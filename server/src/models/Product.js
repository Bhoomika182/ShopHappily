import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 }, // whole rupees
    category: { type: String, required: true, lowercase: true, trim: true, index: true },
    tags: [String],
    image: { type: String, default: '' },
    stock: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ price: 1 });

export default mongoose.model('Product', productSchema);
