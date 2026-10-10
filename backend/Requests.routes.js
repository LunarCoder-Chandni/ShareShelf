import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from './auth.js';
import { validate, idParam, pagination } from './Validate.js';
import * as ctrl from './Requests.controller.js';

const router = Router();
const createRequestSchema = z.object({
  listing_id: z.string().uuid(),
  request_type: z.enum(['borrow', 'service', 'purchase']),
  message: z.string().trim().max(2000).nullable().optional(),
  requested_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  requested_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
}).strict();
const listQuerySchema = z.object({ ...pagination });
const statusSchema = z.object({
  status: z.enum(['accepted', 'rejected', 'cancelled']),
}).strict();

router.get('/', requireAuth, validate(listQuerySchema, 'query'), ctrl.list);
router.post('/', requireAuth, validate(createRequestSchema), ctrl.create);
router.patch('/:id/status', requireAuth, validate(idParam, 'params'), validate(statusSchema), ctrl.updateStatus);

export default router;
