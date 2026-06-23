const Mechanic = require('../models/Mechanic');

exports.listMechanics = async (req, res) => {
  try {
    const latitude = parseFloat(req.query.latitude);
    const longitude = parseFloat(req.query.longitude);
    const radius = parseFloat(req.query.radius) || 15;

    let mechanics;
    if (!Number.isNaN(latitude) && !Number.isNaN(longitude)) {
      mechanics = await Mechanic.findNearby(latitude, longitude, radius);
    } else {
      mechanics = await Mechanic.findAll();
    }

    res.json({ mechanics });
  } catch (error) {
    console.error('List mechanics error:', error);
    res.status(500).json({ error: 'Failed to fetch mechanics', details: error.message });
  }
};

exports.createMechanic = async (req, res) => {
  try {
    const { name, address, latitude, longitude, phoneNumber, specialty, rating } = req.body;

    if (!name || !address || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'name, address, latitude, and longitude are required' });
    }

    const mechanic = await Mechanic.create({
      name,
      address,
      latitude: Number(latitude),
      longitude: Number(longitude),
      phoneNumber,
      specialty,
      rating: rating ? Number(rating) : undefined,
    });

    res.status(201).json({ message: 'Mechanic added', mechanic });
  } catch (error) {
    console.error('Create mechanic error:', error);
    res.status(500).json({ error: 'Failed to create mechanic', details: error.message });
  }
};
