const express = require('express');
const router = express.Router();
const passengerController = require('../controllers/passengerController');
const { authenticateToken, authorize } = require('../middleware/auth');

router.get('/profile', authenticateToken, authorize('PASSENGER'), passengerController.getProfile);
router.put('/location', authenticateToken, authorize('PASSENGER'), passengerController.updateLocation);
router.put('/profile', authenticateToken, authorize('PASSENGER'), passengerController.updateProfile);

module.exports = router;
