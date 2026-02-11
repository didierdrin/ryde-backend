const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, ratingController.createRating);
router.get('/trip/:tripId', authenticateToken, ratingController.getRatingsByTrip);
router.get('/user/:userId', authenticateToken, ratingController.getRatingsByUser);

module.exports = router;
