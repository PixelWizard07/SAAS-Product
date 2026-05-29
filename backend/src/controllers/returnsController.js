const Return = require('../models/Return');

const getReturns = async (req, res, next) => {
  try {
    const { accountId, status, page = 1, limit = 20 } = req.query;
    const filter = { userId: req.user.id };
    if (accountId) filter.accountId = accountId;
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

module.exports = { getReturns, getOtps, markOtpUsed };
