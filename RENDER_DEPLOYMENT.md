# Render Deployment Guide - Pedhe Wala App

## 🚀 Quick Fix for Orders Not Saving on Render

The most common reason orders don't show on Render is missing environment variables. Follow these steps:

---

## Step 1: Deploy Server to Render (Backend API)

1. **Create Render Service:**
   - Go to https://render.com → Create New → Web Service
   - Connect your GitHub repo (Prashant123-svg/Peda-wala)
   - Select branch: `fix/safe-json-parse`
   - Root directory: `server`

2. **Set Environment Variables (CRITICAL):**
   - Click "Advanced" → Add Environment Variables
   - Add these required variables:

   ```
   MONGO_URI=mongodb+srv://root:root@completecoding.lohyfbl.mongodb.net/pedhe-wala
   JWT_SECRET=mySuperSecretKey123!
   ADMIN_EMAIL=prashantchraya@gmail.com
   ADMIN_PASSWORD=Admin@123
   ADMIN_SECRET_KEY=AdminPedhewala123!Secure
   PORT=5000
   NODE_ENV=production
   EMAIL_USER=prashantmahour101@gmail.com
   EMAIL_PASS=zhystlvptigrdrbg
   ```

3. **Set Build & Start Commands:**
   - Build: `npm install`
   - Start: `node server.js`

4. **After Deploy:**
   - Wait for "✅ MongoDB Connected" in logs
   - Note the service URL (e.g., `https://your-service.onrender.com`)

---

## Step 2: Deploy Client to Render (Frontend)

1. **Create Render Service:**
   - Create New → Static Site (if using built files) OR Web Service (for Vite server)
   - Connect GitHub repo, select `fix/safe-json-parse`
   - Root directory: `client`

2. **Set Environment Variables:**
   - Add this CRITICAL variable:

   ```
   VITE_API_BASE_URL=https://your-backend-service.onrender.com
   ```
   
   (Replace `your-backend-service.onrender.com` with your actual backend service URL from Step 1)

3. **Set Build & Start Commands:**
   - Build: `npm run build`
   - Start: `npm run preview` OR serve the `dist` folder

4. **After Deploy:**
   - Open your client URL
   - Login → Add items to cart → Proceed to Checkout

---

## Step 3: Test Order Creation

1. **From Client:**
   - Login with any email/password
   - Add a product to cart
   - Click "Proceed to Checkout"
   - Fill address and click "Confirm Order"

2. **Check Server Logs:**
   - Go to Render Dashboard → Select your backend service → Logs
   - Look for:
     ```
     ✅ CREATE ORDER REQUEST
     🧑 User ID: ...
     📦 Items count: ...
     ✅ Order saved successfully: ...
     ```

3. **Check Client Network Tab:**
   - Open browser DevTools → Network tab
   - Place an order
   - Find POST `/api/orders/create-order`
   - Check Status: should be 201 (success)
   - Response should show order with `_id`

4. **Verify Orders Display:**
   - After successful order, check the "My Orders" section
   - Should show your new order

---

## 🔍 Troubleshooting

### ❌ "Orders not showing in my orders page"

**Check these:**

1. **Is MONGO_URI set on Render?**
   - Go to Render Dashboard → Environment
   - Look for `MONGO_URI`
   - If missing, add: `mongodb+srv://root:root@completecoding.lohyfbl.mongodb.net/pedhe-wala`

2. **Is VITE_API_BASE_URL set in client?**
   - Go to Render Dashboard → Client service → Environment
   - Look for `VITE_API_BASE_URL`
   - Should be: `https://your-backend-service.onrender.com` (exact URL of your backend)

3. **Check Backend Logs:**
   - Logs should show: `✅ MongoDB Connected`
   - If not, MONGO_URI is wrong or MongoDB is down

4. **Check Network Tab (Browser):**
   - Open DevTools → Network
   - Place order
   - Find POST `/api/orders/create-order`
   - If red (error), click it to see response error
   - If green (200/201), order was created

### ❌ "POST /api/orders/create-order returns 404"

- Client is calling wrong API URL
- Verify `VITE_API_BASE_URL` is set in client environment
- Redeploy client after changing env var

### ❌ "POST /api/orders/create-order returns 401 Unauthorized"

- Auth token missing from request
- Check localStorage has `authToken` or `token`
- Make sure you're logged in before placing order

### ❌ "POST /api/orders/create-order returns 500"

- Server error saving to database
- Check server logs on Render for detailed error
- Usually: MONGO_URI is wrong or database quota exceeded

---

## 🔄 Redeployment Steps

After making code changes:

1. Push to GitHub:
   ```bash
   git add -A
   git commit -m "fix: order creation"
   git push origin fix/safe-json-parse
   ```

2. Render auto-redeploys on push, OR manually redeploy:
   - Render Dashboard → Service → Manual Deploy

3. Wait for deployment to complete
   - Check logs for "✅ MongoDB Connected"

---

## ✅ How to Verify Everything Works

1. **Backend is running:**
   ```bash
   curl https://your-backend-service.onrender.com/
   # Should return: { "message": "🚀 Pedhe Wala API is running successfully", "status": "OK" }
   ```

2. **Database is connected:**
   - Check Render logs for: `✅ MongoDB Connected`

3. **Order creation works:**
   - Login on client
   - Add to cart
   - Checkout
   - Check Network tab → POST `/api/orders/create-order` → Status 201
   - Check "My Orders" page → should show new order

---

## 📞 Quick Support

- **"MongoDB not connected?"** → Check MONGO_URI env var
- **"Orders not showing?"** → Check VITE_API_BASE_URL in client
- **"500 error?"** → Check server logs on Render Dashboard
- **"Auth error?"** → Make sure you're logged in, check token in localStorage

Good luck! 🚀
