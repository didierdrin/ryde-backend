const RentalVehicle = require('../models/RentalVehicle');

exports.listRentals = async (req, res) => {
  try {
    const availableOnly = req.query.all !== 'true' || req.user?.userType !== 'ADMIN';
    const vehicles = await RentalVehicle.findAll({ availableOnly });
    res.json({ vehicles });
  } catch (error) {
    console.error('List rentals error:', error);
    res.status(500).json({ error: 'Failed to fetch rental vehicles', details: error.message });
  }
};

exports.createRental = async (req, res) => {
  try {
    const { make, model, year, color, vehicleType, dailyRate, imageUrl, description } = req.body;

    if (!make || !model || !year || !color || !dailyRate || !imageUrl) {
      return res.status(400).json({
        error: 'make, model, year, color, dailyRate, and imageUrl are required',
      });
    }

    const vehicle = await RentalVehicle.create(
      {
        make,
        model,
        year: Number(year),
        color,
        vehicleType: vehicleType || 'SEDAN',
        dailyRate: Number(dailyRate),
        imageUrl,
        description,
      },
      req.user.userId
    );

    res.status(201).json({ message: 'Rental vehicle added', vehicle });
  } catch (error) {
    console.error('Create rental error:', error);
    res.status(500).json({ error: 'Failed to create rental vehicle', details: error.message });
  }
};

exports.updateRental = async (req, res) => {
  try {
    const { rentalId } = req.params;
    const updates = {};
    const fields = ['make', 'model', 'year', 'color', 'vehicleType', 'dailyRate', 'imageUrl', 'description', 'isAvailable'];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (updates.year) updates.year = Number(updates.year);
    if (updates.dailyRate) updates.dailyRate = Number(updates.dailyRate);

    const vehicle = await RentalVehicle.update(rentalId, updates);
    if (!vehicle) {
      return res.status(404).json({ error: 'Rental vehicle not found' });
    }

    res.json({ message: 'Rental vehicle updated', vehicle });
  } catch (error) {
    console.error('Update rental error:', error);
    res.status(500).json({ error: 'Failed to update rental vehicle', details: error.message });
  }
};
