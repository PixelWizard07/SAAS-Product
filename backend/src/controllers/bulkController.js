'use strict';
/**
 * Bulk upsert controller — used by the Chrome extension to push
 * scraped data from supplier.meesho.com into the database.
 */

const { memoryStore } = require('../scrapers/syncService');

const bulkUpsert = (modelName, idField) => async (req, res, next) => {
  try {
    const { accountId, items } = req.body;
    if (!accountId || !Array.isArray(items)) {
      return res.status(400).json({ error: 'accountId and items[] required' });
    }

    let count = 0;

    if (global.dbConnected) {
      const Model = require(`../models/${modelName}`);
      for (const item of items) {
        if (!item[idField]) continue;
        await Model.findOneAndUpdate(
          { accountId, [idField]: item[idField] },
          { ...item, accountId, userId: req.user.id },
          { upsert: true, new: true }
        );
        count++;
      }
    } else {
      // Memory mode
      const store = memoryStore.get(String(accountId)) || { orders: [], returns: [], products: [], payments: [] };
      const key = modelName.toLowerCase() + 's';
      const existing = store[key] || [];
      for (const item of items) {
        if (!item[idField]) continue;
        const idx = existing.findIndex(e => e[idField] === item[idField]);
        const enriched = {
          ...item,
          _id: `${accountId}_${item[idField]}`,
          accountId: { _id: accountId },
          userId: req.user.id,
        };
        if (idx >= 0) existing[idx] = enriched;
        else existing.push(enriched);
        count++;
      }
      store[key] = existing;
      store.lastSyncAt = new Date().toISOString();
      store.status = 'active';
      memoryStore.set(String(accountId), store);
    }

    res.json({ count, message: `${count} ${modelName.toLowerCase()}s upserted` });
  } catch (err) { next(err); }
};

// Also update SellerAccount status to 'active' after successful extension sync
const bulkComplete = async (req, res, next) => {
  try {
    const { accountId } = req.body;
    if (!accountId) return res.status(400).json({ error: 'accountId required' });

    if (global.dbConnected) {
      const SellerAccount = require('../models/SellerAccount');
      await SellerAccount.findOneAndUpdate(
        { _id: accountId, userId: req.user.id },
        { status: 'active', lastSyncAt: new Date() }
      );
    } else {
      const store = memoryStore.get(String(accountId));
      if (store) { store.status = 'active'; store.lastSyncAt = new Date().toISOString(); }
    }

    res.json({ message: 'Sync marked complete' });
  } catch (err) { next(err); }
};

module.exports = { bulkUpsert, bulkComplete };
