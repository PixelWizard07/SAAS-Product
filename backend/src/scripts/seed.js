/**
 * Seed script: creates a demo user and sample data
 * Run: node src/scripts/seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const SellerAccount = require('../models/SellerAccount');
const Order = require('../models/Order');
const Return = require('../models/Return');
const Payment = require('../models/Payment');
const Product = require('../models/Product');
const { encrypt } = require('../utils/encryption');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing demo data
  const existing = await User.findOne({ email: 'demo@meeshohub.com' });
  if (existing) {
    console.log('Demo user already exists — skipping seed');
    await mongoose.disconnect();
    return;
  }

  // Create demo user
  const user = await User.create({
    name: 'Demo Seller',
    email: 'demo@meeshohub.com',
    passwordHash: 'demo123456',
  });
  console.log('Created demo user:', user.email);

  // Create seller accounts
  const acc1 = await SellerAccount.create({
    userId: user._id,
    nickname: 'Fashion Store',
    phone: '9876543210',
    encryptedPassword: encrypt('demo_password'),
    shopName: 'Trendy Fashion Hub',
    status: 'active',
    lastSyncAt: new Date(),
  });

  const acc2 = await SellerAccount.create({
    userId: user._id,
    nickname: 'Electronics Shop',
    phone: '9123456780',
    encryptedPassword: encrypt('demo_password'),
    shopName: 'Gadget Galaxy',
    status: 'active',
    lastSyncAt: new Date(),
  });

  console.log('Created seller accounts');

  // Create sample orders
  const ship = (d) => new Date(Date.now() + d * 86400000);
  const past = (d) => new Date(Date.now() - d * 86400000);

  const orders = await Order.insertMany([
    { accountId: acc1._id, userId: user._id, orderId: 'MH-2024-001', subOrderId: 'MH-2024-001_1', productName: 'Floral Kurti Set', sku: 'FKS-001', variant: 'Blue/M', price: 549, quantity: 1, status: 'Shipped', orderDate: past(1), shipByDate: ship(2), paymentMode: 'Prepaid', buyerName: 'Priya Sharma', labelStatus: 'generated' },
    { accountId: acc2._id, userId: user._id, orderId: 'MH-2024-002', subOrderId: 'MH-2024-002_1', productName: 'Wireless Earbuds Pro', sku: 'WEP-021', variant: 'Black', price: 1299, quantity: 1, status: 'Pending', orderDate: past(2), shipByDate: ship(1), paymentMode: 'COD', buyerName: 'Rahul Verma', labelStatus: 'none', isAd: true },
    { accountId: acc1._id, userId: user._id, orderId: 'MH-2024-003', subOrderId: 'MH-2024-003_1', productName: 'Palazzo Pants', sku: 'PP-012', variant: 'Red/L', price: 399, quantity: 1, status: 'Pending', orderDate: past(0), shipByDate: ship(1), paymentMode: 'COD', buyerName: 'Meena Khanna', labelStatus: 'none' },
    { accountId: acc2._id, userId: user._id, orderId: 'MH-2024-004', subOrderId: 'MH-2024-004_1', productName: 'Smart Watch Fitness Tracker', sku: 'SW-088', variant: 'Black/44mm', price: 2499, quantity: 1, status: 'Ready to Ship', orderDate: past(5), shipByDate: ship(0), paymentMode: 'Prepaid', buyerName: 'Arjun Singh', labelStatus: 'generated' },
  ]);
  console.log('Created', orders.length, 'orders');

  // Create sample payments
  await Payment.insertMany([
    { accountId: acc1._id, userId: user._id, transactionId: 'TXN-001', amount: 29608, type: 'credit', description: 'Order settlement - Jun 1', date: past(1), balance: 29608 },
    { accountId: acc2._id, userId: user._id, transactionId: 'TXN-002', amount: 13417, type: 'credit', description: 'Order settlement - May 29', date: past(3), balance: 13417 },
    { accountId: acc1._id, userId: user._id, transactionId: 'TXN-003', amount: 736, type: 'debit', description: 'Ads Cost recovery', date: past(2), balance: 28872 },
  ]);
  console.log('Created payments');

  // Create sample products
  await Product.insertMany([
    { accountId: acc1._id, userId: user._id, catalogId: 'CAT-001', name: 'Floral Kurti Set', sku: 'FKS-001', price: 549, stock: 45, mrp: 699, status: 'active', isActive: true, category: 'Women Fashion' },
    { accountId: acc2._id, userId: user._id, catalogId: 'CAT-004', name: 'Wireless Earbuds Pro', sku: 'WEP-021', price: 1299, stock: 34, mrp: 1999, status: 'active', isActive: true, category: 'Electronics' },
    { accountId: acc2._id, userId: user._id, catalogId: 'CAT-005', name: 'Smart Watch', sku: 'SW-088', price: 2499, stock: 8, mrp: 3499, status: 'active', isActive: true, category: 'Electronics' },
  ]);
  console.log('Created products');

  console.log('\n✅ Seed complete!');
  console.log('Login with: demo@meeshohub.com / demo123456');
  await mongoose.disconnect();
}

seed().catch(e => { console.error(e); process.exit(1); });
