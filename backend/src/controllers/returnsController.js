const { decrypt } = require('../utils/encryption');
const { MeeshoScraper } = require('../scrapers/MeeshoScraper');
const { getAllMemoryData, getMemoryData, memoryStore } = require('../scrapers/syncService');

const getReturns = async (req, res, next) => {
  try {
    const { accountId, status, page = 1, limit = 20 } = req.query;

    if (!global.dbConnected) {
      let returns = accountId && accountId !== 'all'
        ? getMemoryData(accountId, 'returns')
        : getAllMemoryData('returns');
      if (status) returns = returns.filter(r => r.status === status);
      return res.json({ returns, total: returns.length, page: 1, pages: 1 });
    }

    const Return = require('../models/Return');
    const filter = { userId: req.user.id };
    if (accountId && accountId !== 'all') filter.accountId = accountId;
    if (status) filter.status = status;
    const [returns, total] = await Promise.all([
      Return.find(filter).populate('accountId', 'nickname shopName').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
      Return.countDocuments(filter),
    ]);
    res.json({ returns, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

const getOtps = async (req, res, next) => {
  try {
    if (!global.dbConnected) {
      const returns = getAllMemoryData('returns').filter(r => r.otp && !r.otpUsed);
      return res.json(returns);
    }
    const Return = require('../models/Return');
    const returns = await Return.find({ userId: req.user.id, otp: { $ne: null }, otpUsed: false }).populate('accountId', 'nickname shopName');
    res.json(returns);
  } catch (err) { next(err); }
};

const markOtpUsed = async (req, res, next) => {
  try {
    if (!global.dbConnected) {
      let found = null;
      for (const store of memoryStore.values()) {
        if (store.returns) {
          store.returns = store.returns.map(r => {
            if (r._id === req.params.id) { found = { ...r, otpUsed: true }; return found; }
            return r;
          });
        }
      }
      if (!found) return res.status(404).json({ error: 'Return not found' });
      return res.json(found);
    }
    const Return = require('../models/Return');
    const r = await Return.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { otpUsed: true },
      { new: true }
    );
    if (!r) return res.status(404).json({ error: 'Return not found' });
    res.json(r);
  } catch (err) { next(err); }
};

const fetchReturnOTP = async (req, res, next) => {
  try {
    let ret, account;

    if (!global.dbConnected) {
      ret = getAllMemoryData('returns').find(r => r._id === req.params.id);
      if (!ret) return res.status(404).json({ error: 'Return not found' });
      if (ret.otp && !ret.otpUsed) return res.json({ otp: ret.otp });
      const accountId = ret.accountId?._id || ret.accountId;
      account = memoryStore.get(String(accountId))?._account;
    } else {
      const Return = require('../models/Return');
      const SellerAccount = require('../models/SellerAccount');
      ret = await Return.findOne({ _id: req.params.id, userId: req.user.id });
      if (!ret) return res.status(404).json({ error: 'Return not found' });
      if (ret.otp && !ret.otpUsed) return res.json({ otp: ret.otp });
      account = await SellerAccount.findOne({ _id: ret.accountId, userId: req.user.id }).select('+encryptedPassword +sessionCookies');
    }

    if (!account) return res.status(404).json({ error: 'Account not found' });

    const password = decrypt(account.encryptedPassword);
    const accountId = ret.accountId?._id || ret.accountId;
    const storedCookies = global.dbConnected && account.sessionCookies
      ? JSON.parse(account.sessionCookies)
      : (memoryStore.get(String(accountId))?._cookies || null);

    const scraper = new MeeshoScraper({
      accountId: String(accountId),
      phone: account.phone,
      password,
      sessionCookies: storedCookies,
    });

    let otp = null;
    try {
      otp = await scraper.scrapeReturnOTP(ret.returnId);
      const newCookies = scraper.getCookies();
      if (newCookies) {
        if (global.dbConnected) {
          const SellerAccount = require('../models/SellerAccount');
          await SellerAccount.findByIdAndUpdate(accountId, { sessionCookies: JSON.stringify(newCookies) });
        } else {
          const store = memoryStore.get(String(accountId));
          if (store) store._cookies = newCookies;
        }
      }
    } catch (err) {
      console.error('[returnsController] OTP fetch failed:', err.message);
    }

    if (otp) {
      if (global.dbConnected) {
        const Return = require('../models/Return');
        await Return.findByIdAndUpdate(ret._id, { otp });
      } else {
        for (const store of memoryStore.values()) {
          if (store.returns) store.returns = store.returns.map(r => r._id === req.params.id ? { ...r, otp } : r);
        }
      }
      return res.json({ otp });
    }

    res.json({ otp: ret.otp || null, message: 'OTP not available on Meesho panel' });
  } catch (err) { next(err); }
};

module.exports = { getReturns, getOtps, markOtpUsed, fetchReturnOTP };
