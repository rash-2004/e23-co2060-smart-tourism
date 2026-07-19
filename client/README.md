# Smart Tourism Management System - Client Code Documentation

## Overview
This is a comprehensive React-based frontend for the Smart Tourism Management System. It provides a complete user interface for exploring destinations, managing travel itineraries, finding travel guides, and sharing reviews.

## Project Structure

```
client/
├── public/
│   └── index.html
├── src/
│   ├── components/           # Reusable React components
│   │   ├── Navbar.js        # Navigation bar
│   │   ├── ProtectedRoute.js # Auth-protected routes
│   │   ├── PlaceCard.js     # Place listing card
│   │   ├── SearchBar.js     # Search functionality
│   │   └── ReviewForm.js    # Review submission form
│   ├── context/             # React Context for state management
│   │   ├── AuthContext.js   # Authentication state
│   │   └── PlaceContext.js  # Places and search state
│   ├── pages/               # Page components
│   │   ├── HomePage.js      # Landing page
│   │   ├── LoginPage.js     # User login
│   │   ├── RegisterPage.js  # User registration
│   │   ├── PlacesPage.js    # Browse all places
│   │   ├── PlaceDetailPage.js  # Place details & reviews
│   │   ├── TravelGuidePage.js  # Browse travel guides
│   │   ├── ItineraryPage.js   # Manage travel itineraries
│   │   └── DashboardPage.js   # User dashboard
│   ├── services/            # API communication
│   │   ├── api.js          # Axios config & interceptors
│   │   └── index.js        # API service methods
│   ├── App.js              # Main app component
│   ├── index.js            # Entry point
│   └── index.css           # Global styles
├── package.json
└── .env.example            # Environment variables template
```

## Key Features

### 1. **Authentication System**
- User registration (Tourist/Travel Guide roles)
- User login with JWT token
- Protected routes for authenticated users
- Auto-logout on token expiry

### 2. **Place Discovery**
- Browse all travel destinations
- Advanced search algorithm with fuzzy matching
- Location-based filtering using Haversine formula
- Detailed place information with reviews
- Place ratings and visitor feedback

### 3. **Travel Guide Portfolio**
- Browse experienced travel guides
- Filter guides by specialization
- View guide ratings and experience
- Contact guides (UI ready for backend integration)
- Portfolio viewing capability

### 4. **Itinerary Planning**
- Create custom travel itineraries
- Add/remove places from itineraries
- Organize places in travel sequence
- Set trip dates
- Drag-and-drop support (ready for implementation)

### 5. **Review System**
- Leave ratings and reviews for places
- View community reviews
- Star-based rating system
- Review moderation ready

### 6. **User Dashboard**
- View profile information
- Edit personal details
- System status monitoring
- Quick action buttons
- Statistics display

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

### Installation Steps

1. **Navigate to client directory:**
   ```bash
   cd client
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Setup environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and set your API URL (default: http://localhost:5000)

4. **Start the development server:**
   ```bash
   npm start
   ```
   The app will open at http://localhost:3000

## Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

### Code Structure Patterns

#### Authentication Context
```javascript
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, login, logout, isAuthenticated } = useAuth();
  // Use auth state and methods
}
```

#### Using Place Context
```javascript
import { usePlace } from '../context/PlaceContext';

function MyComponent() {
  const { 
    places, 
    searchPlaces, 
    filterPlacesByLocation 
  } = usePlace();
  // Use place data and filtering methods
}
```

#### API Service Calls
```javascript
import { placeService, itineraryService } from '../services';

// Get all places
const response = await placeService.getAllPlaces();

// Search places
const results = await placeService.searchPlaces('beach');

// Get user itineraries
const itineraries = await itineraryService.getUserItineraries();
```

## Search Algorithm Implementation

### 1. **Text Search**
- Case-insensitive substring matching
- Searches name, description, and category fields
- Located in `PlaceContext.searchPlaces()`

```javascript
const searchPlaces = (query) => {
  const lowerQuery = query.toLowerCase();
  return places.filter(place => 
    place.name.toLowerCase().includes(lowerQuery) ||
    place.description.toLowerCase().includes(lowerQuery)
  );
};
```

### 2. **Location-Based Search (Haversine Formula)**
- Calculates distance between user location and places
- Filters places within specified radius
- Located in `PlaceContext.filterPlacesByLocation()`

```javascript
const filterPlacesByLocation = (latitude, longitude, distanceKm = 10) => {
  // Uses Haversine formula for accurate distance calculation
  // Returns places within distanceKm
};
```

## API Endpoints Used

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Places
- `GET /api/places` - Get all places
- `GET /api/places/:id` - Get place details
- `POST /api/places` - Create new place (admin)
- `PUT /api/places/:id` - Update place (admin)
- `DELETE /api/places/:id` - Delete place (admin)
- `GET /api/places/search?q=query` - Search places
- `GET /api/places/nearby?latitude=X&longitude=Y&distance=Z` - Location search

### Travel Guides
- `GET /api/guides` - Get all guides
- `GET /api/guides/:id` - Get guide details
- `GET /api/guides/:id/portfolio` - Get guide portfolio
- `POST /api/guides/:id/rate` - Rate a guide

### Itineraries
- `GET /api/itineraries` - Get user's itineraries
- `GET /api/itineraries/:id` - Get itinerary details
- `POST /api/itineraries` - Create new itinerary
- `PUT /api/itineraries/:id` - Update itinerary
- `DELETE /api/itineraries/:id` - Delete itinerary
- `POST /api/itineraries/:id/places` - Add place to itinerary
- `DELETE /api/itineraries/:id/places/:placeId` - Remove place from itinerary
- `PUT /api/itineraries/:id/reorder` - Reorder places

### Reviews
- `GET /api/places/:id/reviews` - Get place reviews
- `POST /api/places/:id/reviews` - Submit review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile
- `GET /api/profiles/:userId` - Get user profile by ID

### System
- `GET /api/system/status` - Get system status

## Styling

The application uses:
- **CSS Grid & Flexbox** for layouts
- **Material Design principles** for UI
- **Responsive design** for mobile compatibility
- **Color Scheme**: Purple gradient (#667eea to #764ba2) with neutral grays

### Key Global Classes
- `.btn`, `.btn-primary`, `.btn-success`, `.btn-danger` - Button styles
- `.card` - Card container
- `.container` - Max-width container
- `.grid`, `.grid-cols-2`, `.grid-cols-3` - Grid layouts
- `.error`, `.success` - Alert messages

## Performance Optimization

1. **Code Splitting** - Route-based lazy loading ready
2. **Memoization** - useCallback in contexts for optimized re-renders
3. **Local Storage** - Persistent authentication state
4. **Axios Interceptors** - Automatic token injection and error handling

## Security Features

1. **JWT Token Management** - Tokens stored in localStorage
2. **Protected Routes** - Authentication required for certain pages
3. **CORS Configuration** - Server configured for frontend domain
4. **Input Validation** - Form validation on client side
5. **Password Security** - Backend uses bcrypt hashing

## Future Enhancements

1. **Drag-and-Drop Itinerary Reordering**
2. **Real-time Notifications**
3. **Map Integration** (Google Maps/Mapbox)
4. **Photo Uploads**
5. **Social Features** (Follow guides, share itineraries)
6. **Payment Integration**
7. **Multi-language Support**
8. **Dark Mode**
9. **Progressive Web App (PWA)**
10. **Offline Support**

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### API Connection Issues
- Ensure backend server is running on port 5000
- Check `.env.local` has correct API URL
- Verify CORS headers in backend

### Authentication Errors
- Clear browser localStorage and retry login
- Check token expiration in dev tools
- Verify email format matches server validation

### Performance Issues
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Network tab in DevTools for slow requests
- Consider implementing code splitting

## Contributing

1. Follow the existing component structure
2. Use hooks and functional components
3. Implement proper error handling
4. Add comments for complex logic
5. Test responsive design

## License

© 2024 Smart Tourism Management System. All rights reserved.

## Support

For issues or questions, contact the development team.
