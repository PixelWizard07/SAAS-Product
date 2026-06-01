const { decrypt } = require('../utils/encryption');
const { MeeshoScraper } = require('../scrapers/MeeshoScraper');
const { generateLabelHtml } = require('../utils/labelGenerator');
const { getAllMemoryData, getMemoryData, memoryStore } = require('../scrapers/syncService');

const getOrders = async (req, res, next) => {
  try {
    const { accountId, status, search, page = 1, limit = 100 } = req.query;

    if (!global.dbConnected) {
      // Serve from in-memory store
      let orders = accountId && accountId !== 'all'
        ? getMemoryData(accountId, 'orders')
        : getAllMemoryData('orders');
      if (status) orders = orders.filter(o => o.status === status);
      if (search) {
        const s = search.toLowerCase();
        orders = orders.filter(o =>
          o.orderId?.toLowerCase().includes(s) ||
          o.productName?.toLowerCase().includes(s) ||
          o.subOrderId?.toLowerCase().includes(s)
        );
      }
      return res.json({ orders, total: orders.length, page: 1, pages: 1 });
    }

    const Order = require('../models/Order');
    const { from, to } = req.query;
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
    if (!global.dbConnected) {
      const all = getAllMemoryData('orders');
      const order = all.find(o => o._id === req.params.id);
      if (!order) return res.status(404).json({ error: 'Order not found' });
      return res.json(order);
    }
    const Order = require('../models/Order');
    const order = await Order.findOne({ _id: req.params.id, userId: req.user.id }).populate('accountId', 'nickname shopName');
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) { next(err); }
};

const getStats = async (req, res, next) => {
  try {
    if (!global.dbConnected) {
      const orders = getAllMemoryData('orders');
      const today = new Date(); today.setHours(0, 0, 0, 0);
      return res.json({
        todayOrders: orders.filter(o => o.orderDate && new Date(o.orderDate) >= today).length,
        pendingCount: orders.filter(o => o.status === 'Pending').length,
        totalRevenue: orders.reduce((s, o) => s + (o.price || 0) * (o.quantity || 1), 0),
      });
    }
    const Order = require('../models/Order');
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

async function _getScraperForOrder(order) {
  const accountId = order.accountId?._id || order.accountId;
  let account;
  if (global.dbConnected) {
    const SellerAccount = require('../models/SellerAccount');
    account = await SellerAccount.findById(accountId).select('+encryptedPassword +sessionCookies');
  } else {
    account = memoryStore.get(String(accountId))?._account;
  }
  if (!account) throw new Error('Account not found for order');
  const password = decrypt(account.encryptedPassword);
  const storedCookies = global.dbConnected && account.sessionCookies
    ? JSON.parse(account.sessionCookies)
    : (memoryStore.get(String(accountId))?._cookies || null);
  return {
    scraper: new MeeshoScraper({ accountId: String(accountId), phone: account.phone, password, sessionCookies: storedCookies }),
    account,
    accountId: String(accountId),
  };
}

async function _updateOrderStatus(orderId, update, userId) {
  if (global.dbConnected) {
    const Order = require('../models/Order');
    await Order.findByIdAndUpdate(orderId, update);
  } else {
    for (const store of memoryStore.values()) {
      if (store.orders) {
        store.orders = store.orders.map(o => o._id === orderId ? { ...o, ...update } : o);
      }
    }
  }
}

async function _findOrder(id, userId) {
  if (global.dbConnected) {
    const Order = require('../models/Order');
    return Order.findOne({ _id: id, userId }).populate('accountId', 'nickname shopName');
  }
  const all = getAllMemoryData('orders');
  return all.find(o => o._id === id);
}

async function _saveCookies(accountId, cookies) {
  if (!cookies) return;
  if (global.dbConnected) {
    const SellerAccount = require('../models/SellerAccount');
    await SellerAccount.findByIdAndUpdate(accountId, { sessionCookies: JSON.stringify(cookies) }).catch(() => {});
  } else {
    const store = memoryStore.get(String(accountId));
    if (store) store._cookies = cookies;
  }
}

const acceptOrder = async (req, res, next) => {
  try {
    const order = await _findOrder(req.params.id, req.user.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    await _updateOrderStatus(req.params.id, { status: 'Ready to Ship' }, req.user.id);
    res.json({ message: 'Order accepted', orderId: order.orderId });

    // Perform on Meesho in background via web scraping
    _getScraperForOrder(order).then(async ({ scraper, accountId }) => {
      try {
        await scraper.acceptOrder(order.subOrderId || order.orderId);
        await _saveCookies(accountId, scraper.getCookies());
        console.log(`[orders] Accepted ${order.subOrderId} on Meesho`);
      } catch (e) { console.error('[orders] acceptOrder scraping failed:', e.message); }
    }).catch(() => {});
  } catch (err) { next(err); }
};

const cancelOrder = async (req, res, next) => {
  try {
    const { reason = 'Seller cancelled' } = req.body;
    const order = await _findOrder(req.params.id, req.user.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    await _updateOrderStatus(req.params.id, { status: 'Cancelled' }, req.user.id);
    res.json({ message: 'Order cancelled', orderId: order.orderId });

    _getScraperForOrder(order).then(async ({ scraper, accountId }) => {
      try {
        await scraper.cancelOrder(order.subOrderId || order.orderId, reason);
        await _saveCookies(accountId, scraper.getCookies());
        console.log(`[orders] Cancelled ${order.subOrderId} on Meesho`);
      } catch (e) { console.error('[orders] cancelOrder scraping failed:', e.message); }
    }).catch(() => {});
  } catch (err) { next(err); }
};

const downloadOrderLabel = async (req, res, next) => {
  try {
    const order = await _findOrder(req.params.id, req.user.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Try real label from Meesho via web scraping
    let labelHtml = null;
    try {
      const { scraper, accountId } = await _getScraperForOrder(order);
      labelHtml = await scraper.downloadLabel(order.subOrderId || order.orderId);
      await _saveCookies(accountId, scraper.getCookies());
    } catch (err) {
      console.error('[orders] downloadLabel scraping failed:', err.message);
    }

    // Fallback: generate label from order data
    if (!labelHtml) labelHtml = generateLabelHtml(order);

    // Save to DB if connected
    if (global.dbConnected) {
      const Label = require('../models/Label');
      const Order = require('../models/Order');
      await Label.findOneAndUpdate(
        { orderId: order._id },
        { orderId: order._id, accountId: order.accountId, userId: req.user.id, labelHtml, status: 'success', generatedAt: new Date() },
        { upsert: true }
      ).catch(() => {});
      await Order.findByIdAndUpdate(order._id, { labelStatus: 'printed' }).catch(() => {});
    } else {
      await _updateOrderStatus(req.params.id, { labelStatus: 'printed' }, req.user.id);
    }

    res.json({ labelHtml });
  } catch (err) { next(err); }
};

module.exports = { getOrders, getOrder, getStats, acceptOrder, cancelOrder, downloadOrderLabel };
