const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * /api/ratings:
 *   post:
 *     summary: Create a rating
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tripId
 *               - score
 *               - ratingType
 *             properties:
 *               tripId:
 *                 type: string
 *                 description: Trip identifier
 *               score:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               comment:
 *                 type: string
 *                 example: Great driver!
 *               ratingType:
 *                 type: string
 *                 enum: [PASSENGER_TO_DRIVER, DRIVER_TO_PASSENGER]
 *                 example: PASSENGER_TO_DRIVER
 *     responses:
 *       201:
 *         description: Rating created successfully
 *       400:
 *         description: Invalid request
 */
router.post('/', authenticateToken, ratingController.createRating);

/**
 * @swagger
 * /api/ratings/trip/{tripId}:
 *   get:
 *     summary: Get ratings for a trip
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *         description: Trip identifier
 *     responses:
 *       200:
 *         description: List of ratings for the trip
 */
router.get('/trip/:tripId', authenticateToken, ratingController.getRatingsByTrip);

/**
 * @swagger
 * /api/ratings/user/{userId}:
 *   get:
 *     summary: Get ratings for a user
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User identifier
 *     responses:
 *       200:
 *         description: List of ratings for the user
 */
router.get('/user/:userId', authenticateToken, ratingController.getRatingsByUser);

module.exports = router;
