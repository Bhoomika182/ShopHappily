import redis from '../redis.js';
import { EMBEDDING_DIM } from './embeddings.js';
import { toBuffer } from '../lib/vec.js';

// Redis Stack (RediSearch) used as the vector database. One hash per document:
//   kb:product:<mongoId> | kb:faq:<slug>   ->  title, text, type, category, price, productId, embedding
export const INDEX = 'idx:kb';
export const PREFIX = 'kb:';

export async function ensureIndex() {
  try {
    await redis.call('FT.INFO', INDEX);
    return false;
  } catch (err) {
    if (!/unknown|no such index|not found/i.test(err.message)) throw err;
  }
  await redis.call(
    'FT.CREATE', INDEX, 'ON', 'HASH', 'PREFIX', '1', PREFIX,
    'SCHEMA',
    'title', 'TEXT',
    'text', 'TEXT',
    'type', 'TAG',
    'category', 'TAG',
    'price', 'NUMERIC',
    'embedding', 'VECTOR', 'HNSW', '6', 'TYPE', 'FLOAT32', 'DIM', String(EMBEDDING_DIM), 'DISTANCE_METRIC', 'COSINE'
  );
  console.log('[vector] index created');
  return true;
}

export async function upsertDoc({ id, type, title, text, category = 'none', price = 0, productId = '' }, vector) {
  await redis.hset(`${PREFIX}${id}`, {
    title, text, type, category, price, productId,
    embedding: toBuffer(vector),
  });
}

export const deleteDoc = (id) => redis.del(`${PREFIX}${id}`);

export async function clearAll() {
  const stream = redis.scanStream({ match: `${PREFIX}*`, count: 200 });
  for await (const keys of stream) if (keys.length) await redis.unlink(keys);
}

export async function countDocs() {
  try {
    const info = await redis.call('FT.INFO', INDEX);
    const i = info.indexOf('num_docs');
    return i >= 0 ? Number(info[i + 1]) : 0;
  } catch {
    return 0;
  }
}

const escapeTag = (v) => String(v).replace(/[^a-zA-Z0-9_]/g, (c) => `\\${c}`);

// KNN search with metadata pre-filters (hybrid search): the filter narrows the candidate set,
// then the vector distance ranks it. Cosine distance -> similarity = 1 - distance.
export async function search(vector, { k = 5, type, category, maxPrice } = {}) {
  const filters = [];
  if (type) filters.push(`@type:{${escapeTag(type)}}`);
  if (category) filters.push(`@category:{${escapeTag(category)}}`);
  if (maxPrice != null) filters.push(`@price:[0 ${Number(maxPrice)}]`);
  const pre = filters.length ? `(${filters.join(' ')})` : '*';
  const query = `${pre}=>[KNN ${k} @embedding $vec AS score]`;

  const res = await redis.call(
    'FT.SEARCH', INDEX, query,
    'PARAMS', '2', 'vec', toBuffer(vector),
    'SORTBY', 'score',
    'LIMIT', '0', String(k),
    'RETURN', '7', 'title', 'text', 'type', 'category', 'price', 'productId', 'score',
    'DIALECT', '2'
  );

  // [total, key1, [f, v, f, v...], key2, [...]]
  const hits = [];
  for (let i = 1; i < res.length; i += 2) {
    const f = {};
    for (let j = 0; j < res[i + 1].length; j += 2) f[res[i + 1][j]] = res[i + 1][j + 1];
    hits.push({
      key: res[i], title: f.title, text: f.text, type: f.type, category: f.category,
      price: Number(f.price), productId: f.productId, similarity: 1 - Number(f.score),
    });
  }
  return hits;
}
