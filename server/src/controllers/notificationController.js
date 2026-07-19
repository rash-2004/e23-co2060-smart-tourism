const notificationRepo = require('../repositories/notificationRepo');

async function getUserNotifications(req, res) {
    try {
        const userId = req.params.userId;
        const notifications = await notificationRepo.getUserNotifications(userId);
        res.status(200).json({ success: true, notifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
}

async function getUnreadCount(req, res) {
    try {
        const userId = req.params.userId;
        const count = await notificationRepo.getUnreadCount(userId);
        res.status(200).json({ success: true, count });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ error: 'Failed to fetch unread count' });
    }
}

async function markAsRead(req, res) {
    try {
        const userId = req.params.userId;
        const { notificationId } = req.params;
        const notification = await notificationRepo.markAsRead(notificationId, userId);
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        res.status(200).json({ success: true, notification });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
}

async function markAllAsRead(req, res) {
    try {
        const userId = req.params.userId;
        await notificationRepo.markAllAsRead(userId);
        res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
}

module.exports = {
    getUserNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead
};
