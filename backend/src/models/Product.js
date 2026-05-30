const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'SellerAccount', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  catalogId: String,
  name: String,
  sku: String,
  price: Number,
  stock: Number,
  imageUrl: String,
  images: [String],
  mrp: Number,
  status: { type: String, default: 'active' },
  isActive: { type: Boolean, default: true },
  category: String,
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Product', productSchema);
