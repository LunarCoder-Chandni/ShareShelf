import { supabaseAuthClient } from './supabase.js';
import { AppError } from './middleware/errorHandler.js';
import { unwrap } from './helpers.js';

const PROFILE_FIELDS =
  'id, college_id, full_name, department, year_of_study, avatar_path, created_at, updated_at';

export async function findCollegeForEmail(email) {
  const domain = String(email || '').trim().toLowerCase().split('@')[1];
  if (!domain) return null;

  const colleges = unwrap(await supabaseAuthClient.from('colleges').select('id, email_domains')) || [];
  return (
    colleges.find((college) =>
      (college.email_domains || []).some((allowedDomain) => allowedDomain.toLowerCase() === domain)
    ) || null
  );
}

/** Loads the schema-backed profile created by the auth trigger, repairing it only if absent. */
export async function ensureProfile(client, authUser) {
  const existing = unwrap(
    await client.from('profiles').select(PROFILE_FIELDS).eq('id', authUser.id).maybeSingle()
  );
  if (!existing) {
    throw new AppError(500, 'Your student profile was not created. Check the on_auth_user_created trigger in Supabase.');
  }

  const metadata = authUser.user_metadata || {};
  const updates = {};
  if (!existing.department && metadata.department) updates.department = metadata.department;
  if (!existing.year_of_study && Number(metadata.year_of_study)) updates.year_of_study = Number(metadata.year_of_study);
  if (Object.keys(updates).length === 0) return existing;

  return unwrap(
    await client.from('profiles').update(updates).eq('id', authUser.id).select(PROFILE_FIELDS).single()
  );
}

export async function getPublicProfile(client, id) {
  const profile = unwrap(
    await client.from('profiles').select(PROFILE_FIELDS).eq('id', id).maybeSingle(),
    'Profile not found'
  );
  const ratings = unwrap(
    await client
      .from('profile_ratings')
      .select('avg_rating, review_count')
      .eq('profile_id', id)
      .maybeSingle()
  );

  return {
    ...profile,
    rating_avg: ratings?.avg_rating ?? null,
    rating_count: ratings?.review_count ?? 0,
  };
}

export async function updateProfile(client, id, fields) {
  return unwrap(
    await client.from('profiles').update(fields).eq('id', id).select(PROFILE_FIELDS).single()
  );
}
