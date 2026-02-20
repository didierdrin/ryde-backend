const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Trip {
  static async create(passengerId, tripData) {
    const tripId = uuidv4();
    
    const result = await pool.query(
      `INSERT INTO trips (
        trip_id, passenger_id, pickup_latitude, pickup_longitude, pickup_address,
        destination_latitude, destination_longitude, destination_address,
        distance, fare, status
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        tripId,
        passengerId,
        tripData.pickupLatitude,
        tripData.pickupLongitude,
        tripData.pickupAddress,
        tripData.destinationLatitude,
        tripData.destinationLongitude,
        tripData.destinationAddress,
        tripData.distance,
        tripData.fare,
        'REQUESTED'
      ]
    );

    return result.rows[0];
  }

  static async findById(tripId) {
    const result = await pool.query(
      `SELECT t.*, 
        p.user_id as passenger_user_id,
        u1.name as passenger_name,
        u1.phone_number as passenger_phone,
        d.driver_id,
        d.user_id as driver_user_id,
        u2.name as driver_name,
        u2.phone_number as driver_phone,
        v.registration_number, v.make, v.model, v.color, v.vehicle_type
       FROM trips t
       JOIN passengers p ON t.passenger_id = p.passenger_id
       JOIN users u1 ON p.user_id = u1.user_id
       LEFT JOIN drivers d ON t.driver_id = d.driver_id
       LEFT JOIN users u2 ON d.user_id = u2.user_id
       LEFT JOIN vehicles v ON d.driver_id = v.driver_id
       WHERE t.trip_id = $1`,
      [tripId]
    );
    return result.rows[0];
  }

  static async findByPassengerId(passengerId, status = null) {
    let query = `SELECT t.*, 
      d.driver_id,
      u2.name as driver_name,
      u2.phone_number as driver_phone,
      v.registration_number, v.make, v.model
     FROM trips t
     LEFT JOIN drivers d ON t.driver_id = d.driver_id
     LEFT JOIN users u2 ON d.user_id = u2.user_id
     LEFT JOIN vehicles v ON d.driver_id = v.driver_id
     WHERE t.passenger_id = $1`;
    
    const params = [passengerId];
    if (status) {
      query += ' AND t.status = $2';
      params.push(status);
    }
    query += ' ORDER BY t.request_time DESC';
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async findByDriverId(driverId, status = null) {
    let query = `SELECT t.*, 
      p.user_id as passenger_user_id,
      u1.name as passenger_name,
      u1.phone_number as passenger_phone
     FROM trips t
     JOIN passengers p ON t.passenger_id = p.passenger_id
     JOIN users u1 ON p.user_id = u1.user_id
     WHERE t.driver_id = $1`;
    
    const params = [driverId];
    if (status) {
      query += ' AND t.status = $2';
      params.push(status);
    }
    query += ' ORDER BY t.request_time DESC';
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async findRequestedTrips(latitude, longitude, radius = 10) {
    const result = await pool.query(
      `SELECT * FROM (
        SELECT t.*,
          p.user_id as passenger_user_id,
          u1.name as passenger_name,
          u1.phone_number as passenger_phone,
          (6371 * acos(
            LEAST(1, GREATEST(-1,
              cos(radians($1)) * cos(radians(t.pickup_latitude)) *
              cos(radians(t.pickup_longitude) - radians($2)) +
              sin(radians($1)) * sin(radians(t.pickup_latitude))
            ))
          )) AS driver_distance
         FROM trips t
         JOIN passengers p ON t.passenger_id = p.passenger_id
         JOIN users u1 ON p.user_id = u1.user_id
         WHERE t.status = 'REQUESTED'
           AND t.pickup_latitude IS NOT NULL
           AND t.pickup_longitude IS NOT NULL
      ) sub
       WHERE sub.driver_distance <= $3
       ORDER BY sub.driver_distance, sub.request_time
       LIMIT 20`,
      [latitude, longitude, radius]
    );
    return result.rows;
  }

  static async update(tripId, updates) {
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

    values.push(tripId);
    const query = `UPDATE trips SET ${fields.join(', ')} WHERE trip_id = $${paramCount} RETURNING *`;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async acceptTrip(tripId, driverId) {
    const result = await pool.query(
      `UPDATE trips 
       SET driver_id = $1, status = 'ACCEPTED', updated_at = CURRENT_TIMESTAMP
       WHERE trip_id = $2 AND status = 'REQUESTED'
       RETURNING *`,
      [driverId, tripId]
    );
    return result.rows[0];
  }

  static async startTrip(tripId) {
    const result = await pool.query(
      `UPDATE trips 
       SET status = 'IN_PROGRESS', start_time = CURRENT_TIMESTAMP
       WHERE trip_id = $1 AND status = 'ACCEPTED'
       RETURNING *`,
      [tripId]
    );
    return result.rows[0];
  }

  static async completeTrip(tripId, duration) {
    const result = await pool.query(
      `UPDATE trips 
       SET status = 'COMPLETED', end_time = CURRENT_TIMESTAMP, duration = $1
       WHERE trip_id = $2 AND status = 'IN_PROGRESS'
       RETURNING *`,
      [duration, tripId]
    );
    return result.rows[0];
  }

  static async cancelTrip(tripId, userId) {
    // Check if user is passenger or driver
    const trip = await this.findById(tripId);
    if (!trip) return null;

    const result = await pool.query(
      `UPDATE trips 
       SET status = 'CANCELLED'
       WHERE trip_id = $1 AND (status = 'REQUESTED' OR status = 'ACCEPTED')
       RETURNING *`,
      [tripId]
    );
    return result.rows[0];
  }
}

module.exports = Trip;
