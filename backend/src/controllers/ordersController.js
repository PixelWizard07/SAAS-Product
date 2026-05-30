const Order = require('../models/Order');
const SellerAccount = require('../models/SellerAccount');
const Label = require('../models/Label');
const { decrypt } = require('../utils/encryption');
const { MeeshoScraper } = require('../scrapers/MeeshoScraper');
const { generateLabelHtml } = require('../utils/labelGenerator');

const getOrders = async (req, res, next) => {
  try {
    const { accountId, status, from, to, search, page = 1, limit = 50 } = req.query;
    const filter = { userId: req.user.id };
    if (accountId && accountId !== 'all') filter.accountId = accountId;
    if (status) filter.status = status;
    if (from || to) {
      filter.orderDate = {};
      if (from) filter.orderDate.$gte = new Date(from);
      if (to) filter.orderDate.$lte = new Date(to);
    }
    if (search) filter.$or = [
      { orderId: { $regex: search, $options: 'i' } },
      { productName: { $regex: search, $options: 'i' } },
      { subOrderId: { $regex: search, $options: 'i' } },
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

// ─── ACTIONS ──────────────────────────────────────────────────────────────

async function _getScraperForOrder(order, userId) {
  const account = await SellerAccount.findOne({ _id: order.accountId, userId }).select('+encryptedPassword +sessionCookies');
  if (!account) throw new Error('Account not found');
  const password = decrypt(account.encryptedPassword);
  const storedCookies = account.sessionCookies ? JSON.parse(account.sessionCookies) : null;
  const scraper = new MeeshoScraper({
    accountId: account._id.toString(),
    phone: account.phone,
    password,
    sessionCookies: storedCookies,
  });
  return { scraper, account };
}

const acceptOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user.id });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Optimistic DB update
    await Order.findByIdAndUpdate(order._id, { status: 'Confirmed', labelStatus: 'none' });
    res.json({ message: 'Order accepted', orderId: order.orderId });

    // Perform real action on Meesho in background
    try {
      const { scraper, account } = await _getScraperForOrder(order, req.user.id);
      const subOrderId = order.subOrderId || order.orderId;
      await scraper.acceptOrder(subOrderId);
      const newCookies = scraper.getCookies();
      if (newCookies) await SellerAccount.findByIdAndUpdate(account._id, { sessionCookies: JSON.stringify(newCookies) });
      console.log(`[ordersController] Accepted order ${subOrderId} on Meesho`);
    } catch (err) {
      console.error(`[ordersController] acceptOrder on Meesho failed:`, err.message);
    }
  } catch (err) { next(err); }
};

const cancelOrder = async (req, res, next) => {
  try {
    const { reason = 'Seller cancelled' } = req.body;
    const order = await Order.findOne({ _id: req.params.id, userId: req.user.id });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    await Order.findByIdAndUpdate(order._id, { status: 'Cancelled' });
    res.json({ message: 'Order cancelled', orderId: order.orderId });

    try {
      const { scraper, account } = await _getScraperForOrder(order, req.user.id);
      const subOrderId = order.subOrderId || order.orderId;
      await scraper.cancelOrder(subOrderId, reason);
      const newCookies = scraper.getCookies();
      if (newCookies) await SellerAccount.findByIdAndUpdate(account._id, { sessionCookies: JSON.stringify(newCookies) });
    } catch (err) {
      console.error(`[ordersController] cancelOrder on Meesho failed:`, err.message);
    }
  } catch (err) { next(err); }
};

const downloadOrderLabel = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user.id }).populate('accountId', 'nickname shopName');
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Check DB for existing label
    const existing = await Label.findOne({ orderId: order._id, status: 'success' });
    if (existing) {
      await Order.findByIdAndUpdate(order._id, { labelStatus: 'printed' });
      return res.json({ labelHtml: existing.labelHtml });
    }

    // Try to get real label from Meesho
    let labelHtml = null;
    try {
      const { scraper, account } = await _getScraperForOrder(order, req.user.id);
      const subOrderId = order.subOrderId || order.orderId;
      labelHtml = await scraper.downloadLabel(subOrderId);
      const newCookies = scraper.getCookies();
      if (newCookies) await SellerAccount.findByIdAndUpdate(account._id, { sessionCookies: JSON.stringify(newCookies) });
    } catch (err) {
      console.error(`[ordersController] downloadLabel from Meesho failed:`, err.message);
    }

    // Fallback: generate our own label HTML
    if (!labelHtml) {
      labelHtml = generateLabelHtml(order);
    }

    // Save label record
    await Label.findOneAndUpdate(
      { orderId: order._id },
      { orderId: order._id, accountId: order.accountId, userId: req.user.id, labelHtml, status: 'success', generatedAt: new Date() },
      { upsert: true }
    );
    await Order.findByIdAndUpdate(order._id, { labelStatus: 'printed' });

    res.json({ labelHtml });
  } catch (err) { next(err); }
};

module.exports = { getOrders, getOrder, getStats, acceptOrder, cancelOrder, downloadOrderLabel };
