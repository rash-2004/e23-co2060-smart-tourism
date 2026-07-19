const db = require('../config/db');

// --- Tourists ---
const getTourists = async (req, res) => {
    try {
        const query = `
            SELECT u.id as user_id, u.email, u.is_verified, t.full_name, t.contact_number, u.created_at
            FROM users u
            JOIN tourist_profiles t ON u.id = t.user_id
            WHERE u.role = 'tourist'
            ORDER BY u.created_at DESC
        `;
        const result = await db.query(query);
        res.status(200).json({ tourists: result.rows });
    } catch (error) {
        console.error('Error fetching tourists:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const deleteTourist = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM users WHERE id = $1 AND role = $2', [id, 'tourist']);
        res.status(200).json({ message: 'Tourist deleted successfully' });
    } catch (error) {
        console.error('Error deleting tourist:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// --- Guides ---
const getGuides = async (req, res) => {
    try {
        const query = `
            SELECT u.id as user_id, u.email, u.is_verified, g.full_name, g.contact_number, g.license_number, u.created_at
            FROM users u
            JOIN guide_profiles g ON u.id = g.user_id
            WHERE u.role = 'guide'
            ORDER BY u.created_at DESC
        `;
        const result = await db.query(query);
        res.status(200).json({ guides: result.rows });
    } catch (error) {
        console.error('Error fetching guides:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const deleteGuide = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM users WHERE id = $1 AND role = $2', [id, 'guide']);
        res.status(200).json({ message: 'Guide deleted successfully' });
    } catch (error) {
        console.error('Error deleting guide:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// --- Place Comments ---
const getPlaceComments = async (req, res) => {
    try {
        const query = `
            SELECT pr.id, pr.place_id, p.name as target_name, pr.rating, pr.title, pr.comment, pr.created_at, t.full_name as author_name
            FROM place_reviews pr
            JOIN places p ON pr.place_id = p.id
            JOIN users u ON pr.tourist_id = u.id
            LEFT JOIN tourist_profiles t ON u.id = t.user_id
            ORDER BY pr.created_at DESC
        `;
        const result = await db.query(query);
        res.status(200).json({ comments: result.rows });
    } catch (error) {
        console.error('Error fetching place comments:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const deletePlaceComment = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM place_reviews WHERE id = $1', [id]);
        res.status(200).json({ message: 'Place comment deleted successfully' });
    } catch (error) {
        console.error('Error deleting place comment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// --- Guide Comments ---
const getGuideComments = async (req, res) => {
    try {
        const query = `
            SELECT gr.id, gr.guide_id, g.full_name as target_name, gr.rating, gr.comment, gr.created_at, t.full_name as author_name
            FROM guide_reviews gr
            JOIN users gu ON gr.guide_id = gu.id
            JOIN guide_profiles g ON gu.id = g.user_id
            JOIN users u ON gr.tourist_id = u.id
            LEFT JOIN tourist_profiles t ON u.id = t.user_id
            ORDER BY gr.created_at DESC
        `;
        const result = await db.query(query);
        res.status(200).json({ comments: result.rows });
    } catch (error) {
        console.error('Error fetching guide comments:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const deleteGuideComment = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM guide_reviews WHERE id = $1', [id]);
        res.status(200).json({ message: 'Guide comment deleted successfully' });
    } catch (error) {
        console.error('Error deleting guide comment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getTourists, deleteTourist,
    getGuides, deleteGuide,
    getPlaceComments, deletePlaceComment,
    getGuideComments, deleteGuideComment
};
