
import { supabaseAuthClient } from '../config/supabase.js';
import { env, isAllowedEmail } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import { ensureProfile } from '../profile/profile.service.js';

const sessionOut = (session) =>
  session && {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
  };

export async function signUp({ email, password, full_name }) {
  if (!isAllowedEmail(email)) {
    const domains = env.allowedEmailDomains
      .map((domain) => `@${domain}`)
      .join(', ');

    throw new AppError(
      400,
      `Please sign up with your college email (${domains})`
    );
  }

  const { data, error } = await supabaseAuthClient.auth.signUp({
    email,
    password,
    options: {
      data: { full_name },
    },
  });

  if (error) {
    console.error('Supabase signup error:', error.message);
    throw new AppError(400, error.message);
  }

  if (!data.user || data.user.identities?.length === 0) {
    throw new AppError(409, 'An account with this email already exists');
  }

  return {
    user: {
      id: data.user.id,
      email: data.user.email,
    },
    session: sessionOut(data.session),
    email_confirmation_required: !data.session,
  };
}

export async function logIn({ email, password }) {
  const { data, error } =
    await supabaseAuthClient.auth.signInWithPassword({
      email,
      password,
    });

  if (error) {
    console.error('Supabase login error:', error.message);
    throw new AppError(401, 'Invalid email or password');
  }

  if (!data.user || !data.session) {
    console.error('Supabase login returned no user or session');
    throw new AppError(401, 'Invalid email or password');
  }

  try {
    const profile = await ensureProfile(data.user);

    if (profile.is_blocked) {
      throw new AppError(403, 'Your account has been suspended');
    }

    return {
      user: profile,
      session: sessionOut(data.session),
    };
  } catch (error) {
    console.error('ShareShelf profile/login error:', error.message);
    throw error;
  }
}

export async function refresh(refresh_token) {
  const { data, error } =
    await supabaseAuthClient.auth.refreshSession({
      refresh_token,
    });

  if (error || !data.session) {
    console.error(
      'Supabase refresh error:',
      error?.message || 'No session returned'
    );

    throw new AppError(401, 'Session expired, please log in again');
  }

  return {
    session: sessionOut(data.session),
  };
}
