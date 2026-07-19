const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// When a POST request hits /register, trigger the controller function to send code
router.post('/register', authController.register);

// When a POST request hits /verify-email, verify code and create user
router.post('/verify-email', authController.verifyEmail);

// When a POST request hits /login, trigger the login controller function
router.post('/login', authController.login);

// When a POST request hits /verify-login, verify the OTP for admin login
router.post('/verify-login', authController.verifyLogin);

module.exports = router;