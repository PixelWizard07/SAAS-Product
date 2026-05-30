const SellerAccount = require('../models/SellerAccount');
const { encrypt } = require('../utils/encryption');
const { syncAccount } = require('../scrapers/syncService');

const getAccounts = async (req, res, next) => {
  try {
    const accounts = await SellerAccount.find({ userId: req.user.id });
    res.json(accounts);
  } catch (err) { next(err); }
};

const addAccount = async (req, res, next) => {
  try {
    const { nickname, phone, password } = req.body;
    if (!nickname || !phone || !password) return res.status(400).json({ error: 'All fields required' });
    const encryptedPassword = encrypt(password);
    const account = await SellerAccount.create({ userId: req.user.id, nickname, phone, encryptedPassword });
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
    const account = await SellerAccount.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      update,
      { new: true }
    );
    if (!account) return res.status(404).json({ error: 'Account not found' });
    res.json(account);
  } catch (err) { next(err); }
};

const deleteAccount = async (req, res, next) => {
  try {
    const account = await SellerAccount.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!account) return res.status(404).json({ error: 'Account not found' });
    res.json({ message: 'Account deleted' });
  } catch (err) { next(err); }
};

const syncAccountHandler = async (req, res, next) => {
  try {
    const account = await SellerAccount.findOne({ _id: req.params.id, userId: req.user.id });
    if (!account) return res.status(404).json({ error: 'Account not found' });

    // Run sync asynchronously — respond immediately so UI doesn't time out
    // then update status; client should poll /accounts
    res.json({ message: 'Sync started', accountId: account._id });

    syncAccount(account._id.toString(), req.user.id).catch(err => {
      console.error(`[accountsController] Sync error for ${account._id}:`, err.message);
    });
  } catch (err) { next(err); }
};

module.exports = { getAccounts, addAccount, updateAccount, deleteAccount, syncAccount: syncAccountHandler };
