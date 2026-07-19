const db = require('../config/db');

const getDatabaseStatus = async () => {
    // A simple query to check if the DB is responding
    const result = await db.query('SELECT NOW()');
    return result.rows[0];
};

module.exports = {
    getDatabaseStatus
};