'use strict';
/**
 * syncService — orchestrates MeeshoScraper → DB upsert pipeline
 * Called by: accountsController (manual sync), autoSync job
 */
const { MeeshoScraper } = require('./MeeshoScraper');
const { decrypt, encrypt } = require('../utils/encryption');
const SellerAccount = require('../models/SellerAccount');
const Order = require('../models/Order');
const Return = require('../models/Return');
const Product = require('../models/Product');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const { seedAccountData } = require('../controllers/seedController');

/**
 * Full sync for one account. Uses real Puppeteer scraping.
 * Falls back to seed data if scraping fails (demo/offline mode).
 */
async function syncAccount(accountId, userId) {
  // Guard: if MongoDB is not connected, bail early
  if (!global.dbConnected) {
    console.warn('[syncService] MongoDB not connected — skipping sync');
    return { orders: 0, returns: 0, products: 0, payments: 0 };
  }

  const account = await SellerAccount.findById(accountId).select('+encryptedPassword +sessionCookies');
  if (!account) throw new Error(`Account ${accountId} not found`);

  await SellerAccount.findByIdAndUpdate(accountId, { status: 'syncing' });

  let scraper;
  try {
    const password = decrypt(account.encryptedPassword);
    const storedCookies = account.sessionCookies ? JSON.parse(account.sessionCookies) : null;

    scraper = new MeeshoScraper({
      accountId: account._id.toString(),
      phone: account.phone,
      password,
      sessionCookies: storedCookies,
    });

    // Scrape all data in parallel where possible
    const [orders, returns, products, payments] = await Promise.all([
      scraper.scrapeOrders(),
      scraper.scrapeReturns(),
      scraper.scrapeInventory().catch(() => scraper.scrapeProducts().catch(() => [])),
      scraper.scrapePayments().catch(() => []),
    ]);

    // Persist orders
    let orderCount = 0;
    for (const o of orders) {
      if (!o.orderId) continue;
      await Order.findOneAndUpdate(
        { accountId, orderId: o.orderId },
        {
          ...o,
          accountId,
          userId,
          subOrderId: o.subOrderId,
          isAd: o.isAd || false,
          shipByDate: o.shipByDate ? new Date(o.shipByDate) : undefined,
          orderDate: o.orderDate ? new Date(o.orderDate) : new Date(),
        },
        { upsert: true, new: true }
      );
      orderCount++;
    }

    // Persist returns
    let returnCount = 0;
    for (const r of returns) {
      if (!r.returnId) continue;
      await Return.findOneAndUpdate(
        { accountId, returnId: r.returnId },
        { ...r, accountId, userId },
        { upsert: true, new: true }
      );
      returnCount++;
    }

    // Persist products
    for (const p of products) {
      if (!p.catalogId && !p.name) continue;
      await Product.findOneAndUpdate(
        { accountId, sku: p.sku || p.catalogId },
        { ...p, accountId, userId },
        { upsert: true, new: true }
      );
    }

    // Persist payments
    for (const pay of payments) {
      if (!pay.paymentId) continue;
      await Payment.findOneAndUpdate(
        { accountId, paymentId: pay.paymentId },
        { ...pay, accountId, userId },
        { upsert: true, new: true }
      );
    }

    // Save refreshed cookies
    const newCookies = scraper.getCookies();
    const updateData = { status: 'active', lastSyncAt: new Date() };
    if (newCookies) updateData.sessionCookies = JSON.stringify(newCookies);
    await SellerAccount.findByIdAndUpdate(accountId, updateData);

    // Create sync notification
    await Notification.create({
      userId,
      accountId,
      message: `Sync completed for ${account.nickname}: ${orderCount} orders, ${returnCount} returns`,
      type: 'sync',
    }).catch(() => {});

    return { orders: orderCount, returns: returnCount, products: products.length, payments: payments.length };
  } catch (err) {
    console.error(`[syncService] Real scraping failed for ${accountId}:`, err.message);

    // Fallback: use seed data so the app remains functional
    console.log(`[syncService] Falling back to seed data for ${accountId}`);
    try {
      const result = await seedAccountData(accountId, userId);
      await SellerAccount.findByIdAndUpdate(accountId, { status: 'active', lastSyncAt: new Date() });
      await Notification.create({
        userId,
        accountId,
        message: `Demo sync completed for ${account.nickname} (live scraping unavailable: ${err.message.slice(0, 80)})`,
        type: 'sync',
      }).catch(() => {});
      return result;
    } catch (seedErr) {
      await SellerAccount.findByIdAndUpdate(accountId, { status: 'error' });
      throw new Error(`Sync failed: ${err.message}`);
    }
  }
}

module.exports = { syncAccount };
