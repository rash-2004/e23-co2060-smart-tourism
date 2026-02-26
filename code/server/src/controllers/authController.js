const bcrypt = require('bcrypt');
const userRepo = require('../repositories/userRepo');
const jwt = require('jsonwebtoken');

/**
 * we use bycrypt because if a hacker steals our database, they will only see randomized hash strings, 
 * not our tourists' real passwords. bcrypt also adds a 'salt'—random data added 
 * to the password before hashing—which defends against Rainbow Table cyber attacks."
 */
const register = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // 1. Check if the user already exists
        const existingUser = await userRepo.findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'Email is already registered' });
        }

        // 2. Hash the password (Security Layer)
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // 3. Save the new user to the database
        const newUser = await userRepo.createUser(email, passwordHash, role);

        // 4. Send a success response back to the frontend
        res.status(201).json({
            message: 'User registered successfully!',
            user: newUser
        });

    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Find the user by email
        const user = await userRepo.findUserByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // 2. Compare the provided password with the hashed password in the DB
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // 3. Create a JWT (Digital Passport)
        const token = jwt.sign(
            { id: user.id, role: user.role }, // Data to hide in the token
            process.env.JWT_SECRET,           // Our secret key
            { expiresIn: '1d' }               // Token expires in 1 day
        );

        // 4. Send the token and user info back (exclude the password!)
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
module.exports = { register, login};