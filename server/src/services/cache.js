import redis from '../redis.js';

// Cache-aside with VERSIONED keys. Any catalog write bumps `products:ver`, which makes every
// old cache key unreachable at once (they expire via TTL). No SCAN/DEL fan-out needed.
export const getVersion = async () => (await redis.get('products:ver')) || '0';
export const bumpVersion = () => redis.incr('products:ver');

export async function cached(key, ttlSeconds, loader) {
  const hit = await redis.get(key);
  if (hit) return { value: JSON.parse(hit), hit: true };
  const value = await loader();
  await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  return { value, hit: false };
}
