const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/auth');

function scriptSrcForEnv(env) {
  const e = String(env || 'sandbox').toLowerCase();
  if (e === 'production' || e === 'prod') {
    return 'https://dashboard.irembopay.com/assets/payment/inline.js';
  }
  if (e === 'checkout') {
    return 'https://dashboard.checkout.irembopay.com/assets/payment/inline.js';
  }
  return 'https://dashboard.sandbox.irembopay.com/assets/payment/inline.js';
}

/**
 * Lightweight hosted checkout page for mobile (WebView).
 * It loads the IremboPay inline widget script and calls initiate({ invoiceNumber }).
 *
 * This endpoint is intentionally unauthenticated: invoiceNumber is already a single-use payment reference.
 */
router.get('/checkout/:invoiceNumber', (req, res) => {
  const publicKey = process.env.IREMBOPAY_PUBLIC_KEY;
  if (!publicKey) {
    return res.status(500).send('IremboPay is not configured: missing IREMBOPAY_PUBLIC_KEY');
  }
  const invoiceNumber = String(req.params.invoiceNumber || '').trim();
  if (!invoiceNumber) {
    return res.status(400).send('invoiceNumber required');
  }

  const scriptSrc = scriptSrcForEnv(process.env.IREMBOPAY_ENVIRONMENT);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Ryde • Pay</title>
    <script src="${scriptSrc}"></script>
    <style>
      body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; margin: 0; padding: 16px; background: #f6f7fb; }
      .card { max-width: 560px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 16px; box-shadow: 0 8px 24px rgba(0,0,0,.08); }
      .muted { color: #6b7280; font-size: 14px; margin-top: 8px; }
      .btn { margin-top: 12px; display: inline-block; background: #111827; color: #fff; padding: 10px 12px; border-radius: 10px; text-decoration: none; }
    </style>
  </head>
  <body>
    <div class="card">
      <div><strong>Pay with IremboPay</strong></div>
      <div class="muted">Invoice: ${invoiceNumber}</div>
      <div id="status" class="muted">Opening payment…</div>
      <a class="btn" href="javascript:void(0)" onclick="start()">Open again</a>
    </div>
    <script>
      function postResult(payload) {
        try {
          // For Flutter WebView (webview_flutter): message channel
          if (window.PaymentResult && window.PaymentResult.postMessage) {
            window.PaymentResult.postMessage(JSON.stringify(payload));
          }
        } catch (_) {}
      }
      function start() {
        var statusEl = document.getElementById('status');
        if (!window.IremboPay || !window.IremboPay.initiate) {
          statusEl.textContent = 'Payment system not ready. Please refresh.';
          postResult({ ok: false, reason: 'IREMBO_WIDGET_NOT_READY' });
          return;
        }
        statusEl.textContent = 'Payment widget opened.';
        window.IremboPay.initiate({
          publicKey: "${publicKey}",
          invoiceNumber: "${invoiceNumber}",
          locale: window.IremboPay.locale ? window.IremboPay.locale.EN : "EN",
          callback: function(err) {
            if (!err) {
              statusEl.textContent = 'Payment submitted. You can close this window.';
              postResult({ ok: true });
            } else {
              statusEl.textContent = 'Payment cancelled or failed. You can close this window.';
              postResult({ ok: false, reason: 'CANCELLED_OR_FAILED' });
            }
          }
        });
      }
      setTimeout(start, 50);
    </script>
  </body>
</html>`);
});

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
router.get('/rental-history', authenticateToken, paymentController.getRentalHistory);
router.post('/rental-intent/:intentId/acknowledge', authenticateToken, paymentController.acknowledgeRentalPayment);

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
