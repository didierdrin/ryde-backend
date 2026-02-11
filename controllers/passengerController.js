const Passenger = require('../models/Passenger');
const User = require('../models/User');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const passenger = await Passenger.findByUserId(req.user.userId);
    if (!passenger) {
      return res.status(404).json({ error: 'Passenger profile not found' });
    }

    res.json({ passenger });
  } catch (error) {
    console.error('Get passenger profile error:', error);
    res.status(500).json({ error: 'Failed to fetch passenger profile', details: error.message });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const user = await User.findById(req.user.userId);
    const passenger = await Passenger.findByUserId(req.user.userId);
    
    if (!passenger) {
      return res.status(404).json({ error: 'Passenger profile not found' });
    }

    const updated = await Passenger.updateLocation(passenger.passenger_id, latitude, longitude);
    res.json({ message: 'Location updated', passenger: updated });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ error: 'Failed to update location', details: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const passenger = await Passenger.findByUserId(req.user.userId);
    
    if (!passenger) {
      return res.status(404).json({ error: 'Passenger profile not found' });
    }

    const updates = {};
    if (req.body.paymentMethod) updates.paymentMethod = req.body.paymentMethod;

    const updated = await Passenger.update(passenger.passenger_id, updates);
    res.json({ message: 'Profile updated', passenger: updated });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile', details: error.message });
  }
};
