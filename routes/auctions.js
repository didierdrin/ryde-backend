const express = require('express');
const router = express.Router();
const auctionController = require('../controllers/auctionController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, auctionController.listAuctions);
router.post('/', authenticateToken, auctionController.createListing);
router.post('/:listingId/purchase', authenticateToken, auctionController.purchaseListing);
router.post('/:listingId/cancel', authenticateToken, auctionController.cancelListing);

module.exports = router;
