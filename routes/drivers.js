const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const { authenticateToken, authorize } = require('../middleware/auth');

router.get('/profile', authenticateToken, authorize('DRIVER'), driverController.getProfile);
router.put('/location', authenticateToken, authorize('DRIVER'), driverController.updateLocation);
router.put('/availability', authenticateToken, authorize('DRIVER'), driverController.toggleAvailability);
router.put('/profile', authenticateToken, authorize('DRIVER'), driverController.updateProfile);
router.post('/vehicle', authenticateToken, authorize('DRIVER'), driverController.registerVehicle);
router.put('/vehicle', authenticateToken, authorize('DRIVER'), driverController.updateVehicle);

module.exports = router;
