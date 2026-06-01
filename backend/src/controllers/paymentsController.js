const { getAllMemoryData, getMemoryData } = require('../scrapers/syncService');

const getPayments = async (req, res, next) => {
  try {
    const { accountId, from, to, page = 1, limit = 20 } = req.query;

    if (!global.dbConnected) {
      let payments = accountId && accountId !== 'all'
        ? getMemoryData(accountId, 'payments')
        : getAllMemoryData('payments');
      if (from) payments = payments.filter(p => p.date && new Date(p.date) >= new Date(from));
      if (to) payments = payments.filter(p => p.date && new Date(p.date) <= new Date(to));
      return res.json({ payments, total: payments.length });
    }

    const Payment = require('../models/Payment');
    const filter = { userId: req.user.id };
    if (accountId && accountId !== 'all') filter.accountId = accountId;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }
    const [payments, total] = await Promise.all([
      Payment.find(filter).populate('accountId', 'nickname').sort({ date: -1 }).skip((page - 1) * limit).limit(Number(limit)),
      Payment.countDocuments(filter),
    ]);
    res.json({ payments, total });
  } catch (err) { next(err); }
};

const getSummary = async (req, res, next) => {
  try {
    if (!global.dbConnected) {
      const payments = getAllMemoryData('payments');
      const summary = { credit: 0, debit: 0 };
      payments.forEach(p => {
        if (p.type === 'credit') summary.credit += p.amount || 0;
        else if (p.type === 'debit') summary.debit += p.amount || 0;
      });
      summary.balance = summary.credit - summary.debit;
      return res.json(summary);
    }

    const Payment = require('../models/Payment');
    const result = await Payment.aggregate([
      { $match: { userId: req.user.id } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]);
    const summary = { credit: 0, debit: 0 };
    result.forEach(r => { summary[r._id] = r.total; });
    summary.balance = summary.credit - summary.debit;
    res.json(summary);
  } catch (err) { next(err); }
};

module.exports = { getPayments, getSummary };
