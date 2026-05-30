const router = require('express').Router();
const auth = require('../middleware/auth');
const { getAccounts, addAccount, updateAccount, deleteAccount, syncAccount } = require('../controllers/accountsController');
const { seedAccount } = require('../controllers/seedController');

router.use(auth);
router.get('/', getAccounts);
router.post('/', addAccount);
router.put('/:id', updateAccount);
router.delete('/:id', deleteAccount);
router.post('/:id/sync', syncAccount);
router.post('/:id/seed', seedAccount);

module.exports = router;
