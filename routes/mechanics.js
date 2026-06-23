const express = require('express');
const router = express.Router();
const mechanicController = require('../controllers/mechanicController');
const { authenticateToken, authorize } = require('../middleware/auth');

router.get('/', authenticateToken, mechanicController.listMechanics);
router.post('/', authenticateToken, authorize('ADMIN'), mechanicController.createMechanic);

module.exports = router;
