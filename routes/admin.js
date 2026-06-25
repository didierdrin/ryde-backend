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
router.put('/trips/:tripId', authenticateToken, authorize('ADMIN'), adminController.updateTrip);

module.exports = router;
