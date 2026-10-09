import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import { unwrap, sanitizeSearch, getPagination } from './helpers.js';

const PROVIDER = 'provider:profiles!provider_id(id, full_name, college, rating_avg, rating_count)';

export async function searchServices(f, opts = {}) {
  const { from, to, page, limit } = getPagination(f);
  let q = supabaseAdmin.from('services').select(`*, ${PROVIDER}`, { count: 'exact' });

  if (opts.providerId) q = q.eq('provider_id', opts.providerId);
  if (f.status) q = q.eq('status', f.status);
  else if (!opts.allStatuses) q = q.eq('status', 'active');

  if (f.category) q = q.ilike('category', sanitizeSearch(f.category));
  if (f.q) {
    const s = sanitizeSearch(f.q);
    if (s) q = q.or(`title.ilike.%${s}%,description.ilike.%${s}%`);
  }
  // Price range: match services whose range overlaps the requested range
  if (f.min_price != null) q = q.gte('price_max', f.min_price);
  if (f.max_price != null) q = q.lte('price_min', f.max_price);
  if (f.min_rating != null) q = q.gte('rating_avg', f.min_rating);

  if (f.sort === 'price_asc') q = q.order('price_min', { ascending: true });
  else if (f.sort === 'price_desc') q = q.order('price_min', { ascending: false });
  else if (f.sort === 'rating') q = q.order('rating_avg', { ascending: false });
  else q = q.order('created_at', { ascending: false });

  const { data, error, count } = await q.range(from, to);
  if (error) unwrap({ error });
  return { data, meta: { page, limit, total: count ?? 0 } };
}

export async function getService(id) {
  return unwrap(
    await supabaseAdmin.from('services').select(`*, ${PROVIDER}`).eq('id', id).maybeSingle(),
    'Service not found'
  );
}

export async function createService(providerId, body) {
  return unwrap(
    await supabaseAdmin
      .from('services')
      .insert({ ...body, provider_id: providerId, status: 'active' })
      .select('*')
      .single()
  );
}

async function getOwned(id, providerId) {
  const service = await getService(id);
  if (service.provider_id !== providerId) throw new AppError(403, 'You do not own this service');
  return service;
}

export async function updateService(id, providerId, fields) {
  const service = await getOwned(id, providerId);
  const merged = { ...service, ...fields };
  if (merged.price_max < merged.price_min) {
    throw new AppError(400, 'price_max must be greater than or equal to price_min');
  }
  return unwrap(
    await supabaseAdmin.from('services').update(fields).eq('id', id).select('*').single()
  );
}

export async function deleteService(id, providerId) {
  await getOwned(id, providerId);
  unwrap(await supabaseAdmin.from('services').update({ status: 'inactive' }).eq('id', id));
}