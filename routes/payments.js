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
 * /api/payments/create-invoice-for-amount:
 *   post:
 *     summary: Create IremboPay invoice for an arbitrary amount (rentals, etc.)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount: { type: number, description: 'Amount in RWF' }
 *               address: { type: string, description: 'Optional delivery/booking address' }
 *     responses:
 *       200:
 *         description: Returns invoiceNumber for IremboPay.initiate()
 *       502:
 *         description: Payment gateway error
 */
router.post('/create-invoice-for-amount', authenticateToken, paymentController.createInvoiceForAmount);

/**
 * @swagger
 * /api/payments/rental-intent/{intentId}:
 *   get:
 *     summary: Poll rental payment intent status (after IremboPay; webhook updates server)
 */
router.get('/rental-intent/:intentId', authenticateToken, paymentController.getRentalIntent);

/**
 * @swagger
 * /api/payments/{paymentId}/create-invoice:
 *   post:
 *     summary: Create IremboPay invoice for a trip payment (server-side; webhook confirms)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invoice created; returns invoiceNumber for IremboPay.initiate()
 *       404:
 *         description: Payment not found
 *       502:
 *         description: Payment gateway error
 */
router.post('/:paymentId/create-invoice', authenticateToken, paymentController.createInvoice);

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
