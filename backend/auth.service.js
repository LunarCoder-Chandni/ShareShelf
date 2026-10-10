import { createUserClient, supabaseAuthClient } from './supabase.js';
import { env, isAllowedEmail } from './Env.js';
import { AppError } from './middleware/errorHandler.js';
import { ensureProfile, findCollegeForEmail } from './profile.service.js';

const sessionOut = (s) =>
  s && {
    access_token: s.access_token,
    refresh_token: s.refresh_token,
    expires_at: s.expires_at,
  };

export async function signUp({ email, password, full_name, department, year_of_study }) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!isAllowedEmail(normalizedEmail)) {
    const domains = env.allowedEmailDomains.map((d) => `@${d}`).join(', ');
    throw new AppError(403, domains
      ? `Please sign up with your college email (${domains})`
      : 'Sign-ups are disabled until ALLOWED_EMAIL_DOMAINS is configured');
  }

  const college = await findCollegeForEmail(normalizedEmail);
  if (!college) throw new AppError(403, 'This email domain is not registered to a college');

  const { data, error } = await supabaseAuthClient.auth.signUp({
    email: normalizedEmail,
    password,
    options: { data: { full_name, department, year_of_study } },
  });
  if (error) throw new AppError(400, error.message);
  if (!data.user || data.user.identities?.length === 0) {
    throw new AppError(409, 'An account with this email already exists');
  }

  return {
    user: { id: data.user.id, email: normalizedEmail },
    session: sessionOut(data.session),
    email_confirmation_required: !data.session,
  };
}

export async function logIn({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!isAllowedEmail(normalizedEmail)) {
    throw new AppError(403, 'Only registered college email accounts can log in');
  }

  const { data, error } = await supabaseAuthClient.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });
  if (error) {
    // Supabase requires email confirmation when that project setting is enabled.
    // Preserve that actionable case instead of masking it as a bad password.
    if (error.code === 'email_not_confirmed') {
      throw new AppError(401, 'Please confirm your email address before logging in. Check your inbox and spam folder for the confirmation link.');
    }
    if (error.code === 'invalid_credentials' || error.code === 'user_not_found') {
      throw new AppError(401, 'Email or password is incorrect. If you just signed up, confirm your email first; otherwise check that you used the same email and password you registered with.');
    }
    throw new AppError(401, 'We could not log you in right now. Please try again.');
  }
  if (!data.session) throw new AppError(401, 'Login did not return a session. Please try again.');

  const profile = await ensureProfile(createUserClient(data.session.access_token), data.user);
  return { user: { ...profile, email: data.user.email }, session: sessionOut(data.session) };
}

export async function refresh(refresh_token) {
  const { data, error } = await supabaseAuthClient.auth.refreshSession({ refresh_token });
  if (error || !data.session) throw new AppError(401, 'Session expired, please log in again');
  return { session: sessionOut(data.session) };
}
