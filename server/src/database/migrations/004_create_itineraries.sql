CREATE TABLE IF NOT EXISTS itineraries (
    id SERIAL PRIMARY KEY,
    tourist_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    start_date DATE,
    end_date DATE,
    FOREIGN KEY (tourist_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS itinerary_items (
    id SERIAL PRIMARY KEY,
    itinerary_id INT NOT NULL,
    place_id INT NOT NULL,
    visit_order INT NOT NULL, 
    -- VIVA PREP: The 'visit_order' column is HOW you implement drag-and-drop. 
    -- When a user reorders the route in React, the frontend sends an array of Item IDs. 
    -- Your Node backend will run a transaction to update this 'visit_order' integer for each item.
    notes TEXT,
    FOREIGN KEY (itinerary_id) REFERENCES itineraries(id) ON DELETE CASCADE,
    FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE RESTRICT
    -- VIVA PREP: 'ON DELETE RESTRICT' for places. If an Admin tries to delete the 'Sigiriya' place record, the database will BLOCK it if tourists have Sigiriya in their itineraries. This prevents breaking user data.
);