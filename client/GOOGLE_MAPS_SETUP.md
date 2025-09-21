# Google Maps & OAuth Setup

To use the map features and authentication in K-Mate, you need to set up both Google Maps API and Google OAuth.

## Steps:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API (for map functionality)
   - Google+ API (for OAuth login)
4. Create credentials:
   - **API Key**: For Maps JavaScript API and Places API
   - **OAuth 2.0 Client ID**: For Google login
5. Configure OAuth consent screen with your app details
6. Restrict the API key to your domain for security
7. Set up environment variables for both frontend and backend

### Frontend Environment Setup:

1. In the `client/` directory, copy `.env.example` to `.env.local`:
   ```bash
   cd client
   cp .env.example .env.local
   ```

2. Edit `client/.env.local` and add your API key:
   ```env
   VITE_GOOGLE_MAPS_API_KEY=your_actual_google_maps_api_key_here
   ```

### Backend Environment Setup:

1. In the `server/` directory, set up your `.env` file:
   ```bash
   cd server
   # Add to your .env file:
   ```

2. Add these OAuth credentials to `server/.env`:
   ```env
   GOOGLE_CLIENT_ID=your_oauth_client_id_here
   GOOGLE_CLIENT_SECRET=your_oauth_client_secret_here
   GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
   ```

3. The key will be automatically injected into `index.html` during build

### Security Notes:
- `.env.local` is in `.gitignore` so your API key won't be committed
- Use `.env.example` as a template for other developers
- For production, set the environment variable on your hosting platform

## Current Features:

### Authentication:
- **Google OAuth Login**: Users can log in with their Google account
- **Role-based Access**: Admin and user roles with different permissions
- **Account Selection**: Force account picker for testing multiple accounts

### Map Features:
- **Place Search**: Search for places in Korea using Google Places API
- **Autocomplete**: Real-time place suggestions as you type
- **Interactive Map**: Visual map with marker placement
- **Place Details**: Shows Place ID, coordinates, and other details
- **Category Management**: Organize markers by K-Travel, K-Food, K-Cafe
- **CRUD Operations**: Add, edit, delete markers (admin only)

### Admin Panel:
- **사용자 관리**: Manage users and admin roles
- **K-Map 관리**: Manage map markers and locations
- **Dual Mode**: Works online (API mode) and offline (local mode)

## Usage:

### For Regular Users:
1. Visit the site and login with Google
2. Browse K-Map to see places
3. Add new places using "새 마커 추가"

### For Admins:
1. Login as admin account
2. Access Admin Page → various management features
3. K-Map 관리: View, edit, delete all markers
4. 사용자 관리: Manage user roles and accounts

## Important Notes:
- **API Mode**: Requires backend server running with database
- **Local Mode**: Fallback mode using browser storage
- **Admin Features**: Only available to users with admin role