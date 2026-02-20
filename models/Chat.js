const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Chat {
  /**
   * Get conversations (trips with chat) for the current user (driver or passenger).
   * Returns trip info + other party name + last message.
   */
  static async getConversations(userId) {
    const result = await pool.query(
      `SELECT t.trip_id, t.pickup_address, t.destination_address, t.status,
              t.passenger_id, t.driver_id,
              p.user_id AS passenger_user_id,
              u1.name AS passenger_name,
              d.user_id AS driver_user_id,
              u2.name AS driver_name,
              (SELECT text FROM chat_messages WHERE trip_id = t.trip_id ORDER BY created_at DESC LIMIT 1) AS last_message,
              (SELECT created_at FROM chat_messages WHERE trip_id = t.trip_id ORDER BY created_at DESC LIMIT 1) AS last_message_at
       FROM trips t
       JOIN passengers p ON t.passenger_id = p.passenger_id
       JOIN users u1 ON p.user_id = u1.user_id
       LEFT JOIN drivers d ON t.driver_id = d.driver_id
       LEFT JOIN users u2 ON d.user_id = u2.user_id
       WHERE (p.user_id = $1 OR d.user_id = $1)
         AND t.status IN ('ACCEPTED', 'IN_PROGRESS', 'COMPLETED')
       ORDER BY last_message_at DESC NULLS LAST, t.request_time DESC`,
      [userId]
    );
    return result.rows.map(row => ({
      tripId: row.trip_id,
      pickupAddress: row.pickup_address,
      destinationAddress: row.destination_address,
      status: row.status,
      otherPartyName: row.passenger_user_id === userId ? row.driver_name : row.passenger_name,
      otherPartyUserId: row.passenger_user_id === userId ? row.driver_user_id : row.passenger_user_id,
      lastMessage: row.last_message,
      lastMessageAt: row.last_message_at
    }));
  }

  /**
   * Get messages for a trip. Verifies the user is driver or passenger of the trip.
   */
  static async getMessages(tripId, userId) {
    const tripCheck = await pool.query(
      `SELECT t.trip_id FROM trips t
       JOIN passengers p ON t.passenger_id = p.passenger_id
       LEFT JOIN drivers d ON t.driver_id = d.driver_id
       WHERE t.trip_id = $1 AND (p.user_id = $2 OR d.user_id = $2)`,
      [tripId, userId]
    );
    if (tripCheck.rows.length === 0) {
      return null;
    }

    const result = await pool.query(
      `SELECT cm.message_id, cm.trip_id, cm.sender_id, cm.text, cm.created_at, u.name AS sender_name
       FROM chat_messages cm
       JOIN users u ON cm.sender_id = u.user_id
       WHERE cm.trip_id = $1
       ORDER BY cm.created_at ASC`,
      [tripId]
    );
    return result.rows.map(row => ({
      messageId: row.message_id,
      tripId: row.trip_id,
      senderId: row.sender_id,
      senderName: row.sender_name,
      text: row.text,
      createdAt: row.created_at
    }));
  }

  /**
   * Send a message. Verifies the user is driver or passenger of the trip.
   */
  static async sendMessage(tripId, userId, text) {
    const tripCheck = await pool.query(
      `SELECT t.trip_id FROM trips t
       JOIN passengers p ON t.passenger_id = p.passenger_id
       LEFT JOIN drivers d ON t.driver_id = d.driver_id
       WHERE t.trip_id = $1 AND (p.user_id = $2 OR d.user_id = $2)`,
      [tripId, userId]
    );
    if (tripCheck.rows.length === 0) {
      return null;
    }

    const messageId = uuidv4();
    await pool.query(
      `INSERT INTO chat_messages (message_id, trip_id, sender_id, text)
       VALUES ($1, $2, $3, $4)`,
      [messageId, tripId, userId, text]
    );
    const result = await pool.query(
      `SELECT cm.message_id, cm.trip_id, cm.sender_id, cm.text, cm.created_at, u.name AS sender_name
       FROM chat_messages cm
       JOIN users u ON cm.sender_id = u.user_id
       WHERE cm.message_id = $1`,
      [messageId]
    );
    const row = result.rows[0];
    return row ? {
      messageId: row.message_id,
      tripId: row.trip_id,
      senderId: row.sender_id,
      senderName: row.sender_name,
      text: row.text,
      createdAt: row.created_at
    } : null;
  }
}

module.exports = Chat;
