#!/bin/bash
# OAuth Verification Checklist for Render

echo "================================"
echo "Google OAuth Verification"
echo "================================"
echo ""

BACKEND_URL="https://pedhe-backend.onrender.com"
FRONTEND_URL="https://peda-wala.onrender.com"

echo "1️⃣ Checking Backend OAuth Configuration..."
echo "URL: $BACKEND_URL/api/auth/debug/oauth-config"
echo ""

RESPONSE=$(curl -s "$BACKEND_URL/api/auth/debug/oauth-config")
echo "Response:"
echo "$RESPONSE" | python -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

echo "2️⃣ OAuth Status Check:"
if echo "$RESPONSE" | grep -q "✅ Yes"; then
  echo "✅ Google OAuth is CONFIGURED and ready!"
  echo ""
  echo "Next: Test login at: $FRONTEND_URL/login"
else
  echo "❌ Google OAuth is NOT configured"
  echo ""
  echo "Missing environment variables on Render backend:"
  echo "- GOOGLE_CLIENT_ID"
  echo "- GOOGLE_CLIENT_SECRET"
  echo "- GOOGLE_CALLBACK_URL"
  echo ""
  echo "See GOOGLE_OAUTH_RENDER_SETUP.md for setup instructions"
fi

echo ""
echo "3️⃣ Frontend Health Check:"
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
echo "Frontend HTTP Status: $FRONTEND_STATUS"
if [ "$FRONTEND_STATUS" = "200" ]; then
  echo "✅ Frontend is reachable"
else
  echo "⚠️ Frontend returned status: $FRONTEND_STATUS"
fi

echo ""
echo "================================"
