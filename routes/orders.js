const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

/**
 * Internal: IremboPay webhook is received by mozypizza-callbacks, verified, then forwarded here.
 * Configure mozypizza-callbacks MOZYPIZZA_API_URL to this API (e.g. https://your-ryde-api.railway.app or .../api).
 */
router.post('/subscribe', paymentController.paymentSubscribe);

module.exports = router;
