import { asyncHandler } from '../middleware/errorHandler.js';
import * as requestService from './request.service.js';

export const create = asyncHandler(async (req, res) => {
  res.status(201).json({ data: await requestService.createRequest(req.user.id, req.valid.body) });
});

export const list = asyncHandler(async (req, res) => {
  res.json(await requestService.listRequests(req.user.id, req.valid.query));
});

export const getOne = asyncHandler(async (req, res) => {
  res.json({ data: await requestService.getRequest(req.user.id, req.valid.params.id) });
});

export const act = asyncHandler(async (req, res) => {
  res.json({
    data: await requestService.applyAction(req.user.id, req.valid.params.id, req.valid.body),
  });
});
