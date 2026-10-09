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
app.use(notFound);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`ShareShelf server listening on http://localhost:${env.port}`);
});
