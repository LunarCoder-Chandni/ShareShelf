import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import { unwrap, getPagination } from './helpers.js';

const REVIEWER = 'reviewer:profiles!reviewer_id(id, full_name)';

async function recalc(table, idColumn, id, filterColumn, filterValue) {
  const rows = unwrap(
    await supabaseAdmin.from('reviews').select('rating').eq(filterColumn, filterValue)
  );
  const count = rows.length;
  const avg = count ? rows.reduce((s, r) => s + r.rating, 0) / count : 0;
  unwrap(
    await supabaseAdmin
      .from(table)
      .update({ rating_avg: Math.round(avg * 100) / 100, rating_count: count })
      .eq(idColumn, id)
  );
}

export async function createReview(userId, { request_id, rating, comment }) {
  const r = unwrap(
    await supabaseAdmin.from('requests').select('*').eq('id', request_id).maybeSingle(),
    'Request not found'
  );
  if (r.requester_id !== userId && r.owner_id !== userId) throw new AppError(404, 'Request not found');
  if (r.status !== 'completed') throw new AppError(409, 'You can only review completed transactions');

  const revieweeId = userId === r.requester_id ? r.owner_id : r.requester_id;

  const { data, error } = await supabaseAdmin
    .from('reviews')
    .insert({
      request_id,
      reviewer_id: userId,
      reviewee_id: revieweeId,
      listing_id: r.listing_id,
      service_id: r.service_id,
      rating,
      comment: comment ?? null,
    })
    .select('*')
    .single();
  if (error?.code === '23505') throw new AppError(409, 'You have already reviewed this transaction');
  unwrap({ data, error });

  await recalc('profiles', 'id', revieweeId, 'reviewee_id', revieweeId);
  if (r.service_id && userId === r.requester_id) {
    await recalc('services', 'id', r.service_id, 'service_id', r.service_id);
  }
  return data;
}

export async function listReviewsForUser(userId, f) {
  const { from, to, page, limit } = getPagination(f);
  const { data, error, count } = await supabaseAdmin
    .from('reviews')
    .select(`id, rating, comment, created_at, ${REVIEWER}`, { count: 'exact' })
    .eq('reviewee_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error) unwrap({ error });
  return { data, meta: { page, limit, total: count ?? 0 } };
}

export async function listReviewsForService(serviceId, f) {
  const { from, to, page, limit } = getPagination(f);
  const { data, error, count } = await supabaseAdmin
    .from('reviews')
    .select(`id, rating, comment, created_at, ${REVIEWER}`, { count: 'exact' })
    .eq('service_id', serviceId)
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error) unwrap({ error });
  return { data, meta: { page, limit, total: count ?? 0 } };
}