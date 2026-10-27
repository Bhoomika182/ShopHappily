import Redis from 'ioredis';
import { config } from './config.js';

export const redis = new Redis(config.redisUrl, { maxRetriesPerRequest: 3 });
redis.on('error', (err) => console.error('[redis]', err.message));
redis.on('ready', () => console.log('[redis] ready'));

// Sliding-window-log rate limiter, executed atomically inside Redis (Lua).
// KEYS[1] = sorted set per client; ARGV = nowMs, windowMs, limit, uniqueMember
// Returns {allowed(0|1), currentCount, retryAfterMs}
redis.defineCommand('slidingWindow', {
  numberOfKeys: 1,
  lua: `
    local key, now, window, limit = KEYS[1], tonumber(ARGV[1]), tonumber(ARGV[2]), tonumber(ARGV[3])
    redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
    local count = redis.call('ZCARD', key)
    if count >= limit then
      local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
      return {0, count, window - (now - tonumber(oldest[2]))}
    end
    redis.call('ZADD', key, now, ARGV[4])
    redis.call('PEXPIRE', key, window)
    return {1, count + 1, 0}
  `,
});

export default redis;
