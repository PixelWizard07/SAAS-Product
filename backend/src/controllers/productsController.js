const { getAllMemoryData, getMemoryData, memoryStore } = require('../scrapers/syncService');

const getProducts = async (req, res, next) => {
  try {
    const { accountId, search, isActive, page = 1, limit = 24 } = req.query;

    if (!global.dbConnected) {
      let products = accountId && accountId !== 'all'
        ? getMemoryData(accountId, 'products')
        : getAllMemoryData('products');
      if (isActive !== undefined) products = products.filter(p => String(p.isActive) === isActive);
      if (search) {
        const s = search.toLowerCase();
        products = products.filter(p =>
          p.name?.toLowerCase().includes(s) || p.sku?.toLowerCase().includes(s)
        );
      }
      return res.json({ products, total: products.length, page: 1, pages: 1 });
    }

    const Product = require('../models/Product');
    const filter = { userId: req.user.id };
    if (accountId && accountId !== 'all') filter.accountId = accountId;
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

    if (!global.dbConnected) {
      let found = null;
      for (const store of memoryStore.values()) {
        if (store.products) {
          store.products = store.products.map(p => {
            if (p._id === req.params.id) { found = { ...p, ...update }; return found; }
            return p;
          });
        }
      }
      if (!found) return res.status(404).json({ error: 'Product not found' });
      return res.json(found);
    }

    const Product = require('../models/Product');
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
