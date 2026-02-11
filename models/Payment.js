const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Payment {
  static async create(tripId, paymentData) {
    const paymentId = uuidv4();
    const commissionRate = 0.15; // 15% commission
    const commission = paymentData.amount * commissionRate;
    const driverEarnings = paymentData.amount - commission;
    
    const result = await pool.query(
      `INSERT INTO payments (
        payment_id, trip_id, amount, payment_method, payment_status,
        transaction_ref, commission, driver_earnings
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        paymentId,
        tripId,
        paymentData.amount,
        paymentData.paymentMethod,
        paymentData.paymentStatus || 'PENDING',
        paymentData.transactionRef || null,
        commission,
        driverEarnings
      ]
    );

    return result.rows[0];
  }

  static async findByTripId(tripId) {
    const result = await pool.query(
      'SELECT * FROM payments WHERE trip_id = $1',
      [tripId]
    );
    return result.rows[0];
  }

  static async findById(paymentId) {
    const result = await pool.query(
      'SELECT * FROM payments WHERE payment_id = $1',
      [paymentId]
    );
    return result.rows[0];
  }

  static async update(paymentId, updates) {
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

    values.push(paymentId);
    const query = `UPDATE payments SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE payment_id = $${paramCount} RETURNING *`;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async completePayment(paymentId, transactionRef) {
    const result = await pool.query(
      `UPDATE payments 
       SET payment_status = 'COMPLETED', transaction_ref = $1, payment_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE payment_id = $2
       RETURNING *`,
      [transactionRef, paymentId]
    );
    return result.rows[0];
  }
}

module.exports = Payment;
