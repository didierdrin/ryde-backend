const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const exportController = require('../controllers/exportController');

const exportBodyParser = express.json({
  limit: process.env.EXPORT_BODY_LIMIT || '15mb',
});

router.get('/status', authenticateToken, exportController.exportStatus);
router.post('/email', exportBodyParser, authenticateToken, exportController.sendExportEmail);

module.exports = router;
