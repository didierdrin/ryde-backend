const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class User {
  static async create(userData) {
    const {
      name,
      email,
      phoneNumber,
      password,
      userType
    } = userData;

    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (user_id, name, email, phone_number, password_hash, user_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING user_id, name, email, phone_number, user_type, registration_date, is_active, created_at`,
      [userId, name, email, phoneNumber, passwordHash, userType]
    );

    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL',
      [email]
    );
    return result.rows[0];
  }

  static async findByPhone(phoneNumber) {
    const result = await pool.query(
      'SELECT * FROM users WHERE phone_number = $1 AND deleted_at IS NULL',
      [phoneNumber]
    );
    return result.rows[0];
  }

  static async findById(userId) {
    const result = await pool.query(
      'SELECT user_id, name, email, phone_number, user_type, registration_date, is_active, last_login, created_at FROM users WHERE user_id = $1 AND deleted_at IS NULL',
      [userId]
    );
    return result.rows[0];
  }

  static async update(userId, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) return null;

    values.push(userId);
    const query = `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE user_id = $${paramCount} AND deleted_at IS NULL RETURNING *`;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async updateLastLogin(userId) {
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1',
      [userId]
    );
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async delete(userId) {
    await pool.query(
      'UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE user_id = $1',
      [userId]
    );
  }
}

module.exports = User;
