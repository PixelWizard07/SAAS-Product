const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'SellerAccount', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  transactionId: String,
  paymentId: String,
  amount: Number,
  type: { type: String, enum: ['credit', 'debit'] },
  status: String,
  mode: String,
  description: String,
  date: Date,
  utr: String,
  balance: Number,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Payment', paymentSchema);
