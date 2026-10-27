import test from 'node:test';
import assert from 'node:assert/strict';
import { extractMaxPrice, normalizeHistory, buildRetrievalQuery, productText } from '../src/lib/text.js';
import { toBuffer, cosine } from '../src/lib/vec.js';

test('extractMaxPrice parses common phrasings', () => {
  assert.equal(extractMaxPrice('jacket under 5000'), 5000);
  assert.equal(extractMaxPrice('headphones below Rs. 2,500'), 2500);
  assert.equal(extractMaxPrice('budget of ₹3k'), 3000);
  assert.equal(extractMaxPrice('best coffee set'), undefined);
});

test('normalizeHistory enforces user-first strict alternation and drops a trailing user turn', () => {
  const out = normalizeHistory([
    { role: 'assistant', content: 'hi' },
    { role: 'user', content: 'a' },
    { role: 'user', content: 'dup' },
    { role: 'assistant', content: 'b' },
    { role: 'user', content: 'c' },
    { role: 'system', content: 'ignore me' },
  ]);
  assert.deepEqual(out.map((m) => m.role), ['user', 'assistant']);
});

test('normalizeHistory rejects junk', () => {
  assert.deepEqual(normalizeHistory([null, { role: 'user' }, { role: 'user', content: '  ' }]), []);
});

test('buildRetrievalQuery borrows context for short follow-ups only', () => {
  const history = [{ role: 'user', content: 'rain jacket for trekking' }, { role: 'assistant', content: '...' }];
  assert.match(buildRetrievalQuery('cheaper ones?', history), /rain jacket/);
  assert.equal(buildRetrievalQuery('what do you have for sleeping better at night', history), 'what do you have for sleeping better at night');
});

test('productText includes name, category and tags', () => {
  const t = productText({ name: 'Mug', description: 'Holds tea.', category: 'kitchen', tags: ['tea'] });
  assert.equal(t, 'Mug. Holds tea. Category: kitchen. Tags: tea.');
});

test('toBuffer produces 4 bytes per float32 and cosine is 1 for identical vectors', () => {
  const v = Float32Array.from([0.1, 0.2, 0.3]);
  assert.equal(toBuffer(v).length, 12);
  assert.ok(Math.abs(cosine(v, v) - 1) < 1e-6);
});
