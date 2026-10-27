// Float32 vectors <-> Buffers (RediSearch stores vectors as raw little-endian float32 bytes)
export const toBuffer = (vec) => Buffer.from(vec.buffer, vec.byteOffset, vec.byteLength);

export function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}
