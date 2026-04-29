/**
 * COMPLETE SERVER.JS INTEGRATION EXAMPLE
 * 
 * This file shows the complete setup needed in your server.js to integrate
 * all the new route files (Admin, SubAdmin, Orders Management)
 * 
 * NOTE: This is a TEMPLATE showing where to add the imports and route registrations
 * Apply these changes to your existing server.js file
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============= MIDDLEWARES =============

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Static files
app.use("/public", express.static(path.join(__dirname, "public")));

// ============= DATABASE CONNECTION =============

import connectDB from "./config/db.js";
connectDB();

// ============= ROUTE IMPORTS (Existing) =============

import authRoutes from "./routes/auth.js";
import roleRequestRoutes from "./routes/roleRequest.js";
import orderRoute from "./routes/order.js";
import categoriesRoutes from "./routes/categories.js";
import productsRoutes from "./routes/products.js";
import cartRoutes from "./routes/cart.js";

// ============= ROUTE IMPORTS (NEW - ADD THESE) =============

import adminManagementRoutes from "./routes/adminManagement.js";
import subadminManagementRoutes from "./routes/subadminManagement.js";
import ordersManagementRoutes from "./routes/ordersManagement.js";

// ============= ROUTE REGISTRATION (Existing) =============

app.use("/api/auth", authRoutes);
app.use("/api/role", roleRequestRoutes);
app.use("/api/order", orderRoute);
app.use("/api/categories", categoriesRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/cart", cartRoutes);

// ============= ROUTE REGISTRATION (NEW - ADD THESE) =============

// Admin Dashboard Routes
// Protected by: requireRole("admin")
app.use("/api/admin", adminManagementRoutes);

// SubAdmin Dashboard Routes
// Protected by: requireRole("subAdmin")
app.use("/api/subadmin", subadminManagementRoutes);

// Orders Management Routes (Shared for multiple roles with different endpoints)
// Protected by: authMiddleware + role/permission checks per endpoint
app.use("/api/orders", ordersManagementRoutes);

// ============= ERROR HANDLING MIDDLEWARE =============

// 404 Not Found
app.use((req, res) => {
  res.status(404).json({
    message: "❌ Route not found",
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err : {}
  });
});

// ============= SERVER START =============

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   Pedhe-Wala Server Running            ║
║   🚀 http://localhost:${PORT}              ║
║                                        ║
║   Available Routes:                   ║
║   ✅ /api/auth - Authentication       ║
║   ✅ /api/role - Role Management      ║
║   ✅ /api/admin - Admin Dashboard     ║
║   ✅ /api/subadmin - SubAdmin Dash    ║
║   ✅ /api/orders - Order Management   ║
║   ✅ /api/products - Products         ║
║   ✅ /api/categories - Categories     ║
║   ✅ /api/cart - Shopping Cart        ║
╚════════════════════════════════════════╝
  `);
});

export default app;

/**
 * ============= DIRECTORY STRUCTURE VERIFICATION =============
 * 
 * Your directory structure should look like this:
 * 
 * server/
 * ├── routes/
 * │   ├── auth.js                        (existing)
 * │   ├── roleRequest.js                 (existing - updated)
 * │   ├── order.js                       (existing)
 * │   ├── categories.js                  (existing)
 * │   ├── products.js                    (existing)
 * │   ├── cart.js                        (existing)
 * │   ├── adminManagement.js             (NEW)
 * │   ├── subadminManagement.js          (NEW)
 * │   ├── ordersManagement.js            (NEW)
 * │   └── INTEGRATION_GUIDE.md           (NEW)
 * │
 * ├── middlewares/
 * │   ├── Authentication.js              (existing)
 * │   ├── ProfileCompletion.js           (existing)
 * │   └── PermissionGuard.js             (NEW - created previously)
 * │
 * ├── models/
 * │   ├── user.js                        (existing)
 * │   ├── Order.js                       (existing)
 * │   ├── RoleRequest.js                 (existing)
 * │   ├── UserProfileData.js             (existing)
 * │   └── RoleProfileRequirement.js      (existing)
 * │
 * ├── config/
 * │   └── db.js                          (existing)
 * │
 * └── server.js                          (THIS FILE - Update it)
 * 
 * ============= IMPORTANT NOTES =============
 * 
 * 1. Make sure PermissionGuard.js exists in middlewares/
 *    It's required by all three new route files
 * 
 * 2. Make sure all models are properly defined:
 *    - User.js with 'role' field
 *    - Order.js with order schema
 * 
 * 3. Authentication middleware must be available:
 *    - Import from ./middlewares/Authentication.js
 *    - It should attach req.user with user data
 * 
 * 4. Test the routes immediately after updating server.js
 *    See INTEGRATION_GUIDE.md for testing examples
 */

/**
 * ============= QUICK TEST COMMANDS =============
 * 
 * After starting server, test endpoints:
 * 
 * 1. Get admin stats:
 *    GET http://localhost:5000/api/admin/stats
 *    Headers: {"Authorization": "Bearer {token}"}
 * 
 * 2. Get subadmin orders:
 *    GET http://localhost:5000/api/subadmin/orders
 *    Headers: {"Authorization": "Bearer {token}"}
 * 
 * 3. Get user's orders:
 *    GET http://localhost:5000/api/orders/my-orders
 *    Headers: {"Authorization": "Bearer {token}"}
 * 
 * 4. Create order:
 *    POST http://localhost:5000/api/orders/create
 *    Headers: {"Authorization": "Bearer {token}"}
 *    Body: {
 *      "items": [{"productId": "id", "quantity": 1, "price": 100}],
 *      "deliveryAddress": "123 Main St"
 *    }
 * 
 * Use Thunder Client, Postman, or curl to test
 */
