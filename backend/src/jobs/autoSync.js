const cron = require('node-cron');
const SellerAccount = require('../models/SellerAccount');
const Settings = require('../models/Settings');
const { syncAccount } = require('../scrapers/syncService');

let syncTask = null;

const startAutoSync = () => {
  syncTask = cron.schedule('* * * * *', async () => {
    if (!global.dbConnected) return;
    try {
      const allSettings = await Settings.find({ autoSyncEnabled: true });
      for (const setting of allSettings) {
        const accounts = await SellerAccount.find({ userId: setting.userId, status: { $in: ['active', 'inactive'] } });
        for (const account of accounts) {
          const minutesSinceSync = account.lastSyncAt
            ? (Date.now() - new Date(account.lastSyncAt)) / 60000
            : Infinity;
          if (minutesSinceSync >= setting.syncIntervalMinutes) {
            syncAccount(account._id.toString(), setting.userId.toString()).catch(e => {
              console.error(`[autoSync] Failed for ${account.nickname}:`, e.message);
            });
          }
        }
      }
    } catch (e) {
      console.error('[autoSync] Cron error:', e.message);
    }
  });
};

const stopAutoSync = () => { if (syncTask) syncTask.stop(); };
module.exports = { startAutoSync, stopAutoSync };
