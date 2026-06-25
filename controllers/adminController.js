const pool = require('../config/database');
const { formatDriverProfile, formatPassengerProfile } = require('../utils/profileFormat');

exports.listDrivers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.*, u.name, u.email, u.phone_number, u.profile_picture_url,
        v.vehicle_id, v.registration_number, v.make, v.model, v.year, v.color,
        v.vehicle_type, v.image_url as vehicle_image_url
       FROM drivers d
       JOIN users u ON d.user_id = u.user_id
       LEFT JOIN vehicles v ON v.driver_id = d.driver_id
       WHERE u.deleted_at IS NULL
       ORDER BY u.name`
    );

    const drivers = result.rows.map((row) =>
      formatDriverProfile(row, row.vehicle_id
        ? {
            vehicle_id: row.vehicle_id,
            registration_number: row.registration_number,
            make: row.make,
            model: row.model,
            year: row.year,
            color: row.color,
            vehicle_type: row.vehicle_type,
            image_url: row.vehicle_image_url,
          }
        : null)
    );

    res.json({ drivers });
  } catch (error) {
    console.error('Admin list drivers error:', error);
    res.status(500).json({ error: 'Failed to fetch drivers', details: error.message });
  }
};

exports.listPassengers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, u.name, u.email, u.phone_number, u.profile_picture_url
       FROM passengers p
       JOIN users u ON p.user_id = u.user_id
       WHERE u.deleted_at IS NULL
       ORDER BY u.name`
    );

    res.json({ passengers: result.rows.map(formatPassengerProfile) });
  } catch (error) {
    console.error('Admin list passengers error:', error);
    res.status(500).json({ error: 'Failed to fetch passengers', details: error.message });
  }
};

exports.updateDriverVerification = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['PENDING', 'APPROVED', 'REJECTED'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid verification status' });
    }

    const result = await pool.query(
      `UPDATE drivers SET verification_status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE driver_id = $2 RETURNING *`,
      [status, req.params.driverId]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json({ message: 'Driver verification updated', driver: result.rows[0] });
  } catch (error) {
    console.error('Admin update driver verification error:', error);
    res.status(500).json({ error: 'Failed to update driver', details: error.message });
  }
};
