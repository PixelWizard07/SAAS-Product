const Label = require('../models/Label');
const Order = require('../models/Order');
const { generateLabelHtml } = require('../utils/labelGenerator');

const generateLabel = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, userId: req.user.id }).populate('accountId');
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const html = generateLabelHtml(order, order.accountId);
    const label = await Label.findOneAndUpdate(
      { orderDbId: order._id, userId: req.user.id },
      { orderId: order.orderId, orderDbId: order._id, accountId: order.accountId, userId: req.user.id, labelHtml: html, status: 'success', generatedAt: new Date() },
      { upsert: true, new: true }
    );
    await Order.findByIdAndUpdate(order._id, { labelStatus: 'generated' });
    res.json(label);
  } catch (err) { next(err); }
};

const generateBulk = async (req, res, next) => {
  try {
    const { orderIds } = req.body;
    const results = { success: 0, failed: 0, labels: [] };
    for (const id of orderIds) {
      try {
        const order = await Order.findOne({ _id: id, userId: req.user.id }).populate('accountId');
        if (!order) { results.failed++; continue; }
        const html = generateLabelHtml(order, order.accountId);
        const label = await Label.findOneAndUpdate(
          { orderDbId: order._id, userId: req.user.id },
          { orderId: order.orderId, orderDbId: order._id, accountId: order.accountId, userId: req.user.id, labelHtml: html, status: 'success', generatedAt: new Date() },
          { upsert: true, new: true }
        );
        await Order.findByIdAndUpdate(order._id, { labelStatus: 'generated' });
        results.success++;
        results.labels.push(label);
      } catch (e) {
        await Label.findOneAndUpdate(
          { orderDbId: id, userId: req.user.id },
          { status: 'failed', failReason: e.message },
          { upsert: true }
        );
        results.failed++;
      }
    }
    res.json(results);
  } catch (err) { next(err); }
};

const getLabels = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = { userId: req.user.id };
    if (status) filter.status = status;
    const labels = await Label.find(filter).populate('accountId', 'nickname shopName').sort({ generatedAt: -1 });
    res.json(labels);
  } catch (err) { next(err); }
};

const retryLabel = async (req, res, next) => {
  try {
    const label = await Label.findOne({ _id: req.params.id, userId: req.user.id });
    if (!label) return res.status(404).json({ error: 'Label not found' });
    const order = await Order.findOne({ _id: label.orderDbId }).populate('accountId');
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const html = generateLabelHtml(order, order.accountId);
    label.labelHtml = html;
    label.status = 'success';
    label.failReason = null;
    label.generatedAt = new Date();
    await label.save();
    res.json(label);
  } catch (err) { next(err); }
};

const markPrinted = async (req, res, next) => {
  try {
    const label = await Label.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { printedAt: new Date() },
      { new: true }
    );
    res.json(label);
  } catch (err) { next(err); }
};

module.exports = { generateLabel, generateBulk, getLabels, retryLabel, markPrinted };
