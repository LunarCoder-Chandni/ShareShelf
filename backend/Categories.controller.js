import { asyncHandler } from './middleware/errorHandler.js';
import { unwrap } from './helpers.js';
import { supabaseAuthClient } from './supabase.js';

export const list = asyncHandler(async (req, res) => {
  const { data, error } = await supabaseAuthClient
    .from('categories')
    .select('id, name, slug, listing_type')
    .order('name');
  res.json({ data: unwrap({ data, error }) });
});
