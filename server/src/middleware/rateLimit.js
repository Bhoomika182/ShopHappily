import redis from '../redis.js';
import crypto from 'crypto';

// rateLimit({ name, limit, windowMs, by: 'user' | 'ip' })
// Fails OPEN if Redis is unreachable: a cache outage should not take the store down.
export function rateLimit({ name, limit, windowMs = 60_000, by = 'ip' }) {
  return async (req, res, next) => {
    try {
      const id = by === 'user' && req.userId ? req.userId : req.ip;
      const now = Date.now();
      const member = `${now}-${crypto.randomBytes(4).toString('hex')}`;
      const [allowed, count, retryMs] = await redis.slidingWindow(`rl:${name}:${id}`, now, windowMs, limit, member);

      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - count));
      if (!allowed) {
        const retry = Math.ceil(retryMs / 1000);
        res.setHeader('Retry-After', retry);
        return res.status(429).json({ error: `Too many requests. Try again in ${retry}s.` });
      }
    } catch (err) {
      console.error('[rateLimit] redis unavailable, failing open:', err.message);
    }
    next();
  };
}
