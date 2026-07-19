const db = require('../config/db');
const { runMigrations } = require('./runMigrations');
const { seedDatabase } = require('./seedData');

async function resetDatabase() {
    try {
        console.log('Resetting the database...');
        
        // This drops all tables in the public schema
        await db.query(`
            DROP SCHEMA public CASCADE;
            CREATE SCHEMA public;
            GRANT ALL ON SCHEMA public TO public;
        `);
        console.log('Old data removed successfully!');

        // Run migrations to recreate the tables
        await runMigrations();

        // Run the seed data script
        await seedDatabase();

        console.log('Database has been completely reset and seeded with fresh data!');
        process.exit(0);
    } catch (error) {
        console.error('Failed to reset database:', error);
        process.exit(1);
    }
}

resetDatabase();
