const db = require('../config/db');

const places = [
  "Arugam Bay", "Pinnawala Elephant Orphanage", "Minneriya National Park", 
  "Adam's Bridge", "Jaffna Fort", "Nallur Kandaswamy temple", 
  "Pigeon Island National Park", "Trincomalee", "Nilaveli", 
  "Pasikudah", "Kalkudah", "Galle Face Green", "Viharamahadevi Park", 
  "Gangaramaya Temple", "Independence Memorial Hall", "Lotus Tower", 
  "Kelaniya Raja Maha Vihara", "Bundala National Park", 
  "Kumana National Park", "Gal Oya National Park", "Wilpattu National Park",
  "Wasgamuwa National Park", "Kaudulla National Park", "Lunugamvehera National Park",
  "Udawatta Kele Sanctuary", "Knuckles Mountain Range",
  "Bambarakanda Falls", "Diyaluma Falls", "Ravana Falls", "St. Clair's Falls",
  "Devon Falls", "Dunhinda Falls", "Baker's Falls", "Ramboda Falls", 
  "Bopath Ella", "Lipton's Seat", "Adisham Hall", "Hakgala Botanical Garden",
  "Seetha Amman Temple", "Gregory Lake", "Pidurutalagala",
  "Moon Plains", "Galway's Land National Park", "Jungle Beach, Unawatuna",
  "Hikkaduwa", "Bentota", "Beruwala", "Kalutara Bodhiya", 
  "Richmond Castle", "Kosgoda", "Madu River",
  "Galle Lighthouse", "National Museum of Colombo",
  "Colombo Dutch Museum", "Pettah Floating Market", "Seema Malaka", "Jami Ul-Alfar Mosque",
  "National Zoological Gardens of Sri Lanka", "Bellanwila Rajamaha Viharaya", "Weligama", 
  "Dickwella", "Tangalle", "Mulkirigala Raja Maha Vihara", "Kataragama temple",
  "Kiri Vehera", "Tissamaharama Raja Maha Vihara", "Sithulpawwa Rajamaha Viharaya",
  "Polonnaruwa Vatadage", "Rankoth Vehera", "Ritigala", 
  "Avukana Buddha statue", "Ruwanwelisaya", "Jetavanaramaya", "Abhayagiri Vihāra", 
  "Thuparamaya", "Lovamahapaya", "Mirisawetiya Vihara", "Isurumuniya", 
  "Mihintale", "Koneswaram Temple", "Fort Fredrick", "Marble Beach", 
  "Kanniya Hot Springs", "Batticaloa Fort",
  "Casuarina Beach", "Keerimalai", "Nagadeepa Purana Viharaya", "Nainativu",
  "Neduntheevu", "Point Pedro", "Elephant Pass", "Gadaladeniya Vihara", 
  "Lankatilaka Vihara", "Embekka Devalaya", "Bahirawakanda Vihara Buddha Statue",
  "Rumassala", "Ampara", "Koggala", "Kithulgala", "Negombo Beach", "Manawari Temple"
];

async function seed100() {
    console.log(`Starting to fetch & seed ${places.length} places from Wikipedia...`);
    let added = 0;
    
    for (const placeName of places) {
        try {
            // Fetch summary and coordinates from Wikipedia
const wpRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=extracts|coordinates&exintro&explaintext&titles=${encodeURIComponent(placeName)}&format=json`);
            const wpData = await wpRes.json();
            const pages = wpData.query.pages;
            const pageId = Object.keys(pages)[0];
            
            if (pageId === '-1') {
                console.log(`Skipped (not found): ${placeName}`);
                continue;
            }
            
            const page = pages[pageId];
            const description = page.extract ? page.extract.substring(0, 490) + '...' : `A beautiful and historic location: ${placeName}`;
            
            let lat = 7.8731; // Default roughly center of SL
            let lon = 80.7718;
            
            if (page.coordinates && page.coordinates.length > 0) {
                lat = page.coordinates[0].lat;
                lon = page.coordinates[0].lon;
            }
            
            // Insert into the database
            const query = `
                INSERT INTO places (name, description, latitude, longitude, category, image_url)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (name) DO NOTHING
            `;
            
            await db.query(query, [
                placeName,
                description,
                lat,
                lon,
                'Tourist Attraction',
                '' // Kept empty so the frontend fetches dynamic images
            ]);
            
            console.log(`\u2713 Added: ${placeName}`);
            added++;
            
            // Wait 100ms to be polite to Wikipedia API
            await new Promise(r => setTimeout(r, 100));
        } catch (err) {
            console.log(`Error adding ${placeName}:`, err.message);
        }
    }
    
    console.log(`Done! Added ${added} new places to the database.`);
    process.exit(0);
}

seed100();
