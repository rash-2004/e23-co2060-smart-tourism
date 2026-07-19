const userRepo = require('../repositories/userRepo');
const bcrypt = require('bcrypt');
const db = require('../config/db');

/**
 * USER CONTROLLER
 * Handles user profile operations
 */

/**
 * GET /api/users/:id/profile
 * Fetch user profile (either tourist or guide)
 */
async function getUserProfile(req, res) {
    try {
        const { id } = req.params;

        // Get user profile
        const profile = await userRepo.getUserProfile(id);

        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        res.status(200).json({
            success: true,
            profile
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
}

/**
 * POST /api/users/:id/profile
 * Create or update tourist profile
 */
async function updateTouristProfile(req, res) {
    try {
        const { id } = req.params;
        const { full_name, nationality, contact_number, profile_image_url } = req.body;

        if (!full_name) {
            return res.status(400).json({ error: 'Full name is required' });
        }

        const profile = await userRepo.updateTouristProfile(id, full_name, nationality, contact_number, profile_image_url);

        res.status(200).json({
            success: true,
            message: 'Tourist profile updated successfully',
            profile
        });
    } catch (error) {
        console.error('Error updating tourist profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
}

/**
 * POST /api/users/:id/guide-profile
 * Create or update guide profile
 */
async function updateGuideProfile(req, res) {
    try {
        const { id } = req.params;
        const { 
            full_name, 
            bio, 
            license_number, 
            hourly_rate, 
            contact_number, 
            profile_image_url, 
            specialization, 
            experience_years, 
            languages,
            covered_locations
        } = req.body;

        if (!full_name) {
            return res.status(400).json({ error: 'Full name is required' });
        }

        const profile = await userRepo.updateGuideProfile(
            id,
            full_name,
            bio,
            license_number,
            hourly_rate,
            contact_number,
            profile_image_url,
            specialization,
            experience_years,
            languages,
            covered_locations
        );

        res.status(200).json({
            success: true,
            message: 'Guide profile updated successfully',
            profile
        });
    } catch (error) {
        console.error('Error updating guide profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
}

/**
 * DELETE /api/users/:id/account
 * Permanently delete user account and all related data
 */
async function deleteAccount(req, res) {
    try {
        const { id } = req.params;
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'No authorization token provided' });
        }

        // Delete the user
        const deletedUser = await userRepo.deleteUser(id);

        if (!deletedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Account and all associated data have been permanently deleted'
        });
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ error: 'Failed to delete account' });
    }
}

/**
 * GET /api/users/:id/stats
 * Fetch dashboard statistics for a user
 */
async function getUserStats(req, res) {
    try {
        const { id } = req.params;
        const stats = await userRepo.getUserStats(id);
        res.status(200).json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
}

/**
 * POST /api/users/:id/change-password
 * Change user password
 */
async function changePassword(req, res) {
    try {
        const { id } = req.params;
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ error: 'Old and new passwords are required' });
        }

        const userRes = await db.query('SELECT password_hash FROM users WHERE id = $1', [id]);
        if (userRes.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = userRes.rows[0];
        const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
        
        if (!isMatch) {
            return res.status(401).json({ error: 'Incorrect old password' });
        }

        const hash = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, id]);

        res.status(200).json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
}

module.exports = {
    getUserProfile,
    updateTouristProfile,
    updateGuideProfile,
    deleteAccount,
    getUserStats,
    changePassword
};
