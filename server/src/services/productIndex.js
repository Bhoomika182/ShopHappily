import Product from '../models/Product.js';
import { embed } from './embeddings.js';
import { upsertDoc, deleteDoc, ensureIndex, clearAll } from './vectorStore.js';
import { productText } from '../lib/text.js';
import { FAQS } from '../seed/faq.js';

// MongoDB is the source of truth. The Redis vector index is a derived view that must be kept in
// sync on every product write; `reindexAll` rebuilds it from scratch if the two ever drift.
export async function indexProduct(p) {
  const text = productText(p);
  await upsertDoc(
    { id: `product:${p._id}`, type: 'product', title: p.name, text, category: p.category, price: p.price, productId: String(p._id) },
    await embed(text)
  );
}

export const removeProduct = (id) => deleteDoc(`product:${id}`);

export async function indexFaqs() {
  for (const f of FAQS) {
    const text = `${f.title}. ${f.text}`;
    await upsertDoc({ id: `faq:${f.id}`, type: 'faq', title: f.title, text }, await embed(text));
  }
}

export async function reindexAll() {
  await ensureIndex();
  await clearAll();
  const products = await Product.find();
  for (const p of products) await indexProduct(p);
  await indexFaqs();
  return { products: products.length, faqs: FAQS.length };
}
