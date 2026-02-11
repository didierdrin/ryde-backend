const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Rating {
  static async create(ratingData) {
    const ratingId = uuidv4();
    
    const result = await pool.query(
      `INSERT INTO ratings (
        rating_id, trip_id, rated_by_user_id, rated_user_id, score, comment, rating_type
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        ratingId,
        ratingData.tripId,
        ratingData.ratedByUserId,
        ratingData.ratedUserId,
        ratingData.score,
        ratingData.comment || null,
        ratingData.ratingType
      ]
    );

    return result.rows[0];
  }

  static async findByTripId(tripId) {
    const result = await pool.query(
      `SELECT r.*, u1.name as rated_by_name, u2.name as rated_user_name
       FROM ratings r
       JOIN users u1 ON r.rated_by_user_id = u1.user_id
       JOIN users u2 ON r.rated_user_id = u2.user_id
       WHERE r.trip_id = $1`,
      [tripId]
    );
    return result.rows;
  }

  static async findByUserId(userId) {
    const result = await pool.query(
      `SELECT r.*, u.name as rated_by_name
       FROM ratings r
       JOIN users u ON r.rated_by_user_id = u.user_id
       WHERE r.rated_user_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );
    return result.rows;
  }
}

module.exports = Rating;
