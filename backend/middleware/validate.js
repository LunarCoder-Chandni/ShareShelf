import { z } from 'zod';
import { AppError } from './errorHandler.js';

/** Validates req[source] with a zod schema; parsed result goes to req.valid[source]. */
export const validate =
  (schema, source = 'body') =>
  (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      return next(new AppError(400, 'Validation failed', details));
    }
    req.valid = req.valid || {};
    req.valid[source] = result.data;
    next();
  };

export const idParam = z.object({ id: z.string().uuid('Invalid id') });
export const userIdParam = z.object({ userId: z.string().uuid('Invalid user id') });

export const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
};
