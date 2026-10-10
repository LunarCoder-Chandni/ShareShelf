import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from './auth.js';
import { validate, idParam, pagination } from './Validate.js';
import * as ctrl from './Listings.controller.js';

const router = Router();
const listingType = z.enum(['borrow', 'service', 'sale']);
const common = {
  category_id: z.string().uuid(),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(5000).nullable().optional(),
};
const dateValue = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD dates')
  .nullable()
  .optional();

const createListingSchema = z.discriminatedUnion('listing_type', [
  z.object({
    ...common,
    listing_type: z.literal('borrow'),
    max_duration_days: z.number().int().positive(),
    expected_deposit: z.number().min(0).optional(),
    available_from: dateValue,
    available_until: dateValue,
  }).strict(),
  z.object({
    ...common,
    listing_type: z.literal('service'),
    pricing_type: z.enum(['fixed', 'hourly', 'negotiable', 'free']),
    price: z.number().min(0).nullable().optional(),
    availability_notes: z.string().trim().max(1000).nullable().optional(),
  }).strict(),
  z.object({
    ...common,
    listing_type: z.literal('sale'),
    price: z.number().min(0),
    item_condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor']),
  }).strict(),
]).superRefine((value, ctx) => {
  if (value.listing_type === 'service') {
    const priceRequired = ['fixed', 'hourly'].includes(value.pricing_type);
    if (priceRequired && value.price == null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['price'], message: 'Price is required for fixed and hourly services' });
    }
    if (!priceRequired && value.price != null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['price'], message: 'Free or negotiable services must not include a price' });
    }
  }
});

const listQuerySchema = z.object({
  listing_type: listingType.optional(),
  category_slug: z.string().trim().max(80).optional(),
  search: z.string().trim().max(80).optional(),
  ...pagination,
});

router.get('/public', validate(listQuerySchema, 'query'), ctrl.listPublic);
router.get('/', requireAuth, validate(listQuerySchema, 'query'), ctrl.list);
router.post('/', requireAuth, validate(createListingSchema), ctrl.create);
router.get('/:id', requireAuth, validate(idParam, 'params'), ctrl.get);
router.delete('/:id', requireAuth, validate(idParam, 'params'), ctrl.remove);

export default router;
