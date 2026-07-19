const db = require('../config/db');

async function createNotification(userId, type, title, message, referenceId = null) {
    try {
        const result = await db.query(
            `INSERT INTO notifications (user_id, type, title, message, reference_id)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [userId, type, title, message, referenceId]
        );
        return result.rows[0];
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
}

async function getUserNotifications(userId) {
    try {
        const result = await db.query(
            `SELECT * FROM notifications 
             WHERE user_id = $1 
             ORDER BY created_at DESC`,
            [userId]
        );
        return result.rows;
    } catch (error) {
        console.error('Error fetching user notifications:', error);
        throw error;
    }
}

async function getUnreadCount(userId) {
    try {
        const result = await db.query(
            `SELECT COUNT(*) FROM notifications 
             WHERE user_id = $1 AND is_read = false`,
            [userId]
        );
        return parseInt(result.rows[0].count);
    } catch (error) {
        console.error('Error fetching unread count:', error);
        throw error;
    }
}

async function markAsRead(notificationId, userId) {
    try {
        const result = await db.query(
            `UPDATE notifications 
             SET is_read = true 
             WHERE id = $1 AND user_id = $2
             RETURNING *`,
            [notificationId, userId]
        );
        return result.rows[0];
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
}

async function markAllAsRead(userId) {
    try {
        const result = await db.query(
            `UPDATE notifications 
             SET is_read = true 
             WHERE user_id = $1 AND is_read = false
             RETURNING *`,
            [userId]
        );
        return result.rows;
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
    }
}

module.exports = {
    createNotification,
    getUserNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead
};
