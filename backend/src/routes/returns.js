const router = require('express').Router();
const auth = require('../middleware/auth');
const { getReturns, getOtps, markOtpUsed, fetchReturnOTP } = require('../controllers/returnsController');

router.use(auth);
router.get('/', getReturns);
router.get('/otps', getOtps);
router.put('/:id/otp-used', markOtpUsed);
router.get('/:id/otp', fetchReturnOTP);

module.exports = router;
