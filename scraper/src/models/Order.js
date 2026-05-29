const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  accountId: mongoose.Schema.Types.ObjectId,
  userId: mongoose.Schema.Types.ObjectId,
  orderId: String,
  productName: String,
  sku: String,
  variant: String,
  productImage: String,
  buyerName: String,
  buyerAddress: String,
  orderDate: Date,
  expectedDelivery: Date,
  paymentMode: String,
  status: String,
  price: Number,
  quantity: Number,
});

orderSchema.index({ accountId: 1, orderId: 1 }, { unique: true });
module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);
