const db = require('./src/config/db');

async function check() {
  const res = await db.query('SELECT id, name, latitude, longitude FROM places');
  const places = res.rows;
  
  const suspicious = places.filter(p => {
    const name = p.name.toLowerCase();
    return name.includes('beach') || name.includes('island') || name.includes('bridge') || name.includes('jungle');
  });
  
  console.log('--- SUSPICIOUS PLACES ---');
  suspicious.forEach(p => {
    console.log(`${p.id}: ${p.name} (${p.latitude}, ${p.longitude})`);
  });
  
  // Also check for default coords
  const defaults = places.filter(p => p.latitude == 7.8731 && p.longitude == 80.7718);
  console.log('\n--- DEFAULT COORDS PLACES ---');
  defaults.forEach(p => {
      console.log(`${p.id}: ${p.name}`);
  });

  process.exit(0);
}

check().catch(err => {
    console.error(err);
    process.exit(1);
});
