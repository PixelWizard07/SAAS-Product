const mongoose = require('mongoose');

const returnSchema = new mongoose.Schema({
  accountId: mongoose.Schema.Types.ObjectId,
  userId: mongoose.Schema.Types.ObjectId,
  returnId: String,
  orderId: String,
  productName: String,
  productImage: String,
  returnReason: String,
  status: String,
  buyerName: String,
  otp: String,
  otpUsed: Boolean,
  otpGeneratedAt: Date,
  returnDate: Date,
});

returnSchema.index({ accountId: 1, returnId: 1 }, { unique: true });
module.exports = mongoose.models.Return || mongoose.model('Return', returnSchema);
