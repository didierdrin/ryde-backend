const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Passenger {
  static async create(userId, passengerData = {}) {
    const passengerId = uuidv4();
    
    const result = await pool.query(
      `INSERT INTO passengers (passenger_id, user_id, current_latitude, current_longitude, payment_method)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        passengerId,
        userId,
        passengerData.currentLatitude || null,
        passengerData.currentLongitude || null,
        passengerData.paymentMethod || 'MTN_MOMO'
      ]
    );

    return result.rows[0];
  }

  static async findByUserId(userId) {
    const result = await pool.query(
      `SELECT p.*, u.name, u.email, u.phone_number, u.user_type
       FROM passengers p
       JOIN users u ON p.user_id = u.user_id
       WHERE p.user_id = $1`,
      [userId]
    );
    return result.rows[0];
  }

  static async findById(passengerId) {
    const result = await pool.query(
      `SELECT p.*, u.name, u.email, u.phone_number
       FROM passengers p
       JOIN users u ON p.user_id = u.user_id
       WHERE p.passenger_id = $1`,
      [passengerId]
    );
    return result.rows[0];
  }

  static async update(passengerId, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        fields.push(`${dbKey} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) return null;

    values.push(passengerId);
    const query = `UPDATE passengers SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE passenger_id = $${paramCount} RETURNING *`;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async updateLocation(passengerId, latitude, longitude) {
    const result = await pool.query(
      'UPDATE passengers SET current_latitude = $1, current_longitude = $2, updated_at = CURRENT_TIMESTAMP WHERE passenger_id = $3 RETURNING *',
      [latitude, longitude, passengerId]
    );
    return result.rows[0];
  }

  static async updateRating(passengerId) {
    const result = await pool.query(
      `UPDATE passengers SET rating = (
        SELECT COALESCE(AVG(score), 5.00)
        FROM ratings r
        JOIN trips t ON r.trip_id = t.trip_id
        WHERE t.passenger_id = $1 AND r.rating_type = 'DRIVER_TO_PASSENGER'
      )
      WHERE passenger_id = $1
      RETURNING *`,
      [passengerId]
    );
    return result.rows[0];
  }

  static async incrementTrips(passengerId) {
    await pool.query(
      'UPDATE passengers SET total_trips = total_trips + 1 WHERE passenger_id = $1',
      [passengerId]
    );
  }
}

module.exports = Passenger;
