import { asyncHandler } from '../middleware/errorHandler.js';
import { getDashboard } from '../services/dashboard.service.js';

export const summary = asyncHandler(async (req, res) => {
  res.json({ data: await getDashboard(req.user.id) });
});