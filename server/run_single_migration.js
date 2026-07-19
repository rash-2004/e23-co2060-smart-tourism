const db = require('./src/config/db');
const fs = require('fs');
const path = require('path');

async function runSingleMigration() {
    const migrationFile = process.argv[2];
    if (!migrationFile) {
        console.error('Please provide a migration file name (e.g. 011_add_contact_to_tourists.sql)');
        process.exit(1);
    }
    
    try {
        const sql = fs.readFileSync(path.join(__dirname, 'src/database/migrations', migrationFile), 'utf8');
        await db.query(sql);
        console.log(`Migration ${migrationFile} successful!`);
        process.exit(0);
    } catch (err) {
        console.error(`Migration ${migrationFile} failed:`, err);
        process.exit(1);
    }
}

runSingleMigration();
