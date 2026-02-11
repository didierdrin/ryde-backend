const express = require('express');
const router = express.Router();
const passengerController = require('../controllers/passengerController');
const { authenticateToken, authorize } = require('../middleware/auth');

/**
 * @swagger
 * /api/passengers/profile:
 *   get:
 *     summary: Get passenger profile
 *     tags: [Passengers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Passenger profile retrieved successfully
 *       404:
 *         description: Passenger profile not found
 */
router.get('/profile', authenticateToken, authorize('PASSENGER'), passengerController.getProfile);

/**
 * @swagger
 * /api/passengers/location:
 *   put:
 *     summary: Update passenger location
 *     tags: [Passengers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *             properties:
 *               latitude:
 *                 type: number
 *                 format: float
 *                 example: -1.9441
 *               longitude:
 *                 type: number
 *                 format: float
 *                 example: 30.0619
 *     responses:
 *       200:
 *         description: Location updated successfully
 *       400:
 *         description: Invalid request
 */
router.put('/location', authenticateToken, authorize('PASSENGER'), passengerController.updateLocation);

/**
 * @swagger
 * /api/passengers/profile:
 *   put:
 *     summary: Update passenger profile
 *     tags: [Passengers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentMethod:
 *                 type: string
 *                 enum: [MTN_MOMO, AIRTEL_MONEY, CASH]
 *                 example: MTN_MOMO
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/profile', authenticateToken, authorize('PASSENGER'), passengerController.updateProfile);

module.exports = router;
