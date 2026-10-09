import { supabaseAdmin } from '../config/supabase.js';
import { unwrap, todayISO } from './helpers.js';

const count = async (query) => {
  const { count: c, error } = await query;
  if (error) unwrap({ error });
  return c ?? 0;
};
const head = (table) => supabaseAdmin.from(table).select('id', { count: 'exact', head: true });

export async function getDashboard(userId) {
  const [listings, services, incoming, outgoing, toReturn, awaitingReturn, overdue, openNeeds] =
    await Promise.all([
      count(head('listings').eq('owner_id', userId).not('status', 'in', '(inactive,sold)')),
      count(head('services').eq('provider_id', userId).eq('status', 'active')),
      count(head('requests').eq('owner_id', userId).eq('status', 'pending')),
      count(head('requests').eq('requester_id', userId).in('status', ['pending', 'accepted', 'handed_over'])),
      count(head('requests').eq('requester_id', userId).eq('status', 'handed_over')),
      count(head('requests').eq('owner_id', userId).eq('status', 'handed_over')),
      count(
        head('requests')
          .eq('request_type', 'borrow')
          .eq('status', 'handed_over')
          .lt('due_date', todayISO())
          .or(`requester_id.eq.${userId},owner_id.eq.${userId}`)
      ),
      count(head('needs').eq('user_id', userId).eq('status', 'open')),
    ]);

  return {
    my_active_listings: listings,
    my_active_services: services,
    incoming_pending_requests: incoming,
    my_open_requests: outgoing,
    items_i_must_return: toReturn,
    items_awaiting_return: awaitingReturn,
    overdue_items: overdue,
    my_open_needs: openNeeds,
  };
}