import { AppError } from './middleware/errorHandler.js';
import { fromSupabaseError, sanitizeSearch, unwrap } from './helpers.js';

async function listFromView(client, view, { listing_type, category_slug, search, page, limit, from, to }) {
  let query = client
    .from(view)
    .select('*', { count: 'exact' })
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (listing_type) query = query.eq('listing_type', listing_type);
  if (category_slug) query = query.eq('category_slug', category_slug);

  const cleanSearch = sanitizeSearch(search);
  if (cleanSearch) {
    const compactSearch = cleanSearch.toLowerCase().replace(/[^a-z0-9]/g, '');
    const aliases = {
      labcoat: 'lab coat',
      sheetholder: 'sheet holder',
      pptmaking: 'presentation',
      powerpoint: 'presentation',
    };
    const terms = [...new Set([cleanSearch, aliases[compactSearch]].filter(Boolean))];
    const searchFilters = terms.flatMap((term) => [
      `title.ilike.%${term}%`,
      `description.ilike.%${term}%`,
      `category_name.ilike.%${term}%`,
    ]);
    query = query.or(searchFilters.join(','));
  }

  const result = await query;
  return {
    data: unwrap(result),
    pagination: { page, limit, total: result.count || 0 },
  };
}

export const listListings = (client, query) => listFromView(client, 'listing_cards', query);
export const listPublicListings = (client, query) => listFromView(client, 'public_listing_cards', query);

export async function getListing(client, id) {
  return unwrap(await client.from('listing_cards').select('*').eq('id', id).maybeSingle(), 'Listing not found');
}

export async function createListing(client, ownerId, input) {
  const { listing_type, category_id, title, description } = input;
  const listing = unwrap(
    await client
      .from('listings')
      .insert({
        owner_id: ownerId,
        category_id,
        listing_type,
        title,
        description: description || null,
        status: 'draft',
      })
      .select('id')
      .single()
  );

  const detailByType = {
    borrow: {
      table: 'borrow_details',
      values: {
        max_duration_days: input.max_duration_days,
        expected_deposit: input.expected_deposit ?? 0,
        available_from: input.available_from ?? null,
        available_until: input.available_until ?? null,
      },
    },
    service: {
      table: 'service_details',
      values: {
        pricing_type: input.pricing_type,
        price: input.price ?? null,
        availability_notes: input.availability_notes ?? null,
      },
    },
    sale: {
      table: 'sale_details',
      values: { price: input.price, item_condition: input.item_condition },
    },
  }[listing_type];

  const { error: detailError } = await client
    .from(detailByType.table)
    .insert({ listing_id: listing.id, ...detailByType.values });

  if (detailError) {
    const { error: cleanupError } = await client.from('listings').delete().eq('id', listing.id);
    if (cleanupError) console.error('Could not remove incomplete listing:', cleanupError.code);
    throw fromSupabaseError(detailError);
  }

  const activated = await client
    .from('listings')
    .update({ status: 'active' })
    .eq('id', listing.id)
    .select('id')
    .single();

  if (activated.error) {
    const { error: cleanupError } = await client.from('listings').delete().eq('id', listing.id);
    if (cleanupError) console.error('Could not remove incomplete listing:', cleanupError.code);
    throw fromSupabaseError(activated.error);
  }

  return getListing(client, listing.id);
}

export async function deleteListing(client, id) {
  const result = await client.from('listings').delete().eq('id', id).select('id').maybeSingle();
  if (result.error) throw fromSupabaseError(result.error);
  if (!result.data) throw new AppError(404, 'Listing not found or not owned by this user');
}
