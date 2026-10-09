import { supabaseAdmin, supabaseAuthClient } from '../config/supabase.js';
import { env, isAllowedEmail } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import { unwrap } from '../helpers/helpers.js';
import { ensureProfile } from '../profile/profile.service.js';

const sessionOut = (s) =>
  s && {
    access_token: s.access_token,
    refresh_token: s.refresh_token,
    expires_at: s.expires_at,
  };

export async function signUp({ email, password, full_name, college, phone }) {
  if (!isAllowedEmail(email)) {
    const domains = env.allowedEmailDomains.map((d) => `@${d}`).join(', ');
    throw new AppError(400, `Please sign up with your college email (${domains})`);
  }

  const { data, error } = await supabaseAuthClient.auth.signUp({
    email,
    password,
    options: { data: { full_name } },
  });
  if (error) throw new AppError(400, error.message);
  if (!data.user || data.user.identities?.length === 0) {
    throw new AppError(409, 'An account with this email already exists');
  }

  unwrap(
    await supabaseAdmin
      .from('profiles')
      .upsert({ id: data.user.id, email, full_name, college, phone }, { onConflict: 'id' })
  );

  return {
    user: { id: data.user.id, email },
    session: sessionOut(data.session),
    email_confirmation_required: !data.session,
  };
}

export async function logIn({ email, password }) {
  const { data, error } = await supabaseAuthClient.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw new AppError(401, 'Invalid email or password');

  const profile = await ensureProfile(data.user);
  if (profile.is_blocked) throw new AppError(403, 'Your account has been suspended');
  return { user: profile, session: sessionOut(data.session) };
}

export async function refresh(refresh_token) {
  const { data, error } = await supabaseAuthClient.auth.refreshSession({ refresh_token });
  if (error || !data.session) throw new AppError(401, 'Session expired, please log in again');
  return { session: sessionOut(data.session) };
}
