const router = require('express').Router();

router.use('/auth', require('./auth'));
router.use('/accounts', require('./accounts'));
router.use('/orders', require('./orders'));
router.use('/returns', require('./returns'));
router.use('/products', require('./products'));
router.use('/payments', require('./payments'));
router.use('/notifications', require('./notifications'));

module.exports = router;
