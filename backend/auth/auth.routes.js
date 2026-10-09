import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
<<<<<<< HEAD:backend/Auth.routes.js
import { validate } from './Validate.js';
import { requireAuth } from './auth.js';
import * as ctrl from './Auth.controller.js';
=======
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import * as ctrl from './auth.controller.js';
>>>>>>> 341a4bd6a10aad487ea7eac068e78c87d070cc12:backend/auth/auth.routes.js

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
