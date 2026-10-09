import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import { unwrap, sanitizeSearch, getPagination } from '../helpers/helpers.js';

const POSTER = 'user:profiles!user_id(id, full_name, college, rating_avg)';

export async function createNeed(userId, body) {
  return unwrap(
    await supabaseAdmin
      .from('needs')
      .insert({ ...body, user_id: userId, status: 'open' })
      .select('*')
      .single()
  );
}

/** Open needs posted by other students (so lenders/providers can respond). */
export async function listOpenNeeds(userId, f) {
  const { from, to, page, limit } = getPagination(f);
  let q = supabaseAdmin
    .from('needs')
    .select(`*, ${POSTER}`, { count: 'exact' })
    .eq('status', 'open')
    .neq('user_id', userId);
  if (f.need_type) q = q.eq('need_type', f.need_type);
  if (f.category) q = q.ilike('category', sanitizeSearch(f.category));
  if (f.q) {
    const s = sanitizeSearch(f.q);
    if (s) q = q.or(`title.ilike.%${s}%,description.ilike.%${s}%`);
  }
  const { data, error, count } = await q.order('created_at', { ascending: false }).range(from, to);
  if (error) unwrap({ error });
  return { data, meta: { page, limit, total: count ?? 0 } };
}

export async function listMyNeeds(userId) {
  return unwrap(
    await supabaseAdmin
      .from('needs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
  );
}

async function getOwnedNeed(id, userId) {
  const need = unwrap(
    await supabaseAdmin.from('needs').select('*').eq('id', id).maybeSingle(),
    'Need not found'
  );
  if (need.user_id !== userId) throw new AppError(403, 'This is not your requirement');
  return need;
}

export async function setNeedStatus(id, userId, status) {
  await getOwnedNeed(id, userId);
  return unwrap(
    await supabaseAdmin.from('needs').update({ status }).eq('id', id).select('*').single()
  );
}

const keywords = (text) =>
  [
    ...new Set(
      String(text || '')
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2)
    ),
  ].slice(0, 6);

/** "Need -> Match": finds available listings (items) or active services that fit a requirement. */
export async function findMatches(id, userId) {
  const need = await getOwnedNeed(id, userId);
  const words = keywords(`${need.title} ${need.category || ''}`);
  if (!words.length) return { need, matches: [] };

  const orFilter = words
    .flatMap((w) => [`title.ilike.%${w}%`, `description.ilike.%${w}%`, `category.ilike.%${w}%`])
    .join(',');

  let matches;
  if (need.need_type === 'item') {
    matches = unwrap(
      await supabaseAdmin
        .from('listings')
        .select('*, owner:profiles!owner_id(id, full_name, rating_avg)')
        .eq('status', 'available')
        .neq('owner_id', userId)
        .or(orFilter)
        .limit(30)
    );
  } else {
    let q = supabaseAdmin
      .from('services')
      .select('*, provider:profiles!provider_id(id, full_name, rating_avg)')
      .eq('status', 'active')
      .neq('provider_id', userId)
      .or(orFilter)
      .limit(30);
    if (need.max_budget != null) q = q.lte('price_min', need.max_budget);
    matches = unwrap(await q);
  }

  const score = (m) => {
    const title = (m.title || '').toLowerCase();
    const rest = `${m.description || ''} ${m.category || ''}`.toLowerCase();
    return words.reduce((s, w) => s + (title.includes(w) ? 2 : 0) + (rest.includes(w) ? 1 : 0), 0);
  };
  matches = matches
    .map((m) => ({ ...m, match_score: score(m) }))
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, 10);

  return { need, matches };
}
