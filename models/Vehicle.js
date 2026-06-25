const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Vehicle {
  static async create(driverId, vehicleData) {
    const vehicleId = uuidv4();
    
    const result = await pool.query(
      `INSERT INTO vehicles (vehicle_id, driver_id, registration_number, make, model, year, color, vehicle_type, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        vehicleId,
        driverId,
        vehicleData.registrationNumber,
        vehicleData.make,
        vehicleData.model,
        vehicleData.year,
        vehicleData.color,
        vehicleData.vehicleType,
        vehicleData.imageUrl || null,
      ]
    );

    return result.rows[0];
  }

  static async findByDriverId(driverId) {
    const result = await pool.query(
      `SELECT v.*, d.user_id, u.name as driver_name
       FROM vehicles v
       JOIN drivers d ON v.driver_id = d.driver_id
       JOIN users u ON d.user_id = u.user_id
       WHERE v.driver_id = $1`,
      [driverId]
    );
    return result.rows[0];
  }

  static async findById(vehicleId) {
    const result = await pool.query(
      `SELECT v.*, d.user_id, u.name as driver_name
       FROM vehicles v
       JOIN drivers d ON v.driver_id = d.driver_id
       JOIN users u ON d.user_id = u.user_id
       WHERE v.vehicle_id = $1`,
      [vehicleId]
    );
    return result.rows[0];
  }

  static async update(vehicleId, updates) {
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

    values.push(vehicleId);
    const query = `UPDATE vehicles SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE vehicle_id = $${paramCount} RETURNING *`;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }
}

module.exports = Vehicle;
