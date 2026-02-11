const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Notification {
  static async create(userId, notificationData) {
    const notificationId = uuidv4();
    
    const result = await pool.query(
      `INSERT INTO notifications (
        notification_id, user_id, title, message, notification_type, delivery_method
      )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        notificationId,
        userId,
        notificationData.title,
        notificationData.message,
        notificationData.notificationType,
        notificationData.deliveryMethod || 'PUSH'
      ]
    );

    return result.rows[0];
  }

  static async findByUserId(userId, isRead = null) {
    let query = 'SELECT * FROM notifications WHERE user_id = $1';
    const params = [userId];
    
    if (isRead !== null) {
      query += ' AND is_read = $2';
      params.push(isRead);
    }
    
    query += ' ORDER BY sent_at DESC';
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async markAsRead(notificationId, userId) {
    const result = await pool.query(
      `UPDATE notifications 
       SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
       WHERE notification_id = $1 AND user_id = $2
       RETURNING *`,
      [notificationId, userId]
    );
    return result.rows[0];
  }

  static async markAllAsRead(userId) {
    await pool.query(
      `UPDATE notifications 
       SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );
  }

  static async getUnreadCount(userId) {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = FALSE',
      [userId]
    );
    return parseInt(result.rows[0].count);
  }
}

module.exports = Notification;
