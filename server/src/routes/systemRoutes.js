const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');

// URL: http://localhost:5000/api/system/status
router.get('/status', systemController.getStatus);

module.exports = router;