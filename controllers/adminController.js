const pool = require('../config/database');
const Driver = require('../models/Driver');
const Passenger = require('../models/Passenger');
const Trip = require('../models/Trip');
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');
const { formatDriverProfile, formatPassengerProfile } = require('../utils/profileFormat');
const { formatTrips, formatTrip } = require('../utils/tripFormat');

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

async function fetchDriverById(driverId) {
  const result = await pool.query(
    `SELECT d.*, u.name, u.email, u.phone_number, u.profile_picture_url,
      v.vehicle_id, v.registration_number, v.make, v.model, v.year, v.color,
      v.vehicle_type, v.image_url as vehicle_image_url
     FROM drivers d
     JOIN users u ON d.user_id = u.user_id
     LEFT JOIN vehicles v ON v.driver_id = d.driver_id
     WHERE d.driver_id = $1`,
    [driverId]
  );
  const row = result.rows[0];
  if (!row) return null;
  return formatDriverProfile(
    row,
    row.vehicle_id
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
      : null
  );
}

exports.updateDriver = async (req, res) => {
  try {
    const { driverId } = req.params;
    const existing = await pool.query('SELECT user_id FROM drivers WHERE driver_id = $1', [driverId]);
    if (!existing.rows[0]) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const { name, email, phoneNumber, licenseNumber, address, bio, yearsExperience, verificationStatus, isAvailable } = req.body;
    const userId = existing.rows[0].user_id;

    const userFields = [];
    const userValues = [];
    let userParam = 1;
    if (name !== undefined) {
      userFields.push(`name = $${userParam++}`);
      userValues.push(name);
    }
    if (email !== undefined) {
      userFields.push(`email = $${userParam++}`);
      userValues.push(email);
    }
    if (phoneNumber !== undefined) {
      userFields.push(`phone_number = $${userParam++}`);
      userValues.push(phoneNumber);
    }
    if (userFields.length) {
      userValues.push(userId);
      await pool.query(
        `UPDATE users SET ${userFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE user_id = $${userParam}`,
        userValues
      );
    }

    const driverUpdates = {};
    if (licenseNumber !== undefined) driverUpdates.licenseNumber = licenseNumber;
    if (address !== undefined) driverUpdates.address = address;
    if (bio !== undefined) driverUpdates.bio = bio;
    if (yearsExperience !== undefined) driverUpdates.yearsExperience = Number(yearsExperience);
    if (verificationStatus !== undefined) driverUpdates.verificationStatus = verificationStatus;
    if (isAvailable !== undefined) driverUpdates.isAvailable = isAvailable;

    if (Object.keys(driverUpdates).length) {
      await Driver.update(driverId, driverUpdates);
    }

    const driver = await fetchDriverById(driverId);
    res.json({ message: 'Driver updated', driver });
  } catch (error) {
    console.error('Admin update driver error:', error);
    res.status(500).json({ error: 'Failed to update driver', details: error.message });
  }
};

async function fetchPassengerById(passengerId) {
  const result = await pool.query(
    `SELECT p.*, u.name, u.email, u.phone_number, u.profile_picture_url
     FROM passengers p
     JOIN users u ON p.user_id = u.user_id
     WHERE p.passenger_id = $1`,
    [passengerId]
  );
  return result.rows[0] ? formatPassengerProfile(result.rows[0]) : null;
}

exports.updatePassenger = async (req, res) => {
  try {
    const { passengerId } = req.params;
    const existing = await pool.query('SELECT user_id FROM passengers WHERE passenger_id = $1', [passengerId]);
    if (!existing.rows[0]) {
      return res.status(404).json({ error: 'Passenger not found' });
    }

    const {
      name,
      email,
      phoneNumber,
      paymentMethod,
      emergencyContactName,
      emergencyContactPhone,
    } = req.body;
    const userId = existing.rows[0].user_id;

    const userFields = [];
    const userValues = [];
    let userParam = 1;
    if (name !== undefined) {
      userFields.push(`name = $${userParam++}`);
      userValues.push(name);
    }
    if (email !== undefined) {
      userFields.push(`email = $${userParam++}`);
      userValues.push(email);
    }
    if (phoneNumber !== undefined) {
      userFields.push(`phone_number = $${userParam++}`);
      userValues.push(phoneNumber);
    }
    if (userFields.length) {
      userValues.push(userId);
      await pool.query(
        `UPDATE users SET ${userFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE user_id = $${userParam}`,
        userValues
      );
    }

    const passengerUpdates = {};
    if (paymentMethod !== undefined) passengerUpdates.paymentMethod = paymentMethod;
    if (emergencyContactName !== undefined) passengerUpdates.emergencyContactName = emergencyContactName;
    if (emergencyContactPhone !== undefined) passengerUpdates.emergencyContactPhone = emergencyContactPhone;

    if (Object.keys(passengerUpdates).length) {
      await Passenger.update(passengerId, passengerUpdates);
    }

    const passenger = await fetchPassengerById(passengerId);
    res.json({ message: 'Passenger updated', passenger });
  } catch (error) {
    console.error('Admin update passenger error:', error);
    res.status(500).json({ error: 'Failed to update passenger', details: error.message });
  }
};

exports.listTrips = async (req, res) => {
  try {
    const activeOnly = req.query.active === 'true';
    const trips = activeOnly
      ? await Trip.findActive()
      : await Trip.findAll(req.query.status || null);
    res.json({ trips: formatTrips(trips) });
  } catch (error) {
    console.error('Admin list trips error:', error);
    res.status(500).json({ error: 'Failed to fetch trips', details: error.message });
  }
};

exports.createTrip = async (req, res) => {
  try {
    const {
      passengerPhone,
      pickupLatitude,
      pickupLongitude,
      pickupAddress,
      destinationLatitude,
      destinationLongitude,
      destinationAddress,
      distance,
      fare,
      serviceType,
    } = req.body;

    if (
      !passengerPhone ||
      !pickupAddress ||
      !destinationAddress ||
      pickupLatitude == null ||
      pickupLongitude == null ||
      destinationLatitude == null ||
      destinationLongitude == null ||
      !fare
    ) {
      return res.status(400).json({
        error:
          'passengerPhone, pickupAddress, destinationAddress, coordinates, and fare are required',
      });
    }

    const passengerResult = await pool.query(
      `SELECT p.passenger_id
       FROM passengers p
       JOIN users u ON p.user_id = u.user_id
       WHERE u.phone_number = $1 AND u.deleted_at IS NULL
       LIMIT 1`,
      [passengerPhone]
    );

    if (!passengerResult.rows[0]) {
      return res.status(404).json({
        error: 'No passenger found with that phone number. Register the passenger first.',
      });
    }

    const passengerId = passengerResult.rows[0].passenger_id;
    const trip = await Trip.create(passengerId, {
      pickupLatitude: Number(pickupLatitude),
      pickupLongitude: Number(pickupLongitude),
      pickupAddress,
      destinationLatitude: Number(destinationLatitude),
      destinationLongitude: Number(destinationLongitude),
      destinationAddress,
      distance: distance != null ? Number(distance) : 5,
      fare: Number(fare),
      serviceType: serviceType || 'Taxi/Cab',
    });

    await Payment.create(trip.trip_id, {
      amount: Number(fare),
      paymentMethod: 'MTN_MOMO',
      paymentStatus: 'PENDING',
    });

    const fullTrip = await Trip.findById(trip.trip_id);
    res.status(201).json({ message: 'Trip created', trip: formatTrip(fullTrip) });
  } catch (error) {
    console.error('Admin create trip error:', error);
    res.status(500).json({ error: 'Failed to create trip', details: error.message });
  }
};

exports.listSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.findAll();
    res.json({ subscriptions });
  } catch (error) {
    console.error('Admin list subscriptions error:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions', details: error.message });
  }
};

exports.createSubscription = async (req, res) => {
  try {
    const { driverId, tier, startDate, endDate, commissionRate } = req.body;
    if (!driverId || !tier || !startDate || !endDate) {
      return res.status(400).json({ error: 'driverId, tier, startDate, and endDate are required' });
    }

    const driver = await pool.query('SELECT driver_id FROM drivers WHERE driver_id = $1', [driverId]);
    if (!driver.rows[0]) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const subscription = await Subscription.create({
      driverId,
      tier,
      startDate,
      endDate,
      commissionRate,
    });
    res.status(201).json({ message: 'Subscription created', subscription });
  } catch (error) {
    console.error('Admin create subscription error:', error);
    res.status(500).json({ error: 'Failed to create subscription', details: error.message });
  }
};

exports.cancelSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.deactivate(req.params.subscriptionId);
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    res.json({ message: 'Subscription cancelled', subscription });
  } catch (error) {
    console.error('Admin cancel subscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription', details: error.message });
  }
};

exports.updateTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const allowedStatuses = ['REQUESTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    const updates = {};

    if (req.body.status !== undefined) {
      if (!allowedStatuses.includes(req.body.status)) {
        return res.status(400).json({ error: 'Invalid trip status' });
      }
      updates.status = req.body.status;
    }
    if (req.body.pickupAddress !== undefined) updates.pickupAddress = req.body.pickupAddress;
    if (req.body.destinationAddress !== undefined) updates.destinationAddress = req.body.destinationAddress;
    if (req.body.fare !== undefined) updates.fare = Number(req.body.fare);
    if (req.body.distance !== undefined) updates.distance = Number(req.body.distance);

    const trip = await Trip.update(tripId, updates);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const fullTrip = await Trip.findById(tripId);
    res.json({ message: 'Trip updated', trip: formatTrip(fullTrip) });
  } catch (error) {
    console.error('Admin update trip error:', error);
    res.status(500).json({ error: 'Failed to update trip', details: error.message });
  }
};
