const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'SellerAccount', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  orderId: { type: String, required: true },
  productName: String,
  sku: String,
  variant: String,
  productImage: String,
  buyerName: String,
  buyerAddress: String,
  orderDate: Date,
  expectedDelivery: Date,
  paymentMode: { type: String, enum: ['Prepaid', 'COD'], default: 'Prepaid' },
  status: { type: String, enum: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'], default: 'Pending' },
  price: Number,
  quantity: Number,
  labelStatus: { type: String, enum: ['none', 'generated', 'failed', 'printed'], default: 'none' },
  shipByDate: Date,
  subOrderId: String,
  createdAt: { type: Date, default: Date.now },
});

orderSchema.index({ accountId: 1, orderId: 1 }, { unique: true });

module.exports = mongoose.model('Order', orderSchema);
