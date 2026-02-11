const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const { authenticateToken, authorize } = require('../middleware/auth');

/**
 * @swagger
 * /api/trips:
 *   post:
 *     summary: Request a new trip (Passenger only)
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pickupLatitude
 *               - pickupLongitude
 *               - pickupAddress
 *               - destinationLatitude
 *               - destinationLongitude
 *               - destinationAddress
 *               - distance
 *               - fare
 *             properties:
 *               pickupLatitude:
 *                 type: number
 *                 format: float
 *                 example: -1.9441
 *               pickupLongitude:
 *                 type: number
 *                 format: float
 *                 example: 30.0619
 *               pickupAddress:
 *                 type: string
 *                 example: Kigali City Center
 *               destinationLatitude:
 *                 type: number
 *                 format: float
 *                 example: -1.9500
 *               destinationLongitude:
 *                 type: number
 *                 format: float
 *                 example: 30.0700
 *               destinationAddress:
 *                 type: string
 *                 example: Kigali Airport
 *               distance:
 *                 type: number
 *                 format: float
 *                 example: 5.5
 *               fare:
 *                 type: number
 *                 format: float
 *                 example: 2500
 *     responses:
 *       201:
 *         description: Trip requested successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 trip:
 *                   $ref: '#/components/schemas/Trip'
 */
router.post('/', authenticateToken, authorize('PASSENGER'), tripController.requestTrip);

/**
 * @swagger
 * /api/trips/my-trips:
 *   get:
 *     summary: Get user's trips
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [REQUESTED, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED]
 *         description: Filter trips by status
 *     responses:
 *       200:
 *         description: List of trips
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 trips:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Trip'
 */
router.get('/my-trips', authenticateToken, tripController.getMyTrips);

/**
 * @swagger
 * /api/trips/available:
 *   get:
 *     summary: Get available trips for drivers
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *           format: float
 *         description: Driver's current latitude
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *           format: float
 *         description: Driver's current longitude
 *     responses:
 *       200:
 *         description: List of available trips
 */
router.get('/available', authenticateToken, authorize('DRIVER'), tripController.getAvailableTrips);

/**
 * @swagger
 * /api/trips/{tripId}:
 *   get:
 *     summary: Get trip details by ID
 *     tags: [Trips]
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
 *         description: Trip details
 *       404:
 *         description: Trip not found
 */
router.get('/:tripId', authenticateToken, tripController.getTripById);

/**
 * @swagger
 * /api/trips/{tripId}/accept:
 *   post:
 *     summary: Accept a trip (Driver only)
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trip accepted successfully
 *       400:
 *         description: Trip not available or already accepted
 */
router.post('/:tripId/accept', authenticateToken, authorize('DRIVER'), tripController.acceptTrip);

/**
 * @swagger
 * /api/trips/{tripId}/start:
 *   post:
 *     summary: Start a trip (Driver only)
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trip started successfully
 */
router.post('/:tripId/start', authenticateToken, authorize('DRIVER'), tripController.startTrip);

/**
 * @swagger
 * /api/trips/{tripId}/complete:
 *   post:
 *     summary: Complete a trip (Driver only)
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               duration:
 *                 type: integer
 *                 description: Trip duration in minutes
 *                 example: 15
 *     responses:
 *       200:
 *         description: Trip completed successfully
 */
router.post('/:tripId/complete', authenticateToken, authorize('DRIVER'), tripController.completeTrip);

/**
 * @swagger
 * /api/trips/{tripId}/cancel:
 *   post:
 *     summary: Cancel a trip
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trip cancelled successfully
 */
router.post('/:tripId/cancel', authenticateToken, tripController.cancelTrip);

module.exports = router;
