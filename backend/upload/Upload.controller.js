import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { uploadImage } from '../services/storage.service.js';

export const upload = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError(400, 'No image uploaded (use multipart field "image")');
  res.status(201).json({ data: await uploadImage(req.user.id, req.file) });
});