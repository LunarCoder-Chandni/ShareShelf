import { asyncHandler } from './middleware/errorHandler.js';
import * as authService from './auth.service.js';

export const signup = asyncHandler(async (req, res) => {
  res.status(201).json(await authService.signUp(req.valid.body));
});

export const login = asyncHandler(async (req, res) => {
  res.json(await authService.logIn(req.valid.body));
});

export const refresh = asyncHandler(async (req, res) => {
  res.json(await authService.refresh(req.valid.body.refresh_token));
});

export const me = asyncHandler(async (req, res) => {
  res.json({ data: req.profile });
});