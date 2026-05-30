const router = require('express').Router();
const auth = require('../middleware/auth');
const { getSettings, updateSettings } = require('../controllers/settingsController');
router.use(auth);
router.get('/', getSettings);
router.put('/', updateSettings);
module.exports = router;
