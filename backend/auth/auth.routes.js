import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { validate } from './Validate.js';
import { requireAuth } from './auth.js';
import * as ctrl from './Auth.controller.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many attempts, please try again later' } },
});

const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
  full_name: z.string().trim().min(2).max(80),
  department: z.string().trim().max(120).optional(),
  year_of_study: z.number().int().min(1).max(8).optional(),
});
const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});
const refreshSchema = z.object({ refresh_token: z.string().min(1) });

router.post('/signup', authLimiter, validate(signupSchema), ctrl.signup);
router.post('/login', authLimiter, validate(loginSchema), ctrl.login);
router.post('/refresh', authLimiter, validate(refreshSchema), ctrl.refresh);
router.get('/me', requireAuth, ctrl.me);

export default router;
