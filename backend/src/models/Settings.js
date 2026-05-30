const mongoose = require('mongoose');
const settingsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  syncIntervalMinutes: { type: Number, default: 15 },
  labelGenerationTime: { type: String, default: '09:00' },
  autoLabelEnabled: { type: Boolean, default: false },
  autoSyncEnabled: { type: Boolean, default: true },
  timezone: { type: String, default: 'Asia/Kolkata' },
});
module.exports = mongoose.model('Settings', settingsSchema);
