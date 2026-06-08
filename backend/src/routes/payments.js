const router = require('express').Router();
const auth = require('../middleware/auth');
const { getPayments, getSummary } = require('../controllers/paymentsController');
const { bulkUpsert, bulkComplete } = require('../controllers/bulkController');

router.use(auth);
router.get('/summary', getSummary);
router.get('/', getPayments);
router.post('/bulk', bulkUpsert('Payment', 'paymentId'));
router.post('/sync-complete', bulkComplete);

module.exports = router;
