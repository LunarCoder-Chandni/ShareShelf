import { Router } from 'express';
import { z } from 'zod';
import { validate, userIdParam } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import * as ctrl from './safety.controller.js';

const router = Router();
router.use(requireAuth);

const reportSchema = z
  .object({
    reported_user_id: z.string().uuid().optional(),
    listing_id: z.string().uuid().optional(),
    service_id: z.string().uuid().optional(),
    reason: z.enum(['spam', 'fraud', 'inappropriate', 'harassment', 'item_not_returned', 'other']),
    details: z.string().trim().max(1000).optional(),
  })
  .refine((v) => v.reported_user_id || v.listing_id || v.service_id, {
    message: 'Specify what you are reporting (reported_user_id, listing_id or service_id)',
  });

router.post('/reports', validate(reportSchema), ctrl.report);
router.get('/blocks', ctrl.listBlocked);
router.post('/blocks/:userId', validate(userIdParam, 'params'), ctrl.block);
router.delete('/blocks/:userId', validate(userIdParam, 'params'), ctrl.unblock);

export default router;
