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
    const {
      make,
      model,
      year,
      color,
      vehicleType,
      dailyRate,
      dailyRateWithDriver,
      dailyRateWithoutDriver,
      imageUrl,
      description,
      pickupLocation,
      transmission,
      fuelType,
      ownerName,
      seats,
    } = req.body;

    const withoutDriver = dailyRateWithoutDriver != null ? Number(dailyRateWithoutDriver) : Number(dailyRate);
    const withDriver = Number(dailyRateWithDriver);

    if (
      !make ||
      !model ||
      !year ||
      !color ||
      !imageUrl ||
      !pickupLocation ||
      !ownerName ||
      !seats ||
      !transmission ||
      !fuelType ||
      !withoutDriver ||
      !withDriver
    ) {
      return res.status(400).json({
        error:
          'make, model, year, color, imageUrl, pickupLocation, ownerName, seats, transmission, fuelType, dailyRateWithDriver, and dailyRateWithoutDriver are required',
      });
    }

    const vehicle = await RentalVehicle.create(
      {
        make,
        model,
        year: Number(year),
        color,
        vehicleType: vehicleType || 'SEDAN',
        dailyRate: withoutDriver,
        dailyRateWithDriver: withDriver,
        dailyRateWithoutDriver: withoutDriver,
        imageUrl,
        description,
        pickupLocation,
        transmission,
        fuelType,
        ownerName,
        seats: Number(seats),
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
    const fields = [
      'make',
      'model',
      'year',
      'color',
      'vehicleType',
      'dailyRate',
      'dailyRateWithDriver',
      'dailyRateWithoutDriver',
      'imageUrl',
      'description',
      'pickupLocation',
      'transmission',
      'fuelType',
      'ownerName',
      'seats',
      'isAvailable',
    ];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (updates.year !== undefined) updates.year = Number(updates.year);
    if (updates.dailyRate !== undefined) updates.dailyRate = Number(updates.dailyRate);
    if (updates.dailyRateWithDriver !== undefined) updates.dailyRateWithDriver = Number(updates.dailyRateWithDriver);
    if (updates.dailyRateWithoutDriver !== undefined) updates.dailyRateWithoutDriver = Number(updates.dailyRateWithoutDriver);
    if (updates.seats !== undefined) updates.seats = Number(updates.seats);
    if (updates.dailyRateWithoutDriver !== undefined) {
      updates.dailyRate = updates.dailyRateWithoutDriver;
    }

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
