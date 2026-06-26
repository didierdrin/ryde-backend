const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const TIER_COMMISSION = {
  BASIC: 15.0,
  PREMIUM: 10.0,
  ENTERPRISE: 5.0,
};

class Subscription {
  static format(row) {
    if (!row) return null;
    return {
      id: row.subscription_id,
      driverId: row.driver_id,
      driverName: row.driver_name,
      driverPhone: row.driver_phone,
      tier: row.tier,
      plan: row.tier,
      startDate: row.start_date,
      endDate: row.end_date,
      isActive: row.is_active,
      status: row.is_active ? 'active' : 'cancelled',
      commissionRate: Number(row.commission_rate),
      createdAt: row.created_at,
    };
  }

  static async findAll() {
    const result = await pool.query(
      `SELECT s.*, u.name AS driver_name, u.phone_number AS driver_phone
       FROM subscriptions s
       JOIN drivers d ON s.driver_id = d.driver_id
       JOIN users u ON d.user_id = u.user_id
       ORDER BY s.created_at DESC`
    );
    return result.rows.map(Subscription.format);
  }

  static async create({ driverId, tier, startDate, endDate, commissionRate }) {
    const subscriptionId = uuidv4();
    const normalizedTier = String(tier).toUpperCase();
    const rate = commissionRate != null ? Number(commissionRate) : TIER_COMMISSION[normalizedTier] ?? 15.0;

    await pool.query(
      `INSERT INTO subscriptions
        (subscription_id, driver_id, tier, start_date, end_date, is_active, commission_rate)
       VALUES ($1, $2, $3::subscription_tier_enum, $4, $5, TRUE, $6)`,
      [subscriptionId, driverId, normalizedTier, startDate, endDate, rate]
    );

    const withDriver = await pool.query(
      `SELECT s.*, u.name AS driver_name, u.phone_number AS driver_phone
       FROM subscriptions s
       JOIN drivers d ON s.driver_id = d.driver_id
       JOIN users u ON d.user_id = u.user_id
       WHERE s.subscription_id = $1`,
      [subscriptionId]
    );
    return Subscription.format(withDriver.rows[0]);
  }

  static async deactivate(subscriptionId) {
    const result = await pool.query(
      `UPDATE subscriptions
       SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
       WHERE subscription_id = $1
       RETURNING *`,
      [subscriptionId]
    );
    if (!result.rows[0]) return null;
    const withDriver = await pool.query(
      `SELECT s.*, u.name AS driver_name, u.phone_number AS driver_phone
       FROM subscriptions s
       JOIN drivers d ON s.driver_id = d.driver_id
       JOIN users u ON d.user_id = u.user_id
       WHERE s.subscription_id = $1`,
      [subscriptionId]
    );
    return Subscription.format(withDriver.rows[0]);
  }
}

module.exports = Subscription;
