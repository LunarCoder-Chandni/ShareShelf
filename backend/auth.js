import { supabaseAdmin } from './supabase.js';
import { isAllowedEmail } from './Env.js';
import { AppError, asyncHandler } from './middleware/errorHandler.js';
import { ensureProfile } from './profile.service.js';

/** Verifies the Supabase JWT from "Authorization: Bearer <token>" and loads the profile. */
export const requireAuth = asyncHandler(async (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new AppError(401, 'Missing or invalid Authorization header');
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) throw new AppError(401, 'Invalid or expired token');

  if (!isAllowedEmail(data.user.email)) {
    throw new AppError(403, 'Only college email accounts can use ShareShelf');
  }

  const profile = await ensureProfile(data.user);
  if (profile.is_blocked) throw new AppError(403, 'Your account has been suspended');

  req.user = { id: data.user.id, email: data.user.email };
  req.profile = profile;
  next();
});
