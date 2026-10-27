import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: String, // snapshot: order history must not change when the catalog does
    price: Number,
    qty: Number,
    image: { type: String, default: '' },
    category: { type: String, default: '' },
    description: { type: String, default: '' },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: [itemSchema],
    total: { type: Number, required: true },
    status: { type: String, enum: ['paid', 'shipped', 'cancelled'], default: 'paid' },
  },
  { timestamps: true }
);

export default mongoose.model('Order', orderSchema);
