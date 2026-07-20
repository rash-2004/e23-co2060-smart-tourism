const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// When a POST request hits /register, trigger the controller function to send code
router.post('/register', authController.register);

// When a POST request hits /login, trigger the login controller function
router.post('/login', authController.login);

module.exports = router;