const AuctionListing = require('../models/AuctionListing');

exports.listAuctions = async (req, res) => {
  try {
    const listingType = req.query.type || null;
    const status = req.query.status || 'ACTIVE';
    const listings = await AuctionListing.findAll({ listingType, status });
    res.json({ listings });
  } catch (error) {
    console.error('List auctions error:', error);
    res.status(500).json({ error: 'Failed to fetch auction listings', details: error.message });
  }
};

exports.createListing = async (req, res) => {
  try {
    const { listingType, title, description, make, model, year, price, imageUrl } = req.body;

    if (!listingType || !title || !price) {
      return res.status(400).json({ error: 'listingType, title, and price are required' });
    }

    if (!['BUY', 'SELL'].includes(String(listingType).toUpperCase())) {
      return res.status(400).json({ error: 'listingType must be BUY or SELL' });
    }

    const listing = await AuctionListing.create(req.user.userId, {
      listingType,
      title,
      description,
      make,
      model,
      year: year ? Number(year) : null,
      price: Number(price),
      imageUrl,
    });

    res.status(201).json({ message: 'Listing created', listing });
  } catch (error) {
    console.error('Create auction listing error:', error);
    res.status(500).json({ error: 'Failed to create listing', details: error.message });
  }
};

exports.purchaseListing = async (req, res) => {
  try {
    const { listingId } = req.params;
    const listing = await AuctionListing.findById(listingId);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Listing is no longer available' });
    }

    if (listing.userId === req.user.userId) {
      return res.status(400).json({ error: 'You cannot purchase your own listing' });
    }

    const updated = await AuctionListing.updateStatus(listingId, 'SOLD');
    res.json({ message: 'Listing marked as sold', listing: updated });
  } catch (error) {
    console.error('Purchase listing error:', error);
    res.status(500).json({ error: 'Failed to complete purchase', details: error.message });
  }
};

exports.cancelListing = async (req, res) => {
  try {
    const { listingId } = req.params;
    const listing = await AuctionListing.findById(listingId);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.userId !== req.user.userId && req.user.userType !== 'ADMIN') {
      return res.status(403).json({ error: 'Not allowed to cancel this listing' });
    }

    const updated = await AuctionListing.updateStatus(listingId, 'CANCELLED');
    res.json({ message: 'Listing cancelled', listing: updated });
  } catch (error) {
    console.error('Cancel listing error:', error);
    res.status(500).json({ error: 'Failed to cancel listing', details: error.message });
  }
};
