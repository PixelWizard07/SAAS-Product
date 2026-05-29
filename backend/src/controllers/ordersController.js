const Order = require('../models/Order');

const getOrders = async (req, res, next) => {
  try {
    const { accountId, status, from, to, search, page = 1, limit = 20 } = req.query;
    const filter = { userId: req.user.id };
    if (accountId) filter.accountId = accountId;
    if (status) filter.status = status;
    if (from || to) {
      filter.orderDate = {};
      if (from) filter.orderDate.$gte = new Date(from);
      if (to) filter.orderDate.$lte = new Date(to);
    }
    if (search) filter.$or = [
      { orderId: { $regex: search, $options: 'i' } },
      { productName: { $regex: search, $options: 'i' } },
    ];
    const [orders, total] = await Promise.all([
      Order.find(filter).populate('accountId', 'nickname shopName').sort({ orderDate: -1 }).skip((page - 1) * limit).limit(Number(limit)),
      Order.countDocuments(filter),
    ]);
    res.json({ orders, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user.id }).populate('accountId', 'nickname shopName');
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) { next(err); }
};

const getStats = async (req, res, next) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [todayOrders, pendingCount, totalRevenue] = await Promise.all([
      Order.countDocuments({ userId: req.user.id, orderDate: { $gte: today } }),
      Order.countDocuments({ userId: req.user.id, status: 'Pending' }),
      Order.aggregate([{ $match: { userId: req.user.id } }, { $group: { _id: null, total: { $sum: '$price' } } }]),
    ]);
    res.json({ todayOrders, pendingCount, totalRevenue: totalRevenue[0]?.total || 0 });
  } catch (err) { next(err); }
};

module.exports = { getOrders, getOrder, getStats };
