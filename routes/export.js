const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const exportController = require('../controllers/exportController');

router.post('/email', authenticateToken, exportController.sendExportEmail);

module.exports = router;
