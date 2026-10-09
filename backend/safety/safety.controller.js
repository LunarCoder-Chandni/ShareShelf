import { asyncHandler } from '../middleware/errorHandler.js';
import * as safety from './safety.service.js';

export const report = asyncHandler(async (req, res) => {
  res.status(201).json({ data: await safety.createReport(req.user.id, req.valid.body) });
});

export const block = asyncHandler(async (req, res) => {
  await safety.blockUser(req.user.id, req.valid.params.userId);
  res.status(204).end();
});

export const unblock = asyncHandler(async (req, res) => {
  await safety.unblockUser(req.user.id, req.valid.params.userId);
  res.status(204).end();
});

export const listBlocked = asyncHandler(async (req, res) => {
  res.json({ data: await safety.listBlocks(req.user.id) });
});
