const db = require('../config/db');

const getAllPlaces = async () => {
    const query = 'SELECT * FROM places ORDER BY created_at DESC';
    const result = await db.query(query);
    return result.rows;
};

const createPlace = async (name, description, latitude, longitude, imageUrl) => {
    const query = `
        INSERT INTO places (name, description, latitude, longitude, image_url)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
    `;
    const values = [name, description, latitude, longitude, imageUrl];
    const result = await db.query(query, values);
    return result.rows[0];
};

module.exports = { getAllPlaces, createPlace };