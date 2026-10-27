import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const required = (name) => {
  if (!process.env[name]) throw new Error(`Missing required env var ${name}`);
  return process.env[name];
};

export const config = {
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/shopmind',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: required('JWT_SECRET'),
  secureCookies: process.env.COOKIE_SECURE === 'true',
  anthropicKey: process.env.ANTHROPIC_API_KEY || '',
  model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@shophappily.dev',
  adminPassword: process.env.ADMIN_PASSWORD || 'Admin@12345',
  chatRateLimit: Number(process.env.CHAT_RATE_LIMIT_PER_MIN || 10),
  productCacheTtl: Number(process.env.PRODUCT_CACHE_TTL_SECONDS || 120),
  answerCacheTtl: Number(process.env.ANSWER_CACHE_TTL_SECONDS || 3600),
  minSimilarity: Number(process.env.MIN_SIMILARITY || 0.1),
  modelCacheDir: process.env.MODEL_CACHE_DIR || './.cache',
  seedOnStart: process.env.SEED_ON_START === 'true',
};
