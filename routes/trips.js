const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const { authenticateToken, authorize } = require('../middleware/auth');

router.post('/', authenticateToken, authorize('PASSENGER'), tripController.requestTrip);
router.get('/my-trips', authenticateToken, tripController.getMyTrips);
router.get('/available', authenticateToken, authorize('DRIVER'), tripController.getAvailableTrips);
router.get('/:tripId', authenticateToken, tripController.getTripById);
router.post('/:tripId/accept', authenticateToken, authorize('DRIVER'), tripController.acceptTrip);
router.post('/:tripId/start', authenticateToken, authorize('DRIVER'), tripController.startTrip);
router.post('/:tripId/complete', authenticateToken, authorize('DRIVER'), tripController.completeTrip);
router.post('/:tripId/cancel', authenticateToken, tripController.cancelTrip);

module.exports = router;
