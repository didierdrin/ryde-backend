const Trip = require('../models/Trip');
const Passenger = require('../models/Passenger');
const Driver = require('../models/Driver');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');

exports.requestTrip = async (req, res) => {
  try {
    const {
      pickupLatitude,
      pickupLongitude,
      pickupAddress,
      destinationLatitude,
      destinationLongitude,
      destinationAddress,
      distance,
      fare,
      serviceType
    } = req.body;

    if (!pickupLatitude || !pickupLongitude || !pickupAddress ||
        !destinationLatitude || !destinationLongitude || !destinationAddress ||
        !distance || !fare) {
      return res.status(400).json({ error: 'All trip fields are required' });
    }

    const passenger = await Passenger.findByUserId(req.user.userId);
    if (!passenger) {
      return res.status(404).json({ error: 'Passenger profile not found' });
    }

    const trip = await Trip.create(passenger.passenger_id, {
      pickupLatitude,
      pickupLongitude,
      pickupAddress,
      destinationLatitude,
      destinationLongitude,
      destinationAddress,
      distance,
      fare,
      serviceType: (serviceType && String(serviceType).trim()) ? String(serviceType).trim() : 'Taxi/Cab'
    });

    // Create payment record
    await Payment.create(trip.trip_id, {
      amount: fare,
      paymentMethod: passenger.payment_method || 'MTN_MOMO',
      paymentStatus: 'PENDING'
    });

    // Notify nearby drivers (non-blocking: do not fail the request if notify fails)
    try {
      const nearbyDrivers = await Driver.findAvailableDrivers(pickupLatitude, pickupLongitude);
      for (const driver of nearbyDrivers) {
        await Notification.create(driver.user_id, {
          title: 'New Trip Request',
          message: `A passenger has requested a trip from ${pickupAddress}`,
          notificationType: 'TRIP_REQUEST'
        });
      }
    } catch (notifyErr) {
      console.error('Notify drivers error (trip still created):', notifyErr);
    }

    res.status(201).json({ message: 'Trip requested successfully', trip });
  } catch (error) {
    console.error('Request trip error:', error);
    res.status(500).json({ error: 'Failed to request trip', details: error.message });
  }
};

exports.getMyTrips = async (req, res) => {
  try {
    const userType = req.user.userType;
    let trips;

    if (userType === 'PASSENGER') {
      const passenger = await Passenger.findByUserId(req.user.userId);
      if (!passenger) {
        return res.status(404).json({ error: 'Passenger profile not found' });
      }
      trips = await Trip.findByPassengerId(passenger.passenger_id, req.query.status);
    } else if (userType === 'DRIVER') {
      const driver = await Driver.findByUserId(req.user.userId);
      if (!driver) {
        return res.status(404).json({ error: 'Driver profile not found' });
      }
      trips = await Trip.findByDriverId(driver.driver_id, req.query.status);
    } else if (userType === 'ADMIN') {
      trips = await Trip.findAll(req.query.status);
    } else {
      return res.status(403).json({ error: 'Invalid user type' });
    }

    res.json({ trips });
  } catch (error) {
    console.error('Get trips error:', error);
    res.status(500).json({ error: 'Failed to fetch trips', details: error.message });
  }
};

exports.getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    res.json({ trip });
  } catch (error) {
    console.error('Get trip error:', error);
    res.status(500).json({ error: 'Failed to fetch trip', details: error.message });
  }
};

exports.getTripLocations = async (req, res) => {
  try {
    const row = await Trip.findLocationsByTripId(req.params.tripId);
    if (!row) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const userId = req.user.userId;
    const userType = req.user.userType;
    const isParticipant =
      row.passenger_user_id === userId ||
      row.driver_user_id === userId;
    const isAdmin = userType === 'ADMIN';

    if (!isParticipant && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to view trip locations' });
    }

    const activeStatuses = ['REQUESTED', 'ACCEPTED', 'IN_PROGRESS'];
    if (!activeStatuses.includes(row.status)) {
      return res.json({
        tripId: row.trip_id,
        status: row.status,
        driver: null,
        passenger: null,
      });
    }

    const driver =
      row.driver_id &&
      row.driver_latitude != null &&
      row.driver_longitude != null
        ? {
            latitude: parseFloat(row.driver_latitude),
            longitude: parseFloat(row.driver_longitude),
            name: row.driver_name,
            updatedAt: row.driver_location_updated_at,
          }
        : null;

    const passenger =
      row.passenger_latitude != null && row.passenger_longitude != null
        ? {
            latitude: parseFloat(row.passenger_latitude),
            longitude: parseFloat(row.passenger_longitude),
            name: row.passenger_name,
            updatedAt: row.passenger_location_updated_at,
          }
        : null;

    res.json({
      tripId: row.trip_id,
      status: row.status,
      driver,
      passenger,
    });
  } catch (error) {
    console.error('Get trip locations error:', error);
    res.status(500).json({ error: 'Failed to fetch trip locations', details: error.message });
  }
};

exports.getAvailableTrips = async (req, res) => {
  try {
    const driver = await Driver.findByUserId(req.user.userId);
    if (!driver) {
      return res.status(404).json({ error: 'Driver profile not found' });
    }

    if (!driver.is_available) {
      return res.status(400).json({ error: 'Driver is not available' });
    }

    const { latitude, longitude } = req.query;
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const trips = await Trip.findRequestedTrips(parseFloat(latitude), parseFloat(longitude));
    res.json({ trips });
  } catch (error) {
    console.error('Get available trips error:', error);
    res.status(500).json({ error: 'Failed to fetch available trips', details: error.message });
  }
};

exports.acceptTrip = async (req, res) => {
  try {
    const driver = await Driver.findByUserId(req.user.userId);
    if (!driver) {
      return res.status(404).json({ error: 'Driver profile not found' });
    }

    if (!driver.is_available) {
      return res.status(400).json({ error: 'Driver is not available' });
    }

    const trip = await Trip.acceptTrip(req.params.tripId, driver.driver_id);
    if (!trip) {
      return res.status(400).json({ error: 'Trip not available or already accepted' });
    }

    // Notify passenger
    const tripDetails = await Trip.findById(req.params.tripId);
    await Notification.create(tripDetails.passenger_user_id, {
      title: 'Trip Accepted',
      message: `Your trip request has been accepted by ${tripDetails.driver_name || 'a driver'}`,
      notificationType: 'TRIP_ACCEPTED'
    });

    res.json({ message: 'Trip accepted successfully', trip });
  } catch (error) {
    console.error('Accept trip error:', error);
    res.status(500).json({ error: 'Failed to accept trip', details: error.message });
  }
};

exports.startTrip = async (req, res) => {
  try {
    const driver = await Driver.findByUserId(req.user.userId);
    if (!driver) {
      return res.status(404).json({ error: 'Driver profile not found' });
    }

    const trip = await Trip.startTrip(req.params.tripId);
    if (!trip) {
      return res.status(400).json({ error: 'Trip cannot be started' });
    }

    // Notify passenger
    const tripDetails = await Trip.findById(req.params.tripId);
    await Notification.create(tripDetails.passenger_user_id, {
      title: 'Trip Started',
      message: 'Your trip has started',
      notificationType: 'TRIP_ACCEPTED'
    });

    res.json({ message: 'Trip started successfully', trip });
  } catch (error) {
    console.error('Start trip error:', error);
    res.status(500).json({ error: 'Failed to start trip', details: error.message });
  }
};

exports.completeTrip = async (req, res) => {
  try {
    const { duration } = req.body;
    const driver = await Driver.findByUserId(req.user.userId);
    if (!driver) {
      return res.status(404).json({ error: 'Driver profile not found' });
    }

    const trip = await Trip.completeTrip(req.params.tripId, duration);
    if (!trip) {
      return res.status(400).json({ error: 'Trip cannot be completed' });
    }

    // Update driver earnings
    const payment = await Payment.findByTripId(req.params.tripId);
    if (payment && payment.payment_status === 'COMPLETED') {
      await Driver.addEarnings(driver.driver_id, payment.driver_earnings);
      await Driver.incrementTrips(driver.driver_id);
    }

    // Update passenger trips
    const passenger = await Passenger.findById(trip.passenger_id);
    if (passenger) {
      await Passenger.incrementTrips(trip.passenger_id);
    }

    // Notify passenger
    const tripDetails = await Trip.findById(req.params.tripId);
    await Notification.create(tripDetails.passenger_user_id, {
      title: 'Trip Completed',
      message: 'Your trip has been completed',
      notificationType: 'TRIP_COMPLETED'
    });

    res.json({ message: 'Trip completed successfully', trip });
  } catch (error) {
    console.error('Complete trip error:', error);
    res.status(500).json({ error: 'Failed to complete trip', details: error.message });
  }
};

exports.cancelTrip = async (req, res) => {
  try {
    const trip = await Trip.cancelTrip(req.params.tripId, req.user.userId);
    if (!trip) {
      return res.status(400).json({ error: 'Trip cannot be cancelled' });
    }

    res.json({ message: 'Trip cancelled successfully', trip });
  } catch (error) {
    console.error('Cancel trip error:', error);
    res.status(500).json({ error: 'Failed to cancel trip', details: error.message });
  }
};
