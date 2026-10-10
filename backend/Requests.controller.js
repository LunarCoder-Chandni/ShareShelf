import { asyncHandler } from './middleware/errorHandler.js';
import { getPagination } from './helpers.js';
import * as requests from './requests.service.js';

export const list = asyncHandler(async (req, res) => {
  res.json(await requests.listRequests(req.supabase, { ...req.valid.query, ...getPagination(req.valid.query) }));
});

export const create = asyncHandler(async (req, res) => {
  res.status(201).json({ data: await requests.createRequest(req.supabase, req.user.id, req.valid.body) });
});

export const updateStatus = asyncHandler(async (req, res) => {
  res.json({
    data: await requests.updateRequestStatus(req.supabase, req.user.id, req.valid.params.id, req.valid.body.status),
  });
});
