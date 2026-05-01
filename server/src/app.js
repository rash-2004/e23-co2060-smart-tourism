const express = require('express');
const cors = require('cors');
require('dotenv').config();

//1. IMPORT the ROUTES
const authRoutes = require('./routes/authRoutes');
const systemRoutes = require('./routes/systemRoutes');
const placesRoutes = require('./routes/placesRoutes');
const userRoutes = require('./routes/userRoutes');
const itinerariesRoutes = require('./routes/itinerariesRoutes');
const guideRoutes = require('./routes/guideRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const { runMigrations } = require('./database/runMigrations');

const app = express();

/** * ARCHITECTURE DECISION: Middleware
 * cors: Allows the React frontend (Port 5173) to connect to this API.
 * express.json(): Parses incoming JSON requests so we can read 'req.body'.
 */
app.use(cors());
app.use(express.json());

/**
 * MODULAR ROUTING SYSTEM
 * Instead of writing 100 routes here, we categorize them.
 * "We use prefixing (e.g., /api/auth) to version our API 
 * and keep the entry point clean and maintainable."
 */

// Connect the Auth module (Signup, Login)
app.use('/api/auth', authRoutes);

// Connect the System module (Status, Database Health)
app.use('/api/system', systemRoutes);

// Connect the Places module (Browse destinations)
app.use('/api/places', placesRoutes);

// Connect the User module (Profiles)
app.use('/api/users', userRoutes);

// Connect the Itineraries module (Trip planning)
app.use('/api/itineraries', itinerariesRoutes);

// Connect the Guides module (Public browse)
app.use('/api/guides', guideRoutes);
app.use('/api/bookings', bookingRoutes);

async function startServer() {
    try {
        await runMigrations();
        console.log('Database migrations completed. Starting server...');

        app.listen(PORT, () => {
            console.log(`=========================================`);
            console.log(` SERVER RUNNING ON: http://localhost:${PORT}`);
            console.log(` AUTH ENDPOINT: http://localhost:${PORT}/api/auth/register`);
            console.log(` SYSTEM STATUS: http://localhost:${PORT}/api/system/status`);
            console.log(`=========================================`);
        });
    } catch (error) {
        console.error('Failed to run migrations at startup:', error);
        process.exit(1);
    }
}

/**
 * LEGACY/HEARTBEAT ROUTE
 * Kept for quick browser verification.
 */
app.get('/api/status', (req, res) => {
    res.status(200).json({
        project: "Smart Tourism Management System",
        batch: "E23",
        status: "Active",
        message: "Server Tier is functioning correctly",
        timestamp: new Date().toISOString()
    });
});

// Start logic: Uses the PORT from .env or defaults to 5000.
const PORT = process.env.PORT || 5000;

startServer();