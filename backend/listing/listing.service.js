import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import { unwrap, sanitizeSearch, getPagination } from '../helpers/helpers.js';
import { assertNotBlocked } from '../safety/safety.service.js';

const OWNER = 'owner:profiles!owner_id(id, full_name, college, rating_avg, rating_count)';

/**
 * Search/browse listings (borrow + sell).
 * opts.ownerId -> only that owner's listings; opts.allStatuses -> don't default to "available".
 */
export async function searchListings(f, opts = {}) {
  const { from, to, page, limit } = getPagination(f);
  let q = supabaseAdmin.from('listings').select(`*, ${OWNER}`, { count: 'exact' });

  if (opts.ownerId) q = q.eq('owner_id', opts.ownerId);
  if (f.status) q = q.eq('status', f.status);
  else if (!opts.allStatuses) q = q.eq('status', 'available');
  else q = q.neq('status', 'inactive');

  if (f.listing_type) q = q.eq('listing_type', f.listing_type);
  if (f.category) q = q.ilike('category', sanitizeSearch(f.category));
  if (f.q) {
    const s = sanitizeSearch(f.q);
    if (s) q = q.or(`title.ilike.%${s}%,description.ilike.%${s}%`);
  }
  if (f.min_price != null) q = q.gte('price', f.min_price);
  if (f.max_price != null) q = q.lte('price', f.max_price);

  if (f.sort === 'price_asc') q = q.order('price', { ascending: true, nullsFirst: false });
  else if (f.sort === 'price_desc') q = q.order('price', { ascending: false, nullsFirst: false });
  else q = q.order('created_at', { ascending: false });

  const { data, error, count } = await q.range(from, to);
  if (error) unwrap({ error });
  return { data, meta: { page, limit, total: count ?? 0 } };
}

export async function getListing(id) {
  return unwrap(
    await supabaseAdmin.from('listings').select(`*, ${OWNER}`).eq('id', id).maybeSingle(),
    'Listing not found'
  );
}

export async function createListing(ownerId, body) {
  return unwrap(
    await supabaseAdmin
      .from('listings')
      .insert({ ...body, owner_id: ownerId, status: 'available' })
      .select('*')
      .single()
  );
}

async function getOwned(id, ownerId) {
  const listing = await getListing(id);
  if (listing.owner_id !== ownerId) throw new AppError(403, 'You do not own this listing');
  return listing;
}

export async function updateListing(id, ownerId, fields) {
  const listing = await getOwned(id, ownerId);
  if (['reserved', 'borrowed', 'sold'].includes(listing.status)) {
    throw new AppError(409, `Cannot edit a listing that is ${listing.status}`);
  }
  return unwrap(
    await supabaseAdmin.from('listings').update(fields).eq('id', id).select('*').single()
  );
}

/** Soft delete so existing requests/transactions keep their references. */
export async function deleteListing(id, ownerId) {
  const listing = await getOwned(id, ownerId);
  if (['reserved', 'borrowed'].includes(listing.status)) {
    throw new AppError(409, 'This item is part of an active request and cannot be removed yet');
  }
  unwrap(await supabaseAdmin.from('listings').update({ status: 'inactive' }).eq('id', id));
}

/** Controlled contact sharing: only for available items for sale, to non-blocked users. */
export async function getSellerContact(id, userId) {
  const listing = await getListing(id);
  if (listing.listing_type !== 'sell') throw new AppError(400, 'Only items for sale have seller contact');
  if (listing.status !== 'available') throw new AppError(409, 'This item is no longer available');
  if (listing.owner_id === userId) throw new AppError(400, 'This is your own listing');
  await assertNotBlocked(userId, listing.owner_id);

  const seller = unwrap(
    await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, phone')
      .eq('id', listing.owner_id)
      .single()
  );
  return { listing_id: id, seller };
}

export async function markSold(id, ownerId, { buyer_id, amount }) {
  const listing = await getOwned(id, ownerId);
  if (listing.listing_type !== 'sell') throw new AppError(400, 'Only items for sale can be marked sold');
  if (listing.status !== 'available') throw new AppError(409, `Listing is already ${listing.status}`);
  if (buyer_id === ownerId) throw new AppError(400, 'Buyer cannot be the seller');

  const updated = unwrap(
    await supabaseAdmin
      .from('listings')
      .update({ status: 'sold' })
      .eq('id', id)
      .eq('status', 'available')
      .select('*')
  );
  if (!updated.length) throw new AppError(409, 'Listing is no longer available');

  const transaction = unwrap(
    await supabaseAdmin
      .from('transactions')
      .insert({
        kind: 'sale',
        listing_id: id,
        seller_id: ownerId,
        buyer_id: buyer_id ?? null,
        amount: amount ?? listing.price,
        status: 'completed',
      })
      .select('*')
      .single()
  );
  return { listing: updated[0], transaction };
}
