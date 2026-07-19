const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function runMigrations() {
    console.log('Starting migrations...');
    const migrationsPath = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsPath).filter(file => file.endsWith('.sql')).sort();

    for (const file of files) {
        console.log(`Running ${file}...`);
        const filePath = path.join(migrationsPath, file);
        const sql = fs.readFileSync(filePath, 'utf8');
        await db.query(sql);
    }
    console.log('All migrations completed successfully.');
}

module.exports = { runMigrations };

if (require.main === module) {
    runMigrations()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error('Migration failed:', err);
            process.exit(1);
        });
}