const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class AuctionListing {
  static format(row) {
    if (!row) return null;
    return {
      id: row.listing_id,
      userId: row.user_id,
      sellerName: row.seller_name,
      listingType: row.listing_type,
      title: row.title,
      description: row.description,
      make: row.make,
      model: row.model,
      year: row.year,
      price: Number(row.price),
      imageUrl: row.image_url,
      status: row.status,
      createdAt: row.created_at,
    };
  }

  static async findAll({ listingType, status = 'ACTIVE' } = {}) {
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (status) {
      conditions.push(`a.status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }

    if (listingType) {
      conditions.push(`a.listing_type = $${paramCount}`);
      values.push(listingType.toUpperCase());
      paramCount++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT a.*, u.name AS seller_name
       FROM auction_listings a
       JOIN users u ON a.user_id = u.user_id
       ${where}
       ORDER BY a.created_at DESC`,
      values
    );
    return result.rows.map(AuctionListing.format);
  }

  static async findById(listingId) {
    const result = await pool.query(
      `SELECT a.*, u.name AS seller_name
       FROM auction_listings a
       JOIN users u ON a.user_id = u.user_id
       WHERE a.listing_id = $1`,
      [listingId]
    );
    return AuctionListing.format(result.rows[0]);
  }

  static async create(userId, data) {
    const listingId = uuidv4();
    const result = await pool.query(
      `INSERT INTO auction_listings
        (listing_id, user_id, listing_type, title, description, make, model, year, price, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        listingId,
        userId,
        data.listingType.toUpperCase(),
        data.title,
        data.description || null,
        data.make || null,
        data.model || null,
        data.year || null,
        data.price,
        data.imageUrl || null,
      ]
    );
    const row = result.rows[0];
    row.seller_name = null;
    return AuctionListing.format(row);
  }

  static async updateStatus(listingId, status) {
    const result = await pool.query(
      `UPDATE auction_listings SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE listing_id = $2 RETURNING *`,
      [status, listingId]
    );
    return AuctionListing.format(result.rows[0]);
  }

  static async update(listingId, updates) {
    const fieldMap = {
      listingType: 'listing_type',
      title: 'title',
      description: 'description',
      make: 'make',
      model: 'model',
      year: 'year',
      price: 'price',
      imageUrl: 'image_url',
      status: 'status',
    };

    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined && fieldMap[key]) {
        let value = updates[key];
        if (key === 'listingType') value = String(value).toUpperCase();
        fields.push(`${fieldMap[key]} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) return null;

    values.push(listingId);
    const result = await pool.query(
      `UPDATE auction_listings SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE listing_id = $${paramCount} RETURNING *`,
      values
    );
    const row = result.rows[0];
    if (!row) return null;
    const withSeller = await pool.query(
      `SELECT a.*, u.name AS seller_name FROM auction_listings a
       JOIN users u ON a.user_id = u.user_id WHERE a.listing_id = $1`,
      [listingId]
    );
    return AuctionListing.format(withSeller.rows[0]);
  }
}

module.exports = AuctionListing;
