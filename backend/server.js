import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './Env.js';
import { supabaseAuthClient } from './supabase.js';
import { fromSupabaseError } from './helpers.js';
import { asyncHandler, errorHandler, notFound } from './middleware/errorHandler.js';
import authRoutes from './Auth.routes.js';
import profileRoutes from './Profile.routes.js';
import listingRoutes from './Listings.routes.js';
import requestRoutes from './Requests.routes.js';
import categoryRoutes from './Categories.routes.js';
import transactionRoutes from './Transactions.routes.js';

const app = express();
const frontendDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'frontend');

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: env.clientOrigins }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(express.static(frontendDir));

app.get('/api/health', asyncHandler(async (_req, res) => {
  const { error } = await supabaseAuthClient.from('colleges').select('id').limit(1);
  if (error) throw fromSupabaseError(error);
  res.json({ status: 'ok', database: 'connected' });
}));

app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use(notFound);
app.use(errorHandler);

app.listen(env.port, '127.0.0.1', () => {
  console.log(`ShareShelf API listening on http://127.0.0.1:${env.port}`);
});

export default app;
