# Google OAuth Setup Guide

## Overview
This guide explains how to set up Google OAuth 2.0 authentication for the Pedhe Wale application.

## Prerequisites
- Google Cloud Project with OAuth 2.0 credentials
- Redirect URIs configured in Google Cloud Console

## Environment Variables Required

Add these to your `.env` file in the `server` folder:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Step-by-Step Setup

### 1. Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API

### 2. Create OAuth 2.0 Credentials
1. Navigate to **Credentials** in the sidebar
2. Click **Create Credentials** → **OAuth 2.0 Client IDs**
3. Choose **Web application**
4. Set **Application name** to "Pedhe Wale"

### 3. Configure Authorized Redirect URIs
Add these redirect URIs in the Google Cloud Console:

**For Development:**
```
http://localhost:3001/login
http://localhost:5000/api/auth/google/callback
```

**For Production:**
```
https://peda-wala.onrender.com/login
https://pedhe-backend.onrender.com/api/auth/google/callback
```

### 4. Copy Your Credentials
- Copy the **Client ID** and **Client Secret**
- Add them to your `.env` file

## Backend Configuration (Already Set Up)

The backend is already configured with:
- **Route:** `/api/auth/google` - Initiates Google login
- **Callback Route:** `/api/auth/google/callback` - Handles OAuth callback
- **Serialization:** User session management
- **Token Generation:** JWT token created on successful login

### Files Modified:
- `server/routes/auth.js` - Google OAuth routes and Passport strategy
- `server/server.js` - Session and Passport middleware

## Frontend Configuration (Already Set Up)

The login page now includes:
- **Google Login Button** - Triggers OAuth flow
- **Callback Handler** - Processes redirect from Google
- **Token Storage** - Saves JWT and user data to localStorage
- **Auto-Redirect** - Redirects to home on successful login

### Files Modified:
- `client/src/navigation/Login.tsx` - Added Google login functionality

## How It Works

### Login Flow:
1. User clicks **"Login with Google"** button on login page
2. Redirected to Google consent screen
3. User grants permissions
4. Google redirects back to: `/api/auth/google/callback`
5. Backend creates JWT token with user data
6. Backend redirects to frontend with token in URL: `/?token=...&user=...`
7. Frontend receives token/user data and saves to localStorage
8. User is redirected to home page

### User Data Stored:
```javascript
localStorage.setItem("token", token);              // JWT token
localStorage.setItem("userId", user.id);          // MongoDB user ID
localStorage.setItem("userName", user.name);      // User's name
localStorage.setItem("userEmail", user.email);    // User's email
localStorage.setItem("userRole", user.role);      // User's role
```

## Database Integration

When a user logs in with Google:
1. Backend checks if user exists by email
2. If new user:
   - Creates user with `googleId`, `name`, `email`
   - Sets role to "user"
   - Saves to MongoDB
3. If existing user:
   - Retrieves user data
   - Creates JWT token
   - Redirects with token

## Testing

### Local Testing:
1. Set up localhost in Google Console redirect URIs
2. Add credentials to `.env`
3. Run: `npm run dev` in both `client` and `server` folders
4. Visit: `http://localhost:5173/login`
5. Click "Login with Google"

### Production Testing:
1. Update redirect URIs in Google Console
2. Update `.env` on Render/deployment platform
3. Test login flow on deployed URLs

## Troubleshooting

### "Redirect URI mismatch"
- Ensure redirect URIs match exactly in Google Console
- No trailing slashes unless configured
- Match http/https exactly

### "Invalid client ID"
- Verify GOOGLE_CLIENT_ID in `.env`
- Check it matches Google Console
- Restart the backend server

### User not created
- Check MongoDB connection
- Verify User model has `googleId` field
- Check server logs for errors

### Token not stored
- Open browser DevTools Console
- Check Network tab for `/auth/google/callback` response
- Verify URL parameters contain token and user data

## Security Notes

✅ **Implemented:**
- Secure session management
- JWT token expiration (1 day)
- HttpOnly cookies in production
- HTTPS enforcement in production

⚠️ **Additional Recommendations:**
- Use strong SESSION_SECRET in production
- Implement CSRF protection
- Validate token on backend before API calls
- Refresh token strategy for longer sessions

## API Endpoints

### Initiate Google Login
```
GET /api/auth/google
```
Redirects to Google consent screen

### Google OAuth Callback
```
GET /api/auth/google/callback
```
Handled by Passport automatically, redirects to frontend with token

### Get User Profile (Requires Auth)
```
GET /api/auth/profile
Headers: Authorization: Bearer {token}
```

## Next Steps

1. ✅ Install packages: `npm install passport passport-google-oauth20 express-session`
2. ✅ Update backend with Google OAuth routes
3. ✅ Update frontend Login component
4. 📝 Add environment variables to `.env`
5. 🧪 Test login flow
6. 🚀 Deploy to Render/production

## Support

For issues or questions:
- Check browser console for errors
- Check server logs: `npm run dev`
- Verify environment variables are set
- Test with different Google accounts

---

**Last Updated:** 2026-05-02
**Status:** Ready for testing
