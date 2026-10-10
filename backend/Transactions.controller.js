import { asyncHandler } from './middleware/errorHandler.js';
import { getPagination } from './helpers.js';
import * as transactions from './transactions.service.js';

export const list = asyncHandler(async (req, res) => {
  res.json(await transactions.listTransactions(req.supabase, { ...req.valid.query, ...getPagination(req.valid.query) }));
});

export const updateStatus = asyncHandler(async (req, res) => {
  res.json({
    data: await transactions.updateTransactionStatus(
      req.supabase,
      req.user.id,
      req.valid.params.id,
      req.valid.body.status
    ),
  });
});
