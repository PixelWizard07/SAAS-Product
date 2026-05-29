const router = require('express').Router();
const auth = require('../middleware/auth');
const { getNotifications, markRead, markAllRead } = require('../controllers/notificationsController');

router.use(auth);
router.get('/', getNotifications);
router.put('/read-all', markAllRead);
router.put('/:id/read', markRead);

module.exports = router;
