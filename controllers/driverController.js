const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const { formatDriverForPassenger } = require('../utils/driverDetails');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const driver = await Driver.findByUserId(req.user.userId);
    if (!driver) {
      return res.status(404).json({ error: 'Driver profile not found' });
    }

    const vehicle = await Vehicle.findByDriverId(driver.driver_id);

    res.json({ driver, vehicle });
  } catch (error) {
    console.error('Get driver profile error:', error);
    res.status(500).json({ error: 'Failed to fetch driver profile', details: error.message });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const driver = await Driver.findByUserId(req.user.userId);
    if (!driver) {
      return res.status(404).json({ error: 'Driver profile not found' });
    }

    const updated = await Driver.updateLocation(driver.driver_id, latitude, longitude);
    res.json({ message: 'Location updated', driver: updated });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ error: 'Failed to update location', details: error.message });
  }
};

exports.toggleAvailability = async (req, res) => {
  try {
    const { isAvailable } = req.body;

    if (typeof isAvailable !== 'boolean') {
      return res.status(400).json({ error: 'isAvailable must be a boolean' });
    }

    const driver = await Driver.findByUserId(req.user.userId);
    if (!driver) {
      return res.status(404).json({ error: 'Driver profile not found' });
    }

    const updated = await Driver.toggleAvailability(driver.driver_id, isAvailable);
    res.json({ message: 'Availability updated', driver: updated });
  } catch (error) {
    console.error('Toggle availability error:', error);
    res.status(500).json({ error: 'Failed to update availability', details: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const driver = await Driver.findByUserId(req.user.userId);
    if (!driver) {
      return res.status(404).json({ error: 'Driver profile not found' });
    }

    const updates = {};
    if (req.body.licenseNumber) updates.licenseNumber = req.body.licenseNumber;
    if (req.body.address !== undefined) updates.address = req.body.address;
    if (req.body.dateOfBirth) updates.dateOfBirth = req.body.dateOfBirth;
    if (req.body.licenseIssuedDate) updates.licenseIssuedDate = req.body.licenseIssuedDate;

    const updated = await Driver.update(driver.driver_id, updates);
    res.json({ message: 'Profile updated', driver: updated });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile', details: error.message });
  }
};

exports.registerVehicle = async (req, res) => {
  try {
    const { registrationNumber, make, model, year, color, vehicleType } = req.body;

    if (!registrationNumber || !make || !model || !year || !color || !vehicleType) {
      return res.status(400).json({ error: 'All vehicle fields are required' });
    }

    const driver = await Driver.findByUserId(req.user.userId);
    if (!driver) {
      return res.status(404).json({ error: 'Driver profile not found' });
    }

    // Check if vehicle already exists
    const existingVehicle = await Vehicle.findByDriverId(driver.driver_id);
    if (existingVehicle) {
      return res.status(400).json({ error: 'Vehicle already registered' });
    }

    const vehicle = await Vehicle.create(driver.driver_id, {
      registrationNumber,
      make,
      model,
      year,
      color,
      vehicleType
    });

    res.status(201).json({ message: 'Vehicle registered successfully', vehicle });
  } catch (error) {
    console.error('Register vehicle error:', error);
    res.status(500).json({ error: 'Failed to register vehicle', details: error.message });
  }
};

exports.getNearbyDrivers = async (req, res) => {
  try {
    const latitude = parseFloat(req.query.latitude);
    const longitude = parseFloat(req.query.longitude);
    const radius = parseFloat(req.query.radius) || 10;

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return res.status(400).json({ error: 'latitude and longitude query parameters are required' });
    }

    const drivers = await Driver.findAvailableDrivers(latitude, longitude, radius);
    res.json({
      drivers: drivers.map(formatDriverForPassenger),
    });
  } catch (error) {
    console.error('Get nearby drivers error:', error);
    res.status(500).json({ error: 'Failed to fetch nearby drivers', details: error.message });
  }
};

exports.updateVehicle = async (req, res) => {
  try {
    const driver = await Driver.findByUserId(req.user.userId);
    if (!driver) {
      return res.status(404).json({ error: 'Driver profile not found' });
    }

    const vehicle = await Vehicle.findByDriverId(driver.driver_id);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const updates = {};
    if (req.body.make) updates.make = req.body.make;
    if (req.body.model) updates.model = req.body.model;
    if (req.body.year) updates.year = req.body.year;
    if (req.body.color) updates.color = req.body.color;
    if (req.body.vehicleType) updates.vehicleType = req.body.vehicleType;

    const updated = await Vehicle.update(vehicle.vehicle_id, updates);
    res.json({ message: 'Vehicle updated', vehicle: updated });
  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({ error: 'Failed to update vehicle', details: error.message });
  }
};
