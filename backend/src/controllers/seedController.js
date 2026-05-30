const Order = require('../models/Order');
const Return = require('../models/Return');
const Product = require('../models/Product');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');

const indianNames = ['Priya Sharma', 'Rahul Verma', 'Sunita Patel', 'Meena Khanna', 'Arjun Singh',
  'Kavita Rao', 'Divya Nair', 'Vikram Joshi', 'Anita Gupta', 'Suresh Kumar',
  'Pooja Mehta', 'Rajesh Tiwari', 'Rekha Yadav', 'Mohan Das', 'Lata Mishra'];

const cities = ['Mumbai, Maharashtra', 'Delhi, DL', 'Ahmedabad, Gujarat', 'Jaipur, Rajasthan',
  'Bangalore, Karnataka', 'Chennai, TN', 'Kochi, Kerala', 'Pune, Maharashtra',
  'Hyderabad, Telangana', 'Kolkata, WB', 'Surat, Gujarat', 'Lucknow, UP'];

const products = [
  { name: 'Floral Kurti Set', sku: 'FKS-001', variant: 'Blue / M', category: 'Women Fashion', price: 549, stock: 45 },
  { name: 'Palazzo Pants', sku: 'PP-012', variant: 'Red / L', category: 'Women Fashion', price: 399, stock: 78 },
  { name: 'Anarkali Suit', sku: 'AS-067', variant: 'Pink / XL', category: 'Women Fashion', price: 699, stock: 12 },
  { name: 'Saree with Blouse', sku: 'SB-034', variant: 'Green / Free Size', category: 'Women Fashion', price: 899, stock: 30 },
  { name: 'Kurta Pyjama Set', sku: 'KP-055', variant: 'White / L', category: 'Men Fashion', price: 649, stock: 25 },
  { name: 'Wireless Earbuds Pro', sku: 'WEP-021', variant: 'Black', category: 'Electronics', price: 1299, stock: 34 },
  { name: 'Smart Watch', sku: 'SW-088', variant: 'Black / 44mm', category: 'Electronics', price: 2499, stock: 8 },
  { name: 'Bluetooth Speaker', sku: 'BS-091', variant: 'Blue', category: 'Electronics', price: 1799, stock: 20 },
  { name: 'Phone Stand', sku: 'PS-010', variant: 'Silver', category: 'Electronics', price: 299, stock: 100 },
  { name: 'USB-C Hub', sku: 'UCH-007', variant: 'Black', category: 'Electronics', price: 799, stock: 15 },
  { name: 'Decorative Lamp', sku: 'DL-045', variant: 'Gold', category: 'Home Decor', price: 899, stock: 23 },
  { name: 'Cotton Bedsheet Set', sku: 'CBS-034', variant: 'King / White', category: 'Home Decor', price: 1199, stock: 56 },
  { name: 'Ceramic Planter', sku: 'CP-019', variant: 'White / Medium', category: 'Home Decor', price: 349, stock: 40 },
  { name: 'Wall Clock', sku: 'WC-028', variant: 'Wooden', category: 'Home Decor', price: 599, stock: 18 },
];

const returnReasons = [
  'Product damaged during delivery',
  'Wrong product delivered',
  'Size mismatch',
  'Quality not as expected',
  'Colour different from image',
  'Duplicate item received',
];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const generateOtp = () => String(randInt(100000, 999999));

const seedAccountData = async (accountId, userId) => {
  // Clear existing data for this account
  await Promise.all([
    Order.deleteMany({ accountId }),
    Return.deleteMany({ accountId }),
    Product.deleteMany({ accountId }),
    Payment.deleteMany({ accountId }),
    Notification.deleteMany({ accountId }),
  ]);

  const statuses = ['Pending', 'Pending', 'Confirmed', 'Confirmed', 'Shipped', 'Shipped', 'Delivered', 'Delivered', 'Cancelled'];
  const paymentModes = ['Prepaid', 'COD'];
  const labelStatuses = ['none', 'none', 'none', 'generated', 'generated', 'failed'];

  // Create 15 orders
  const orderDocs = Array.from({ length: 15 }, (_, i) => {
    const prod = rand(products);
    const daysAgo = randInt(0, 10);
    const status = rand(statuses);
    const labelStatus = status === 'Delivered' || status === 'Shipped' ? rand(['generated', 'printed']) :
      status === 'Cancelled' ? 'none' : rand(labelStatuses);
    const shipByDate = new Date(Date.now() + randInt(-1, 3) * 86400000);
    return {
      accountId,
      userId,
      orderId: `MH-${Date.now()}-${String(i + 1).padStart(3, '0')}`,
      subOrderId: `SUB-${Date.now()}-${String(i + 1).padStart(3, '0')}`,
      productName: prod.name,
      sku: prod.sku,
      variant: prod.variant,
      productImage: `https://placehold.co/80x80/DBEAFE/6366F1?text=${encodeURIComponent(prod.name.split(' ')[0])}`,
      buyerName: rand(indianNames),
      buyerAddress: rand(cities),
      orderDate: new Date(Date.now() - daysAgo * 86400000),
      expectedDelivery: new Date(Date.now() + randInt(2, 6) * 86400000),
      shipByDate,
      paymentMode: rand(paymentModes),
      status,
      labelStatus,
      price: prod.price,
      quantity: randInt(1, 3),
    };
  });
  const orders = await Order.insertMany(orderDocs);

  // Create 3 returns (linked to first 3 orders)
  const returnStatuses = ['Initiated', 'Pickup Scheduled', 'Picked Up', 'Refunded'];
  const returnDocs = orders.slice(0, 3).map((o, i) => {
    const needsOtp = i < 2; // first 2 get OTPs
    return {
      accountId,
      userId,
      returnId: `RET-${Date.now()}-${String(i + 1).padStart(3, '0')}`,
      orderId: o.orderId,
      productName: o.productName,
      productImage: `https://placehold.co/80x80/FEE2E2/EF4444?text=${encodeURIComponent(o.productName.split(' ')[0])}`,
      returnReason: rand(returnReasons),
      status: rand(returnStatuses),
      buyerName: o.buyerName,
      otp: needsOtp ? generateOtp() : null,
      otpUsed: false,
      otpGeneratedAt: needsOtp ? new Date() : null,
      returnDate: new Date(Date.now() - randInt(1, 5) * 86400000),
    };
  });
  await Return.insertMany(returnDocs);

  // Create 6 products
  const selectedProducts = products.slice(0, 6);
  const productDocs = selectedProducts.map((p, i) => ({
    accountId,
    userId,
    catalogId: `CAT-${String(i + 1).padStart(3, '0')}`,
    name: p.name,
    sku: p.sku,
    price: p.price,
    stock: p.stock,
    imageUrl: `https://placehold.co/120x120/EEF2FF/6366F1?text=${encodeURIComponent(p.name.split(' ')[0])}`,
    isActive: p.stock > 0,
    category: p.category,
  }));
  await Product.insertMany(productDocs);

  // Create 4 payments
  let balance = randInt(5000, 20000);
  const paymentDocs = Array.from({ length: 4 }, (_, i) => {
    const isCredit = i % 3 !== 2; // 3 credits, 1 debit
    const amount = isCredit ? randInt(3000, 12000) : randInt(500, 3000);
    balance = isCredit ? balance + amount : balance - amount;
    return {
      accountId,
      userId,
      transactionId: `TXN-${Date.now()}-${i}`,
      amount,
      type: isCredit ? 'credit' : 'debit',
      description: isCredit
        ? `Order settlement - Week ${randInt(40, 50)}`
        : `Return refund - RET-${String(i + 1).padStart(3, '0')}`,
      date: new Date(Date.now() - (i + 1) * 3 * 86400000),
      balance,
    };
  });
  await Payment.insertMany(paymentDocs);

  // Create 2 notifications
  const notifDocs = [
    {
      userId,
      accountId,
      message: `${orders.length} new orders synced successfully`,
      type: 'sync',
      isRead: false,
    },
    {
      userId,
      accountId,
      message: `${returnDocs.filter(r => r.otp).length} return OTPs generated and ready`,
      type: 'otp',
      isRead: false,
    },
  ];
  await Notification.insertMany(notifDocs);

  return { orders: orders.length, returns: returnDocs.length };
};

const seedAccount = async (req, res, next) => {
  try {
    const SellerAccount = require('../models/SellerAccount');
    const account = await SellerAccount.findOne({ _id: req.params.id, userId: req.user.id });
    if (!account) return res.status(404).json({ error: 'Account not found' });

    const result = await seedAccountData(account._id, req.user.id);
    await SellerAccount.findByIdAndUpdate(account._id, { status: 'active', lastSyncAt: new Date() });

    res.json({ message: 'Seed data created', ...result });
  } catch (err) { next(err); }
};

module.exports = { seedAccount, seedAccountData };
