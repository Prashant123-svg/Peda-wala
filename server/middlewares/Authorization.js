import User from "../models/user.js";

/**
 * Role-based access control middleware
 * Usage: router.get("/route", authMiddleware, requireRole("admin", "subAdmin"), handler)
 */
export const requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ msg: "Unauthorized: No user context" });
      }

      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({ msg: "User not found" });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          msg: "Insufficient permissions",
          requiredRoles: allowedRoles,
          userRole: user.role,
          userId: user._id,
        });
      }

      // Attach user info to request
      req.user.role = user.role;
      req.user.name = user.name;
      req.user.email = user.email;

      next();
    } catch (error) {
      console.error("Authorization middleware error:", error);
      res.status(500).json({ msg: "Authorization error", error: error.message });
    }
  };
};

/**
 * Permission-based access control
 * Usage: router.get("/route", authMiddleware, requirePermission("view_all_orders"), handler)
 */
export const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ msg: "Unauthorized: No user context" });
      }

      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({ msg: "User not found" });
      }

      const permissions = getPermissionsForRole(user.role);

      if (!permissions.includes(permission)) {
        return res.status(403).json({
          msg: `Permission denied: ${permission}`,
          userRole: user.role,
        });
      }

      req.user.role = user.role;
      next();
    } catch (error) {
      console.error("Permission check error:", error);
      res.status(500).json({ msg: "Permission check error" });
    }
  };
};

/**
 * Only admin can access: Direct role check for admin only
 */
export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ msg: "Unauthorized" });
    }

    const user = await User.findById(req.user.id);

    if (!user || user.role !== "admin") {
      return res.status(403).json({ msg: "Admin access required" });
    }

    req.user.role = user.role;
    next();
  } catch (error) {
    res.status(500).json({ msg: "Authorization error" });
  }
};

/**
 * Admin or Sub-Admin access
 */
export const requireAdminOrSubAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ msg: "Unauthorized" });
    }

    const user = await User.findById(req.user.id);

    if (!user || !["admin", "subAdmin"].includes(user.role)) {
      return res.status(403).json({ msg: "Admin or Sub-Admin access required" });
    }

    req.user.role = user.role;
    next();
  } catch (error) {
    res.status(500).json({ msg: "Authorization error" });
  }
};

/**
 * Delivery boy or higher
 */
export const requireDeliveryBoyOrHigher = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ msg: "Unauthorized" });
    }

    const user = await User.findById(req.user.id);
    const allowedRoles = ["deliveryBoy", "subAdmin", "admin"];

    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ msg: "Delivery boy or higher access required" });
    }

    req.user.role = user.role;
    next();
  } catch (error) {
    res.status(500).json({ msg: "Authorization error" });
  }
};

/**
 * Get all permissions for a given role
 */
export const getPermissionsForRole = (role) => {
  const permissionsMap = {
    admin: [
      // User management
      "create_subadmin",
      "remove_subadmin",
      "create_delivery_boy",
      "remove_delivery_boy",
      "delete_user",
      "block_user",
      "unblock_user",
      "view_all_users",
      "assign_admin",
      "remove_admin",

      // Order management
      "view_all_orders",
      "update_order_status",
      "assign_delivery_boy",
      "delete_order",

      // Delivery tracking
      "update_delivery_status",
      "view_delivery_details",

      // Reports
      "view_all_sales_reports",
      "view_daily_reports",
      "view_delivery_boy_performance",

      // System
      "manage_api_config",
      "manage_website_settings",
      "view_system_logs",
      "view_activity_logs",

      // Role management
      "approve_role_requests",
      "reject_role_requests",
      "view_role_requests",
    ],

    subAdmin: [
      // User management
      "create_delivery_boy",
      "remove_delivery_boy",
      "view_all_users",
      "block_user",

      // Order management
      "view_all_orders",
      "update_order_status",
      "assign_delivery_boy",
      "delete_order",

      // Delivery tracking
      "view_delivery_details",

      // Reports
      "view_all_sales_reports",
      "view_daily_reports",

      // System
      "manage_website_settings",
      "view_activity_logs",

      // Role management
      "approve_role_requests",
      "reject_role_requests",
      "view_role_requests",
    ],

    deliveryBoy: [
      // Order management
      "view_assigned_orders",
      "update_delivery_status",

      // Reports
      "view_personal_sales",

      // Self
      "view_own_profile",
      "update_own_profile",
    ],

    user: [
      // Products
      "browse_products",
      "view_product_details",

      // Orders
      "create_order",
      "view_own_orders",
      "cancel_own_order",

      // Profile
      "view_own_profile",
      "update_own_profile",

      // Role requests
      "submit_role_request",
      "view_own_role_requests",
    ],
  };

  return permissionsMap[role] || [];
};

/**
 * Helper to check if user has specific permission
 */
export const userHasPermission = async (userId, permission) => {
  try {
    const user = await User.findById(userId);
    if (!user) return false;

    const permissions = getPermissionsForRole(user.role);
    return permissions.includes(permission);
  } catch (error) {
    console.error("Error checking permission:", error);
    return false;
  }
};

/**
 * Middleware to attach permissions to request
 */
export const attachPermissions = async (req, res, next) => {
  try {
    if (req.user && req.user.id) {
      const user = await User.findById(req.user.id);
      if (user) {
        req.user.permissions = getPermissionsForRole(user.role);
        req.user.role = user.role;
      }
    }
    next();
  } catch (error) {
    next();
  }
};
