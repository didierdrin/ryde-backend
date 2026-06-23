const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const { authenticateToken, authorize } = require('../middleware/auth');

/**
 * @swagger
 * /api/drivers/profile:
 *   get:
 *     summary: Get driver profile
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Driver profile retrieved successfully
 *       404:
 *         description: Driver profile not found
 */
router.get('/profile', authenticateToken, authorize('DRIVER'), driverController.getProfile);

router.get('/nearby', authenticateToken, authorize('PASSENGER', 'ADMIN'), driverController.getNearbyDrivers);

/**
 * @swagger
 * /api/drivers/location:
 *   put:
 *     summary: Update driver location
 *     tags: [Drivers]
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
 */
router.put('/location', authenticateToken, authorize('DRIVER'), driverController.updateLocation);

/**
 * @swagger
 * /api/drivers/availability:
 *   put:
 *     summary: Toggle driver availability
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isAvailable
 *             properties:
 *               isAvailable:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Availability updated successfully
 */
router.put('/availability', authenticateToken, authorize('DRIVER'), driverController.toggleAvailability);

/**
 * @swagger
 * /api/drivers/profile:
 *   put:
 *     summary: Update driver profile
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               licenseNumber:
 *                 type: string
 *                 example: DL123456
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/profile', authenticateToken, authorize('DRIVER'), driverController.updateProfile);

/**
 * @swagger
 * /api/drivers/vehicle:
 *   post:
 *     summary: Register a vehicle
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - registrationNumber
 *               - make
 *               - model
 *               - year
 *               - color
 *               - vehicleType
 *             properties:
 *               registrationNumber:
 *                 type: string
 *                 example: RAD 12345
 *               make:
 *                 type: string
 *                 example: Toyota
 *               model:
 *                 type: string
 *                 example: Corolla
 *               year:
 *                 type: integer
 *                 example: 2020
 *               color:
 *                 type: string
 *                 example: White
 *               vehicleType:
 *                 type: string
 *                 enum: [SEDAN, SUV, MOTORCYCLE]
 *                 example: SEDAN
 *     responses:
 *       201:
 *         description: Vehicle registered successfully
 *       400:
 *         description: Invalid request or vehicle already registered
 */
router.post('/vehicle', authenticateToken, authorize('DRIVER'), driverController.registerVehicle);

/**
 * @swagger
 * /api/drivers/vehicle:
 *   put:
 *     summary: Update vehicle information
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               make:
 *                 type: string
 *               model:
 *                 type: string
 *               year:
 *                 type: integer
 *               color:
 *                 type: string
 *               vehicleType:
 *                 type: string
 *                 enum: [SEDAN, SUV, MOTORCYCLE]
 *     responses:
 *       200:
 *         description: Vehicle updated successfully
 */
router.put('/vehicle', authenticateToken, authorize('DRIVER'), driverController.updateVehicle);

module.exports = router;
