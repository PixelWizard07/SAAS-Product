const router = require('express').Router();
const auth = require('../middleware/auth');
const { getPayments, getSummary } = require('../controllers/paymentsController');

router.use(auth);
router.get('/summary', getSummary);
router.get('/', getPayments);

module.exports = router;
