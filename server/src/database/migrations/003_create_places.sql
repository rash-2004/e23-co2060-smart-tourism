CREATE TABLE IF NOT EXISTS places (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,
    latitude DECIMAL(10, 8) NOT NULL, 
    longitude DECIMAL(11, 8) NOT NULL,
    category VARCHAR(50),
    image_url VARCHAR(500),
    -- VIVA PREP: We use standard DECIMALs for lat/long for now. In Sprint 2, when we need spatial queries ("find places within 5km"), we will alter this table to use PostGIS Geometry types. Plan for the future, but build for today.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);