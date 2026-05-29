const router = require('express').Router();
const auth = require('../middleware/auth');
const { getOrders, getOrder, getStats } = require('../controllers/ordersController');

router.use(auth);
router.get('/stats', getStats);
router.get('/', getOrders);
router.get('/:id', getOrder);

module.exports = router;
