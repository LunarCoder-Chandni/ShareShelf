import { Router } from 'express';
import { z } from 'zod';
import { validate, idParam } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import * as ctrl from './profile.controller.js';

const router = Router();
router.use(requireAuth);

const updateSchema = z
  .object({
    full_name: z.string().trim().min(2).max(80),
    college: z.string().trim().max(120),
    bio: z.string().trim().max(500),
    phone: z.string().trim().regex(/^[0-9+\-\s]{7,15}$/, 'Invalid phone number'),
    avatar_url: z.string().url().max(500),
  })
  .partial()
  .refine((o) => Object.keys(o).length > 0, 'Provide at least one field to update');

router.get('/me', ctrl.getMe);
router.patch('/me', validate(updateSchema), ctrl.updateMe);
router.get('/:id', validate(idParam, 'params'), ctrl.getProfile);

export default router;
