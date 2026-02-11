const Rating = require('../models/Rating');
const Trip = require('../models/Trip');
const Passenger = require('../models/Passenger');
const Driver = require('../models/Driver');

exports.createRating = async (req, res) => {
  try {
    const { tripId, score, comment, ratingType } = req.body;

    if (!tripId || !score || !ratingType) {
      return res.status(400).json({ error: 'Trip ID, score, and rating type are required' });
    }

    if (score < 1 || score > 5) {
      return res.status(400).json({ error: 'Score must be between 1 and 5' });
    }

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Determine rated user based on rating type
    let ratedUserId;
    if (ratingType === 'PASSENGER_TO_DRIVER') {
      ratedUserId = trip.driver_user_id;
    } else {
      ratedUserId = trip.passenger_user_id;
    }

    const rating = await Rating.create({
      tripId,
      ratedByUserId: req.user.userId,
      ratedUserId,
      score,
      comment,
      ratingType
    });

    // Update ratings
    if (ratingType === 'PASSENGER_TO_DRIVER') {
      await Driver.updateRating(trip.driver_id);
    } else {
      await Passenger.updateRating(trip.passenger_id);
    }

    res.status(201).json({ message: 'Rating created successfully', rating });
  } catch (error) {
    console.error('Create rating error:', error);
    res.status(500).json({ error: 'Failed to create rating', details: error.message });
  }
};

exports.getRatingsByTrip = async (req, res) => {
  try {
    const ratings = await Rating.findByTripId(req.params.tripId);
    res.json({ ratings });
  } catch (error) {
    console.error('Get ratings error:', error);
    res.status(500).json({ error: 'Failed to fetch ratings', details: error.message });
  }
};

exports.getRatingsByUser = async (req, res) => {
  try {
    const ratings = await Rating.findByUserId(req.params.userId);
    res.json({ ratings });
  } catch (error) {
    console.error('Get user ratings error:', error);
    res.status(500).json({ error: 'Failed to fetch ratings', details: error.message });
  }
};
