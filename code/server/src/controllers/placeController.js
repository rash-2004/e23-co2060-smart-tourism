const placeRepo = require('../repositories/placeRepo');

const getPlaces = async (req, res) => {
    try {
        const places = await placeRepo.getAllPlaces();
        res.status(200).json(places);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch places' });
    }
};

const addPlace = async (req, res) => {
    try {
        // We now destructure latitude and longitude instead of location
        const { name, description, latitude, longitude, image_url } = req.body;
        
        const newPlace = await placeRepo.createPlace(name, description, latitude, longitude, image_url);
        res.status(201).json(newPlace);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create place' });
    }
};

module.exports = { getPlaces, addPlace };