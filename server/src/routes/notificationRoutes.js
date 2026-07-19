const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

router.get('/:userId', notificationController.getUserNotifications);
router.get('/:userId/unread-count', notificationController.getUnreadCount);
router.put('/:userId/mark-all-read', notificationController.markAllAsRead);
router.put('/:userId/:notificationId/read', notificationController.markAsRead);

module.exports = router;
