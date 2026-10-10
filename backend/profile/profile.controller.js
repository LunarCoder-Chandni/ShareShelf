import { asyncHandler } from './middleware/errorHandler.js';
import * as profileService from './profile.service.js';

export const getMe = asyncHandler(async (req, res) => {
  res.json({ data: req.profile });
});

export const updateMe = asyncHandler(async (req, res) => {
  res.json({ data: await profileService.updateProfile(req.supabase, req.user.id, req.valid.body) });
});

export const getProfile = asyncHandler(async (req, res) => {
  res.json({ data: await profileService.getPublicProfile(req.supabase, req.valid.params.id) });
});
