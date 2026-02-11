const Payment = require('../models/Payment');
const Trip = require('../models/Trip');

exports.getPaymentByTrip = async (req, res) => {
  try {
    const payment = await Payment.findByTripId(req.params.tripId);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({ payment });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ error: 'Failed to fetch payment', details: error.message });
  }
};

exports.completePayment = async (req, res) => {
  try {
    const { transactionRef } = req.body;

    if (!transactionRef) {
      return res.status(400).json({ error: 'Transaction reference is required' });
    }

    const payment = await Payment.completePayment(req.params.paymentId, transactionRef);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({ message: 'Payment completed successfully', payment });
  } catch (error) {
    console.error('Complete payment error:', error);
    res.status(500).json({ error: 'Failed to complete payment', details: error.message });
  }
};
