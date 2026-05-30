const cron = require('node-cron');
const SellerAccount = require('../models/SellerAccount');
const Settings = require('../models/Settings');
const { seedAccountData } = require('../controllers/seedController');
const Notification = require('../models/Notification');

let syncTask = null;

const startAutoSync = () => {
  syncTask = cron.schedule('* * * * *', async () => {
    try {
      const allSettings = await Settings.find({ autoSyncEnabled: true });
      for (const setting of allSettings) {
        const accounts = await SellerAccount.find({ userId: setting.userId, status: 'active' });
        for (const account of accounts) {
          const minutesSinceSync = account.lastSyncAt
            ? (Date.now() - new Date(account.lastSyncAt)) / 60000
            : Infinity;
          if (minutesSinceSync >= setting.syncIntervalMinutes) {
            try {
              await seedAccountData(account._id, setting.userId);
              await SellerAccount.findByIdAndUpdate(account._id, { lastSyncAt: new Date() });
              await Notification.create({
                userId: setting.userId,
                accountId: account._id,
                message: `Auto-sync completed for ${account.nickname}`,
                type: 'sync',
              });
            } catch (e) {
              console.error(`Auto-sync failed for ${account._id}:`, e.message);
            }
          }
        }
      }
    } catch (e) {
      console.error('Auto-sync cron error:', e.message);
    }
  });
};

const stopAutoSync = () => { if (syncTask) syncTask.stop(); };
module.exports = { startAutoSync, stopAutoSync };
