import crypto from 'node:crypto';
import { supabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';

const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/** Uploads to Supabase Storage (bucket must be PUBLIC) and returns its public URL. */
export async function uploadImage(userId, file) {
  const path = `${userId}/${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${EXT[file.mimetype]}`;
  const { error } = await supabaseAdmin.storage
    .from(env.storageBucket)
    .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });
  if (error) {
    console.error('Storage error:', error);
    throw new AppError(500, 'Image upload failed. Check that the storage bucket exists.');
  }
  const { data } = supabaseAdmin.storage.from(env.storageBucket).getPublicUrl(path);
  return { url: data.publicUrl, path };
}