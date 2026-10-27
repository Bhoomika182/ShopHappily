import mongoose from 'mongoose';
import { connectDb } from '../db.js';
import redis from '../redis.js';
import { seedAll } from './seed.js';
import { reindexAll } from '../services/productIndex.js';

const reindexOnly = process.argv.includes('--reindex-only');
await connectDb();
if (reindexOnly) console.log('[reindex]', await reindexAll());
else await seedAll({ force: process.argv.includes('--force') });
await mongoose.disconnect();
redis.disconnect();
