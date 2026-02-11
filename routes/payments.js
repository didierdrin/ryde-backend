const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * /api/payments/trip/{tripId}:
 *   get:
 *     summary: Get payment details for a trip
 *     tags: [Payments]
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
 *         description: Payment details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 payment:
 *                   $ref: '#/components/schemas/Payment'
 *       404:
 *         description: Payment not found
 */
router.get('/trip/:tripId', authenticateToken, paymentController.getPaymentByTrip);

/**
 * @swagger
 * /api/payments/{paymentId}/complete:
 *   post:
 *     summary: Complete a payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transactionRef
 *             properties:
 *               transactionRef:
 *                 type: string
 *                 description: External payment gateway transaction reference
 *                 example: MTN_MOMO_123456789
 *     responses:
 *       200:
 *         description: Payment completed successfully
 *       404:
 *         description: Payment not found
 */
router.post('/:paymentId/complete', authenticateToken, paymentController.completePayment);

module.exports = router;
