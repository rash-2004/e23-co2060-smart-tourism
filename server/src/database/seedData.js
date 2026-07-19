const db = require('../config/db');
const bcrypt = require('bcrypt');

/**
 * SEED DATA SCRIPT
 * Populates database with sample travel destinations
 * Run this after migrations to initialize the app with demo data
 */

const samplePlaces = [
    {
        name: 'Sigiriya Rock Fortress',
        description: 'UNESCO World Heritage Site featuring a 5th-century palace built atop a 200-meter rock column. Known as the "Eighth Wonder of the World", it offers stunning views and ancient frescoes. One of Sri Lanka\'s most iconic attractions.',
        latitude: 7.9571,
        longitude: 80.7597,
        category: 'Historical',
        image_url: 'https://asianindigoleisurelanka.com/wp-content/uploads/2025/02/Sigiriya-8th-Wonder-Sri-Lanka.jpg'
    },
    {
        name: 'Temple of the Tooth (Sri Dalada Maligawa)',
        description: 'Most sacred Buddhist temple in Kandy, housing what is believed to be a tooth relic of Buddha. Located in the heart of Kandy with stunning architecture and religious significance. A UNESCO World Heritage Site.',
        latitude: 6.9270,
        longitude: 80.6353,
        category: 'Religious',
        image_url: 'https://lakshmisharath.com/wp-content/uploads/2022/09/Kandy-toothrelictemple-dawn.jpg'
    },
    {
        name: 'Anuradhapura Ancient City',
        description: 'One of the oldest continuously inhabited cities in the world and UNESCO World Heritage Site. Features ancient temples, stupas, and the sacred Bodhi tree. Capital of Sri Lanka for over 1000 years.',
        latitude: 8.3142,
        longitude: 80.4167,
        category: 'Historical',
        image_url: 'https://tse1.mm.bing.net/th/id/OIP.XKQ_kZfvxbfuoEVla1tymQHaEh?rs=1&pid=ImgDetMain&o=7&rm=3'
    },
    {
        name: 'Polonnaruwa Ancient City',
        description: 'Second ancient capital of Sri Lanka featuring magnificent Buddhist temples and palaces from the 12th century. Famous for the Gal Vihara statue and intricate stone carvings. UNESCO World Heritage Site.',
        latitude: 7.9357,
        longitude: 81.0067,
        category: 'Historical',
        image_url: 'https://www.bluelankatours.com/wp-content/uploads/2020/02/DSC9479-copy.jpg'
    },
    {
        name: 'Ella Rock',
        description: 'Scenic mountain peak in the central highlands offering panoramic views of tea plantations and valleys. Popular hiking destination with a relatively easy trek. Located near Nine Arch Bridge.',
        latitude: 6.8667,
        longitude: 81.0433,
        category: 'Nature',
        image_url: 'https://th.bing.com/th/id/R.890715fe2c2fd2f34bfff7139ed9a253?rik=k3lC8NCLUdQ85A&riu=http%3a%2f%2fmochilerosviajeros.com%2fwp-content%2fuploads%2f2019%2f03%2fElla-Rock.jpg&ehk=3s1wfZtKv5Eg%2fvQ9NHILuPl%2btRGdwnoy31wcVUnQClA%3d&risl=&pid=ImgRaw&r=0'
    },
    {
        name: 'Adam\'s Peak (Sri Pada)',
        description: 'Sacred mountain with a footprint-shaped depression on its summit revered by Buddhists, Hindus, and Muslims. Elevation 2,243m with 5,500 steps to reach the peak. Spiritual pilgrimage destination.',
        latitude: 6.8092,
        longitude: 80.7608,
        category: 'Religious',
        image_url: 'https://tse4.mm.bing.net/th/id/OIP.Dnq5LTSnsGPNZqMvAN_8nQHaFB?rs=1&pid=ImgDetMain&o=7&rm=3'
    },
    {
        name: 'Nine Arch Bridge',
        description: 'Iconic colonial-era railway bridge built in 1921 with nine stone arches. Located in Ella, it\'s one of the most photographed bridges in Sri Lanka. Surrounded by lush green valleys and tea plantations.',
        latitude: 6.8431,
        longitude: 81.1178,
        category: 'Monument',
        image_url: 'https://i0.wp.com/www.tourbooking.lk/wp-content/uploads/2023/02/Nine-Arch-Bridge.jpg?fit=1920%2C1080&ssl=1'
    },
    {
        name: 'Mirissa Beach',
        description: 'Tropical beach in southern Sri Lanka known for whale watching (November-March) and spectacular sunsets. Pristine white sand and clear waters. Popular base for exploring the south coast.',
        latitude: 5.9412,
        longitude: 80.7773,
        category: 'Beach',
        image_url: 'https://i.pinimg.com/originals/e6/7b/18/e67b18f636852de9ca74b734503ac466.jpg'
    },
    {
        name: 'Unawatuna Beach',
        description: 'Picturesque crescent-shaped beach near Galle with golden sand and calm waters. Perfect for swimming, snorkeling, and water sports. Vibrant beach town with restaurants and accommodations.',
        latitude: 6.0238,
        longitude: 80.7777,
        category: 'Beach',
        image_url: 'https://turystycznyninja.pl/wp-content/uploads/2023/01/Unawatuna-Beach-Sri-Lanka-shutterstock.com-Marius-Dobilas.jpg'
    },
    {
        name: 'Galle Fort',
        description: 'UNESCO World Heritage Site and 16th-century coastal fort built by the Portuguese. Completely surrounded by a massive fortified wall with historic significance. Features colonial architecture and museums.',
        latitude: 6.0287,
        longitude: 80.2180,
        category: 'Historical',
        image_url: 'https://www.lankaislandproperties.com/wp-content/uploads/2021/11/Galle-Fort.jpg'
    },
    {
        name: 'Nuwara Eliya',
        description: 'Hill station in central highlands at 1,868m elevation. Known as "Little England" with colonial architecture, golf course, and cool climate. Gateway to Horton Plains and scenic tea country.',
        latitude: 6.9271,
        longitude: 80.7850,
        category: 'Nature',
        image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400'
    },
    {
        name: 'Horton Plains National Park',
        description: 'Scenic plateau with stunning views, hiking trails, and unique flora/fauna. Famous for the "World\'s End" cliff viewpoint and Baker\'s Falls. Altitude 2,100m-2,295m with cool mountain climate.',
        latitude: 6.8217,
        longitude: 80.8358,
        category: 'Nature',
        image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400'
    },
    {
        name: 'Kandy Lake',
        description: 'Artificial lake in the heart of Kandy surrounded by walking paths, gardens, and temples. Built in 1807, it\'s an iconic landmark with reflection of hills and temples. Evening strolls are popular.',
        latitude: 6.9271,
        longitude: 80.6353,
        category: 'Nature',
        image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400'
    },
    {
        name: 'Dambulla Cave Temple',
        description: 'Sacred Buddhist temple complex with five caves containing 153 Buddha statues and intricate murals. Five stories high with gold roof. One of the oldest and most visited cave temples in Sri Lanka.',
        latitude: 7.8674,
        longitude: 80.6596,
        category: 'Religious',
        image_url: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=600&h=400'
    },
    {
        name: 'Peradeniya Botanical Gardens',
        description: 'Lush botanical gardens near Kandy covering 147 acres. Home to over 4,000 species of plants, orchids, and giant bamboo. Scenic walking paths along the Mahaweli River.',
        latitude: 7.2705,
        longitude: 80.5916,
        category: 'Nature',
        image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400'
    },
    {
        name: 'Colombo National Museum',
        description: 'Premier museum featuring Sri Lankan art, artifacts, and natural history exhibits. Housed in a Victorian building with collections spanning from prehistoric times to modern era. Includes royal regalia and Buddhist sculptures.',
        latitude: 6.8721,
        longitude: 80.6325,
        category: 'Museum',
        image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400'
    },
    {
        name: 'Mount Lavinia Beach',
        description: 'Golden sandy beach in Colombo suburb with calm waters and vibrant atmosphere. Named after a legendary love story. Home to Mount Lavinia Hotel and water sports facilities.',
        latitude: 6.8475,
        longitude: 80.7662,
        category: 'Beach',
        image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400'
    },
    {
        name: 'Uda Walawe National Park',
        description: 'Large national park known for elephant herds, buffalo, and diverse wildlife. 30,821 hectares with scenic landscape and reservoir. Popular for safari tours and wildlife photography.',
        latitude: 6.4671,
        longitude: 80.8186,
        category: 'Wildlife',
        image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400'
    },
    {
        name: 'Sinharaja Rainforest',
        description: 'UNESCO World Heritage tropical rainforest with rich biodiversity. Home to endemic species including leopards, elephants, and rare birds. Pristine wilderness perfect for nature lovers and birdwatchers.',
        latitude: 6.4233,
        longitude: 80.4213,
        category: 'Nature',
        image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400'
    },
    {
        name: 'Yala National Park',
        description: 'Largest national park in Sri Lanka with highest concentration of leopards. Covers 97,881 hectares with savanna landscape. Excellent for safari tours and spotting elephants, crocodiles, and birds.',
        latitude: 6.1900,
        longitude: 81.5150,
        category: 'Wildlife',
        image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400'
    }
];

const sampleGuides = [
    {
        email: 'guide1@example.com',
        password: 'password123',
        full_name: 'Dinesh Perera',
        bio: 'Expert historical guide with 10 years of experience in the Cultural Triangle. Specializing in Sigiriya and Polonnaruwa history.',
        license_number: 'GUIDE-SL-001',
        hourly_rate: 15.00,
        contact_number: '+94 77 123 4567',
        profile_image_url: 'https://img.freepik.com/free-photo/portrait-handsome-young-man-with-crossed-arms_23-2148202507.jpg',
        specialization: 'Historical & Cultural',
        experience_years: 10,
        languages: 'English, Sinhala, Japanese',
        covered_locations: 'Sigiriya'
    },
    {
        email: 'guide2@example.com',
        password: 'password123',
        full_name: 'Sarah Wijesinghe',
        bio: 'Adventure and nature enthusiast. I lead trekking trips to Ella Rock and Adam\'s Peak. Certified first aid responder.',
        license_number: 'GUIDE-SL-002',
        hourly_rate: 12.50,
        contact_number: '+94 71 987 6543',
        profile_image_url: 'https://img.freepik.com/free-photo/young-beautiful-woman-smiling-outside_1150-13757.jpg',
        specialization: 'Adventure & Trekking',
        experience_years: 5,
        languages: 'English, Sinhala, French',
        covered_locations: 'Ella Rock'
    },
    {
        email: 'guide3@example.com',
        password: 'password123',
        full_name: 'Kamal Silva',
        bio: 'Wildlife expert specializing in Yala and Uda Walawe safaris. I know the best spots for leopard sightings!',
        license_number: 'GUIDE-SL-003',
        hourly_rate: 18.00,
        contact_number: '+94 76 555 4444',
        profile_image_url: 'https://img.freepik.com/free-photo/handsome-bearded-man-wearing-casual-white-shirt_273609-12580.jpg',
        specialization: 'Wildlife Safari',
        experience_years: 12,
        languages: 'English, Sinhala, German',
        covered_locations: 'Yala National Park'
    },
    {
        email: 'guide4@example.com',
        password: 'password123',
        full_name: 'Ruwan Jayasinghe',
        bio: 'Friendly cultural guide who enjoys storytelling around ancient kingdoms and temples.',
        license_number: 'GUIDE-SL-004',
        hourly_rate: 14.00,
        contact_number: '+94 77 234 5678',
        profile_image_url: 'https://img.freepik.com/free-photo/smiling-man-standing-outdoors_23-2148751657.jpg',
        specialization: 'Cultural Trails',
        experience_years: 7,
        languages: 'English, Sinhala',
        covered_locations: 'Sigiriya Rock Fortress, Dambulla Cave Temple, Polonnaruwa Ancient City'
    },
    {
        email: 'guide5@example.com',
        password: 'password123',
        full_name: 'Nimali Fernando',
        bio: 'Nature guide focused on hill country walks and tea-country viewpoints.',
        license_number: 'GUIDE-SL-005',
        hourly_rate: 13.50,
        contact_number: '+94 71 112 3344',
        profile_image_url: 'https://img.freepik.com/free-photo/portrait-beautiful-woman-smiling_23-2148746285.jpg',
        specialization: 'Hill Country Nature',
        experience_years: 6,
        languages: 'English, Sinhala, Tamil',
        covered_locations: 'Nuwara Eliya, Horton Plains National Park, Ella Rock'
    },
    {
        email: 'guide6@example.com',
        password: 'password123',
        full_name: 'Tharindu Madushan',
        bio: 'South coast specialist with strong knowledge of beaches and colonial heritage.',
        license_number: 'GUIDE-SL-006',
        hourly_rate: 16.00,
        contact_number: '+94 76 778 8899',
        profile_image_url: 'https://img.freepik.com/free-photo/happy-young-man-with-beard_23-2147619893.jpg',
        specialization: 'Beach & Heritage',
        experience_years: 8,
        languages: 'English, Sinhala',
        covered_locations: 'Galle Fort, Unawatuna Beach, Mirissa Beach'
    },
    {
        email: 'guide7@example.com',
        password: 'password123',
        full_name: 'Sajani Rathnayake',
        bio: 'Experienced pilgrimage and temple route planner for spiritual travelers.',
        license_number: 'GUIDE-SL-007',
        hourly_rate: 12.00,
        contact_number: '+94 75 223 4455',
        profile_image_url: 'https://img.freepik.com/free-photo/close-up-portrait-young-woman_23-2149157790.jpg',
        specialization: 'Religious Tours',
        experience_years: 9,
        languages: 'English, Sinhala, Hindi',
        covered_locations: 'Temple of the Tooth (Sri Dalada Maligawa), Adam\'s Peak (Sri Pada), Dambulla Cave Temple'
    },
    {
        email: 'guide8@example.com',
        password: 'password123',
        full_name: 'Chathura Weerakoon',
        bio: 'Wildlife tracker who organizes responsible safaris and birding routes.',
        license_number: 'GUIDE-SL-008',
        hourly_rate: 18.50,
        contact_number: '+94 70 990 2211',
        profile_image_url: 'https://img.freepik.com/free-photo/young-man-portrait-city_23-2148886997.jpg',
        specialization: 'Wildlife & Birding',
        experience_years: 11,
        languages: 'English, Sinhala',
        covered_locations: 'Yala National Park, Uda Walawe National Park, Sinharaja Rainforest'
    },
    {
        email: 'guide9@example.com',
        password: 'password123',
        full_name: 'Madhavi Senanayake',
        bio: 'City and museum guide helping travelers discover Colombo and nearby highlights.',
        license_number: 'GUIDE-SL-009',
        hourly_rate: 11.50,
        contact_number: '+94 74 556 7788',
        profile_image_url: 'https://img.freepik.com/free-photo/portrait-smiling-young-woman_23-2148139150.jpg',
        specialization: 'City Discovery',
        experience_years: 4,
        languages: 'English, Sinhala, Tamil',
        covered_locations: 'Colombo National Museum, Mount Lavinia Beach'
    },
    {
        email: 'guide10@example.com',
        password: 'password123',
        full_name: 'Kasun Dilshan',
        bio: 'Historical and photography guide with special love for UNESCO sites.',
        license_number: 'GUIDE-SL-010',
        hourly_rate: 17.00,
        contact_number: '+94 77 665 4433',
        profile_image_url: 'https://img.freepik.com/free-photo/man-portrait-looking-camera_23-2148887002.jpg',
        specialization: 'History & Photography',
        experience_years: 10,
        languages: 'English, Sinhala, French',
        covered_locations: 'Anuradhapura Ancient City, Polonnaruwa Ancient City, Sigiriya Rock Fortress'
    },
    {
        email: 'guide11@example.com',
        password: 'password123',
        full_name: 'Iresha Wickramasinghe',
        bio: 'Tea-country and scenic rail journey expert with relaxed itineraries.',
        license_number: 'GUIDE-SL-011',
        hourly_rate: 13.00,
        contact_number: '+94 78 331 2299',
        profile_image_url: 'https://img.freepik.com/free-photo/beautiful-woman-portrait_23-2148844333.jpg',
        specialization: 'Scenic Highlands',
        experience_years: 6,
        languages: 'English, Sinhala',
        covered_locations: 'Nine Arch Bridge, Ella Rock, Nuwara Eliya'
    },
    {
        email: 'guide12@example.com',
        password: 'password123',
        full_name: 'Prabath Mendis',
        bio: 'Calm and detail-oriented guide for Kandy region and botanical tours.',
        license_number: 'GUIDE-SL-012',
        hourly_rate: 12.75,
        contact_number: '+94 71 441 9922',
        profile_image_url: 'https://img.freepik.com/free-photo/portrait-smiling-young-man_23-2148531380.jpg',
        specialization: 'Kandy Region',
        experience_years: 7,
        languages: 'English, Sinhala',
        covered_locations: 'Kandy Lake, Temple of the Tooth (Sri Dalada Maligawa), Peradeniya Botanical Gardens'
    },
    {
        email: 'guide13@example.com',
        password: 'password123',
        full_name: 'Rashmi Peris',
        bio: 'Coastal route planner for families seeking safe, easygoing experiences.',
        license_number: 'GUIDE-SL-013',
        hourly_rate: 14.25,
        contact_number: '+94 72 118 8822',
        profile_image_url: 'https://img.freepik.com/free-photo/young-woman-outdoor-portrait_23-2148231836.jpg',
        specialization: 'Family Coastal Tours',
        experience_years: 5,
        languages: 'English, Sinhala',
        covered_locations: 'Mirissa Beach, Unawatuna Beach, Galle Fort, Mount Lavinia Beach'
    },
    {
        email: 'guide14@example.com',
        password: 'password123',
        full_name: 'Lakshan Gunawardena',
        bio: 'Adventure-first guide for treks, sunrise climbs, and mountain routes.',
        license_number: 'GUIDE-SL-014',
        hourly_rate: 16.50,
        contact_number: '+94 75 995 1166',
        profile_image_url: 'https://img.freepik.com/free-photo/young-man-smiling-camera_23-2148019954.jpg',
        specialization: 'Adventure Trekking',
        experience_years: 9,
        languages: 'English, Sinhala',
        covered_locations: 'Adam\'s Peak (Sri Pada), Horton Plains National Park, Ella Rock'
    },
    {
        email: 'guide15@example.com',
        password: 'password123',
        full_name: 'Dilmi Abeysekera',
        bio: 'Museum and heritage specialist who offers deep cultural context.',
        license_number: 'GUIDE-SL-015',
        hourly_rate: 12.25,
        contact_number: '+94 77 459 2311',
        profile_image_url: 'https://img.freepik.com/free-photo/close-up-smiley-woman_23-2149157796.jpg',
        specialization: 'Museum & Heritage',
        experience_years: 5,
        languages: 'English, Sinhala, Japanese',
        covered_locations: 'Colombo National Museum, Anuradhapura Ancient City'
    },
    {
        email: 'guide16@example.com',
        password: 'password123',
        full_name: 'Heshan Karunaratne',
        bio: 'Rugged safari planner with efficient routes across southern wildlife parks.',
        license_number: 'GUIDE-SL-016',
        hourly_rate: 19.00,
        contact_number: '+94 76 224 6677',
        profile_image_url: 'https://img.freepik.com/free-photo/portrait-handsome-man_23-2148859448.jpg',
        specialization: 'Safari Logistics',
        experience_years: 13,
        languages: 'English, Sinhala, German',
        covered_locations: 'Yala National Park, Uda Walawe National Park'
    },
    {
        email: 'guide17@example.com',
        password: 'password123',
        full_name: 'Piumi Jayawardena',
        bio: 'Eco-travel host focusing on rainforest biodiversity and conservation.',
        license_number: 'GUIDE-SL-017',
        hourly_rate: 15.25,
        contact_number: '+94 70 771 4433',
        profile_image_url: 'https://img.freepik.com/free-photo/portrait-young-woman-street_23-2149085594.jpg',
        specialization: 'Eco Tourism',
        experience_years: 8,
        languages: 'English, Sinhala',
        covered_locations: 'Sinharaja Rainforest, Horton Plains National Park'
    },
    {
        email: 'guide18@example.com',
        password: 'password123',
        full_name: 'Nadeesha Liyanage',
        bio: 'Balanced all-round guide handling mixed itineraries from coast to highlands.',
        license_number: 'GUIDE-SL-018',
        hourly_rate: 14.75,
        contact_number: '+94 71 843 2290',
        profile_image_url: 'https://img.freepik.com/free-photo/young-lady-smiling_23-2148126733.jpg',
        specialization: 'Multi-Region Trips',
        experience_years: 7,
        languages: 'English, Sinhala, Tamil',
        covered_locations: 'Sigiriya Rock Fortress, Kandy Lake, Nine Arch Bridge, Mirissa Beach'
    },
    {
        email: 'guide19@example.com',
        password: 'password123',
        full_name: 'Suren Pathirana',
        bio: 'Fast-paced route specialist for travelers who want to cover more in less time.',
        license_number: 'GUIDE-SL-019',
        hourly_rate: 13.75,
        contact_number: '+94 74 600 1188',
        profile_image_url: 'https://img.freepik.com/free-photo/young-handsome-man-studio_23-2149013388.jpg',
        specialization: 'Express Itineraries',
        experience_years: 6,
        languages: 'English, Sinhala',
        covered_locations: 'Polonnaruwa Ancient City, Dambulla Cave Temple, Temple of the Tooth (Sri Dalada Maligawa)'
    },
    {
        email: 'guide20@example.com',
        password: 'password123',
        full_name: 'Amaya Hettiarachchi',
        bio: 'Photogenic location specialist helping content creators and couples.',
        license_number: 'GUIDE-SL-020',
        hourly_rate: 15.00,
        contact_number: '+94 75 334 8890',
        profile_image_url: 'https://img.freepik.com/free-photo/pretty-smiling-woman_23-2148231830.jpg',
        specialization: 'Photo Tours',
        experience_years: 8,
        languages: 'English, Sinhala, French',
        covered_locations: 'Nine Arch Bridge, Galle Fort, Nuwara Eliya, Unawatuna Beach'
    },
    {
        email: 'guide21@example.com',
        password: 'password123',
        full_name: 'Ravindu Senarath',
        bio: 'Heritage and religion focused guide for reflective and educational journeys.',
        license_number: 'GUIDE-SL-021',
        hourly_rate: 12.90,
        contact_number: '+94 78 919 5500',
        profile_image_url: 'https://img.freepik.com/free-photo/portrait-young-man_23-2148872780.jpg',
        specialization: 'Heritage Pilgrimage',
        experience_years: 9,
        languages: 'English, Sinhala',
        covered_locations: 'Anuradhapura Ancient City, Temple of the Tooth (Sri Dalada Maligawa), Adam\'s Peak (Sri Pada)'
    },
    {
        email: 'guide22@example.com',
        password: 'password123',
        full_name: 'Viduni Cooray',
        bio: 'Wellness and slow-travel guide with calm pacing and personalized support.',
        license_number: 'GUIDE-SL-022',
        hourly_rate: 11.90,
        contact_number: '+94 72 901 4477',
        profile_image_url: 'https://img.freepik.com/free-photo/cheerful-young-woman_23-2148231840.jpg',
        specialization: 'Wellness Retreats',
        experience_years: 4,
        languages: 'English, Sinhala',
        covered_locations: 'Peradeniya Botanical Gardens, Kandy Lake, Mount Lavinia Beach'
    },
    {
        email: 'guide23@example.com',
        password: 'password123',
        full_name: 'Janaka Rodrigo',
        bio: 'Senior island-wide guide for long routes combining history, beaches, and wildlife.',
        license_number: 'GUIDE-SL-023',
        hourly_rate: 20.00,
        contact_number: '+94 77 880 3344',
        profile_image_url: 'https://img.freepik.com/free-photo/happy-bearded-man-portrait_23-2148764738.jpg',
        specialization: 'Island-Wide Premium Tours',
        experience_years: 15,
        languages: 'English, Sinhala, Tamil, German',
        covered_locations: 'Sigiriya Rock Fortress, Temple of the Tooth (Sri Dalada Maligawa), Yala National Park, Mirissa Beach, Colombo National Museum'
    }
];

async function seedDatabase() {
    try {
        console.log('Starting database seeding...');

        // Insert sample places
        for (const place of samplePlaces) {
            const query = `
                INSERT INTO places (name, description, latitude, longitude, category, image_url)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (name) DO NOTHING
            `;
            
            await db.query(query, [
                place.name,
                place.description,
                place.latitude,
                place.longitude,
                place.category,
                place.image_url
            ]);

            console.log(`✓ Added: ${place.name}`);
        }

        // Insert sample guides
        console.log('\nSeeding travel guides...');
        for (const guide of sampleGuides) {
            // 1. Create User
            const saltRounds = 10;
            const passwordHash = await bcrypt.hash(guide.password, saltRounds);
            
            const userResult = await db.query(
                `INSERT INTO users (email, password_hash, role) 
                 VALUES ($1, $2, 'guide') 
                 ON CONFLICT (email) DO UPDATE SET role = 'guide'
                 RETURNING id`,
                [guide.email, passwordHash]
            );
            
            const userId = userResult.rows[0].id;

            // 2. Create Guide Profile
            const profileQuery = `
                INSERT INTO guide_profiles 
                (user_id, full_name, bio, license_number, hourly_rate, contact_number, profile_image_url, specialization, experience_years, languages, covered_locations, is_approved)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, TRUE)
                ON CONFLICT (user_id) DO UPDATE SET 
                    full_name = $2, bio = $3, license_number = $4, hourly_rate = $5,
                    contact_number = $6, profile_image_url = $7, specialization = $8,
                    experience_years = $9, languages = $10, covered_locations = $11, is_approved = TRUE
            `;
            
            await db.query(profileQuery, [
                userId, guide.full_name, guide.bio, guide.license_number, guide.hourly_rate,
                guide.contact_number, guide.profile_image_url, guide.specialization,
                guide.experience_years, guide.languages, guide.covered_locations
            ]);

            console.log(`✓ Added Guide: ${guide.full_name}`);
        }

        console.log('\n✓ Database seeding completed successfully!');
        console.log(`Total places added: ${samplePlaces.length}`);

    } catch (error) {
        console.error('Error seeding database:', error);
        throw error;
    }
}

// Run seed if this file is executed directly
if (require.main === module) {
    seedDatabase()
        .then(() => {
            console.log('Seed script completed');
            process.exit(0);
        })
        .catch(error => {
            console.error('Seed script failed:', error);
            process.exit(1);
        });
}

module.exports = { seedDatabase };
