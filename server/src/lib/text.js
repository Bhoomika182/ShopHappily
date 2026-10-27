import crypto from 'crypto';

export const sha = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 32);

export const normalizeQuestion = (q) => q.toLowerCase().replace(/\s+/g, ' ').trim();

// The text that gets embedded for a product. Name + description + category + tags.
export function productText(p) {
  const tags = (p.tags || []).join(', ');
  return `${p.name}. ${p.description} Category: ${p.category}.${tags ? ` Tags: ${tags}.` : ''}`;
}

// "waterproof jacket under 5000" / "below Rs. 2,500" / "budget of 3k"  ->  number
// Cheap, deterministic metadata extraction. An LLM-based query parser is the upgrade path.
export function extractMaxPrice(q) {
  const m = /(?:under|below|less than|within|upto|up to|max(?:imum)?|budget of|<)\s*(?:rs\.?|inr|₹)?\s*(\d[\d,]*)(\s*k\b)?/i.exec(q);
  if (!m) return undefined;
  let n = Number(m[1].replace(/,/g, ''));
  if (m[2]) n *= 1000;
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

// Anthropic requires: starts with "user", strictly alternating, and (since we append the
// final user turn ourselves) ends with "assistant". Never trust client-sent history.
export function normalizeHistory(history = []) {
  const out = [];
  for (const m of history) {
    if (!m || !['user', 'assistant'].includes(m.role)) continue;
    if (typeof m.content !== 'string' || !m.content.trim()) continue;
    const expected = out.length === 0 ? 'user' : out[out.length - 1].role === 'user' ? 'assistant' : 'user';
    if (m.role !== expected) continue;
    out.push({ role: m.role, content: m.content.slice(0, 1500) });
  }
  if (out.length && out[out.length - 1].role === 'user') out.pop();
  return out;
}

// Short follow-ups ("and cheaper ones?") carry no meaning alone -> borrow the previous user turn.
export function buildRetrievalQuery(question, history = []) {
  const lastUser = [...history].reverse().find((m) => m.role === 'user');
  if (lastUser && question.trim().split(/\s+/).length < 6) return `${lastUser.content} ${question}`;
  return question;
}

export const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
