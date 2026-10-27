import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Product from '../models/Product.js';
import { config } from '../config.js';
import { PRODUCTS } from './products.js';
import { reindexAll } from '../services/productIndex.js';
import { bumpVersion } from '../services/cache.js';

export async function seedAll({ force = false } = {}) {
  if (!(await User.exists({ email: config.adminEmail }))) {
    await User.create({
      name: 'Admin',
      email: config.adminEmail,
      password: await bcrypt.hash(config.adminPassword, 10),
      role: 'admin',
    });
    console.log(`[seed] admin created: ${config.adminEmail}`);
  }

  if (force || (await Product.countDocuments()) === 0) {
    await Product.deleteMany({});
    await Product.insertMany(PRODUCTS);
    console.log(`[seed] ${PRODUCTS.length} products inserted`);
  }

  const r = await reindexAll();
  await bumpVersion();
  console.log(`[seed] vector index built: ${r.products} products + ${r.faqs} policy docs`);
}
