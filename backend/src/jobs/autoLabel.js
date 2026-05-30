const cron = require('node-cron');
const Order = require('../models/Order');
const Label = require('../models/Label');
const Settings = require('../models/Settings');
const Notification = require('../models/Notification');
const { generateLabelHtml } = require('../utils/labelGenerator');

let labelTask = null;

const startAutoLabel = () => {
  labelTask = cron.schedule('* * * * *', async () => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    try {
      const settings = await Settings.find({ autoLabelEnabled: true, labelGenerationTime: currentTime });
      for (const setting of settings) {
        const orders = await Order.find({
          userId: setting.userId,
          status: { $in: ['Confirmed', 'Pending'] },
          labelStatus: 'none',
        }).populate('accountId');

        let success = 0, failed = 0;
        for (const order of orders) {
          try {
            const html = generateLabelHtml(order, order.accountId);
            await Label.findOneAndUpdate(
              { orderDbId: order._id, userId: setting.userId },
              { orderId: order.orderId, orderDbId: order._id, accountId: order.accountId?._id, userId: setting.userId, labelHtml: html, status: 'success', generatedAt: new Date() },
              { upsert: true }
            );
            await Order.findByIdAndUpdate(order._id, { labelStatus: 'generated' });
            success++;
          } catch (e) {
            await Label.findOneAndUpdate(
              { orderDbId: order._id, userId: setting.userId },
              { status: 'failed', failReason: e.message },
              { upsert: true }
            );
            await Order.findByIdAndUpdate(order._id, { labelStatus: 'failed' });
            failed++;
          }
        }

        if (success + failed > 0) {
          await Notification.create({
            userId: setting.userId,
            message: `Auto label generation: ${success} labels generated, ${failed} failed`,
            type: 'system',
          });
        }
      }
    } catch (e) {
      console.error('Auto-label cron error:', e.message);
    }
  });
};

module.exports = { startAutoLabel };
