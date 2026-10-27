import { Router } from 'express';
import { z } from 'zod';
import Product from '../models/Product.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { bumpVersion } from '../services/cache.js';
import { indexProduct, reindexAll, removeProduct } from '../services/productIndex.js';
import { seedAll } from '../seed/seed.js';
import { clearAll } from '../services/vectorStore.js';

const router = Router();
router.use(requireAuth, requireAdmin);

const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(1000),
  price: z.number().min(0).max(1_000_000),
  category: z.string().trim().toLowerCase().min(2).max(40).regex(/^[a-z0-9_\-\s]+$/, 'letters, numbers, hyphens, and spaces only'),
  stock: z.number().int().min(0).max(100000),
  tags: z.array(z.string().trim().max(30)).max(10).default([]),
  image: z.string().trim().optional().default(''),
});

// Write to Mongo (truth) -> update vector index (derived) -> invalidate caches.
// If embedding fails the product is still saved; /reindex repairs the index later.
async function sync(product) {
  let indexed = true;
  try { await indexProduct(product); } catch (err) { indexed = false; console.error('[index] failed:', err.message); }
  await bumpVersion();
  return indexed;
}

router.post('/products', async (req, res) => {
  const product = await Product.create(productSchema.parse(req.body));
  res.status(201).json({ product, indexed: await sync(product) });
});

router.put('/products/:id', async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, productSchema.partial().parse(req.body), { new: true });
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  res.json({ product, indexed: await sync(product) });
});

router.delete('/products/:id', async (req, res) => {
  await Product.deleteOne({ _id: req.params.id });
  await removeProduct(req.params.id);
  await bumpVersion();
  res.json({ ok: true });
});

router.post('/reindex', async (req, res) => {
  const result = await reindexAll();
  await bumpVersion();
  res.json(result);
});

router.post('/seed', async (req, res) => {
  await seedAll({ force: true });
  res.json({ ok: true, message: 'Catalogue populated with 26 demo products' });
});

router.post('/clear', async (req, res) => {
  await Product.deleteMany({});
  await clearAll();
  await bumpVersion();
  res.json({ ok: true, message: 'All products cleared' });
});

export default router;
