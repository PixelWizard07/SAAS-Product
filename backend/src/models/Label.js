const mongoose = require('mongoose');
const labelSchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  orderDbId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'SellerAccount' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  labelHtml: String,
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
  failReason: String,
  generatedAt: Date,
  printedAt: Date,
});
module.exports = mongoose.model('Label', labelSchema);
