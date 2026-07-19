const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRepo = require('../repositories/userRepo');
const nodemailer = require('nodemailer');

// In-memory store for pending registrations (email -> { userData, code, expires })
const pendingRegistrations = new Map();

// In-memory store for pending admin logins (email -> { userId, email, role, code, expires })
const pendingLogins = new Map();

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * we use bycrypt because if a hacker steals our database, they will only see randomized hash strings, 
 * not our tourists' real passwords. bcrypt also adds a 'salt'—random data added 
 * to the password before hashing—which defends against Rainbow Table cyber attacks."
 */
const register = async (req, res) => {
    try {
        const { email, password, role, full_name, contact_number, covered_locations, profile_image_url } = req.body;

        // 1. Check if the user already exists
        const existingUser = await userRepo.findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'Email is already registered' });
        }

        // 2. Generate a 6-digit verification code
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // 3. Store registration data temporarily (expires in 10 minutes)
        pendingRegistrations.set(email, {
            userData: req.body,
            code,
            expires: Date.now() + 10 * 60 * 1000 // 10 minutes
        });

        // 4. Send email using the professional dark theme format (no emojis)
        const mailOptions = {
            from: `"Smart Tourism" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Verify your Smart Tourism Account',
            html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f14; color: #e5e7eb; padding: 40px 20px; margin: 0; width: 100%;">
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; background-color: #161616; border-radius: 12px; margin: 0 auto;">
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #a794ff; text-align: center; margin: 0 0 24px 0; font-size: 24px; font-weight: 600; line-height: 1.4;">
                                Welcome to Smart Tourism,<br>${full_name || 'User'}!
                            </h2>
                            <p style="font-size: 16px; line-height: 1.5; color: #e5e7eb; margin: 0 0 30px 0;">
                                Please use the following 6-digit verification code to complete your registration.
                            </p>
                            <div style="background-color: #121212; border: 1px solid #2a2a2a; border-radius: 8px; padding: 30px 20px; text-align: center; margin: 0 0 30px 0;">
                                <span style="font-size: 42px; font-weight: bold; letter-spacing: 12px; color: #a794ff; display: inline-block; padding-left: 12px;">${code}</span>
                            </div>
                            <p style="text-align: center; font-size: 14px; color: #9ca3af; margin: 0;">
                                This code will expire in 10 minutes.
                            </p>
                        </td>
                    </tr>
                </table>
            </div>
            `
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({
            message: 'Verification code sent to email. Please verify to complete registration.'
        });

    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * VERIFY EMAIL - Complete user registration
 */
const verifyEmail = async (req, res) => {
    try {
        const { email, code } = req.body;
        const pending = pendingRegistrations.get(email);

        if (!pending) {
            return res.status(400).json({ error: 'No pending registration found for this email.' });
        }

        if (Date.now() > pending.expires) {
            pendingRegistrations.delete(email);
            return res.status(400).json({ error: 'Verification code has expired. Please register again.' });
        }

        if (pending.code !== code) {
            return res.status(400).json({ error: 'Invalid verification code.' });
        }

        // Code is valid, proceed to save the user
        const { password, role, full_name, contact_number, covered_locations, profile_image_url } = pending.userData;

        // Hash the password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Save the new user to the database
        const newUser = await userRepo.createUser(email, passwordHash, role);

        // Create initial profile if data provided
        if (full_name) {
            if (role === 'guide') {
                await userRepo.updateGuideProfile(
                    newUser.id, 
                    full_name, 
                    null, // bio
                    null, // license_number
                    0, // hourly_rate
                    contact_number || null,
                    profile_image_url || null,
                    null, // specialization
                    0, // experience_years
                    null, // languages
                    covered_locations || null
                );
            } else {
                await userRepo.updateTouristProfile(
                    newUser.id, 
                    full_name, 
                    '', 
                    contact_number || null,
                    profile_image_url || null
                );
            }
        }

        // Remove from pending registrations
        pendingRegistrations.delete(email);

        res.status(201).json({
            message: 'Email verified and user registered successfully!',
            user: newUser
        });

    } catch (error) {
        console.error('Verification Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * LOGIN - Authenticate user and return JWT token
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validate input
        console.log("LOGIN ATTEMPT:", email, password);
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // 2. Find user by email
        const user = await userRepo.findUserByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // 3. Compare password with hash
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // 4. Special flow for admin: Require OTP
        if (user.role === 'admin') {
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            pendingLogins.set(email, {
                userId: user.id,
                email: user.email,
                role: user.role,
                code,
                expires: Date.now() + 10 * 60 * 1000 // 10 mins
            });

            const mailOptions = {
                from: `"Smart Tourism" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Admin Login Verification',
                html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f14; color: #e5e7eb; padding: 40px 20px; margin: 0; width: 100%;">
                    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; background-color: #161616; border-radius: 12px; margin: 0 auto;">
                        <tr>
                            <td style="padding: 40px 30px;">
                                <h2 style="color: #a794ff; text-align: center; margin: 0 0 24px 0; font-size: 24px; font-weight: 600; line-height: 1.4;">
                                    Admin Verification Required
                                </h2>
                                <p style="font-size: 16px; line-height: 1.5; color: #e5e7eb; margin: 0 0 30px 0;">
                                    Please use the following 6-digit verification code to complete your login.
                                </p>
                                <div style="background-color: #121212; border: 1px solid #2a2a2a; border-radius: 8px; padding: 30px 20px; text-align: center; margin: 0 0 30px 0;">
                                    <span style="font-size: 42px; font-weight: bold; letter-spacing: 12px; color: #a794ff; display: inline-block; padding-left: 12px;">${code}</span>
                                </div>
                                <p style="text-align: center; font-size: 14px; color: #9ca3af; margin: 0;">
                                    This code will expire in 10 minutes.
                                </p>
                            </td>
                        </tr>
                    </table>
                </div>
                `
            };

            await transporter.sendMail(mailOptions);

            return res.status(200).json({
                message: 'Verification code sent',
                requires_otp: true,
                email: user.email
            });
        }

        // 5. Generate JWT token for normal users
        const token = jwt.sign(
            { 
                userId: user.id, 
                email: user.email, 
                role: user.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRY || '24h' }
        );

        // 6. Return success with token
        res.status(200).json({
            message: 'Login successful!',
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * VERIFY LOGIN - Verify OTP for admin login
 */
const verifyLogin = async (req, res) => {
    try {
        const { email, code } = req.body;
        const pending = pendingLogins.get(email);

        if (!pending) {
            return res.status(400).json({ error: 'No pending login found for this email.' });
        }

        if (Date.now() > pending.expires) {
            pendingLogins.delete(email);
            return res.status(400).json({ error: 'Verification code has expired. Please login again.' });
        }

        if (pending.code !== code) {
            return res.status(400).json({ error: 'Invalid verification code.' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: pending.userId, 
                email: pending.email, 
                role: pending.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRY || '24h' }
        );

        // Remove pending login
        pendingLogins.delete(email);

        res.status(200).json({
            message: 'Login successful!',
            token,
            user: {
                id: pending.userId,
                email: pending.email,
                role: pending.role
            }
        });

    } catch (error) {
        console.error('Verify Login Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { register, verifyEmail, login, verifyLogin };