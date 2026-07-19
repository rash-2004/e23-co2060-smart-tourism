# Smart Tourism SaaS Platform

A modern, full-stack web application for tourists and travel guides to coordinate itineraries and bookings.

## 🚀 Getting Started Locally

Follow these steps to set up and run the project on your machine.

### 1. Prerequisites
Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or higher)
- [PostgreSQL](https://www.postgresql.org/)

### 2. Database Setup
1. Open your PostgreSQL terminal (`psql`) or a GUI like pgAdmin.
2. Create a new database:
   ```sql
   CREATE DATABASE smart_tourism;
   ```
3. You may need to run the initial schema migrations (check the `server/src/config/db.js` or any SQL files in the repository to initialize tables).

### 3. Server Configuration
1. Navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Create a `.env` file (or update the existing one) with your database credentials:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=smart_tourism
   DB_USER=postgres
   DB_PASSWORD=your_password_here
   JWT_SECRET=your_secret_key
   JWT_EXPIRY=24h
   NODE_ENV=development
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm start
   ```

### 4. Client Configuration
1. Open a new terminal and navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the React application:
   ```bash
   npm start
   ```

### 5. Access the App
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

---

## 🛠 Features
- **Itinerary Planner**: Create custom trips with real-time routing using GraphHopper.
- **Guide Matchmaking**: Automatically find guides based on your selected locations.
- **Messaging System**: Real-time chat between tourists and guides for coordination.
- **Multi-Currency Quoting**: Guides can offer quotes in USD or LKR.
- **Dynamic Dashboard**: Real-time stats and profile management.
