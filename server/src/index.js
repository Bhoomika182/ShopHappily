import 'express-async-errors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { config } from './config.js';
import { connectDb } from './db.js';
import redis from './redis.js';
import { errorHandler } from './middleware/error.js';
import { countDocs, ensureIndex } from './services/vectorStore.js';
import { warmUp } from './services/embeddings.js';
import { seedAll } from './seed/seed.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import aiRoutes from './routes/ai.js';
import adminRoutes from './routes/admin.js';

const app = express();
app.set('trust proxy', 1); // behind nginx or cloud proxy: req.ip must be the real client for rate limiting

// CORS & Preflight handling
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,Idempotency-Key');
    res.setHeader('Access-Control-Expose-Headers', 'X-Cache');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(morgan('dev'));

app.get('/api/health', async (req, res) =>
  res.json({
    status: 'ok',
    mongo: mongoose.connection.readyState === 1,
    redis: redis.status === 'ready',
    aiMode: config.anthropicKey ? 'live' : 'demo',
    vectorDocs: await countDocs(),
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));
app.use(errorHandler);

await connectDb();
await ensureIndex();
const server = app.listen(config.port, () => console.log(`[server] listening on ${config.port}`));

// Warm the embedding model and (first run only) seed, in the background so the API is up immediately.
warmUp()
  .then(() => (config.seedOnStart ? seedAll() : null))
  .catch((err) => console.error('[startup] background init failed:', err));

const shutdown = () => {
  console.log('[server] shutting down');
  server.close(async () => {
    await mongoose.disconnect();
    redis.disconnect();
    process.exit(0);
  });
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
