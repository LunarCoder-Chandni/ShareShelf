import { createUserClient, supabaseAuthClient } from './supabase.js';
import { isAllowedEmail } from './Env.js';
import { AppError, asyncHandler } from './middleware/errorHandler.js';
import { ensureProfile } from './profile.service.js';

/** Verifies the Supabase JWT from "Authorization: Bearer <token>" and loads the profile. */
export const requireAuth = asyncHandler(async (req, res, next) => {
  const authorization = req.headers.authorization || '';
  const match = authorization.match(/^Bearer\s+(\S+)$/i);
  if (!match) {
    throw new AppError(401, 'Missing or invalid Authorization header');
  }
  const token = match[1];

  const { data, error } = await supabaseAuthClient.auth.getUser(token);
  if (error || !data?.user) throw new AppError(401, 'Invalid or expired token');

  if (!isAllowedEmail(data.user.email)) {
    throw new AppError(403, 'Only college email accounts can use ShareShelf');
  }

  const userClient = createUserClient(token);
  const profile = await ensureProfile(userClient, data.user);

  req.user = { id: data.user.id, email: data.user.email };
  req.profile = profile;
  req.supabase = userClient;
  next();
});
