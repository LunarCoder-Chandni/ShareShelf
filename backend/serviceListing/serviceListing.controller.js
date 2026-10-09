import { asyncHandler } from '../middleware/errorHandler.js';
import * as svc from './serviceListing.service.js';

export const list = asyncHandler(async (req, res) => {
  res.json(await svc.searchServices(req.valid.query));
});

export const mine = asyncHandler(async (req, res) => {
  res.json(await svc.searchServices(req.valid.query, { providerId: req.user.id, allStatuses: true }));
});

export const getOne = asyncHandler(async (req, res) => {
  res.json({ data: await svc.getService(req.valid.params.id) });
});

export const create = asyncHandler(async (req, res) => {
  res.status(201).json({ data: await svc.createService(req.user.id, req.valid.body) });
});

export const update = asyncHandler(async (req, res) => {
  res.json({ data: await svc.updateService(req.valid.params.id, req.user.id, req.valid.body) });
});

export const remove = asyncHandler(async (req, res) => {
  await svc.deleteService(req.valid.params.id, req.user.id);
  res.status(204).end();
});
