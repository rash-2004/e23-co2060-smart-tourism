const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function runMigrations() {
    const migrationsPath = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsPath).filter(file => file.endsWith('.sql')).sort();

    for (const file of files) {
        const filePath = path.join(migrationsPath, file);
        const sql = fs.readFileSync(filePath, 'utf8');
        await db.query(sql);
    }
}

module.exports = { runMigrations };

if (require.main === module) {
    runMigrations().catch(() => process.exit(1));
}