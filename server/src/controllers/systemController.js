const systemRepo = require('../repositories/systemRepo');

const getStatus = async (req, res) => {
    try {
        const dbTime = await systemRepo.getDatabaseStatus();
        res.status(200).json({
            status: 'Online',
            message: 'Smart Tourism API is running smoothly',
            database_time: dbTime.now
        });
    } catch (error) {
        res.status(500).json({ status: 'Error', message: error.message });
    }
};

module.exports = {
    getStatus
};