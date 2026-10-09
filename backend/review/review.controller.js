import { asyncHandler } from '../middleware/errorHandler.js';
import * as reviewService from './review.service.js';

export const create = asyncHandler(async (req, res) => {
  res.status(201).json({ data: await reviewService.createReview(req.user.id, req.valid.body) });
});

export const forUser = asyncHandler(async (req, res) => {
  res.json(await reviewService.listReviewsForUser(req.valid.params.userId, req.valid.query));
});

export const forService = asyncHandler(async (req, res) => {
  res.json(await reviewService.listReviewsForService(req.valid.params.id, req.valid.query));
});
