const Return = require('../models/Return');
const SellerAccount = require('../models/SellerAccount');
const { decrypt } = require('../utils/encryption');
const { MeeshoScraper } = require('../scrapers/MeeshoScraper');

const getReturns = async (req, res, next) => {
  try {
    const { accountId, status, page = 1, limit = 20 } = req.query;
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
    const returns = await Return.find({ userId: req.user.id, otp: { $ne: null }, otpUsed: false }).populate('accountId', 'nickname shopName');
    res.json(returns);
  } catch (err) { next(err); }
};

const markOtpUsed = async (req, res, next) => {
  try {
    const r = await Return.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { otpUsed: true },
      { new: true }
    );
    if (!r) return res.status(404).json({ error: 'Return not found' });
    res.json(r);
  } catch (err) { next(err); }
};

// Fetch live OTP for a specific return from Meesho
const fetchReturnOTP = async (req, res, next) => {
  try {
    const ret = await Return.findOne({ _id: req.params.id, userId: req.user.id });
    if (!ret) return res.status(404).json({ error: 'Return not found' });

    // If we already have a live OTP, return it
    if (ret.otp && !ret.otpUsed) return res.json({ otp: ret.otp });

    const account = await SellerAccount.findOne({ _id: ret.accountId, userId: req.user.id }).select('+encryptedPassword +sessionCookies');
    if (!account) return res.status(404).json({ error: 'Account not found' });

    const password = decrypt(account.encryptedPassword);
    const storedCookies = account.sessionCookies ? JSON.parse(account.sessionCookies) : null;
    const scraper = new MeeshoScraper({
      accountId: account._id.toString(),
      phone: account.phone,
      password,
      sessionCookies: storedCookies,
    });

    let otp = null;
    try {
      otp = await scraper.scrapeReturnOTP(ret.returnId);
      const newCookies = scraper.getCookies();
      if (newCookies) await SellerAccount.findByIdAndUpdate(account._id, { sessionCookies: JSON.stringify(newCookies) });
    } catch (err) {
      console.error('[returnsController] OTP fetch failed:', err.message);
    }

    if (otp) {
      await Return.findByIdAndUpdate(ret._id, { otp });
      return res.json({ otp });
    }

    res.json({ otp: ret.otp || null, message: 'OTP not available on Meesho panel' });
  } catch (err) { next(err); }
};

module.exports = { getReturns, getOtps, markOtpUsed, fetchReturnOTP };
