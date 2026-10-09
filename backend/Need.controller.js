import { asyncHandler } from '../middleware/errorHandler.js';
import * as needService from '../services/need.service.js';

export const create = asyncHandler(async (req, res) => {
  res.status(201).json({ data: await needService.createNeed(req.user.id, req.valid.body) });
});

export const listOpen = asyncHandler(async (req, res) => {
  res.json(await needService.listOpenNeeds(req.user.id, req.valid.query));
});

export const mine = asyncHandler(async (req, res) => {
  res.json({ data: await needService.listMyNeeds(req.user.id) });
});

export const matches = asyncHandler(async (req, res) => {
  res.json({ data: await needService.findMatches(req.valid.params.id, req.user.id) });
});

export const setStatus = asyncHandler(async (req, res) => {
  res.json({
    data: await needService.setNeedStatus(req.valid.params.id, req.user.id, req.valid.body.status),
  });
});