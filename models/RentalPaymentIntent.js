const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class RentalPaymentIntent {
  static async create(userId, { amount, vehicleRef, description, rentalStartDate, rentalEndDate, rentalDays, withDriver }) {
    const intentId = uuidv4();
    const result = await pool.query(
      `INSERT INTO rental_payment_intents
        (intent_id, user_id, amount, vehicle_ref, description, rental_start_date, rental_end_date, rental_days, with_driver)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        intentId,
        userId,
        amount,
        vehicleRef || null,
        description || null,
        rentalStartDate || null,
        rentalEndDate || null,
        rentalDays || null,
        withDriver === true,
      ]
    );
    return result.rows[0];
  }

  static async findByIntentId(intentId) {
    const result = await pool.query('SELECT * FROM rental_payment_intents WHERE intent_id = $1', [intentId]);
    return result.rows[0];
  }

  static async findByInvoiceNumber(invoiceNumber) {
    const result = await pool.query(
      'SELECT * FROM rental_payment_intents WHERE invoice_number = $1',
      [invoiceNumber]
    );
    return result.rows[0];
  }

  static async hasOverlappingBooking(vehicleRef, startDate, endDate, excludeIntentId = null) {
    const result = await pool.query(
      `SELECT 1 FROM rental_payment_intents
       WHERE vehicle_ref = $1
         AND status IN ('PENDING', 'COMPLETED')
         AND rental_start_date IS NOT NULL
         AND rental_end_date IS NOT NULL
         AND rental_start_date <= $3::date
         AND rental_end_date >= $2::date
         AND ($4::varchar IS NULL OR intent_id <> $4)
       LIMIT 1`,
      [vehicleRef, startDate, endDate, excludeIntentId]
    );
    return result.rowCount > 0;
  }

  static async setInvoiceNumber(intentId, invoiceNumber) {
    const result = await pool.query(
      `UPDATE rental_payment_intents
       SET invoice_number = $1, updated_at = CURRENT_TIMESTAMP
       WHERE intent_id = $2
       RETURNING *`,
      [invoiceNumber, intentId]
    );
    return result.rows[0];
  }

  static async markCompleted(intentId) {
    const result = await pool.query(
      `UPDATE rental_payment_intents
       SET status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP
       WHERE intent_id = $1
       RETURNING *`,
      [intentId]
    );
    return result.rows[0];
  }

  static async markFailed(intentId) {
    const result = await pool.query(
      `UPDATE rental_payment_intents
       SET status = 'FAILED', updated_at = CURRENT_TIMESTAMP
       WHERE intent_id = $1
       RETURNING *`,
      [intentId]
    );
    return result.rows[0];
  }

  static format(row) {
    if (!row) return null;
    return {
      intentId: row.intent_id,
      amount: Number(row.amount),
      status: row.status,
      invoiceNumber: row.invoice_number,
      vehicleRef: row.vehicle_ref,
      description: row.description,
      rentalStartDate: row.rental_start_date,
      rentalEndDate: row.rental_end_date,
      rentalDays: row.rental_days != null ? Number(row.rental_days) : null,
      withDriver: row.with_driver === true,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      vehicle: row.make
        ? {
            make: row.make,
            model: row.model,
            year: row.year,
            color: row.color,
            imageUrl: row.image_url,
          }
        : null,
    };
  }

  static async findByUserId(userId) {
    const result = await pool.query(
      `SELECT ri.*, rv.make, rv.model, rv.year, rv.color, rv.image_url
       FROM rental_payment_intents ri
       LEFT JOIN rental_vehicles rv ON rv.rental_id = ri.vehicle_ref
       WHERE ri.user_id = $1
       ORDER BY ri.created_at DESC`,
      [userId]
    );
    return result.rows.map(RentalPaymentIntent.format);
  }
}

module.exports = RentalPaymentIntent;
