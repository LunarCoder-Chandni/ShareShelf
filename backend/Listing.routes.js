import { Router } from 'express';
import { z } from 'zod';
import { validate, idParam, pagination } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import * as ctrl from '../controllers/listing.controller.js';

const router = Router();
router.use(requireAuth);

const fields = z.object({
  listing_type: z.enum(['borrow', 'sell']),
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(2000).default(''),
  category: z.string().trim().min(2).max(50),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor']).default('good'),
  image_urls: z.array(z.string().url()).max(5).default([]),
  price: z.coerce.number().min(0).max(1000000).optional(), // selling price
  deposit: z.coerce.number().min(0).max(1000000).default(0), // borrow deposit
  max_borrow_days: z.coerce.number().int().min(1).max(90).optional(),
});

const createSchema = fields.superRefine((v, ctx) => {
  if (v.listing_type === 'sell' && v.price === undefined) {
    ctx.addIssue({ code: 'custom', path: ['price'], message: 'price is required for items for sale' });
  }
  if (v.listing_type === 'borrow' && v.max_borrow_days === undefined) {
    ctx.addIssue({
      code: 'custom',
      path: ['max_borrow_days'],
      message: 'max_borrow_days is required for items to lend',
    });
  }
});

const updateSchema = fields
  .omit({ listing_type: true })
  .partial()
  .refine((o) => Object.keys(o).length > 0, 'Provide at least one field to update');

const querySchema = z.object({
  listing_type: z.enum(['borrow', 'sell']).optional(),
  category: z.string().optional(),
  q: z.string().optional(),
  min_price: z.coerce.number().min(0).optional(),
  max_price: z.coerce.number().min(0).optional(),
  status: z.enum(['available', 'reserved', 'borrowed', 'sold', 'inactive']).optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc']).default('newest'),
  ...pagination,
});

const soldSchema = z.object({
  buyer_id: z.string().uuid().optional(),
  amount: z.coerce.number().min(0).optional(),
});

router.get('/', validate(querySchema, 'query'), ctrl.list);
router.get('/mine', validate(querySchema, 'query'), ctrl.mine);
router.post('/', validate(createSchema), ctrl.create);
router.get('/:id', validate(idParam, 'params'), ctrl.getOne);
router.patch('/:id', validate(idParam, 'params'), validate(updateSchema), ctrl.update);
router.delete('/:id', validate(idParam, 'params'), ctrl.remove);
router.post('/:id/contact', validate(idParam, 'params'), ctrl.contactSeller);
router.post('/:id/mark-sold', validate(idParam, 'params'), validate(soldSchema), ctrl.markSold);

export default router;