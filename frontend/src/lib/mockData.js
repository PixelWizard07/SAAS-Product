export const MOCK_ACCOUNTS = [
  { _id: 'acc1', nickname: 'Fashion Store', phone: '9876543210', shopName: 'Trendy Fashion Hub', profilePicture: 'https://api.dicebear.com/7.x/shapes/svg?seed=acc1', status: 'active', lastSyncAt: new Date(Date.now() - 10 * 60000).toISOString() },
  { _id: 'acc2', nickname: 'Electronics Shop', phone: '9123456780', shopName: 'Gadget Galaxy', profilePicture: 'https://api.dicebear.com/7.x/shapes/svg?seed=acc2', status: 'active', lastSyncAt: new Date(Date.now() - 25 * 60000).toISOString() },
  { _id: 'acc3', nickname: 'Home Decor', phone: '9988776655', shopName: 'Casa Beautiful', profilePicture: 'https://api.dicebear.com/7.x/shapes/svg?seed=acc3', status: 'inactive', lastSyncAt: null },
]

const ship = (days) => new Date(Date.now() + days * 86400000).toISOString()
const past = (days) => new Date(Date.now() - days * 86400000).toISOString()

// Inline SVG data-URLs — no network needed
const IMG = {
  fashion: `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect width='80' height='80' fill='%23FDE68A'/><text x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' font-size='36'>👗</text></svg>`,
  electronics: `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect width='80' height='80' fill='%23BFDBFE'/><text x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' font-size='36'>📱</text></svg>`,
  home: `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect width='80' height='80' fill='%23D1FAE5'/><text x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' font-size='36'>🏠</text></svg>`,
}

export const MOCK_ORDERS = [
  { _id: 'o1', orderId: 'MH-2024-001', subOrderId: 'MH-2024-001_1', productName: 'Floral Kurti Set', sku: 'FKS-001', variant: 'Blue / M', productImage: IMG.fashion, buyerName: 'Priya Sharma', buyerAddress: 'Mumbai, Maharashtra', orderDate: past(1), shipByDate: ship(2), paymentMode: 'Prepaid', status: 'Shipped', price: 549, quantity: 1, accountId: { _id: 'acc1', nickname: 'Fashion Store' }, labelStatus: 'generated', isAd: false },
  { _id: 'o2', orderId: 'MH-2024-002', subOrderId: 'MH-2024-002_1', productName: 'Wireless Earbuds Pro', sku: 'WEP-021', variant: 'Black', productImage: IMG.electronics, buyerName: 'Rahul Verma', buyerAddress: 'Delhi, DL', orderDate: past(2), shipByDate: ship(1), paymentMode: 'COD', status: 'Pending', price: 1299, quantity: 1, accountId: { _id: 'acc2', nickname: 'Electronics Shop' }, labelStatus: 'none', isAd: true },
  { _id: 'o3', orderId: 'MH-2024-003', subOrderId: 'MH-2024-003_1', productName: 'Decorative Lamp Vintage Style', sku: 'DL-045', variant: 'Gold', productImage: IMG.home, buyerName: 'Sunita Patel', buyerAddress: 'Ahmedabad, Gujarat', orderDate: past(3), shipByDate: ship(2), paymentMode: 'Prepaid', status: 'Delivered', price: 899, quantity: 2, accountId: { _id: 'acc3', nickname: 'Home Decor' }, labelStatus: 'printed', isAd: false },
  { _id: 'o4', orderId: 'MH-2024-004', subOrderId: 'MH-2024-004_1', productName: 'Palazzo Pants Ethnic Wear', sku: 'PP-012', variant: 'Red / L', productImage: IMG.fashion, buyerName: 'Meena Khanna', buyerAddress: 'Jaipur, Rajasthan', orderDate: past(0), shipByDate: ship(1), paymentMode: 'COD', status: 'Pending', price: 399, quantity: 1, accountId: { _id: 'acc1', nickname: 'Fashion Store' }, labelStatus: 'none', isAd: false },
  { _id: 'o5', orderId: 'MH-2024-005', subOrderId: 'MH-2024-005_1', productName: 'Smart Watch Fitness Tracker', sku: 'SW-088', variant: 'Black / 44mm', productImage: IMG.electronics, buyerName: 'Arjun Singh', buyerAddress: 'Bangalore, Karnataka', orderDate: past(5), shipByDate: past(1), paymentMode: 'Prepaid', status: 'Delivered', price: 2499, quantity: 1, accountId: { _id: 'acc2', nickname: 'Electronics Shop' }, labelStatus: 'printed', isAd: true },
  { _id: 'o6', orderId: 'MH-2024-006', subOrderId: 'MH-2024-006_1', productName: 'Cotton Bedsheet Set King Size', sku: 'CBS-034', variant: 'King / White', productImage: IMG.home, buyerName: 'Kavita Rao', buyerAddress: 'Chennai, TN', orderDate: past(1), shipByDate: ship(3), paymentMode: 'Prepaid', status: 'Shipped', price: 1199, quantity: 1, accountId: { _id: 'acc3', nickname: 'Home Decor' }, labelStatus: 'generated', isAd: false },
  { _id: 'o7', orderId: 'MH-2024-007', subOrderId: 'MH-2024-007_1', productName: 'Anarkali Suit Designer Wear', sku: 'AS-067', variant: 'Pink / XL', productImage: IMG.fashion, buyerName: 'Divya Nair', buyerAddress: 'Kochi, Kerala', orderDate: past(0), shipByDate: ship(2), paymentMode: 'COD', status: 'Pending', price: 699, quantity: 1, accountId: { _id: 'acc1', nickname: 'Fashion Store' }, labelStatus: 'none', isAd: false },
  { _id: 'o8', orderId: 'MH-2024-008', subOrderId: 'MH-2024-008_1', productName: 'Bluetooth Speaker Portable', sku: 'BS-091', variant: 'Blue', productImage: IMG.electronics, buyerName: 'Vikram Joshi', buyerAddress: 'Pune, Maharashtra', orderDate: past(4), shipByDate: past(0), paymentMode: 'Prepaid', status: 'Cancelled', price: 1799, quantity: 1, accountId: { _id: 'acc2', nickname: 'Electronics Shop' }, labelStatus: 'failed', isAd: false },
]

export const MOCK_RETURNS = [
  { _id: 'r1', returnId: 'RET-001', orderId: 'MH-2024-003', productName: 'Decorative Lamp Vintage Style', productImage: IMG.home, returnReason: 'Product damaged during delivery', status: 'Initiated', buyerName: 'Sunita Patel', accountId: { _id: 'acc3', nickname: 'Home Decor' }, otp: '483921', otpUsed: false, otpGeneratedAt: new Date(Date.now() - 5 * 60000).toISOString(), ordersDelivered: 27, customerReturnRate: 7.41, returnCount: 2, category: 'Home & Kitchen', productId: '218655237', dualPricing: true, whatChanged: '7.41%', changeType: 'increase' },
  { _id: 'r2', returnId: 'RET-002', orderId: 'MH-2024-005', productName: 'Smart Watch Fitness Tracker', productImage: IMG.electronics, returnReason: 'Wrong product delivered', status: 'Pickup Scheduled', buyerName: 'Arjun Singh', accountId: { _id: 'acc2', nickname: 'Electronics Shop' }, otp: '726354', otpUsed: false, otpGeneratedAt: new Date(Date.now() - 15 * 60000).toISOString(), ordersDelivered: 658, customerReturnRate: 7.75, returnCount: 51, category: 'Bags, Luggage & Travel Accessories', productId: '276764717', dualPricing: true, whatChanged: '0.90%', changeType: 'increase' },
  { _id: 'r3', returnId: 'RET-003', orderId: 'MH-2024-001', productName: 'Floral Kurti Set', productImage: IMG.fashion, returnReason: 'Size mismatch', status: 'Picked Up', buyerName: 'Priya Sharma', accountId: { _id: 'acc1', nickname: 'Fashion Store' }, otp: null, otpUsed: false, otpGeneratedAt: null, ordersDelivered: 0, customerReturnRate: 0, returnCount: 0, category: 'Sports & Fitness', productId: '356910951', dualPricing: true, whatChanged: null, changeType: null },
  { _id: 'r4', returnId: 'RET-004', orderId: 'MH-2023-988', productName: 'Palazzo Pants Ethnic Wear', productImage: IMG.fashion, returnReason: 'Quality not as expected', status: 'Refunded', buyerName: 'Meena Khanna', accountId: { _id: 'acc1', nickname: 'Fashion Store' }, otp: null, otpUsed: true, otpGeneratedAt: null, ordersDelivered: 1, customerReturnRate: 0, returnCount: 0, category: 'Sports & Fitness', productId: '356912893', dualPricing: true, whatChanged: null, changeType: null },
]

export const MOCK_PRODUCTS = [
  { _id: 'p1', catalogId: 'CAT-001', name: 'Floral Kurti Set', sku: 'FKS-001', price: 549, stock: 45, imageUrl: IMG.fashion, isActive: true, category: 'Women Fashion', accountId: { _id: 'acc1', nickname: 'Fashion Store' } },
  { _id: 'p2', catalogId: 'CAT-002', name: 'Palazzo Pants', sku: 'PP-012', price: 399, stock: 78, imageUrl: IMG.fashion, isActive: true, category: 'Women Fashion', accountId: { _id: 'acc1', nickname: 'Fashion Store' } },
  { _id: 'p3', catalogId: 'CAT-003', name: 'Anarkali Suit', sku: 'AS-067', price: 699, stock: 12, imageUrl: IMG.fashion, isActive: true, category: 'Women Fashion', accountId: { _id: 'acc1', nickname: 'Fashion Store' } },
  { _id: 'p4', catalogId: 'CAT-004', name: 'Wireless Earbuds Pro', sku: 'WEP-021', price: 1299, stock: 34, imageUrl: IMG.electronics, isActive: true, category: 'Electronics', accountId: { _id: 'acc2', nickname: 'Electronics Shop' } },
  { _id: 'p5', catalogId: 'CAT-005', name: 'Smart Watch', sku: 'SW-088', price: 2499, stock: 8, imageUrl: IMG.electronics, isActive: true, category: 'Electronics', accountId: { _id: 'acc2', nickname: 'Electronics Shop' } },
  { _id: 'p6', catalogId: 'CAT-006', name: 'Bluetooth Speaker', sku: 'BS-091', price: 1799, stock: 0, imageUrl: IMG.electronics, isActive: false, category: 'Electronics', accountId: { _id: 'acc2', nickname: 'Electronics Shop' } },
  { _id: 'p7', catalogId: 'CAT-007', name: 'Decorative Lamp', sku: 'DL-045', price: 899, stock: 23, imageUrl: IMG.home, isActive: true, category: 'Home Decor', accountId: { _id: 'acc3', nickname: 'Home Decor' } },
  { _id: 'p8', catalogId: 'CAT-008', name: 'Cotton Bedsheet Set', sku: 'CBS-034', price: 1199, stock: 56, imageUrl: IMG.home, isActive: true, category: 'Home Decor', accountId: { _id: 'acc3', nickname: 'Home Decor' } },
]

export const MOCK_PAYMENTS = [
  { _id: 'pay1', transactionId: 'TXN-20241201', amount: 4850, type: 'credit', description: 'Order settlement - Week 48', date: new Date(Date.now() - 2 * 86400000).toISOString(), balance: 12450, accountId: { _id: 'acc1', nickname: 'Fashion Store' } },
  { _id: 'pay2', transactionId: 'TXN-20241128', amount: 320, type: 'debit', description: 'Return refund - RET-004', date: new Date(Date.now() - 5 * 86400000).toISOString(), balance: 7600, accountId: { _id: 'acc1', nickname: 'Fashion Store' } },
  { _id: 'pay3', transactionId: 'TXN-20241125', amount: 9200, type: 'credit', description: 'Order settlement - Week 47', date: new Date(Date.now() - 8 * 86400000).toISOString(), balance: 7920, accountId: { _id: 'acc2', nickname: 'Electronics Shop' } },
  { _id: 'pay4', transactionId: 'TXN-20241122', amount: 2499, type: 'debit', description: 'Return refund - RET-002', date: new Date(Date.now() - 10 * 86400000).toISOString(), balance: 5200, accountId: { _id: 'acc2', nickname: 'Electronics Shop' } },
  { _id: 'pay5', transactionId: 'TXN-20241120', amount: 3500, type: 'credit', description: 'Order settlement - Week 46', date: new Date(Date.now() - 14 * 86400000).toISOString(), balance: 7699, accountId: { _id: 'acc3', nickname: 'Home Decor' } },
]

export const MOCK_NOTIFICATIONS = [
  { _id: 'n1', message: 'New order MH-2024-007 received for Fashion Store', type: 'order', isRead: false, createdAt: new Date(Date.now() - 30 * 60000).toISOString(), accountId: { _id: 'acc1', nickname: 'Fashion Store' } },
  { _id: 'n2', message: 'Return RET-001 pickup scheduled for Home Decor', type: 'return', isRead: false, createdAt: new Date(Date.now() - 1 * 3600000).toISOString(), accountId: { _id: 'acc3', nickname: 'Home Decor' } },
  { _id: 'n3', message: 'Payment of ₹4,850 credited to Fashion Store', type: 'payment', isRead: true, createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), accountId: { _id: 'acc1', nickname: 'Fashion Store' } },
  { _id: 'n4', message: 'Electronics Shop synced successfully — 12 new orders', type: 'sync', isRead: false, createdAt: new Date(Date.now() - 25 * 60000).toISOString(), accountId: { _id: 'acc2', nickname: 'Electronics Shop' } },
  { _id: 'n5', message: 'OTP 483921 generated for return RET-001', type: 'otp', isRead: true, createdAt: new Date(Date.now() - 5 * 60000).toISOString(), accountId: { _id: 'acc3', nickname: 'Home Decor' } },
]

export const MOCK_CHART_DATA = [
  { date: 'Mon', orders: 12, revenue: 8400 },
  { date: 'Tue', orders: 19, revenue: 13200 },
  { date: 'Wed', orders: 8, revenue: 5600 },
  { date: 'Thu', orders: 24, revenue: 16800 },
  { date: 'Fri', orders: 31, revenue: 21700 },
  { date: 'Sat', orders: 28, revenue: 19600 },
  { date: 'Sun', orders: 17, revenue: 11900 },
]

export const MOCK_STATS = {
  todayOrders: 12,
  totalRevenue: 97200,
  pendingReturns: 2,
  activeOtps: 2,
  pendingOrders: 3,
  totalProducts: 8,
}

export const MOCK_LABELS = [
  { _id: 'l1', orderId: 'MH-2024-001', status: 'success', generatedAt: new Date().toISOString(), accountId: { nickname: 'Fashion Store' }, labelHtml: '<html><body><div style="border:2px solid #000;padding:20px;font-family:Arial"><h2 style="color:#6366F1">MeeshoHub</h2><p><strong>Order:</strong> MH-2024-001</p><p><strong>Ship To:</strong> Priya Sharma<br/>Mumbai, Maharashtra</p><p><strong>Product:</strong> Floral Kurti Set</p><p style="background:#D1FAE5;padding:8px;display:inline-block;font-weight:bold">PREPAID</p></div></body></html>' },
  { _id: 'l2', orderId: 'MH-2024-002', status: 'failed', failReason: 'Buyer address missing', accountId: { nickname: 'Electronics Shop' } },
  { _id: 'l3', orderId: 'MH-2024-004', status: 'success', generatedAt: new Date(Date.now() - 3600000).toISOString(), accountId: { nickname: 'Fashion Store' }, labelHtml: '<html><body><div style="border:2px solid #000;padding:20px;font-family:Arial"><h2 style="color:#6366F1">MeeshoHub</h2><p><strong>Order:</strong> MH-2024-004</p><p><strong>Ship To:</strong> Meena Khanna<br/>Jaipur, Rajasthan</p><p><strong>Product:</strong> Palazzo Pants</p><p style="background:#FEF3C7;padding:8px;display:inline-block;font-weight:bold">COD: ₹399</p></div></body></html>' },
]

export const MOCK_SETTINGS = {
  syncIntervalMinutes: 15,
  labelGenerationTime: '09:00',
  autoLabelEnabled: false,
  autoSyncEnabled: true,
  timezone: 'Asia/Kolkata',
}
