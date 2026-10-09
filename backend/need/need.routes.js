import { Router } from 'express';
import { z } from 'zod';
import { validate, idParam, pagination } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import * as ctrl from './need.controller.js';

const router = Router();
router.use(requireAuth);

const createSchema = z.object({
  need_type: z.enum(['item', 'service']),
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(1000).default(''),
  category: z.string().trim().max(50).optional(),
  max_budget: z.coerce.number().min(0).max(1000000).optional(),
});
const querySchema = z.object({
  need_type: z.enum(['item', 'service']).optional(),
  category: z.string().optional(),
  q: z.string().optional(),
  ...pagination,
});
const statusSchema = z.object({ status: z.enum(['open', 'fulfilled', 'closed']) });

router.post('/', validate(createSchema), ctrl.create);
router.get('/', validate(querySchema, 'query'), ctrl.listOpen);
router.get('/mine', ctrl.mine);
router.get('/:id/matches', validate(idParam, 'params'), ctrl.matches);
router.patch('/:id/status', validate(idParam, 'params'), validate(statusSchema), ctrl.setStatus);

export default router;
