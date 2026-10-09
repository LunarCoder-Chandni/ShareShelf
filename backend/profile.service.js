import { supabaseAdmin } from './supabase.js';
import { unwrap } from './helpers.js';

const PUBLIC_FIELDS = 'id, full_name, college, bio, avatar_url, rating_avg, rating_count, created_at';

/** Returns the user's profile, creating a minimal one on first sight. */
export async function ensureProfile(authUser) {
  const existing = unwrap(
    await supabaseAdmin.from('profiles').select('*').eq('id', authUser.id).maybeSingle()
  );
  if (existing) return existing;

  unwrap(
    await supabaseAdmin.from('profiles').upsert(
      {
        id: authUser.id,
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
      },
      { onConflict: 'id', ignoreDuplicates: true }
    )
  );
  return unwrap(await supabaseAdmin.from('profiles').select('*').eq('id', authUser.id).single());
}

export async function getPublicProfile(id) {
  return unwrap(
    await supabaseAdmin.from('profiles').select(PUBLIC_FIELDS).eq('id', id).maybeSingle(),
    'User not found'
  );
}

export async function updateProfile(id, fields) {
  return unwrap(
    await supabaseAdmin.from('profiles').update(fields).eq('id', id).select('*').single()
  );
}
