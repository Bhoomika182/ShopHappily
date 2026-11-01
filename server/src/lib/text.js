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

export const CATEGORY_MAP = {
  // Laptops
  laptop: 'laptops',
  laptops: 'laptops',
  notebook: 'laptops',
  notebooks: 'laptops',
  macbook: 'laptops',
  macbooks: 'laptops',
  computer: 'laptops',
  computers: 'laptops',
  pc: 'laptops',
  ultrabook: 'laptops',
  ultrabooks: 'laptops',

  // Shoes
  shoe: 'shoes',
  shoes: 'shoes',
  sneaker: 'shoes',
  sneakers: 'shoes',
  footwear: 'shoes',
  boot: 'shoes',
  boots: 'shoes',
  oxford: 'shoes',
  oxfords: 'shoes',
  loafer: 'shoes',
  loafers: 'shoes',
  trainer: 'shoes',
  trainers: 'shoes',

  // Jackets
  jacket: 'jackets',
  jackets: 'jackets',
  coat: 'jackets',
  coats: 'jackets',
  windbreaker: 'jackets',
  windbreakers: 'jackets',
  puffer: 'jackets',
  puffers: 'jackets',
  blazer: 'jackets',
  blazers: 'jackets',
  outerwear: 'jackets',

  // Bags
  bag: 'bags',
  bags: 'bags',
  handbag: 'bags',
  handbags: 'bags',
  backpack: 'bags',
  backpacks: 'bags',
  purse: 'bags',
  purses: 'bags',
  tote: 'bags',
  totes: 'bags',

  // Watches
  watch: 'watches',
  watches: 'watches',
  wristwatch: 'watches',
  wristwatches: 'watches',
  timepiece: 'watches',
  timepieces: 'watches',

  // Tables
  table: 'tables',
  tables: 'tables',
  desk: 'tables',
  desks: 'tables',
  furniture: 'tables',
};

export function extractCategory(q) {
  if (!q || typeof q !== 'string') return undefined;
  const words = q.toLowerCase().match(/\b[a-z0-9_-]+\b/g) || [];
  for (const w of words) {
    if (CATEGORY_MAP[w]) return CATEGORY_MAP[w];
  }
  return undefined;
}

const FOLLOW_UP_PATTERN = /^(and\b|or\b|also\b|how\s+about\b|what\s+about\b|any\s+(other|more|cheaper)\b|show\s+(me\s+)?(more|other)\b|cheaper\b|more\b|less\b|under\b|below\b|other\b|others\b|in\s+(black|white|blue|red|brown|leather)\b|size\b)/i;

export function isFollowUp(question) {
  return FOLLOW_UP_PATTERN.test(question.trim());
}

// Short follow-ups ("and cheaper ones?") carry no meaning alone -> borrow the previous user turn.
// But if the question specifies a new topic or category (e.g. "laptops" after "shoes"), NEVER borrow old context.
export function buildRetrievalQuery(question, history = []) {
  const lastUser = [...history].reverse().find((m) => m.role === 'user');
  if (!lastUser) return question;

  const currentCat = extractCategory(question);
  const lastCat = extractCategory(lastUser.content);

  // If the user specifies a category that is different from previous turn, it's a topic switch
  if (currentCat && currentCat !== lastCat) {
    return question;
  }

  // Only borrow context for genuine follow-ups / refinements
  if (isFollowUp(question) || (lastCat && !currentCat && question.trim().split(/\s+/).length < 4)) {
    return `${lastUser.content} ${question}`;
  }

  return question;
}

export const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
