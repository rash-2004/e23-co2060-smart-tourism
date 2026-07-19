const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const systemRoutes = require('./routes/systemRoutes');
const placesRoutes = require('./routes/placesRoutes');
const userRoutes = require('./routes/userRoutes');
const itinerariesRoutes = require('./routes/itinerariesRoutes');
const guideRoutes = require('./routes/guideRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

app.set('io', io);

io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('join_booking', (bookingId) => {
        socket.join(`booking_${bookingId}`);
        console.log(`User joined room: booking_${bookingId}`);
    });

    socket.on('join_user', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`User joined personal room: user_${userId}`);
    });

    socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
    });
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/api/auth', authRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/places', placesRoutes);
app.use('/api/users', userRoutes);
app.use('/api/itineraries', itinerariesRoutes);
app.use('/api/guides', guideRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

async function startServer() {
    try {
        console.log('Starting server...');

        server.listen(PORT, () => {
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

app.get('/api/status', (req, res) => {
    res.status(200).json({
        project: "Smart Tourism Management System",
        batch: "E23",
        status: "Active",
        message: "Server Tier is functioning correctly",
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 5000;

startServer();