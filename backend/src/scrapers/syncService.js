'use strict';
/**
 * syncService — MeeshoScraper → storage pipeline
 *
 * Works in two modes:
 *   1. MongoDB connected  → persists all data to DB (accounts, orders, returns, products, payments)
 *   2. No MongoDB (demo)  → stores scraped data in in-memory Map per accountId
 *
 * Frontend polls /accounts for status. When sync completes, data is available at
 * /orders, /returns, /products, /payments (served from DB or in-memory cache).
 */

const { MeeshoScraper } = require('./MeeshoScraper');
const { decrypt } = require('../utils/encryption');

// ── In-memory store for when MongoDB is unavailable ──────────────────────────
// Structure: { [accountId]: { orders, returns, products, payments, lastSyncAt } }
const memoryStore = new Map();

const getMemoryData = (accountId, key) => {
  const store = memoryStore.get(accountId);
  return store?.[key] || [];
};

const getAllMemoryData = (key) => {
  const result = [];
  for (const store of memoryStore.values()) {
    if (store[key]) result.push(...store[key]);
  }
  return result;
};

module.exports.getMemoryData = getMemoryData;
module.exports.getAllMemoryData = getAllMemoryData;
module.exports.memoryStore = memoryStore;

// ─── Main sync function ───────────────────────────────────────────────────────

async function syncAccount(accountId, userId) {
  const useDB = global.dbConnected;

  // Load account data (with or without DB)
  let account;
  if (useDB) {
    const SellerAccount = require('../models/SellerAccount');
    account = await SellerAccount.findById(accountId).select('+encryptedPassword +sessionCookies');
    if (!account) throw new Error(`Account ${accountId} not found`);
    await SellerAccount.findByIdAndUpdate(accountId, { status: 'syncing' });
  } else {
    // In-memory mode: account info passed via memoryStore
    const stored = memoryStore.get(accountId);
    if (!stored) throw new Error(`Account ${accountId} not in memory store`);
    account = stored._account;
    stored.status = 'syncing';
  }

  const password = decrypt(account.encryptedPassword);
  const storedCookies = useDB && account.sessionCookies
    ? (() => { try { return JSON.parse(account.sessionCookies); } catch { return null; } })()
    : (memoryStore.get(accountId)?._cookies || null);

  const scraper = new MeeshoScraper({
    accountId: String(accountId),
    phone: account.phone,
    password,
    sessionCookies: storedCookies,
  });

  try {
    console.log(`[syncService] Starting scrape for account ${accountId} (${account.nickname})`);

    // Scrape all data from Meesho supplier panel
    const [orders, returns, products, payments] = await Promise.all([
      scraper.scrapeOrders(),
      scraper.scrapeReturns(),
      scraper.scrapeInventory().catch(() => []),
      scraper.scrapePayments().catch(() => []),
    ]);

    const freshCookies = scraper.getCookies();

    if (useDB) {
      // ── Persist to MongoDB ──────────────────────────────────────────────
      const Order   = require('../models/Order');
      const Return  = require('../models/Return');
      const Product = require('../models/Product');
      const Payment = require('../models/Payment');
      const SellerAccount = require('../models/SellerAccount');
      const Notification = require('../models/Notification');

      let orderCount = 0;
      for (const o of orders) {
        if (!o.orderId) continue;
        await Order.findOneAndUpdate(
          { accountId, orderId: o.orderId },
          { ...o, accountId, userId,
            shipByDate: o.shipByDate ? new Date(o.shipByDate) : undefined,
            orderDate: o.orderDate ? new Date(o.orderDate) : new Date() },
          { upsert: true, new: true }
        );
        orderCount++;
      }

      for (const r of returns) {
        if (!r.returnId) continue;
        await Return.findOneAndUpdate(
          { accountId, returnId: r.returnId },
          { ...r, accountId, userId },
          { upsert: true, new: true }
        );
      }

      for (const p of products) {
        if (!p.catalogId && !p.name) continue;
        await Product.findOneAndUpdate(
          { accountId, sku: p.sku || p.catalogId },
          { ...p, accountId, userId },
          { upsert: true, new: true }
        );
      }

      for (const pay of payments) {
        if (!pay.paymentId) continue;
        await Payment.findOneAndUpdate(
          { accountId, paymentId: pay.paymentId },
          { ...pay, accountId, userId },
          { upsert: true, new: true }
        );
      }

      const updateData = { status: 'active', lastSyncAt: new Date() };
      if (freshCookies) updateData.sessionCookies = JSON.stringify(freshCookies);
      await SellerAccount.findByIdAndUpdate(accountId, updateData);

      await Notification.create({
        userId, accountId,
        message: `Sync complete for ${account.nickname}: ${orderCount} orders, ${returns.length} returns`,
        type: 'sync',
      }).catch(() => {});

    } else {
      // ── Store in memory ────────────────────────────────────────────────
      const withAccount = (arr) => arr.map(item => ({
        ...item,
        _id: item._id || `${accountId}_${item.orderId || item.returnId || item.catalogId || item.paymentId || Math.random()}`,
        accountId: { _id: accountId, nickname: account.nickname },
        userId,
      }));

      memoryStore.set(accountId, {
        _account: account,
        _cookies: freshCookies,
        status: 'active',
        lastSyncAt: new Date().toISOString(),
        orders:   withAccount(orders),
        returns:  withAccount(returns),
        products: withAccount(products),
        payments: withAccount(payments),
      });
    }

    console.log(`[syncService] Sync complete for ${accountId}: ${orders.length} orders, ${returns.length} returns, ${products.length} products, ${payments.length} payments`);
    return { orders: orders.length, returns: returns.length, products: products.length, payments: payments.length };

  } catch (err) {
    console.error(`[syncService] Scraping failed for ${accountId}:`, err.message);

    // Mark as error
    if (useDB) {
      const SellerAccount = require('../models/SellerAccount');
      await SellerAccount.findByIdAndUpdate(accountId, { status: 'error' }).catch(() => {});
    } else {
      const stored = memoryStore.get(accountId);
      if (stored) stored.status = 'error';
    }

    throw err;
  }
}

module.exports.syncAccount = syncAccount;
