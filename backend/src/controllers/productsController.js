const Product = require('../models/Product');

const getProducts = async (req, res, next) => {
  try {
    const { accountId, search, isActive, page = 1, limit = 24 } = req.query;
    const filter = { userId: req.user.id };
    if (accountId) filter.accountId = accountId;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
    ];
    const [products, total] = await Promise.all([
      Product.find(filter).populate('accountId', 'nickname').sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
      Product.countDocuments(filter),
    ]);
    res.json({ products, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

const updateProduct = async (req, res, next) => {
  try {
    const { price, stock, isActive } = req.body;
    const update = { updatedAt: new Date() };
    if (price !== undefined) update.price = price;
    if (stock !== undefined) update.stock = stock;
    if (isActive !== undefined) update.isActive = isActive;
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      update,
      { new: true }
    );
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) { next(err); }
};

module.exports = { getProducts, updateProduct };
