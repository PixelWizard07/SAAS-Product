const { encrypt } = require('../utils/encryption');
const { syncAccount, memoryStore } = require('../scrapers/syncService');

// In-memory account list (used when MongoDB is unavailable)
// Persists for the lifetime of the server process
const memAccounts = new Map(); // userId → Map(accountId → account)

const getUserAccounts = (userId) => {
  if (!memAccounts.has(userId)) memAccounts.set(userId, new Map());
  return memAccounts.get(userId);
};

const getAccounts = async (req, res, next) => {
  try {
    if (global.dbConnected) {
      const SellerAccount = require('../models/SellerAccount');
      const accounts = await SellerAccount.find({ userId: req.user.id });
      return res.json(accounts);
    }
    // Memory mode: merge base account info with sync status from memoryStore
    const userAccs = getUserAccounts(req.user.id);
    const list = Array.from(userAccs.values()).map(acc => {
      const mem = memoryStore.get(acc._id);
      return {
        ...acc,
        status: mem?.status || acc.status,
        lastSyncAt: mem?.lastSyncAt || acc.lastSyncAt,
      };
    });
    res.json(list);
  } catch (err) { next(err); }
};

const addAccount = async (req, res, next) => {
  try {
    const { nickname, phone, password } = req.body;
    if (!nickname || !phone || !password) {
      return res.status(400).json({ error: 'nickname, phone, and password are required' });
    }
    const encryptedPassword = encrypt(password);

    if (global.dbConnected) {
      const SellerAccount = require('../models/SellerAccount');
      const account = await SellerAccount.create({
        userId: req.user.id, nickname, phone, encryptedPassword,
      });
      return res.status(201).json(account);
    }

    // Memory mode
    const id = `mem_${Date.now()}`;
    const account = {
      _id: id, userId: req.user.id, nickname, phone,
      encryptedPassword, shopName: nickname,
      profilePicture: '', status: 'inactive', lastSyncAt: null,
    };
    getUserAccounts(req.user.id).set(id, account);
    // Seed into memoryStore so syncService can find it
    memoryStore.set(id, { _account: account, _cookies: null, status: 'inactive' });
    res.status(201).json(account);
  } catch (err) { next(err); }
};

const updateAccount = async (req, res, next) => {
  try {
    const { nickname, phone, password } = req.body;
    const update = {};
    if (nickname) update.nickname = nickname;
    if (phone) update.phone = phone;
    if (password) update.encryptedPassword = encrypt(password);

    if (global.dbConnected) {
      const SellerAccount = require('../models/SellerAccount');
      const account = await SellerAccount.findOneAndUpdate(
        { _id: req.params.id, userId: req.user.id }, update, { new: true }
      );
      if (!account) return res.status(404).json({ error: 'Account not found' });
      return res.json(account);
    }

    const userAccs = getUserAccounts(req.user.id);
    const existing = userAccs.get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Account not found' });
    const updated = { ...existing, ...update };
    userAccs.set(req.params.id, updated);
    if (memoryStore.has(req.params.id)) {
      memoryStore.get(req.params.id)._account = updated;
    }
    res.json(updated);
  } catch (err) { next(err); }
};

const deleteAccount = async (req, res, next) => {
  try {
    if (global.dbConnected) {
      const SellerAccount = require('../models/SellerAccount');
      const account = await SellerAccount.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
      if (!account) return res.status(404).json({ error: 'Account not found' });
    } else {
      getUserAccounts(req.user.id).delete(req.params.id);
      memoryStore.delete(req.params.id);
    }
    res.json({ message: 'Account deleted' });
  } catch (err) { next(err); }
};

const syncAccountHandler = async (req, res, next) => {
  try {
    let account;
    if (global.dbConnected) {
      const SellerAccount = require('../models/SellerAccount');
      account = await SellerAccount.findOne({ _id: req.params.id, userId: req.user.id });
    } else {
      account = getUserAccounts(req.user.id).get(req.params.id);
    }
    if (!account) return res.status(404).json({ error: 'Account not found' });

    // Respond immediately — sync runs in background
    res.json({ message: 'Sync started', accountId: account._id });

    syncAccount(String(account._id || req.params.id), req.user.id).catch(err => {
      console.error(`[accountsController] Sync error for ${req.params.id}:`, err.message);
    });
  } catch (err) { next(err); }
};

module.exports = { getAccounts, addAccount, updateAccount, deleteAccount, syncAccount: syncAccountHandler };
