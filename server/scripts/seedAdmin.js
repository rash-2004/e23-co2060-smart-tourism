const bcrypt = require('bcrypt');
require('dotenv').config();
const db = require('../src/config/db');
const seedAdmin = async () => {
    try {
        const email = 'adminsmart00@gmail.com';
        const password = '@Dmin1234';
        const role = 'admin';

        // Check if admin exists
        const checkQuery = 'SELECT * FROM users WHERE email = $1';
        const checkResult = await db.query(checkQuery, [email]);
        
        if (checkResult.rows.length > 0) {
            console.log('Admin user already exists. Updating password...');
            const saltRounds = 10;
            const passwordHash = await bcrypt.hash(password, saltRounds);
            await db.query('UPDATE users SET password_hash = $1, role = $2 WHERE email = $3', [passwordHash, role, email]);
            console.log('Admin password updated successfully.');
        } else {
            console.log('Creating admin user...');
            const saltRounds = 10;
            const passwordHash = await bcrypt.hash(password, saltRounds);
            
            const insertQuery = `
                INSERT INTO users (email, password_hash, role)
                VALUES ($1, $2, $3)
                RETURNING id, email, role;
            `;
            const result = await db.query(insertQuery, [email, passwordHash, role]);
            console.log('Admin created:', result.rows[0]);
        }
    } catch (err) {
        console.error('Error seeding admin:', err);
    } finally {
        process.exit(0);
    }
};

seedAdmin();
