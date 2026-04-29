/**
 * Permission Guard Middleware
 * Validates user roles and specific permissions
 */

// Role-based permissions mapping
const rolePermissions = {
  admin: [
    "manage_admins",
    "manage_subadmins",
    "manage_deliveryboys",
    "manage_api",
    "manage_settings",
    "manage_users",
    "view_all_orders",
    "view_reports",
    "block_users"
  ],
  subAdmin: [
    "view_orders",
    "update_orders",
    "assign_deliveryboys",
    "manage_deliveryboys",
    "view_queries",
    "view_basic_reports"
  ],
  deliveryBoy: [
    "view_assigned_orders",
    "update_delivery_status"
  ],
  user: [
    "view_products",
    "add_to_cart",
    "place_order",
    "view_own_orders"
  ]
};

/**
 * Middleware to check if user has required role
 * Usage: router.get("/admin", requireRole("admin"), handler)
 */
export const requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        console.error("❌ No user context in request");
        return res.status(401).json({ message: "Unauthorized: No user context" });
      }

      // First try to get role from JWT (fast path)
      let userRole = req.user?.role;
      
      // If role is not in JWT, fetch from database to ensure we have the latest role
      if (!userRole) {
        const User = (await import("../models/user.js")).default;
        const user = await User.findById(req.user.id);
        if (!user) {
          console.error("❌ User not found in database");
          return res.status(404).json({ message: "User not found" });
        }
        userRole = user.role;
        req.user.role = userRole;
      }
    
      if (!userRole || !allowedRoles.includes(userRole)) {
        console.log(`❌ Access denied: User role ${userRole} not in [${allowedRoles.join(", ")}]`);
        return res.status(403).json({
          message: `Access denied. Required role: ${allowedRoles.join(" or ")}. Your role: ${userRole}`
        });
      }
    
      console.log(`✅ Role check passed: ${userRole}`);
      next();
    } catch (error) {
      console.error("❌ Role check error:", error.message);
      res.status(500).json({ message: "Role check error", error: error.message });
    }
  };
};

/**
 * Middleware to check if user has specific permission
 * Usage: router.post("/create-subadmin", requirePermission("manage_subadmins"), handler)
 */
export const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        console.error("❌ No user context in request");
        return res.status(401).json({ message: "Unauthorized: No user context" });
      }

      // First try to get role from JWT
      let userRole = req.user?.role;
      
      // If role is not in JWT, fetch from database to ensure we have the latest role
      if (!userRole) {
        const User = (await import("../models/user.js")).default;
        const user = await User.findById(req.user.id);
        if (!user) {
          console.error("❌ User not found in database");
          return res.status(404).json({ message: "User not found" });
        }
        userRole = user.role;
        req.user.role = userRole;
      }

      const userPermissions = rolePermissions[userRole] || [];
    
      if (!userPermissions.includes(permission)) {
        console.log(`❌ Permission denied: ${userRole} lacks ${permission}`);
        return res.status(403).json({
          message: `Permission denied: ${permission}. Required: ${permission}. Your role: ${userRole}`
        });
      }
    
      console.log(`✅ Permission granted: ${permission}`);
      next();
    } catch (error) {
      console.error("❌ Permission check error:", error.message);
      res.status(500).json({ message: "Permission check error", error: error.message });
    }
  };
};

/**
 * Middleware to check multiple permissions (AND logic)
 * Usage: router.delete("/user/:id", requireAllPermissions(["manage_users", "block_users"]), handler)
 */
export const requireAllPermissions = (permissions) => {
  return (req, res, next) => {
    const userRole = req.user?.role;
    const userPermissions = rolePermissions[userRole] || [];
    
    const hasAll = permissions.every(perm => userPermissions.includes(perm));
    
    if (!hasAll) {
      return res.status(403).json({
        message: `Permission denied: Requires all of [${permissions.join(", ")}]`
      });
    }
    
    next();
  };
};

/**
 * Middleware to check any permission (OR logic)
 * Usage: router.get("/dashboard", requireAnyPermission(["view_all_orders", "view_basic_reports"]), handler)
 */
export const requireAnyPermission = (permissions) => {
  return (req, res, next) => {
    const userRole = req.user?.role;
    const userPermissions = rolePermissions[userRole] || [];
    
    const hasAny = permissions.some(perm => userPermissions.includes(perm));
    
    if (!hasAny) {
      return res.status(403).json({
        message: `Permission denied: Requires one of [${permissions.join(", ")}]`
      });
    }
    
    next();
  };
};

/**
 * Helper function to get user's permissions
 */
export const getUserPermissions = (role) => {
  return rolePermissions[role] || [];
};

/**
 * Helper function to check if user has permission (for non-middleware use)
 */
export const hasPermission = (userRole, permission) => {
  const permissions = rolePermissions[userRole] || [];
  return permissions.includes(permission);
};

export default {
  requireRole,
  requirePermission,
  requireAllPermissions,
  requireAnyPermission,
  getUserPermissions,
  hasPermission
};
