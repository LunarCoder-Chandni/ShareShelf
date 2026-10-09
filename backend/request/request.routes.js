import { Router } from 'express';
import { z } from 'zod';
import { validate, idParam, pagination } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import * as ctrl from './request.controller.js';

const router = Router();
router.use(requireAuth);

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');

const createSchema = z
  .object({
    request_type: z.enum(['borrow', 'service']),
    listing_id: z.string().uuid().optional(),
    service_id: z.string().uuid().optional(),
    message: z.string().trim().max(500).optional(),
    start_date: date.optional(),
    due_date: date.optional(),
  })
  .superRefine((v, ctx) => {
    if (v.request_type === 'borrow') {
      if (!v.listing_id) ctx.addIssue({ code: 'custom', path: ['listing_id'], message: 'listing_id is required' });
      if (!v.due_date) ctx.addIssue({ code: 'custom', path: ['due_date'], message: 'due_date (return date) is required' });
    } else if (!v.service_id) {
      ctx.addIssue({ code: 'custom', path: ['service_id'], message: 'service_id is required' });
    }
  });

const querySchema = z.object({
  role: z.enum(['requester', 'owner']).optional(),
  status: z
    .enum(['pending', 'accepted', 'rejected', 'handed_over', 'completed', 'cancelled'])
    .optional(),
  request_type: z.enum(['borrow', 'service']).optional(),
  ...pagination,
});

const actionSchema = z.object({
  action: z.enum(['accept', 'reject', 'cancel', 'handover', 'return', 'complete']),
  photo_url: z.string().url().optional(), // handover / return photo record
  amount: z.coerce.number().min(0).optional(), // agreed price when completing a service
});

router.post('/', validate(createSchema), ctrl.create);
router.get('/', validate(querySchema, 'query'), ctrl.list);
router.get('/:id', validate(idParam, 'params'), ctrl.getOne);
router.patch('/:id/status', validate(idParam, 'params'), validate(actionSchema), ctrl.act);

export default router;
