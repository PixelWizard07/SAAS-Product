require('dotenv').config();
const { Worker } = require('bullmq');
const mongoose = require('mongoose');
const Redis = require('ioredis');
const { launchBrowser } = require('../browser');
const { login } = require('../meesho/login');
const { scrapeOrders } = require('../meesho/orders');
const { scrapeReturns } = require('../meesho/returns');
const { decrypt } = require('../utils/encryption');
const logger = require('../logger');

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', { maxRetriesPerRequest: null, enableReadyCheck: false });

const SellerAccount = require('../models/SellerAccount');
const Order = require('../models/Order');
const Return = require('../models/Return');

const worker = new Worker('account-sync', async (job) => {
  const { accountId, userId } = job.data;
  logger.info(`Starting sync for account ${accountId}`);
  const account = await SellerAccount.findById(accountId).select('+encryptedPassword +sessionCookies');
  if (!account) throw new Error(`Account ${accountId} not found`);

  const browser = await launchBrowser();
  try {
    let cookies = account.sessionCookies ? JSON.parse(account.sessionCookies) : null;
    if (!cookies) {
      const password = decrypt(account.encryptedPassword);
      cookies = await login(browser, account.phone, password);
      await SellerAccount.findByIdAndUpdate(accountId, { sessionCookies: JSON.stringify(cookies) });
    }

    const [orders, returns] = await Promise.all([
      scrapeOrders(browser, cookies),
      scrapeReturns(browser, cookies),
    ]);

    for (const o of orders) {
      await Order.findOneAndUpdate(
        { accountId, orderId: o.orderId },
        { ...o, accountId, userId },
        { upsert: true }
      );
    }
    for (const r of returns) {
      await Return.findOneAndUpdate(
        { accountId, returnId: r.returnId },
        { ...r, accountId, userId },
        { upsert: true }
      );
    }

    await SellerAccount.findByIdAndUpdate(accountId, { status: 'active', lastSyncAt: new Date() });
    logger.info(`Sync complete for account ${accountId}: ${orders.length} orders, ${returns.length} returns`);
  } catch (err) {
    await SellerAccount.findByIdAndUpdate(accountId, { status: 'error' });
    logger.error(`Sync failed for ${accountId}:`, err.message);
    throw err;
  } finally {
    await browser.close();
  }
}, { connection, concurrency: 2 });

worker.on('failed', (job, err) => logger.error(`Job ${job?.id} failed: ${err.message}`));
worker.on('completed', (job) => logger.info(`Job ${job.id} completed`));

module.exports = worker;
