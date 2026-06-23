const express = require('express');
const router = express.Router();
const rentalController = require('../controllers/rentalController');
const { authenticateToken, authorize } = require('../middleware/auth');

router.get('/', authenticateToken, rentalController.listRentals);
router.post('/', authenticateToken, authorize('ADMIN'), rentalController.createRental);
router.put('/:rentalId', authenticateToken, authorize('ADMIN'), rentalController.updateRental);

module.exports = router;
