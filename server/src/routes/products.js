import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import Product from '../models/Product.js';
import { cached, getVersion } from '../services/cache.js';
import { embed } from '../services/embeddings.js';
import { search } from '../services/vectorStore.js';
import { hydrate } from '../services/rag.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { config } from '../config.js';
import { extractMaxPrice, sha } from '../lib/text.js';

const router = Router();

const listSchema = z.object({
  search: z.string().trim().max(100).optional(),
  category: z.string().trim().toLowerCase().max(30).optional(),
  sort: z.enum(['newest', 'relevance', 'price_asc', 'price_desc']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(12),
});

// Catalogue listing: Mongo query behind a Redis cache-aside layer (see services/cache.js).
// The X-Cache header makes the cache visible in the UI and in demos.
router.get('/', async (req, res) => {
  const q = listSchema.parse(req.query);
  const key = `cache:products:${await getVersion()}:${sha(JSON.stringify(q))}`;

  const { value, hit } = await cached(key, config.productCacheTtl, async () => {
    const filter = {};
    if (q.category) filter.category = q.category;
    if (q.search) filter.$text = { $search: q.search };

    const useRelevance = q.search && q.sort === 'relevance';
    const sortMap = { newest: { createdAt: -1, _id: 1 }, price_asc: { price: 1, _id: 1 }, price_desc: { price: -1, _id: 1 } };
    const query = useRelevance
      ? Product.find(filter, { score: { $meta: 'textScore' } }).sort({ score: { $meta: 'textScore' } })
      : Product.find(filter).sort(sortMap[q.sort] || sortMap.newest);

    const [items, total] = await Promise.all([
      query.skip((q.page - 1) * q.limit).limit(q.limit).lean(),
      Product.countDocuments(filter),
    ]);
    return { items, total, page: q.page, pages: Math.max(1, Math.ceil(total / q.limit)) };
  });

  res.set('X-Cache', hit ? 'HIT' : 'MISS').json(value);
});

router.get('/categories', async (req, res) => {
  const { value, hit } = await cached(`cache:categories:${await getVersion()}`, 300, () => Product.distinct('category'));
  res.set('X-Cache', hit ? 'HIT' : 'MISS').json(value.sort());
});

// Semantic search: embed the query, KNN over the Redis vector index. Finds "something to keep
// drinks cold on a hike" even though no product contains those words.
router.get(
  '/semantic',
  rateLimit({ name: 'semantic', limit: 30, windowMs: 60_000, by: 'ip' }),
  async (req, res) => {
    const { q, category } = z
      .object({ q: z.string().trim().min(2).max(200), category: z.string().trim().toLowerCase().max(30).optional() })
      .parse(req.query);

    const hits = await search(await embed(q), { k: 12, type: 'product', category, maxPrice: extractMaxPrice(q) });
    const results = await hydrate(hits.filter((h) => h.similarity >= config.minSimilarity));
    res.json({ items: results.map((r) => ({ ...r.product, similarity: Number(r.similarity.toFixed(2)) })) });
  }
);

router.get('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Product not found.' });
  const product = await Product.findById(req.params.id).lean();
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  res.json(product);
});

export default router;
