import { Router } from 'express';
import { z } from 'zod';
import { validate, userIdParam, pagination } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import * as ctrl from '../controllers/review.controller.js';

const router = Router();
router.use(requireAuth);

const createSchema = z.object({
  request_id: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional(),
});

router.post('/', validate(createSchema), ctrl.create);
router.get(
  '/user/:userId',
  validate(userIdParam, 'params'),
  validate(z.object({ ...pagination }), 'query'),
  ctrl.forUser
);

export default router;