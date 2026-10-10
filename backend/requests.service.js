import { AppError } from './middleware/errorHandler.js';
import { fromSupabaseError, unwrap } from './helpers.js';

export async function listRequests(client, { page, limit, from, to }) {
  const result = await client
    .from('requests')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);
  const rows = unwrap(result);
  const listingIds = [...new Set(rows.map((row) => row.listing_id))];
  const requesterIds = [...new Set(rows.map((row) => row.requester_id))];
  const [listingRows, profileRows] = await Promise.all([
    listingIds.length
      ? client.from('listings').select('id, title, owner_id').in('id', listingIds)
      : Promise.resolve({ data: [], error: null }),
    requesterIds.length
      ? client.from('profiles').select('id, full_name').in('id', requesterIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  const listings = new Map(unwrap(listingRows).map((row) => [row.id, row]));
  const profiles = new Map(unwrap(profileRows).map((row) => [row.id, row]));
  return {
    data: rows.map((row) => ({
      ...row,
      listing: listings.get(row.listing_id) || null,
      requester: profiles.get(row.requester_id) || null,
    })),
    pagination: { page, limit, total: result.count || 0 },
  };
}

export async function createRequest(client, requesterId, input) {
  const listing = unwrap(
    await client
      .from('listings')
      .select('id, owner_id, listing_type, status')
      .eq('id', input.listing_id)
      .maybeSingle(),
    'Listing not found'
  );

  if (listing.status !== 'active') throw new AppError(409, 'This listing is not available');
  if (listing.owner_id === requesterId) throw new AppError(400, 'You cannot request your own listing');

  const expectedType = listing.listing_type === 'sale' ? 'purchase' : listing.listing_type;
  if (input.request_type !== expectedType) {
    throw new AppError(400, `This listing requires a ${expectedType} request`);
  }

  return unwrap(
    await client
      .from('requests')
      .insert({ ...input, requester_id: requesterId, message: input.message || null })
      .select('*')
      .single()
  );
}

export async function updateRequestStatus(client, userId, id, status) {
  const request = unwrap(
    await client.from('requests').select('id, listing_id, requester_id, status').eq('id', id).maybeSingle(),
    'Request not found or not permitted'
  );
  if (request.status !== 'pending') throw new AppError(409, 'Only pending requests can be changed');

  if (status === 'cancelled' && request.requester_id !== userId) {
    throw new AppError(403, 'Only the requester can cancel this request');
  }
  if (status !== 'cancelled') {
    const listing = unwrap(
      await client.from('listings').select('owner_id').eq('id', request.listing_id).maybeSingle(),
      'Listing not found'
    );
    if (listing.owner_id !== userId) {
      throw new AppError(403, 'Only the listing owner can respond to this request');
    }
  }

  const result = await client
    .from('requests')
    .update({ status })
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (result.error) throw fromSupabaseError(result.error);
  if (!result.data) throw new AppError(404, 'Request not found or not permitted');
  return result.data;
}
