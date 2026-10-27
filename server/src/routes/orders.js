import { Router } from 'express';
import redis from '../redis.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { requireAuth } from '../middleware/auth.js';
import { cartKey, loadCart } from '../services/cart.js';
import { bumpVersion } from '../services/cache.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const orders = await Order.find({ user: req.userId })
    .sort({ createdAt: -1 })
    .populate('items.product', 'image category description')
    .limit(50)
    .lean();

  const normalized = orders.map((order) => ({
    ...order,
    items: order.items.map((i) => ({
      ...i,
      product: i.product?._id ? String(i.product._id) : String(i.product),
      image: i.image || i.product?.image || '',
      category: i.category || i.product?.category || '',
      description: i.description || i.product?.description || '',
    })),
  }));

  res.json(normalized);
});

// Checkout. Three problems solved here:
//  1. Overselling   -> atomic conditional stock decrement ({stock: {$gte: qty}}), compensated on failure.
//  2. Double submit -> Idempotency-Key header + Redis lock; a retry returns the SAME order.
//  3. Stale caches  -> catalogue cache version is bumped after stock changes.
// Payment is simulated (orders are created as "paid").
router.post('/', async (req, res) => {
  const idem = req.get('Idempotency-Key');
  let idemKey, lockKey;

  if (idem) {
    if (idem.length > 100) return res.status(400).json({ error: 'Idempotency-Key too long.' });
    idemKey = `idem:${req.userId}:${idem}`;
    lockKey = `${idemKey}:lock`;
    const prev = await redis.get(idemKey);
    if (prev) {
      const order = await Order.findById(prev).lean();
      if (order) return res.json({ order, replayed: true });
    }
    if (!(await redis.set(lockKey, '1', 'EX', 30, 'NX')))
      return res.status(409).json({ error: 'This checkout is already being processed.' });
  }

  try {
    const cart = await loadCart(req.userId);
    if (!cart.items.length) return res.status(400).json({ error: 'Your cart is empty.' });

    const reserved = [];
    let order;
    try {
      for (const { product, qty } of cart.items) {
        const r = await Product.updateOne({ _id: product._id, stock: { $gte: qty } }, { $inc: { stock: -qty } });
        if (r.modifiedCount !== 1)
          throw Object.assign(new Error(`Not enough stock for "${product.name}". Update your cart and try again.`), { status: 409, expose: true });
        reserved.push({ id: product._id, qty });
      }
      order = await Order.create({
        user: req.userId,
        items: cart.items.map(({ product, qty }) => ({
          product: product._id,
          name: product.name,
          price: product.price,
          qty,
          image: product.image || '',
          category: product.category || '',
          description: product.description || '',
        })),
        total: cart.total,
      });
    } catch (err) {
      // compensate: give back whatever we already took
      await Promise.all(reserved.map((r) => Product.updateOne({ _id: r.id }, { $inc: { stock: r.qty } })));
      throw err;
    }

    await redis.del(cartKey(req.userId));
    await bumpVersion();
    if (idemKey) await redis.set(idemKey, String(order._id), 'EX', 24 * 3600);
    res.status(201).json({ order });
  } finally {
    if (lockKey) await redis.del(lockKey);
  }
});

export default router;
