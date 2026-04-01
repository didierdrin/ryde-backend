const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class RentalPaymentIntent {
  static async create(userId, { amount, vehicleRef, description }) {
    const intentId = uuidv4();
    const result = await pool.query(
      `INSERT INTO rental_payment_intents (intent_id, user_id, amount, vehicle_ref, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [intentId, userId, amount, vehicleRef || null, description || null]
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
}

module.exports = RentalPaymentIntent;
