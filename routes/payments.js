const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/auth');

router.get('/trip/:tripId', authenticateToken, paymentController.getPaymentByTrip);
router.post('/:paymentId/complete', authenticateToken, paymentController.completePayment);

module.exports = router;
