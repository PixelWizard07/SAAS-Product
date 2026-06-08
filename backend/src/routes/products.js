const router = require('express').Router();
const auth = require('../middleware/auth');
const { getProducts, updateProduct } = require('../controllers/productsController');
const { bulkUpsert } = require('../controllers/bulkController');

router.use(auth);
router.get('/', getProducts);
router.post('/bulk', bulkUpsert('Product', 'catalogId'));
router.put('/:id', updateProduct);

module.exports = router;
