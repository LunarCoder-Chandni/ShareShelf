import { asyncHandler } from '../middleware/errorHandler.js';
import * as listingService from '../services/listing.service.js';

export const list = asyncHandler(async (req, res) => {
  res.json(await listingService.searchListings(req.valid.query));
});

export const mine = asyncHandler(async (req, res) => {
  res.json(
    await listingService.searchListings(req.valid.query, {
      ownerId: req.user.id,
      allStatuses: true,
    })
  );
});

export const getOne = asyncHandler(async (req, res) => {
  res.json({ data: await listingService.getListing(req.valid.params.id) });
});

export const create = asyncHandler(async (req, res) => {
  res.status(201).json({ data: await listingService.createListing(req.user.id, req.valid.body) });
});

export const update = asyncHandler(async (req, res) => {
  res.json({
    data: await listingService.updateListing(req.valid.params.id, req.user.id, req.valid.body),
  });
});

export const remove = asyncHandler(async (req, res) => {
  await listingService.deleteListing(req.valid.params.id, req.user.id);
  res.status(204).end();
});

export const contactSeller = asyncHandler(async (req, res) => {
  res.json({ data: await listingService.getSellerContact(req.valid.params.id, req.user.id) });
});

export const markSold = asyncHandler(async (req, res) => {
  res.json({
    data: await listingService.markSold(req.valid.params.id, req.user.id, req.valid.body),
  });
});