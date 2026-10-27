import { Router } from 'express';
import { z } from 'zod';
import redis from '../redis.js';
import { requireAuth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { config } from '../config.js';
import { getVersion } from '../services/cache.js';
import { streamAnswer } from '../services/llm.js';
import { SYSTEM_PROMPT, NO_MATCH, buildMessages, demoAnswer, retrieve } from '../services/rag.js';
import { normalizeHistory, normalizeQuestion, sha } from '../lib/text.js';

import jwt from 'jsonwebtoken';
import { COOKIE } from '../middleware/auth.js';

const router = Router();
// Parse user if signed in, but allow guest shoppers to ask questions
router.use((req, res, next) => {
  const token = req.cookies?.[COOKIE];
  if (token) {
    try {
      const payload = jwt.verify(token, config.jwtSecret);
      req.userId = payload.id;
      req.role = payload.role;
    } catch {}
  }
  next();
});

const chatSchema = z.object({
  question: z.string().trim().min(2).max(500),
  category: z.string().trim().toLowerCase().max(30).optional(),
  history: z.array(z.object({ role: z.string(), content: z.string() })).max(10).default([]),
});

router.get('/stats', async (req, res) => {
  const [calls, hits] = await redis.mget('stats:llm_calls', 'stats:answer_cache_hits');
  res.json({ mode: config.anthropicKey ? 'live' : 'demo', llmCalls: Number(calls || 0), answerCacheHits: Number(hits || 0) });
});

// RAG chat, streamed to the browser as Server-Sent Events:
//   sources -> token* -> done        (or error)
router.post(
  '/chat',
  rateLimit({ name: 'chat', limit: config.chatRateLimit, windowMs: 60_000, by: 'user' }),
  async (req, res) => {
    const body = chatSchema.parse(req.body); // validate BEFORE opening the stream so errors are normal JSON
    const question = body.question;
    const history = normalizeHistory(body.history);

    res.set({
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders();
    const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

    // If the user closes the tab mid-answer, stop paying for tokens nobody will read.
    const controller = new AbortController();
    res.on('close', () => { if (!res.writableEnded) controller.abort(); });

    const started = performance.now();
    const ms = () => Math.round(performance.now() - started);

    try {
      // Answer cache: only for standalone questions (no history) answered by the real model,
      // keyed by catalogue version so a product/price change invalidates stale answers.
      const cacheKey =
        config.anthropicKey && history.length === 0
          ? `ai:ans:${await getVersion()}:${sha(`${normalizeQuestion(question)}|${body.category || ''}`)}`
          : null;

      if (cacheKey) {
        const hit = await redis.get(cacheKey);
        if (hit) {
          const { answer, sources } = JSON.parse(hit);
          await redis.incr('stats:answer_cache_hits');
          send('sources', sources);
          send('token', { t: answer });
          send('done', { cached: true, totalMs: ms() });
          return res.end();
        }
      }

      const retrieved = await retrieve(question, history, { category: body.category });
      const sources = retrieved.products.map(({ product: p, similarity }) => ({
        id: p._id, name: p.name, price: p.price, category: p.category, stock: p.stock,
        similarity: Number(similarity.toFixed(2)),
      }));
      send('sources', sources);

      if (!retrieved.products.length && !retrieved.faqs.length) {
        send('token', { t: NO_MATCH });
        send('done', { cached: false, noMatch: true, timings: retrieved.timings, totalMs: ms() });
        return res.end();
      }

      let answer = '';
      let firstTokenMs;
      const stream = streamAnswer({
        system: SYSTEM_PROMPT,
        messages: buildMessages(question, history, retrieved),
        fallback: demoAnswer(retrieved),
        signal: controller.signal,
      });
      for await (const t of stream) {
        firstTokenMs ??= ms();
        answer += t;
        send('token', { t });
      }

      if (config.anthropicKey) await redis.incr('stats:llm_calls');
      if (cacheKey && answer) await redis.set(cacheKey, JSON.stringify({ answer, sources }), 'EX', config.answerCacheTtl);
      send('done', { cached: false, filters: retrieved.filters, timings: { ...retrieved.timings, firstTokenMs }, totalMs: ms() });
    } catch (err) {
      if (!controller.signal.aborted) {
        console.error('[ai] chat failed:', err.message);
        send('error', { message: err.expose ? err.message : 'The assistant hit a problem. Please try again.' });
      }
    } finally {
      res.end();
    }
  }
);

export default router;
