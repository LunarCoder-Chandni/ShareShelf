<<<<<<< HEAD
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import authRoutes from './Auth.routes.js';
import { env } from './Env.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const app = express();
const frontendDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '../frontend');

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.clientOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});
app.use('/api/auth', authRoutes);
app.use(express.static(frontendDirectory));
=======
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

// Route modules
import authRoutes from './auth/auth.routes.js';
import profileRoutes from './profile/profile.routes.js';
import listingRoutes from './listing/listing.routes.js';
import needRoutes from './need/need.routes.js';
import requestRoutes from './request/request.routes.js';
import reviewRoutes from './review/review.routes.js';
import safetyRoutes from './safety/safety.routes.js';
import serviceListingRoutes from './serviceListing/serviceListing.routes.js';

const app = express();

// Global middleware
app.use(helmet());
app.use(cors({ origin: env.clientOrigins, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/needs', needRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/safety', safetyRoutes);
app.use('/api/services', serviceListingRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Error handling
>>>>>>> 341a4bd6a10aad487ea7eac068e78c87d070cc12
app.use(notFound);
app.use(errorHandler);

app.listen(env.port, () => {
<<<<<<< HEAD
  console.log(`ShareShelf server listening on http://localhost:${env.port}`);
});
=======
  console.log(`ShareShelf API running on port ${env.port} [${env.nodeEnv}]`);
});

export default app;
>>>>>>> 341a4bd6a10aad487ea7eac068e78c87d070cc12
