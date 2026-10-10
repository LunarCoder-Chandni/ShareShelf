import { AppError } from '../middleware/errorHandler.js';

export function fromSupabaseError(error) {
  const map = {
    '23505': [409, 'This record already exists'],
    '23503': [400, 'A referenced record does not exist'],
    '22P02': [400, 'Invalid value format'],
    '23514': [400, 'A value violates a database constraint'],
    '23502': [400, 'A required value is missing'],
    '42501': [403, 'You are not allowed to perform this action'],
    PGRST116: [404, 'Record not found'],
  };
  const m = map[error.code];
  if (m) return new AppError(m[0], m[1]);
  console.error('Database error:', error);
  return new AppError(500, 'Database error');
}

/** Unwraps a Supabase { data, error } result. Pass a message to 404 on null data. */
export function unwrap({ data, error }, notFoundMessage) {
  if (error) throw fromSupabaseError(error);
  if (notFoundMessage && (data === null || data === undefined)) {
    throw new AppError(404, notFoundMessage);
  }
  return data;
}

/** Removes characters that could break PostgREST filter strings. */
export const sanitizeSearch = (s = '') =>
  String(s).replace(/[%,()*\\:"']/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);

export function getPagination({ page = 1, limit = 20 } = {}) {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  return { page: p, limit: l, from: (p - 1) * l, to: (p - 1) * l + l - 1 };
}

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const daysBetween = (a, b) =>
  Math.round((new Date(`${b}T00:00:00Z`) - new Date(`${a}T00:00:00Z`)) / 86400000);
