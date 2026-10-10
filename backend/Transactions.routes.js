import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from './auth.js';
import { validate, idParam, pagination } from './Validate.js';
import * as ctrl from './Transactions.controller.js';

const router = Router();
const listQuerySchema = z.object({ ...pagination });
const statusSchema = z.object({
  status: z.enum(['returned', 'completed', 'cancelled', 'disputed']),
}).strict();

router.get('/', requireAuth, validate(listQuerySchema, 'query'), ctrl.list);
router.patch('/:id/status', requireAuth, validate(idParam, 'params'), validate(statusSchema), ctrl.updateStatus);

export default router;
