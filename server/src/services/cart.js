import redis from '../redis.js';
import Product from '../models/Product.js';

// Cart = one Redis hash per user: field = productId, value = qty. It is ephemeral by nature
// (7-day TTL, refreshed on every write), so it doesn't need Mongo. Orders are what we persist.
export const CART_TTL = 7 * 24 * 3600;
export const cartKey = (userId) => `cart:${userId}`;

export async function loadCart(userId) {
  const raw = await redis.hgetall(cartKey(userId));
  const ids = Object.keys(raw);
  const products = ids.length ? await Product.find({ _id: { $in: ids } }).lean() : [];
  const items = products.map((product) => ({ product, qty: Number(raw[product._id]) }));

  const live = new Set(items.map((i) => String(i.product._id)));
  const stale = ids.filter((id) => !live.has(id)); // product deleted while in cart
  if (stale.length) await redis.hdel(cartKey(userId), ...stale);

  const total = items.reduce((s, i) => s + i.product.price * i.qty, 0);
  return { items, total, count: items.reduce((s, i) => s + i.qty, 0) };
}

