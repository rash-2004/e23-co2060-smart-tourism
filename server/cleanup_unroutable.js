const db = require('./src/config/db');

// GraphHopper free demo key
const GRAPHHOPPER_API_KEY = 'f8512521-29f8-40cc-ad0a-64bed3f3c40b';
const COLOMBO = [6.9271, 79.8612];

async function isRoutable(lat, lng) {
    const url = `https://graphhopper.com/api/1/route?point=${COLOMBO[0]},${COLOMBO[1]}&point=${lat},${lng}&vehicle=car&key=${GRAPHHOPPER_API_KEY}`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        return res.ok && data.paths && data.paths.length > 0;
    } catch (e) {
        return false;
    }
}

async function cleanup() {
    console.log('Starting unroutable place cleanup...');
    const res = await db.query('SELECT id, name, latitude, longitude FROM places');
    const places = res.rows;
    let deletedCount = 0;
    const suspicious = places.filter(p => {
        const name = p.name.toLowerCase();
        return name.includes('beach') || name.includes('island') || name.includes('bridge') || name.includes('jungle');
    });
    
    console.log(`Testing ${suspicious.length} potentially unroutable coastal places...`);
    
    for (const p of suspicious) {
        const lat = parseFloat(p.latitude);
        const lng = parseFloat(p.longitude);
        
        // Skip default/suspicious coordinates automatically or test them
        const routable = await isRoutable(lat, lng);
        
        if (!routable) {
            console.log(`X Removing unroutable place: ${p.name} (${lat}, ${lng})`);
            await db.query('DELETE FROM places WHERE id = $1', [p.id]);
            deletedCount++;
        } else {
            console.log(`\u2713 Keeping routable place: ${p.name}`);
        }
        
        // Wait 200ms to avoid API rate limit
        await new Promise(r => setTimeout(r, 200));
    }
    
    console.log(`\nCleanup complete. Removed ${deletedCount} unroutable places.`);
    process.exit(0);
}

cleanup().catch(err => {
    console.error(err);
    process.exit(1);
});
