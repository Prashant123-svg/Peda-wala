# Google OAuth Setup for Render Deployment

## Overview
The warning "⚠️ Google OAuth is not configured on the server" appears because these environment variables are missing on your Render backend:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL`

## Step 1: Get Your Google OAuth Credentials

You already have these credentials from your Google Cloud project. Copy them from your Google Cloud Console:
```
GOOGLE_CLIENT_ID: <YOUR_CLIENT_ID_FROM_GOOGLE_CLOUD>
GOOGLE_CLIENT_SECRET: <YOUR_CLIENT_SECRET_FROM_GOOGLE_CLOUD>
```

**⚠️ SECURITY:** Never commit your real credentials to Git! Always use Render's environment variables.

## Step 2: Set Environment Variables on Render Backend

1. Go to **Render Dashboard**: https://dashboard.render.com/
2. Select your **`pedhe-backend`** service
3. Click **Settings** → **Environment**
4. Add these 7 environment variables (or update if they exist):

| Variable | Value |
|----------|-------|
| `MONGO_URI` | Copy from your local `.env` |
| `JWT_SECRET` | Any random string, e.g., `your-jwt-secret-key-12345` |
| `ADMIN_EMAIL` | From your local `.env` |
| `ADMIN_PASSWORD` | From your local `.env` |
| `ADMIN_SECRET_KEY` | From your local `.env` |
| `GOOGLE_CLIENT_ID` | Copy from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Copy from Google Cloud Console |
| `GOOGLE_CALLBACK_URL` | `https://pedhe-backend.onrender.com/auth/google/callback` |
| `FRONTEND_URL` | `https://peda-wala.onrender.com` |
| `SESSION_SECRET` | Any random string, e.g., `your-session-secret-12345` |

**⚠️ Important:** Make sure `sync` is set to `false` for secret values so they're not exposed in version control.

5. Click **Save** and Render will **automatically restart** your backend

## Step 3: Update Google Cloud Console

1. Go to **Google Cloud Console**: https://console.cloud.google.com/
2. Navigate to **APIs & Services** → **Credentials**
3. Find your OAuth 2.0 Client ID (name: "Pedhe Wala" or similar)
4. Click **Edit** and ensure these are set:

**Authorized JavaScript Origins:**
```
https://peda-wala.onrender.com
https://pedhe-backend.onrender.com
```

**Authorized redirect URIs:**
```
https://pedhe-backend.onrender.com/auth/google/callback
```

5. Click **Save**

## Step 4: Verify Setup

After Render redeploys (wait 2-3 minutes), test:

### Test 1: Check OAuth Config Status
```
curl https://pedhe-backend.onrender.com/api/auth/debug/oauth-config
```

Expected response:
```json
{
  "message": "Google OAuth Configuration",
  "nodeEnv": "production",
  "googleOAuthConfigured": "✅ Yes",
  "googleClientId": "✅ Set",
  "googleClientSecret": "✅ Set",
  "googleCallbackUrl": "https://pedhe-backend.onrender.com/auth/google/callback",
  "frontendUrl": "https://peda-wala.onrender.com",
  "jwtSecret": "✅ Set"
}
```

### Test 2: Try Google Login
1. Open https://peda-wala.onrender.com/login
2. Click **"Login with Google"** button
3. You should see the Google login popup (no warning)
4. Complete Google authentication
5. You should be redirected to homepage with user data saved

### Test 3: Verify in Developer Console
1. Open DevTools (F12) → **Network** tab
2. Click Google login
3. Watch for requests to:
   - `pedhe-backend.onrender.com/auth/google` → Should redirect to Google
   - `accounts.google.com/...` → Google auth page
   - `pedhe-backend.onrender.com/auth/google/callback` → Should receive token + user
4. No errors in Console tab

## Troubleshooting

### Still seeing "⚠️ Google OAuth is not configured"?

**Check these:**
1. ✅ Environment variables are set on Render backend
2. ✅ Service has been restarted (Render does this automatically on env change)
3. ✅ Wait 2-3 minutes for changes to take effect
4. ✅ Hard refresh frontend (Ctrl+Shift+R) to clear browser cache
5. ✅ Check backend logs for any errors (Render Dashboard → Logs)

### Google login redirects to Google but then gets stuck?

**This means:**
- Backend is configured (✅)
- But Google OAuth callback might be failing

Check:
1. ✅ GOOGLE_CALLBACK_URL is exactly: `https://pedhe-backend.onrender.com/auth/google/callback`
2. ✅ Google Cloud Console has this URL in "Authorized redirect URIs"
3. ✅ Check Render backend logs for callback errors

### Google login gives "User already exists" error?

**This is normal!** It means:
- OAuth worked ✅
- User was created from Google profile
- Just login again, it should work

## How It Works (Backend)

1. **Frontend** sends GET to `/api/auth/google`
2. **Backend** checks if `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` are set
3. If NOT set → Returns 503 error (what you're seeing)
4. If set → Redirects user to Google login
5. **Google** authenticates user
6. **Google** calls `/api/auth/google/callback` with auth code
7. **Backend** exchanges code for user info, creates JWT token
8. **Backend** redirects to frontend with token + user data in URL
9. **Frontend** saves token to localStorage, shows success message, redirects to home

## Files Modified
- `render.yaml` - Already configured ✅
- `server/routes/auth.js` - Has all OAuth logic ✅
- `client/src/navigation/Login.tsx` - Checks OAuth status before showing button ✅

## Next Steps
1. ✅ Set env vars on Render backend (this guide)
2. ✅ Update Google Cloud Console
3. ✅ Test with curl and browser
4. ✅ If all working, you're done!
