# Routes Integration Guide

This guide shows how to integrate the three new route files into your main `server.js` file.

## Files Created:

1. **`routes/adminManagement.js`** - Admin dashboard operations
2. **`routes/subadminManagement.js`** - SubAdmin dashboard operations  
3. **`routes/ordersManagement.js`** - Order operations (shared by multiple roles)

---

## Step 1: Add Imports to `server.js`

Add these imports at the top of your `server.js` file alongside your existing route imports:

```javascript
// Existing imports...
import authRoutes from "./routes/auth.js";
import roleRequestRoutes from "./routes/roleRequest.js";
import orderRoute from "./routes/order.js";

// NEW ROUTES - Add these:
import adminManagementRoutes from "./routes/adminManagement.js";
import subadminManagementRoutes from "./routes/subadminManagement.js";
import ordersManagementRoutes from "./routes/ordersManagement.js";
```

---

## Step 2: Register Routes in Express App

Add the route registrations after your middleware setup and before the error handling. Find where you have your existing routes like:

```javascript
app.use("/api/auth", authRoutes);
app.use("/api/role", roleRequestRoutes);
app.use("/api/order", orderRoute);
```

And add these NEW routes:

```javascript
// ===== ADMIN ROUTES =====
app.use("/api/admin", adminManagementRoutes);

// ===== SUBADMIN ROUTES =====
app.use("/api/subadmin", subadminManagementRoutes);

// ===== ORDERS ROUTES (Shared for all roles) =====
app.use("/api/orders", ordersManagementRoutes);
```

---

## Step 3: Verify file structure

Your `server/routes/` directory should now contain:

```
server/
  routes/
    auth.js                      (existing)
    roleRequest.js               (existing - already updated)
    order.js                     (existing)
    ├─ adminManagement.js        (NEW)
    ├─ subadminManagement.js     (NEW)
    └─ ordersManagement.js       (NEW)
```

Also ensure you have:

```
server/
  middlewares/
    ├─ Authentication.js         (existing)
    ├─ ProfileCompletion.js      (existing)
    └─ PermissionGuard.js        (NEW - created previously)
```

---

## Complete Routes Reference

### Admin Management Routes (`/api/admin`)

#### SubAdmin Management
```javascript
POST   /api/admin/create-subadmin       // Create new SubAdmin
GET    /api/admin/subadmins             // List all SubAdmins
DELETE /api/admin/remove-subadmin/:id   // Remove SubAdmin role
```

#### DeliveryBoy Management
```javascript
POST   /api/admin/add-deliveryboy/:userId        // Promote user to DeliveryBoy
GET    /api/admin/deliveryboys                   // List all DeliveryBoys
DELETE /api/admin/remove-deliveryboy/:id         // Remove DeliveryBoy role
```

#### User Management
```javascript
GET    /api/admin/users                 // Get all users (with filters)
PUT    /api/admin/block-user/:userId    // Block/Unblock user
```

#### Dashboard
```javascript
GET    /api/admin/stats                 // Admin dashboard statistics
```

---

### SubAdmin Management Routes (`/api/subadmin`)

#### Order Management
```javascript
GET    /api/subadmin/orders             // List all orders (paginated, filterable)
GET    /api/subadmin/orders/:orderId    // Get order details
PUT    /api/subadmin/orders/:orderId/status  // Update order status
```

#### Delivery Boy Assignment
```javascript
POST   /api/subadmin/assign-delivery-boy       // Assign DeliveryBoy to order
GET    /api/subadmin/unassigned-orders         // Get orders without assigned DeliveryBoy
GET    /api/subadmin/available-delivery-boys  // Get DeliveryBoys with active order count
```

#### Analytics
```javascript
GET    /api/subadmin/customer-queries   // Get customer complaints/queries
GET    /api/subadmin/reports            // Get analytics reports (period: day/week/month)
GET    /api/subadmin/dashboard-summary  // Quick dashboard summary
```

---

### Orders Management Routes (`/api/orders`)

#### User/Customer Operations
```javascript
GET    /api/orders/my-orders            // Get user's own orders (requires auth)
GET    /api/orders/:orderId             // Get single order details
POST   /api/orders/create               // Create new order
PUT    /api/orders/:orderId/cancel      // Cancel pending order
```

#### DeliveryBoy Operations
```javascript
GET    /api/orders/delivery-boy/assigned        // Get assigned orders for delivery boy
PUT    /api/orders/:orderId/delivery-status    // Update delivery status (in-transit, delivered, failed)
```

#### Admin/SubAdmin Operations
```javascript
GET    /api/orders/all                  // Get all orders (Admin/SubAdmin view)
GET    /api/orders/stats/summary        // Order statistics and success rate
```

---

## Example API Calls

### Create SubAdmin (Admin only)
```bash
POST /api/admin/create-subadmin
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Rajesh Kumar",
  "email": "rajesh@pedhewala.com",
  "phone": "9876543210",
  "address": "Delhi"
}
```

### Assign DeliveryBoy to Order (SubAdmin)
```bash
POST /api/subadmin/assign-delivery-boy
Authorization: Bearer {token}
Content-Type: application/json

{
  "orderId": "507f1f77bcf86cd799439011",
  "deliveryBoyId": "507f1f77bcf86cd799439012"
}
```

### Update Order Status (SubAdmin)
```bash
PUT /api/subadmin/orders/507f1f77bcf86cd799439011/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "confirmed",
  "notes": "Order confirmed and ready to ship"
}
```

### Create Order (User)
```bash
POST /api/orders/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "items": [
    {
      "productId": "507f1f77bcf86cd799439001",
      "quantity": 2,
      "price": 150
    }
  ],
  "deliveryAddress": "123 Main St, Delhi",
  "notes": "Please deliver before 5 PM"
}
```

### Update Delivery Status (DeliveryBoy)
```bash
PUT /api/orders/507f1f77bcf86cd799439011/delivery-status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "delivered",
  "notes": "Order delivered successfully"
}
```

---

## Permission Requirements

Each route is protected by the `PermissionGuard` middleware. Users must have the correct:
1. **Role** (admin, subAdmin, deliveryBoy, user)
2. **Permission** (specific capability within their role)

### Admin Permissions
- `manage_admins` - Create/manage admin accounts
- `manage_subadmins` - Create/manage SubAdmins
- `manage_deliveryboys` - Add/remove DeliveryBoys
- `manage_api` - Manage API settings
- `manage_settings` - System settings
- `manage_users` - User management
- `view_all_orders` - View all orders
- `view_reports` - View reports
- `block_users` - Block/unblock users

### SubAdmin Permissions
- `view_orders` - View all orders
- `update_orders` - Update order status
- `assign_deliveryboys` - Assign DeliveryBoys to orders
- `view_queries` - View customer queries
- `view_basic_reports` - View analytics

### DeliveryBoy Permissions
- `view_assigned_orders` - View orders assigned to them
- `update_delivery_status` - Update delivery status

### User Permissions
- `view_products` - Browse products
- `add_to_cart` - Add items to cart
- `place_order` - Create orders
- `view_own_orders` - View their own orders

---

## Testing the Routes

### Using Thunder Client / Postman

1. **Login to get token:**
   ```
   POST /api/auth/login
   {"email": "admin@pedhewala.com", "password": "password"}
   ```

2. **Copy the token from response**

3. **Use token in Authorization header:**
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
   ```

4. **Test endpoints** - Try the examples above

---

## Error Handling

All routes include comprehensive error handling:

- **400** - Bad Request (missing required fields)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found (order/user doesn't exist)
- **500** - Internal Server Error (server issue)

Example error response:
```json
{
  "message": "Error creating SubAdmin",
  "error": "Email already exists"
}
```

---

## Next Steps

### Frontend Implementation

Create React components for each dashboard:

1. **AdminDashboard.tsx**
   - SubAdmin management panel
   - DeliveryBoy management
   - User management
   - Settings

2. **SubAdminDashboard.tsx**
   - Order listing & filtering
   - Order status updates
   - DeliveryBoy assignment
   - Reports & analytics

3. **OrdersComponent.tsx**
   - User: My orders, create order
   - DeliveryBoy: Assigned orders, update status
   - Admin/SubAdmin: All orders view

---

## Debugging

If routes give 404 error:
1. Verify import statements in `server.js`
2. Check route registration paths (should match file names)
3. Verify middleware imports in route files
4. Check that `PermissionGuard.js` is in correct location

If permission denied (403):
1. Verify user role in database
2. Check JWT token is being sent
3. Verify token hasn't expired
4. Check user's assigned permissions match route requirements

---

## Database Models Used

Routes depend on these models:

- **User.js** - User data with role field
- **Order.js** - Order information
- **RoleRequest.js** - Role upgrade requests
- **UserProfileData.js** - Profile details

Make sure all these models are properly imported in their respective route files.
