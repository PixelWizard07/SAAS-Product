const router = require('express').Router();
const auth = require('../middleware/auth');
const { getProducts, updateProduct } = require('../controllers/productsController');

router.use(auth);
router.get('/', getProducts);
router.put('/:id', updateProduct);

module.exports = router;
