const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const notification = require('../controllers/notificationController');

router.use(requireAuth);

router.get('/', notification.list);
router.patch('/:id/read', notification.markRead);
router.patch('/read-all', notification.markAllRead);
router.delete('/:id', notification.remove);

module.exports = router;
