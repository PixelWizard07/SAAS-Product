const mongoose = require('mongoose');

const sellerAccountSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId },
  nickname: String,
  phone: String,
  encryptedPassword: { type: String, select: false },
  shopName: String,
  status: String,
  lastSyncAt: Date,
  sessionCookies: { type: String, select: false },
});

module.exports = mongoose.models.SellerAccount || mongoose.model('SellerAccount', sellerAccountSchema);
