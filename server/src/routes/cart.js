import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import redis from '../redis.js';
import Product from '../models/Product.js';
import { requireAuth } from '../middleware/auth.js';
import { cartKey, CART_TTL, loadCart } from '../services/cart.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => res.json(await loadCart(req.userId)));

router.put('/items', async (req, res) => {
  const { productId, qty } = z
    .object({ productId: z.string().refine(mongoose.isValidObjectId, 'invalid id'), qty: z.number().int().min(0).max(10) })
    .parse(req.body);

  if (qty === 0) {
    await redis.hdel(cartKey(req.userId), productId);
  } else {
    const product = await Product.findById(productId).lean();
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    if (product.stock < qty)
      return res.status(409).json({ error: `Only ${product.stock} of "${product.name}" left in stock.` });
    await redis.multi().hset(cartKey(req.userId), productId, qty).expire(cartKey(req.userId), CART_TTL).exec();
  }
  res.json(await loadCart(req.userId));
});

router.delete('/', async (req, res) => {
  await redis.del(cartKey(req.userId));
  res.json({ items: [], total: 0, count: 0 });
});

export default router;
