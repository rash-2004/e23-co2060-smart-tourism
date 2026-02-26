const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// When a POST request hits /register, trigger the controller function
router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router;