import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import { unwrap, getPagination, todayISO, daysBetween } from '../helpers/helpers.js';
import { assertNotBlocked } from '../safety/safety.service.js';

const SELECT = `*,
  requester:profiles!requester_id(id, full_name, rating_avg),
  owner:profiles!owner_id(id, full_name, rating_avg),
  listing:listings(id, title, image_urls, listing_type, deposit, max_borrow_days),
  service:services(id, title, price_min, price_max)`;

const ACTIVE_STATUSES = ['pending', 'accepted', 'handed_over'];

/** action -> { from: allowed current statuses, actor, to: next status } */
const TRANSITIONS = {
  borrow: {
    accept: { from: ['pending'], actor: 'owner', to: 'accepted' },
    reject: { from: ['pending'], actor: 'owner', to: 'rejected' },
    cancel: { from: ['pending', 'accepted'], actor: 'either', to: 'cancelled' },
    handover: { from: ['accepted'], actor: 'owner', to: 'handed_over' },
    return: { from: ['handed_over'], actor: 'owner', to: 'completed' },
  },
  service: {
    accept: { from: ['pending'], actor: 'owner', to: 'accepted' },
    reject: { from: ['pending'], actor: 'owner', to: 'rejected' },
    cancel: { from: ['pending', 'accepted'], actor: 'either', to: 'cancelled' },
    complete: { from: ['accepted'], actor: 'owner', to: 'completed' },
  },
};

/** Return-date tracking: flag borrowed items past their due date. */
const withOverdue = (r) => ({
  ...r,
  is_overdue: r.request_type === 'borrow' && r.status === 'handed_over' && r.due_date < todayISO(),
});

export async function createRequest(userId, body) {
  const { request_type, listing_id, service_id, message, start_date, due_date } = body;
  const row = { request_type, requester_id: userId, message: message ?? null, status: 'pending' };
  let ownerId;

  if (request_type === 'borrow') {
    const listing = unwrap(
      await supabaseAdmin.from('listings').select('*').eq('id', listing_id).maybeSingle(),
      'Listing not found'
    );
    if (listing.listing_type !== 'borrow') throw new AppError(400, 'This listing is not for borrowing');
    if (listing.status !== 'available') throw new AppError(409, 'This item is not available right now');

    const start = start_date || todayISO();
    const days = daysBetween(start, due_date);
    if (start < todayISO()) throw new AppError(400, 'Start date cannot be in the past');
    if (days < 1) throw new AppError(400, 'Return date must be after the start date');
    if (listing.max_borrow_days && days > listing.max_borrow_days) {
      throw new AppError(400, `This item can be borrowed for at most ${listing.max_borrow_days} day(s)`);
    }
    ownerId = listing.owner_id;
    Object.assign(row, { listing_id, start_date: start, due_date });
  } else {
    const service = unwrap(
      await supabaseAdmin.from('services').select('*').eq('id', service_id).maybeSingle(),
      'Service not found'
    );
    if (service.status !== 'active') throw new AppError(409, 'This service is not available right now');
    ownerId = service.provider_id;
    row.service_id = service_id;
  }

  if (ownerId === userId) throw new AppError(400, 'You cannot send a request to yourself');
  await assertNotBlocked(userId, ownerId);

  // Prevent duplicate open requests for the same target
  let dup = supabaseAdmin
    .from('requests')
    .select('id')
    .eq('requester_id', userId)
    .in('status', ACTIVE_STATUSES)
    .limit(1);
  dup = request_type === 'borrow' ? dup.eq('listing_id', listing_id) : dup.eq('service_id', service_id);
  if (unwrap(await dup).length) {
    throw new AppError(409, 'You already have an open request for this');
  }

  const created = unwrap(
    await supabaseAdmin
      .from('requests')
      .insert({ ...row, owner_id: ownerId })
      .select(SELECT)
      .single()
  );
  return withOverdue(created);
}

export async function listRequests(userId, f) {
  const { from, to, page, limit } = getPagination(f);
  let q = supabaseAdmin.from('requests').select(SELECT, { count: 'exact' });

  if (f.role === 'requester') q = q.eq('requester_id', userId);
  else if (f.role === 'owner') q = q.eq('owner_id', userId);
  else q = q.or(`requester_id.eq.${userId},owner_id.eq.${userId}`);

  if (f.status) q = q.eq('status', f.status);
  if (f.request_type) q = q.eq('request_type', f.request_type);

  const { data, error, count } = await q.order('created_at', { ascending: false }).range(from, to);
  if (error) unwrap({ error });
  return { data: data.map(withOverdue), meta: { page, limit, total: count ?? 0 } };
}

export async function getRequest(userId, id) {
  const r = unwrap(
    await supabaseAdmin.from('requests').select(SELECT).eq('id', id).maybeSingle(),
    'Request not found'
  );
  if (r.requester_id !== userId && r.owner_id !== userId) throw new AppError(404, 'Request not found');
  return withOverdue(r);
}

async function setListingStatus(listingId, status) {
  unwrap(await supabaseAdmin.from('listings').update({ status }).eq('id', listingId));
}

/**
 * Moves a request through its workflow.
 * Borrow:  pending -> accepted -> handed_over -> completed
 * Service: pending -> accepted -> completed
 * Either side can cancel before hand-over; the owner can reject a pending request.
 */
export async function applyAction(userId, id, { action, photo_url, amount }) {
  const r = unwrap(
    await supabaseAdmin.from('requests').select('*').eq('id', id).maybeSingle(),
    'Request not found'
  );
  const isOwner = r.owner_id === userId;
  const isRequester = r.requester_id === userId;
  if (!isOwner && !isRequester) throw new AppError(404, 'Request not found');

  const rule = TRANSITIONS[r.request_type]?.[action];
  if (!rule) throw new AppError(400, `"${action}" is not a valid action for a ${r.request_type} request`);
  if (rule.actor === 'owner' && !isOwner) throw new AppError(403, 'Only the owner can do this');
  if (!rule.from.includes(r.status)) {
    throw new AppError(409, `Cannot ${action} a request that is ${r.status}`);
  }

  const patch = { status: rule.to };
  const now = new Date().toISOString();

  if (r.request_type === 'borrow') {
    if (action === 'accept') {
      const reserved = unwrap(
        await supabaseAdmin
          .from('listings')
          .update({ status: 'reserved' })
          .eq('id', r.listing_id)
          .eq('status', 'available')
          .select('id')
      );
      if (!reserved.length) throw new AppError(409, 'This item is no longer available');
      // Competing pending requests for the same item are rejected automatically
      unwrap(
        await supabaseAdmin
          .from('requests')
          .update({ status: 'rejected' })
          .eq('listing_id', r.listing_id)
          .eq('status', 'pending')
          .neq('id', r.id)
      );
    } else if (action === 'cancel' && r.status === 'accepted') {
      await setListingStatus(r.listing_id, 'available');
    } else if (action === 'handover') {
      patch.handed_over_at = now;
      if (photo_url) patch.handover_photo_url = photo_url;
      await setListingStatus(r.listing_id, 'borrowed');
    } else if (action === 'return') {
      patch.completed_at = now;
      if (photo_url) patch.return_photo_url = photo_url;
      await setListingStatus(r.listing_id, 'available');
    }
  } else if (action === 'complete') {
    patch.completed_at = now;
  }

  // Guard against concurrent changes: only update if status is still what we read
  const updated = unwrap(
    await supabaseAdmin
      .from('requests')
      .update(patch)
      .eq('id', id)
      .eq('status', r.status)
      .select(SELECT)
  );
  if (!updated.length) throw new AppError(409, 'This request was just updated, please refresh');

  if (rule.to === 'completed') {
    unwrap(
      await supabaseAdmin.from('transactions').insert({
        kind: r.request_type,
        request_id: r.id,
        listing_id: r.listing_id,
        service_id: r.service_id,
        buyer_id: r.requester_id,
        seller_id: r.owner_id,
        amount: amount ?? null,
        status: 'completed',
      })
    );
  }
  return withOverdue(updated[0]);
}
