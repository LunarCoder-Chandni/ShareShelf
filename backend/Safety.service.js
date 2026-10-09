import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import { unwrap } from './helpers.js';

/** Throws if either user has blocked the other. */
export async function assertNotBlocked(a, b) {
  const rows = unwrap(
    await supabaseAdmin
      .from('blocks')
      .select('blocker_id')
      .or(
        `and(blocker_id.eq.${a},blocked_id.eq.${b}),and(blocker_id.eq.${b},blocked_id.eq.${a})`
      )
      .limit(1)
  );
  if (rows.length) throw new AppError(403, 'You cannot interact with this user');
}

export async function createReport(reporterId, body) {
  return unwrap(
    await supabaseAdmin
      .from('reports')
      .insert({ ...body, reporter_id: reporterId })
      .select('id, reason, status, created_at')
      .single()
  );
}

export async function blockUser(blockerId, blockedId) {
  if (blockerId === blockedId) throw new AppError(400, 'You cannot block yourself');
  unwrap(
    await supabaseAdmin
      .from('blocks')
      .upsert(
        { blocker_id: blockerId, blocked_id: blockedId },
        { onConflict: 'blocker_id,blocked_id', ignoreDuplicates: true }
      )
  );
}

export async function unblockUser(blockerId, blockedId) {
  unwrap(
    await supabaseAdmin.from('blocks').delete().eq('blocker_id', blockerId).eq('blocked_id', blockedId)
  );
}

export async function listBlocks(blockerId) {
  return unwrap(
    await supabaseAdmin
      .from('blocks')
      .select('blocked_id, created_at, user:profiles!blocked_id(id, full_name)')
      .eq('blocker_id', blockerId)
  );
}