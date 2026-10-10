import { AppError } from './middleware/errorHandler.js';
import { fromSupabaseError, unwrap } from './helpers.js';

export async function listTransactions(client, { page, limit, from, to }) {
  const result = await client
    .from('transactions')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);
  return { data: unwrap(result), pagination: { page, limit, total: result.count || 0 } };
}

export async function updateTransactionStatus(client, userId, id, status) {
  const transaction = unwrap(
    await client.from('transactions').select('*').eq('id', id).maybeSingle(),
    'Transaction not found or not permitted'
  );
  const isOwner = transaction.lender_or_seller_id === userId;
  const isRequester = transaction.borrower_or_buyer_id === userId;
  if (!isOwner && !isRequester) throw new AppError(403, 'Only the people in this transaction can update it');

  if (status === 'disputed') {
    if (['completed', 'cancelled', 'disputed'].includes(transaction.status)) {
      throw new AppError(409, 'This transaction can no longer be disputed');
    }
  } else if (status === 'cancelled') {
    if (transaction.status !== 'in_progress' || !isRequester) {
      throw new AppError(409, 'Only the requester can cancel an in-progress transaction');
    }
  } else if (transaction.transaction_type === 'borrow' && status === 'returned') {
    if (transaction.status !== 'in_progress' || !isRequester) {
      throw new AppError(409, 'Only the borrower can mark an in-progress loan as returned');
    }
  } else if (status === 'completed') {
    if (transaction.transaction_type === 'borrow') {
      if (transaction.status !== 'returned' || !isOwner) {
        throw new AppError(409, 'The owner can complete a loan after the borrower marks it returned');
      }
    } else if (transaction.status !== 'in_progress') {
      throw new AppError(409, 'Only an in-progress transaction can be completed');
    }
  } else {
    throw new AppError(409, 'Invalid transaction status change');
  }

  const result = await client
    .from('transactions')
    .update({ status })
    .eq('id', id)
    .select('*')
    .single();
  if (result.error) throw fromSupabaseError(result.error);
  return result.data;
}
