const mongoose = require('mongoose');

const sellerAccountSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  nickname: { type: String, required: true, trim: true },
  phone: { type: String, required: true },
  encryptedPassword: { type: String, required: true, select: false },
  shopName: { type: String, default: '' },
  profilePicture: { type: String, default: '' },
  status: { type: String, enum: ['active', 'inactive', 'syncing', 'error'], default: 'inactive' },
  lastSyncAt: { type: Date, default: null },
  sessionCookies: { type: String, select: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('SellerAccount', sellerAccountSchema);
