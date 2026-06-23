const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Driver {
  static async create(userId, driverData) {
    const driverId = uuidv4();
    
    const result = await pool.query(
      `INSERT INTO drivers (driver_id, user_id, license_number, current_latitude, current_longitude, verification_status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        driverId,
        userId,
        driverData.licenseNumber,
        driverData.currentLatitude || null,
        driverData.currentLongitude || null,
        driverData.verificationStatus || 'PENDING'
      ]
    );

    return result.rows[0];
  }

  static async findByUserId(userId) {
    const result = await pool.query(
      `SELECT d.*, u.name, u.email, u.phone_number, u.user_type
       FROM drivers d
       JOIN users u ON d.user_id = u.user_id
       WHERE d.user_id = $1`,
      [userId]
    );
    return result.rows[0];
  }

  static async findById(driverId) {
    const result = await pool.query(
      `SELECT d.*, u.name, u.email, u.phone_number
       FROM drivers d
       JOIN users u ON d.user_id = u.user_id
       WHERE d.driver_id = $1`,
      [driverId]
    );
    return result.rows[0];
  }

  static async findAvailableDrivers(latitude, longitude, radius = 5) {
    const result = await pool.query(
      `SELECT * FROM (
        SELECT d.*, u.name, u.email, u.phone_number,
          v.make, v.model, v.year, v.color, v.vehicle_type, v.registration_number,
          (6371 * acos(
            LEAST(1, GREATEST(-1,
              cos(radians($1)) * cos(radians(d.current_latitude)) *
              cos(radians(d.current_longitude) - radians($2)) +
              sin(radians($1)) * sin(radians(d.current_latitude))
            ))
          )) AS distance
         FROM drivers d
         JOIN users u ON d.user_id = u.user_id
         LEFT JOIN vehicles v ON v.driver_id = d.driver_id
         WHERE d.is_available = TRUE
           AND d.verification_status = 'APPROVED'
           AND d.current_latitude IS NOT NULL
           AND d.current_longitude IS NOT NULL
      ) sub
       WHERE sub.distance <= $3
       ORDER BY sub.distance
       LIMIT 25`,
      [latitude, longitude, radius]
    );
    return result.rows;
  }

  static async update(driverId, updates) {
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

    values.push(driverId);
    const query = `UPDATE drivers SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE driver_id = $${paramCount} RETURNING *`;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async updateLocation(driverId, latitude, longitude) {
    const result = await pool.query(
      'UPDATE drivers SET current_latitude = $1, current_longitude = $2, updated_at = CURRENT_TIMESTAMP WHERE driver_id = $3 RETURNING *',
      [latitude, longitude, driverId]
    );
    return result.rows[0];
  }

  static async toggleAvailability(driverId, isAvailable) {
    const result = await pool.query(
      'UPDATE drivers SET is_available = $1, updated_at = CURRENT_TIMESTAMP WHERE driver_id = $2 RETURNING *',
      [isAvailable, driverId]
    );
    return result.rows[0];
  }

  static async updateRating(driverId) {
    const result = await pool.query(
      `UPDATE drivers SET rating = (
        SELECT COALESCE(AVG(score), 5.00)
        FROM ratings r
        JOIN trips t ON r.trip_id = t.trip_id
        WHERE t.driver_id = $1 AND r.rating_type = 'PASSENGER_TO_DRIVER'
      )
      WHERE driver_id = $1
      RETURNING *`,
      [driverId]
    );
    return result.rows[0];
  }

  static async incrementTrips(driverId) {
    await pool.query(
      'UPDATE drivers SET total_trips = total_trips + 1 WHERE driver_id = $1',
      [driverId]
    );
  }

  static async addEarnings(driverId, amount) {
    await pool.query(
      'UPDATE drivers SET earnings = earnings + $1 WHERE driver_id = $2',
      [amount, driverId]
    );
  }
}

module.exports = Driver;
