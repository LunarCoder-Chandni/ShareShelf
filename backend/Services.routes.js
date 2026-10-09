import { Router } from 'express';
import { z } from 'zod';
import { validate, idParam, pagination } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import * as ctrl from '../controllers/serviceListing.controller.js';
import * as reviewCtrl from '../controllers/review.controller.js';

const router = Router();
router.use(requireAuth);

const fields = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(2000).default(''),
  category: z.string().trim().min(2).max(50),
  price_min: z.coerce.number().min(0).max(1000000),
  price_max: z.coerce.number().min(0).max(1000000),
  delivery_days: z.coerce.number().int().min(1).max(60).default(1),
  availability: z.string().trim().max(100).default('Available'),
  image_urls: z.array(z.string().url()).max(5).default([]),
});

const createSchema = fields.refine((v) => v.price_max >= v.price_min, {
  path: ['price_max'],
  message: 'price_max must be greater than or equal to price_min',
});

const updateSchema = fields
  .extend({ status: z.enum(['active', 'inactive']) })
  .partial()
  .refine((o) => Object.keys(o).length > 0, 'Provide at least one field to update');

const querySchema = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
  min_price: z.coerce.number().min(0).optional(),
  max_price: z.coerce.number().min(0).optional(),
  min_rating: z.coerce.number().min(0).max(5).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'rating']).default('newest'),
  ...pagination,
});

router.get('/', validate(querySchema, 'query'), ctrl.list);
router.get('/mine', validate(querySchema, 'query'), ctrl.mine);
router.post('/', validate(createSchema), ctrl.create);
router.get('/:id', validate(idParam, 'params'), ctrl.getOne);
router.patch('/:id', validate(idParam, 'params'), validate(updateSchema), ctrl.update);
router.delete('/:id', validate(idParam, 'params'), ctrl.remove);
router.get(
  '/:id/reviews',
  validate(idParam, 'params'),
  validate(z.object({ ...pagination }), 'query'),
  reviewCtrl.forService
);

export default router;