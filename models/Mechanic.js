const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Mechanic {
  static format(row) {
    if (!row) return null;
    return {
      id: row.mechanic_id,
      name: row.name,
      address: row.address,
      latitude: row.latitude != null ? Number(row.latitude) : null,
      longitude: row.longitude != null ? Number(row.longitude) : null,
      phoneNumber: row.phone_number,
      specialty: row.specialty,
      rating: row.rating != null ? Number(row.rating) : null,
      distanceKm: row.distance != null ? Number(Number(row.distance).toFixed(2)) : null,
      isActive: row.is_active,
    };
  }

  static async findNearby(latitude, longitude, radiusKm = 15) {
    const result = await pool.query(
      `SELECT * FROM (
        SELECT m.*,
          (6371 * acos(
            LEAST(1, GREATEST(-1,
              cos(radians($1)) * cos(radians(m.latitude)) *
              cos(radians(m.longitude) - radians($2)) +
              sin(radians($1)) * sin(radians(m.latitude))
            ))
          )) AS distance
        FROM mechanics m
        WHERE m.is_active = TRUE
      ) sub
      WHERE sub.distance <= $3
      ORDER BY sub.distance
      LIMIT 25`,
      [latitude, longitude, radiusKm]
    );
    return result.rows.map(Mechanic.format);
  }

  static async findAll() {
    const result = await pool.query(
      'SELECT *, NULL::numeric AS distance FROM mechanics WHERE is_active = TRUE ORDER BY name'
    );
    return result.rows.map(Mechanic.format);
  }

  static async create(data) {
    const mechanicId = uuidv4();
    const result = await pool.query(
      `INSERT INTO mechanics
        (mechanic_id, name, address, latitude, longitude, phone_number, specialty, rating)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *, NULL::numeric AS distance`,
      [
        mechanicId,
        data.name,
        data.address,
        data.latitude,
        data.longitude,
        data.phoneNumber || null,
        data.specialty || null,
        data.rating || 4.5,
      ]
    );
    return Mechanic.format(result.rows[0]);
  }
}

module.exports = Mechanic;
