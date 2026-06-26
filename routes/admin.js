const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

router.get('/drivers', authenticateToken, authorize('ADMIN'), adminController.listDrivers);
router.get('/passengers', authenticateToken, authorize('ADMIN'), adminController.listPassengers);
router.put(
  '/drivers/:driverId/verification',
  authenticateToken,
  authorize('ADMIN'),
  adminController.updateDriverVerification
);
router.put('/drivers/:driverId', authenticateToken, authorize('ADMIN'), adminController.updateDriver);
router.put('/passengers/:passengerId', authenticateToken, authorize('ADMIN'), adminController.updatePassenger);
router.get('/trips', authenticateToken, authorize('ADMIN'), adminController.listTrips);
router.post('/trips', authenticateToken, authorize('ADMIN'), adminController.createTrip);
router.put('/trips/:tripId', authenticateToken, authorize('ADMIN'), adminController.updateTrip);
router.get('/subscriptions', authenticateToken, authorize('ADMIN'), adminController.listSubscriptions);
router.post('/subscriptions', authenticateToken, authorize('ADMIN'), adminController.createSubscription);
router.delete(
  '/subscriptions/:subscriptionId',
  authenticateToken,
  authorize('ADMIN'),
  adminController.cancelSubscription
);

module.exports = router;
