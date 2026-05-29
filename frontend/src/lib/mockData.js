export const MOCK_ACCOUNTS = [
  { _id: 'acc1', nickname: 'Fashion Store', phone: '9876543210', shopName: 'Trendy Fashion Hub', profilePicture: 'https://api.dicebear.com/7.x/shapes/svg?seed=acc1', status: 'active', lastSyncAt: new Date(Date.now() - 10 * 60000).toISOString() },
  { _id: 'acc2', nickname: 'Electronics Shop', phone: '9123456780', shopName: 'Gadget Galaxy', profilePicture: 'https://api.dicebear.com/7.x/shapes/svg?seed=acc2', status: 'active', lastSyncAt: new Date(Date.now() - 25 * 60000).toISOString() },
  { _id: 'acc3', nickname: 'Home Decor', phone: '9988776655', shopName: 'Casa Beautiful', profilePicture: 'https://api.dicebear.com/7.x/shapes/svg?seed=acc3', status: 'inactive', lastSyncAt: null },
]

export const MOCK_ORDERS = [
  { _id: 'o1', orderId: 'MH-2024-001', productName: 'Floral Kurti Set', sku: 'FKS-001', variant: 'Blue / M', productImage: 'https://placehold.co/80x80/DBEAFE/6366F1?text=Kurti', buyerName: 'Priya Sharma', buyerAddress: 'Mumbai, Maharashtra', orderDate: new Date(Date.now() - 1 * 86400000).toISOString(), expectedDelivery: new Date(Date.now() + 3 * 86400000).toISOString(), paymentMode: 'Prepaid', status: 'Shipped', price: 549, quantity: 1, accountId: { _id: 'acc1', nickname: 'Fashion Store' } },
  { _id: 'o2', orderId: 'MH-2024-002', productName: 'Wireless Earbuds Pro', sku: 'WEP-021', variant: 'Black', productImage: 'https://placehold.co/80x80/DBEAFE/6366F1?text=Earbuds', buyerName: 'Rahul Verma', buyerAddress: 'Delhi, DL', orderDate: new Date(Date.now() - 2 * 86400000).toISOString(), expectedDelivery: new Date(Date.now() + 4 * 86400000).toISOString(), paymentMode: 'COD', status: 'Pending', price: 1299, quantity: 1, accountId: { _id: 'acc2', nickname: 'Electronics Shop' } },
  { _id: 'o3', orderId: 'MH-2024-003', productName: 'Decorative Lamp', sku: 'DL-045', variant: 'Gold', productImage: 'https://placehold.co/80x80/DBEAFE/6366F1?text=Lamp', buyerName: 'Sunita Patel', buyerAddress: 'Ahmedabad, Gujarat', orderDate: new Date(Date.now() - 3 * 86400000).toISOString(), expectedDelivery: new Date(Date.now() + 2 * 86400000).toISOString(), paymentMode: 'Prepaid', status: 'Delivered', price: 899, quantity: 2, accountId: { _id: 'acc3', nickname: 'Home Decor' } },
  { _id: 'o4', orderId: 'MH-2024-004', productName: 'Palazzo Pants', sku: 'PP-012', variant: 'Red / L', productImage: 'https://placehold.co/80x80/DBEAFE/6366F1?text=Palazzo', buyerName: 'Meena Khanna', buyerAddress: 'Jaipur, Rajasthan', orderDate: new Date(Date.now()).toISOString(), expectedDelivery: new Date(Date.now() + 5 * 86400000).toISOString(), paymentMode: 'COD', status: 'Confirmed', price: 399, quantity: 1, accountId: { _id: 'acc1', nickname: 'Fashion Store' } },
  { _id: 'o5', orderId: 'MH-2024-005', productName: 'Smart Watch', sku: 'SW-088', variant: 'Black / 44mm', productImage: 'https://placehold.co/80x80/DBEAFE/6366F1?text=Watch', buyerName: 'Arjun Singh', buyerAddress: 'Bangalore, Karnataka', orderDate: new Date(Date.now() - 5 * 86400000).toISOString(), expectedDelivery: new Date(Date.now() - 1 * 86400000).toISOString(), paymentMode: 'Prepaid', status: 'Delivered', price: 2499, quantity: 1, accountId: { _id: 'acc2', nickname: 'Electronics Shop' } },
  { _id: 'o6', orderId: 'MH-2024-006', productName: 'Cotton Bedsheet Set', sku: 'CBS-034', variant: 'King / White', productImage: 'https://placehold.co/80x80/DBEAFE/6366F1?text=Bedsheet', buyerName: 'Kavita Rao', buyerAddress: 'Chennai, TN', orderDate: new Date(Date.now() - 1 * 86400000).toISOString(), expectedDelivery: new Date(Date.now() + 3 * 86400000).toISOString(), paymentMode: 'Prepaid', status: 'Shipped', price: 1199, quantity: 1, accountId: { _id: 'acc3', nickname: 'Home Decor' } },
  { _id: 'o7', orderId: 'MH-2024-007', productName: 'Anarkali Suit', sku: 'AS-067', variant: 'Pink / XL', productImage: 'https://placehold.co/80x80/DBEAFE/6366F1?text=Anarkali', buyerName: 'Divya Nair', buyerAddress: 'Kochi, Kerala', orderDate: new Date(Date.now()).toISOString(), expectedDelivery: new Date(Date.now() + 4 * 86400000).toISOString(), paymentMode: 'COD', status: 'Pending', price: 699, quantity: 1, accountId: { _id: 'acc1', nickname: 'Fashion Store' } },
  { _id: 'o8', orderId: 'MH-2024-008', productName: 'Bluetooth Speaker', sku: 'BS-091', variant: 'Blue', productImage: 'https://placehold.co/80x80/DBEAFE/6366F1?text=Speaker', buyerName: 'Vikram Joshi', buyerAddress: 'Pune, Maharashtra', orderDate: new Date(Date.now() - 4 * 86400000).toISOString(), expectedDelivery: new Date(Date.now() + 1 * 86400000).toISOString(), paymentMode: 'Prepaid', status: 'Cancelled', price: 1799, quantity: 1, accountId: { _id: 'acc2', nickname: 'Electronics Shop' } },
]

export const MOCK_RETURNS = [
  { _id: 'r1', returnId: 'RET-001', orderId: 'MH-2024-003', productName: 'Decorative Lamp', productImage: 'https://placehold.co/80x80/FEE2E2/EF4444?text=Lamp', returnReason: 'Product damaged during delivery', status: 'Initiated', buyerName: 'Sunita Patel', accountId: { _id: 'acc3', nickname: 'Home Decor' }, otp: '483921', otpUsed: false, otpGeneratedAt: new Date(Date.now() - 5 * 60000).toISOString() },
  { _id: 'r2', returnId: 'RET-002', orderId: 'MH-2024-005', productName: 'Smart Watch', productImage: 'https://placehold.co/80x80/FEE2E2/EF4444?text=Watch', returnReason: 'Wrong product delivered', status: 'Pickup Scheduled', buyerName: 'Arjun Singh', accountId: { _id: 'acc2', nickname: 'Electronics Shop' }, otp: '726354', otpUsed: false, otpGeneratedAt: new Date(Date.now() - 15 * 60000).toISOString() },
  { _id: 'r3', returnId: 'RET-003', orderId: 'MH-2024-001', productName: 'Floral Kurti Set', productImage: 'https://placehold.co/80x80/FEE2E2/EF4444?text=Kurti', returnReason: 'Size mismatch', status: 'Picked Up', buyerName: 'Priya Sharma', accountId: { _id: 'acc1', nickname: 'Fashion Store' }, otp: null, otpUsed: false, otpGeneratedAt: null },
  { _id: 'r4', returnId: 'RET-004', orderId: 'MH-2023-988', productName: 'Palazzo Pants', productImage: 'https://placehold.co/80x80/FEE2E2/EF4444?text=Palazzo', returnReason: 'Quality not as expected', status: 'Refunded', buyerName: 'Meena Khanna', accountId: { _id: 'acc1', nickname: 'Fashion Store' }, otp: null, otpUsed: true, otpGeneratedAt: null },
]

export const MOCK_PRODUCTS = [
  { _id: 'p1', catalogId: 'CAT-001', name: 'Floral Kurti Set', sku: 'FKS-001', price: 549, stock: 45, imageUrl: 'https://placehold.co/120x120/EEF2FF/6366F1?text=Kurti', isActive: true, category: 'Women Fashion', accountId: { _id: 'acc1', nickname: 'Fashion Store' } },
  { _id: 'p2', catalogId: 'CAT-002', name: 'Palazzo Pants', sku: 'PP-012', price: 399, stock: 78, imageUrl: 'https://placehold.co/120x120/EEF2FF/6366F1?text=Palazzo', isActive: true, category: 'Women Fashion', accountId: { _id: 'acc1', nickname: 'Fashion Store' } },
  { _id: 'p3', catalogId: 'CAT-003', name: 'Anarkali Suit', sku: 'AS-067', price: 699, stock: 12, imageUrl: 'https://placehold.co/120x120/EEF2FF/6366F1?text=Anarkali', isActive: true, category: 'Women Fashion', accountId: { _id: 'acc1', nickname: 'Fashion Store' } },
  { _id: 'p4', catalogId: 'CAT-004', name: 'Wireless Earbuds Pro', sku: 'WEP-021', price: 1299, stock: 34, imageUrl: 'https://placehold.co/120x120/EEF2FF/6366F1?text=Earbuds', isActive: true, category: 'Electronics', accountId: { _id: 'acc2', nickname: 'Electronics Shop' } },
  { _id: 'p5', catalogId: 'CAT-005', name: 'Smart Watch', sku: 'SW-088', price: 2499, stock: 8, imageUrl: 'https://placehold.co/120x120/EEF2FF/6366F1?text=Watch', isActive: true, category: 'Electronics', accountId: { _id: 'acc2', nickname: 'Electronics Shop' } },
  { _id: 'p6', catalogId: 'CAT-006', name: 'Bluetooth Speaker', sku: 'BS-091', price: 1799, stock: 0, imageUrl: 'https://placehold.co/120x120/EEF2FF/6366F1?text=Speaker', isActive: false, category: 'Electronics', accountId: { _id: 'acc2', nickname: 'Electronics Shop' } },
  { _id: 'p7', catalogId: 'CAT-007', name: 'Decorative Lamp', sku: 'DL-045', price: 899, stock: 23, imageUrl: 'https://placehold.co/120x120/EEF2FF/6366F1?text=Lamp', isActive: true, category: 'Home Decor', accountId: { _id: 'acc3', nickname: 'Home Decor' } },
  { _id: 'p8', catalogId: 'CAT-008', name: 'Cotton Bedsheet Set', sku: 'CBS-034', price: 1199, stock: 56, imageUrl: 'https://placehold.co/120x120/EEF2FF/6366F1?text=Bedsheet', isActive: true, category: 'Home Decor', accountId: { _id: 'acc3', nickname: 'Home Decor' } },
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
