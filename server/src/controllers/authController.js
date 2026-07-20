const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRepo = require('../repositories/userRepo');
const userRepo = require('../repositories/userRepo');

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

        // 2. Register the user instantly
        let newUser;
        if (role === 'tourist') {
            newUser = await userRepo.createUser(email, password, role);
            if (newUser) {
                await userRepo.createTouristProfile(newUser.id, full_name, '', contact_number || null, profile_image_url || null);
            }
        } else if (role === 'guide') {
            newUser = await userRepo.createUser(email, password, role);
            if (newUser) {
                await userRepo.createGuideProfile(newUser.id, full_name, '', contact_number || null, profile_image_url || null);
            }
        } else if (role === 'admin') {
            newUser = await userRepo.createUser(email, password, role);
            if (newUser) {
                await userRepo.createAdminProfile(newUser.id, full_name, '', contact_number || null, profile_image_url || null);
            }
        }

        // 3. Generate JWT token
        const token = jwt.sign(
            { 
                userId: newUser.id, 
                email: newUser.email, 
                role: newUser.role 
            },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'Registration successful',
            user: newUser,
            token
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

        // No special flow for admin required since OTP is removed

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