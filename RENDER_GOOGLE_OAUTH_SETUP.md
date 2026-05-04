# Render + Google OAuth Setup Guide for Pedhe Wala

This file contains copy-ready steps to configure Google OAuth for the Pedhe Wala app deployed on Render.

Backend host: https://pedhe-backend.onrender.com
Frontend host: https://peda-wala.onrender.com

---

## 1) Required environment variables (Backend service)
Add these to your Render backend service (Settings → Environment → Environment Variables). Use Render's secret/env UI (do NOT commit secrets to the repo).

- `GOOGLE_CLIENT_ID` = your-google-client-id.apps.googleusercontent.com
- `GOOGLE_CLIENT_SECRET` = your-google-client-secret
- `GOOGLE_CALLBACK_URL` = https://pedhe-backend.onrender.com/auth/google/callback
- `FRONTEND_URL` = https://peda-wala.onrender.com
- `JWT_SECRET` = a long random secret (keep private)
- `SESSION_SECRET` = a long random secret (used by express-session)
- `NODE_ENV` = production

Notes:
- `GOOGLE_CALLBACK_URL` must exactly match the Authorized redirect URI you set in Google Cloud.
- Use Render's Environment Secrets or protected env fields where possible.

---

## 2) Frontend environment variable (Client service)
Add this to your frontend service environment variables on Render:

- `VITE_API_BASE_URL` = https://pedhe-backend.onrender.com/api

This ensures the client will call the backend at the correct URL in production.

---

## 3) Google Cloud Console — OAuth 2.0 Client configuration
1. Open https://console.cloud.google.com → APIs & Services → Credentials.
2. Select the OAuth 2.0 Client ID used for this app (or create a new one).
3. Under **Authorized redirect URIs**, add:
   - `https://pedhe-backend.onrender.com/auth/google/callback`
   (Exact match required: scheme, host, path, and trailing slash must match.)
4. (Optional) Under **Authorized JavaScript origins**, add:
   - `https://peda-wala.onrender.com`
5. Save.

---

## 4) Redeploy / Restart
- After adding env vars, trigger a manual deploy or restart the backend service in Render so env vars are applied.
- Then redeploy the frontend service (so it picks up `VITE_API_BASE_URL`).

---

## 5) Quick verification (curl)
- Check OAuth debug endpoint (backend prints configuration):

```bash
curl -s https://pedhe-backend.onrender.com/api/auth/debug/oauth-config | jq
```
Expect `googleOAuthConfigured` to be `Yes` or `true` and `googleCallbackUrl` to match `https://pedhe-backend.onrender.com/auth/google/callback`.

- List server routes (optional):

```bash
curl -s https://pedhe-backend.onrender.com/api/debug/routes | jq
```

---

## 6) Manual test flow
1. Open: `https://peda-wala.onrender.com/login`
2. Click **Login with Google**.
3. You should be redirected to Google and, after approving, redirected back to the frontend with a token.
4. If you encounter an error, check Render logs for the backend service (Render → Logs) and the server startup logs (they print masked client id and callback URL).

---

## 7) Common issues & troubleshooting
- Callback mismatch: Ensure `GOOGLE_CALLBACK_URL` and the Google Console redirect URI are identical (no trailing slash mismatch, same protocol).
- Env var not applied: Confirm you restarted the service after adding env vars; Render does not always apply new env vars until redeploy/restart.
- Secrets format: Do not add surrounding quotes in Render's env UI; enter raw values.
- CORS / blocked requests: Ensure frontend `VITE_API_BASE_URL` points to `https://pedhe-backend.onrender.com/api`.
- Check server logs on Render for stack traces from `/auth/google` and `/auth/google/callback`.

---

## 8) Optional: Local testing
If you want to test locally first, create a `.env` in the `server/` folder with the same keys (use http callback):

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback
FRONTEND_URL=http://localhost:3000
JWT_SECRET=...
SESSION_SECRET=...
NODE_ENV=development
```

Start server and client locally and test the login flow.

---

## 9) Screenshot placeholders (optional)
Add screenshots to your team docs in a `docs/screenshots/` folder. Example filenames for reference:
- `screenshots/render-backend-env.png` — Render service → Environment variables
- `screenshots/render-frontend-env.png` — Frontend env var
- `screenshots/google-console-redirect.png` — Google Cloud Console redirect URI entry

---

If you want, I can also:
- Create these screenshots and embed them in this file (I will need access tokens or you can upload screenshots), or
- Add this file to your repo as `RENDER_GOOGLE_OAUTH_SETUP.md` (done), or
- Walk you through the Render dashboard via a short step-by-step with exact clicks.


