const router = require('express').Router();
const auth = require('../middleware/auth');
const { getReturns, getOtps, markOtpUsed, fetchReturnOTP } = require('../controllers/returnsController');
const { bulkUpsert } = require('../controllers/bulkController');

router.use(auth);
router.get('/', getReturns);
router.post('/bulk', bulkUpsert('Return', 'returnId'));
router.get('/otps', getOtps);
router.put('/:id/otp-used', markOtpUsed);
router.get('/:id/otp', fetchReturnOTP);

module.exports = router;
