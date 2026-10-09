
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import authRoutes from './auth/auth.routes.js';
import listingRoutes from './listing/listing.routes.js';
import needRoutes from './need/need.routes.js';
import profileRoutes from './profile/profile.routes.js';
import requestRoutes from './request/request.routes.js';
import reviewRoutes from './review/review.routes.js';
import safetyRoutes from './safety/safety.routes.js';
import serviceListingRoutes from './serviceListing/serviceListing.routes.js';

import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const app = express();

const frontendDirectory = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../frontend'
);

// Security and middleware
app.use(helmet());

app.use(
  cors({
    origin: env.clientOrigins,
    credentials: true
  })
);

app.use(express.json({ limit: '1mb' }));

app.use(
  morgan(env.nodeEnv === 'production' ? 'combined' : 'dev')
);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/needs', needRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/safety', safetyRoutes);
app.use('/api/services', serviceListingRoutes);

// Serve frontend files
app.use(express.static(frontendDirectory));

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(env.port, () => {
  console.log(
    `ShareShelf API running on port ${env.port} [${env.nodeEnv}]`
  );
});

export default app;
