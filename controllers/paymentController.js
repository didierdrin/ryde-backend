const Payment = require('../models/Payment');
const Trip = require('../models/Trip');
const User = require('../models/User');
const RentalPaymentIntent = require('../models/RentalPaymentIntent');
const { createInvoicePayload } = require('../services/irembopayService');

function buildCheckoutUrl(req, invoiceNumber) {
  const configured = process.env.PUBLIC_API_URL || process.env.API_URL;
  if (configured) {
    const base = String(configured).replace(/\/api\/?$/, '');
    return `${base}/api/payments/checkout/${encodeURIComponent(String(invoiceNumber))}`;
  }
  const proto = req.get('x-forwarded-proto') || req.protocol || 'https';
  const host = req.get('x-forwarded-host') || req.get('host');
  return `${proto}://${host}/api/payments/checkout/${encodeURIComponent(String(invoiceNumber))}`;
}

function invoicePaymentMeta(req, invoiceNumber) {
  const meta = {
    checkoutUrl: buildCheckoutUrl(req, invoiceNumber),
    irembopayEnvironment: process.env.IREMBOPAY_ENVIRONMENT || 'sandbox',
  };
  const publicKey = process.env.IREMBOPAY_PUBLIC_KEY;
  if (publicKey) meta.publicKey = publicKey;
  return meta;
}

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
 * Create IremboPay invoice (server-side secret key). Stores invoice_number on the payment row.
 * Webhook: mozypizza-callbacks → POST /api/orders/subscribe (MOZYPIZZA_INTERNAL_SECRET).
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

    const { invoiceNumber } = await createInvoicePayload({
      amount: payment.amount,
      customerName: userName,
      customerEmail: userEmail,
      customerPhone: userPhone,
      description: `Ryde trip ${trip.trip_id}`,
      transactionId: `RYDE-TRIP-${payment.payment_id}`,
    });

    await Payment.setInvoiceNumber(payment.payment_id, String(invoiceNumber));

    res.json({
      invoiceNumber,
      paymentId,
      ...invoicePaymentMeta(req, invoiceNumber),
    });
  } catch (error) {
    const status = error.statusCode || error.response?.status;
    console.error('Create invoice error:', error.message, error.response?.data || '');
    if (status === 500 && error.message?.includes('not configured')) {
      return res.status(500).json({ error: error.message });
    }
    if (status === 502) {
      return res.status(502).json({ error: error.message });
    }
    const data = error.response?.data || error.errors || error;
    if (status >= 400 && status < 500) {
      const msg = Array.isArray(data?.message) ? data.message.join(' ') : (data?.message || 'Payment gateway error');
      return res.status(502).json({ error: msg });
    }
    res.status(500).json({ error: 'Failed to create payment invoice', details: error.message });
  }
};

/**
 * Rental / arbitrary amount: creates a rental_payment_intent and Irembo invoice.
 */
exports.createInvoiceForAmount = async (req, res) => {
  try {
    const { amount: amountParam, address, vehicleRef } = req.body;
    const amount = Number(amountParam);
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    let userEmail = 'customer@ryde.com';
    let userName = 'Valued Customer';
    let userPhone = '0780000000';
    const user = await User.findById(req.user.userId);
    if (user) {
      userEmail = user.email || userEmail;
      userName = user.name || userName;
      if (user.phone_number) userPhone = String(user.phone_number).trim();
    }

    const intent = await RentalPaymentIntent.create(req.user.userId, {
      amount,
      vehicleRef: vehicleRef ? String(vehicleRef) : null,
      description: address ? `Rental — ${String(address).trim()}` : 'Vehicle rental',
    });

    const { invoiceNumber } = await createInvoicePayload({
      amount,
      customerName: userName,
      customerEmail: userEmail,
      customerPhone: userPhone,
      description: intent.description || 'Ryde rental',
      transactionId: `RYDE-RENT-${intent.intent_id}`,
    });

    await RentalPaymentIntent.setInvoiceNumber(intent.intent_id, String(invoiceNumber));

    res.json({
      invoiceNumber,
      intentId: intent.intent_id,
      ...invoicePaymentMeta(req, invoiceNumber),
    });
  } catch (error) {
    const status = error.statusCode || error.response?.status;
    console.error('Create invoice for amount error:', error.message, error.response?.data || '');
    if (status === 500 && error.message?.includes('not configured')) {
      return res.status(500).json({ error: error.message });
    }
    if (status === 502) {
      return res.status(502).json({ error: error.message });
    }
    const data = error.response?.data || error.errors || error;
    if (status >= 400 && status < 500) {
      const msg = Array.isArray(data?.message) ? data.message.join(' ') : (data?.message || 'Payment gateway error');
      return res.status(502).json({ error: msg });
    }
    res.status(500).json({ error: 'Failed to create payment invoice', details: error.message });
  }
};

/**
 * Internal: called by mozypizza-callbacks after IremboPay webhook verification.
 * Same contract as mozypizza-be POST /api/orders/subscribe.
 */
exports.paymentSubscribe = async (req, res) => {
  try {
    const secret = req.headers['x-internal-secret'];
    const expected = process.env.MOZYPIZZA_INTERNAL_SECRET;
    if (!expected || secret !== expected) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const invoiceNumber =
      body.invoiceNumber ?? body.invoice_number ?? body.data?.invoiceNumber ?? body.data?.invoice_number;
    if (!invoiceNumber) {
      return res.status(400).json({ success: false, message: 'invoiceNumber required' });
    }

    const rawStatus = (body.paymentStatus || body.payment_status || '').toString().toUpperCase();
    const transactionReference =
      body.transactionReference ?? body.transaction_reference ?? body.transactionRef;

    const isPaid =
      rawStatus === 'PAID' || rawStatus === 'COMPLETED' || rawStatus === 'SUCCESS' || rawStatus === 'SUCCEEDED';
    const isFailed = rawStatus === 'FAILED' || rawStatus === 'FAILURE' || rawStatus === 'CANCELLED';

    const inv = String(invoiceNumber);

    const payment = await Payment.findByInvoiceNumber(inv);
    if (payment) {
      if (payment.payment_status === 'COMPLETED' && isPaid) {
        return res.status(200).json({ success: true, scope: 'trip', duplicate: true });
      }
      if (isPaid) {
        const ref = transactionReference || inv;
        await Payment.completePayment(payment.payment_id, ref);
      } else if (isFailed) {
        await Payment.markFailed(payment.payment_id);
      } else {
        return res.status(200).json({ success: true, scope: 'trip', ignored: true, paymentStatus: rawStatus });
      }
      return res.status(200).json({ success: true, scope: 'trip' });
    }

    const intent = await RentalPaymentIntent.findByInvoiceNumber(inv);
    if (intent) {
      if (intent.status === 'COMPLETED' && isPaid) {
        return res.status(200).json({ success: true, scope: 'rental', duplicate: true });
      }
      if (isPaid) {
        await RentalPaymentIntent.markCompleted(intent.intent_id);
      } else if (isFailed) {
        await RentalPaymentIntent.markFailed(intent.intent_id);
      } else {
        return res.status(200).json({ success: true, scope: 'rental', ignored: true, paymentStatus: rawStatus });
      }
      return res.status(200).json({ success: true, scope: 'rental' });
    }

    return res.status(404).json({ success: false, message: 'No payment or rental intent for invoice' });
  } catch (error) {
    console.error('paymentSubscribe error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRentalIntent = async (req, res) => {
  try {
    const row = await RentalPaymentIntent.findByIntentId(req.params.intentId);
    if (!row || row.user_id !== req.user.userId) {
      return res.status(404).json({ error: 'Intent not found' });
    }
    res.json({
      intent: {
        intentId: row.intent_id,
        amount: row.amount,
        status: row.status,
        invoiceNumber: row.invoice_number,
        vehicleRef: row.vehicle_ref,
      },
    });
  } catch (error) {
    console.error('getRentalIntent error:', error);
    res.status(500).json({ error: 'Failed to fetch intent', details: error.message });
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
