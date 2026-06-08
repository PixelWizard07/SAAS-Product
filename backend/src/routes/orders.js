const router = require('express').Router();
const auth = require('../middleware/auth');
const { getOrders, getOrder, getStats, acceptOrder, cancelOrder, downloadOrderLabel } = require('../controllers/ordersController');
const { bulkUpsert } = require('../controllers/bulkController');

router.use(auth);
router.get('/stats', getStats);
router.get('/', getOrders);
router.post('/bulk', bulkUpsert('Order', 'orderId'));
router.get('/:id', getOrder);
router.post('/:id/accept', acceptOrder);
router.post('/:id/cancel', cancelOrder);
router.post('/:id/label', downloadOrderLabel);

module.exports = router;
