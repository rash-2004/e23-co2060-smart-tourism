CREATE TABLE IF NOT EXISTS guide_profiles (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL, -- 1-to-1 relationship
    full_name VARCHAR(100) NOT NULL,
    bio TEXT,
    license_number VARCHAR(50) UNIQUE,
    hourly_rate DECIMAL(10, 2),
    is_approved BOOLEAN DEFAULT FALSE, -- Human-in-the-loop: Admin must approve guides
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tourist_profiles (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    nationality VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);