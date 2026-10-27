import { pipeline, env } from '@xenova/transformers';
import { config } from '../config.js';

// Local embedding model (runs inside Node via ONNX): no API key, no per-call cost,
// 384-dim vectors. Swap for a hosted embedding API by changing this one file.
env.cacheDir = config.modelCacheDir;

export const EMBEDDING_DIM = 384;
const MODEL = 'Xenova/all-MiniLM-L6-v2';

let extractor;
const load = () => (extractor ??= pipeline('feature-extraction', MODEL));

export async function embed(text) {
  const run = await load();
  const out = await run(text, { pooling: 'mean', normalize: true });
  return Float32Array.from(out.data);
}

export const warmUp = () => embed('warm up').then(() => console.log('[embeddings] model ready'));
