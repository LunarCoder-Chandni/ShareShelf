import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from './auth.js';
import { validate, idParam } from './Validate.js';
import * as ctrl from './Profile.controller.js';

const router = Router();
const updateProfileSchema = z
  .object({
    full_name: z.string().trim().min(2).max(80).optional(),
    department: z.string().trim().max(120).nullable().optional(),
    year_of_study: z.number().int().min(1).max(8).nullable().optional(),
    avatar_path: z.string().trim().max(500).nullable().optional(),
  })
  .strict()
  .refine((fields) => Object.keys(fields).length > 0, 'Provide at least one profile field');

router.get('/me', requireAuth, ctrl.getMe);
router.patch('/me', requireAuth, validate(updateProfileSchema), ctrl.updateMe);
router.get('/:id', requireAuth, validate(idParam, 'params'), ctrl.getProfile);

export default router;
