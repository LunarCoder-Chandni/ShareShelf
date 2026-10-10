import { asyncHandler } from './middleware/errorHandler.js';
import { getPagination } from './helpers.js';
import * as listings from './listings.service.js';
import { supabaseAuthClient } from './supabase.js';

export const list = asyncHandler(async (req, res) => {
  res.json(await listings.listListings(req.supabase, { ...req.valid.query, ...getPagination(req.valid.query) }));
});

export const listPublic = asyncHandler(async (req, res) => {
  res.json(await listings.listPublicListings(supabaseAuthClient, { ...req.valid.query, ...getPagination(req.valid.query) }));
});

export const get = asyncHandler(async (req, res) => {
  res.json({ data: await listings.getListing(req.supabase, req.valid.params.id) });
});

export const create = asyncHandler(async (req, res) => {
  res.status(201).json({ data: await listings.createListing(req.supabase, req.user.id, req.valid.body) });
});

export const remove = asyncHandler(async (req, res) => {
  await listings.deleteListing(req.supabase, req.valid.params.id);
  res.status(204).end();
});
