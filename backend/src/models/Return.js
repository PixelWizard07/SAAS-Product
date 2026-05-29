const mongoose = require('mongoose');

const returnSchema = new mongoose.Schema({
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'SellerAccount', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  returnId: { type: String, required: true },
  orderId: String,
  productName: String,
  productImage: String,
  returnReason: String,
  status: { type: String, enum: ['Initiated', 'Pickup Scheduled', 'Picked Up', 'Refunded'], default: 'Initiated' },
  buyerName: String,
  otp: String,
  otpUsed: { type: Boolean, default: false },
  otpGeneratedAt: Date,
  returnDate: Date,
  createdAt: { type: Date, default: Date.now },
});

returnSchema.index({ accountId: 1, returnId: 1 }, { unique: true });

module.exports = mongoose.model('Return', returnSchema);
