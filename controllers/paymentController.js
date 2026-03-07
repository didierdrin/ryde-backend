const Payment = require('../models/Payment');
const Trip = require('../models/Trip');
const User = require('../models/User');
const axios = require('axios');

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

/**
 * Create IremboPay invoice via mozypizza-be (no direct IremboPay implementation here).
 * Returns invoiceNumber for frontend to use with IremboPay.initiate().
 * Payment confirmation is handled by mozypizza-callbacks → mozypizza-be.
 */
exports.createInvoice = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    if (payment.payment_status !== 'PENDING') {
      return res.status(400).json({ error: 'Payment is not pending' });
    }

    const trip = await Trip.findById(payment.trip_id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const baseUrl = (process.env.MOZYPIZZA_API_URL || 'https://mozypizza-be-production.up.railway.app/api').replace(/\/$/, '');
    const productId = process.env.MOZYPIZZA_PRODUCT_ID;
    const unitPrice = Number(process.env.MOZYPIZZA_PRODUCT_UNIT_PRICE) || 1;

    if (!productId) {
      return res.status(500).json({ error: 'IremboPay not configured (MOZYPIZZA_PRODUCT_ID)' });
    }

    const amount = Number(payment.amount);
    const quantity = Math.max(1, Math.round(amount / unitPrice));

    let userEmail = 'customer@ryde.com';
    let userName = trip.passenger_name || 'Valued Customer';
    let userPhone = (trip.passenger_phone && String(trip.passenger_phone).trim()) || '0780000000';
    if (trip.passenger_user_id) {
      const user = await User.findById(trip.passenger_user_id);
      if (user) {
        userEmail = user.email || userEmail;
        userName = user.name || userName;
        if (user.phone_number) userPhone = String(user.phone_number).trim();
      }
    }

    const phoneDigits = userPhone.replace(/\D/g, '').replace(/^0/, '').slice(-9);
    const orderPayload = {
      items: [{ productId: Number(productId), quantity }],
      address: (trip.pickup_address || trip.destination_address || 'Kigali').trim(),
      phoneNumber: phoneDigits.length >= 9 ? phoneDigits : userPhone.replace(/\D/g, ''),
      paymentType: 'online',
    };

    const orderResponse = await axios.post(`${baseUrl}/orders`, orderPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    });

    const data = orderResponse.data;
    const invoiceNumber = data?.invoiceNumber ?? data?.data?.invoiceNumber;
    if (!invoiceNumber) {
      console.error('Mozypizza order response:', orderResponse.data);
      return res.status(502).json({ error: 'Could not get payment invoice from gateway' });
    }

    res.json({ invoiceNumber, paymentId });
  } catch (error) {
    const status = error.response?.status;
    const data = error.response?.data;
    console.error('Create invoice error:', error.message, data || '');
    if (status === 401) {
      return res.status(502).json({ error: 'Payment gateway authentication failed' });
    }
    if (status === 403) {
      return res.status(502).json({ error: 'Payment gateway rejected request' });
    }
    if (status >= 400 && status < 500) {
      return res.status(502).json({ error: data?.message || 'Payment gateway error' });
    }
    res.status(500).json({ error: 'Failed to create payment invoice', details: error.message });
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
