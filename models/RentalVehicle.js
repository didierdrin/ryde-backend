const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class RentalVehicle {
  static format(row) {
    if (!row) return null;
    return {
      id: row.rental_id,
      make: row.make,
      model: row.model,
      year: row.year,
      color: row.color,
      type: row.vehicle_type,
      dailyRate: Number(row.daily_rate),
      dailyRateWithDriver: row.daily_rate_with_driver != null ? Number(row.daily_rate_with_driver) : null,
      dailyRateWithoutDriver: row.daily_rate_without_driver != null ? Number(row.daily_rate_without_driver) : null,
      pickupLocation: row.pickup_location,
      transmission: row.transmission,
      fuelType: row.fuel_type,
      ownerName: row.owner_name,
      seats: row.seats != null ? Number(row.seats) : null,
      imageUrl: row.image_url,
      description: row.description,
      isAvailable: row.is_available,
      createdAt: row.created_at,
    };
  }

  static async findAll({ availableOnly = true } = {}) {
    const where = availableOnly ? 'WHERE is_available = TRUE' : '';
    const result = await pool.query(
      `SELECT * FROM rental_vehicles ${where} ORDER BY created_at DESC`
    );
    return result.rows.map(RentalVehicle.format);
  }

  static async findById(rentalId) {
    const result = await pool.query(
      'SELECT * FROM rental_vehicles WHERE rental_id = $1',
      [rentalId]
    );
    return RentalVehicle.format(result.rows[0]);
  }

  static async create(data, createdBy = null) {
    const rentalId = uuidv4();
    const dailyRateWithoutDriver = data.dailyRateWithoutDriver ?? data.dailyRate;
    const result = await pool.query(
      `INSERT INTO rental_vehicles
        (rental_id, make, model, year, color, vehicle_type, daily_rate, daily_rate_with_driver,
         daily_rate_without_driver, pickup_location, transmission, fuel_type, owner_name, seats,
         image_url, description, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING *`,
      [
        rentalId,
        data.make,
        data.model,
        data.year,
        data.color,
        data.vehicleType || 'SEDAN',
        dailyRateWithoutDriver,
        data.dailyRateWithDriver,
        dailyRateWithoutDriver,
        data.pickupLocation,
        data.transmission || 'AUTOMATIC',
        data.fuelType || 'PETROL',
        data.ownerName,
        data.seats,
        data.imageUrl,
        data.description || null,
        createdBy,
      ]
    );
    return RentalVehicle.format(result.rows[0]);
  }

  static async update(rentalId, updates) {
    const fieldMap = {
      make: 'make',
      model: 'model',
      year: 'year',
      color: 'color',
      vehicleType: 'vehicle_type',
      dailyRate: 'daily_rate',
      dailyRateWithDriver: 'daily_rate_with_driver',
      dailyRateWithoutDriver: 'daily_rate_without_driver',
      pickupLocation: 'pickup_location',
      transmission: 'transmission',
      fuelType: 'fuel_type',
      ownerName: 'owner_name',
      seats: 'seats',
      imageUrl: 'image_url',
      description: 'description',
      isAvailable: 'is_available',
    };

    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined && fieldMap[key]) {
        fields.push(`${fieldMap[key]} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) return null;

    values.push(rentalId);
    const result = await pool.query(
      `UPDATE rental_vehicles SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE rental_id = $${paramCount} RETURNING *`,
      values
    );
    return RentalVehicle.format(result.rows[0]);
  }
}

module.exports = RentalVehicle;
