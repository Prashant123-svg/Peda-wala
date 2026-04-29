/**
 * Admin Management Routes
 * Handles SubAdmin creation, DeliveryBoy management, user blocking, etc.
 */

import express from "express";
import { authMiddleware } from "../middlewares/Authentication.js";
import { requireRole, requirePermission } from "../middlewares/PermissionGuard.js";
import User from "../models/user.js";
import Order from "../models/Order.js";

const router = express.Router();

// ============= SUBADMIN MANAGEMENT =============

/**
 * Create SubAdmin
 * POST /api/admin/create-subadmin
 * body: { name, email, phone, address }
 */
router.post(
  "/create-subadmin",
  authMiddleware,
  requireRole("admin"),
  requirePermission("manage_subadmins"),
  async (req, res) => {
    try {
      const { name, email, phone, address } = req.body;

      // Validate input
      if (!name || !email) {
        return res.status(400).json({ message: "Name and email are required" });
      }

      // Check if email already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Create SubAdmin user
      const newSubAdmin = new User({
        name,
        email,
        phone,
        address,
        role: "subAdmin",
        password: email.split("@")[0] + "123", // Default password
        status: "active"
      });

      await newSubAdmin.save();

      console.log(`✅ SubAdmin created: ${name} (${email})`);

      res.status(201).json({
        message: "SubAdmin created successfully",
        user: {
          id: newSubAdmin._id,
          name: newSubAdmin.name,
          email: newSubAdmin.email,
          role: newSubAdmin.role,
          password: newSubAdmin.password // Share with admin to give to subadmin
        }
      });
    } catch (error) {
      console.error("Error creating SubAdmin:", error.message);
      res.status(500).json({ message: "Error creating SubAdmin", error: error.message });
    }
  }
);

/**
 * Get all SubAdmins
 * GET /api/admin/subadmins
 */
router.get(
  "/subadmins",
  authMiddleware,
  requireRole("admin"),
  requirePermission("manage_subadmins"),
  async (req, res) => {
    try {
      const subAdminRoleRegex = /^subadmin$/i;
      const subadmins = await User.find({ role: { $regex: subAdminRoleRegex } })
        .select("_id name email phone address status createdAt")
        .sort({ createdAt: -1 });

      res.json({
        total: subadmins.length,
        subadmins
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching SubAdmins", error: error.message });
    }
  }
);

/**
 * Remove SubAdmin (revert to user)
 * DELETE /api/admin/remove-subadmin/:subadminId
 */
router.delete(
  "/remove-subadmin/:subadminId",
  authMiddleware,
  requireRole("admin"),
  requirePermission("manage_subadmins"),
  async (req, res) => {
    try {
      const { subadminId } = req.params;

      const subadmin = await User.findById(subadminId);
      if (!subadmin || subadmin.role !== "subAdmin") {
        return res.status(404).json({ message: "SubAdmin not found" });
      }

      await Order.updateMany(
        { subAdminId: subadminId },
        {
          $unset: {
            subAdminId: "",
            approvedAt: "",
          },
        }
      );

      await User.findByIdAndDelete(subadminId);

      console.log(`✅ SubAdmin account deleted: ${subadmin.name}`);

      res.json({
        message: "SubAdmin account deleted successfully",
        deletedUser: { id: subadmin._id, name: subadmin.name, role: "subAdmin" }
      });
    } catch (error) {
      res.status(500).json({ message: "Error deleting SubAdmin account", error: error.message });
    }
  }
);

// ============= DELIVERY BOY MANAGEMENT =============

/**
 * Promote user to DeliveryBoy
 * POST /api/admin/add-deliveryboy/:userId
 */
router.post(
  "/add-deliveryboy/:userId",
  authMiddleware,
  requireRole("admin"),
  requirePermission("manage_deliveryboys"),
  async (req, res) => {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.role === "deliveryBoy") {
        return res.status(400).json({ message: "User is already a DeliveryBoy" });
      }

      user.role = "deliveryBoy";
      await user.save();

      console.log(`✅ DeliveryBoy role added to ${user.name}`);

      res.json({
        message: "User promoted to DeliveryBoy",
        user: { id: user._id, name: user.name, role: user.role }
      });
    } catch (error) {
      res.status(500).json({ message: "Error adding DeliveryBoy", error: error.message });
    }
  }
);

/**
 * Get all DeliveryBoys
 * GET /api/admin/deliveryboys
 */
router.get(
  "/deliveryboys",
  authMiddleware,
  requireRole("admin", "subAdmin"),
  requirePermission("manage_deliveryboys"),
  async (req, res) => {
    try {
      const deliveryBoyRoleRegex = /^delivery(?:[-_ ]?boy|boy)$/i;
      const deliveryboys = await User.find({ role: { $regex: deliveryBoyRoleRegex } })
        .select("_id name email phone address status createdAt")
        .sort({ createdAt: -1 });

      res.json({
        total: deliveryboys.length,
        deliveryboys
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching DeliveryBoys", error: error.message });
    }
  }
);

/**
 * Remove DeliveryBoy role
 * DELETE /api/admin/remove-deliveryboy/:deliveryboyId
 */
router.delete(
  "/remove-deliveryboy/:deliveryboyId",
  authMiddleware,
  requireRole("admin"),
  requirePermission("manage_deliveryboys"),
  async (req, res) => {
    try {
      const { deliveryboyId } = req.params;

      const deliveryboy = await User.findById(deliveryboyId);
      if (!deliveryboy || deliveryboy.role !== "deliveryBoy") {
        return res.status(404).json({ message: "DeliveryBoy not found" });
      }

      await Order.updateMany(
        { deliveryBoyId: deliveryboyId, orderStatus: { $in: ["Assigned", "Out for Delivery"] } },
        {
          $set: {
            orderStatus: "Confirmed",
            status: "Shipped",
          },
          $unset: {
            deliveryBoyId: "",
            assignedAt: "",
          },
        }
      );

      await Order.updateMany(
        { deliveryBoyId: deliveryboyId },
        {
          $unset: {
            deliveryBoyId: "",
            assignedAt: "",
          },
        }
      );

      await User.findByIdAndDelete(deliveryboyId);

      console.log(`✅ DeliveryBoy account deleted: ${deliveryboy.name}`);

      res.json({
        message: "DeliveryBoy account deleted successfully",
        deletedUser: { id: deliveryboy._id, name: deliveryboy.name, role: "deliveryBoy" }
      });
    } catch (error) {
      res.status(500).json({ message: "Error deleting DeliveryBoy account", error: error.message });
    }
  }
);

// ============= USER BLOCKING/MANAGEMENT =============

/**
 * Block/Unblock User
 * PUT /api/admin/block-user/:userId
 * body: { isBlocked: true/false }
 */
router.put(
  "/block-user/:userId",
  authMiddleware,
  requireRole("admin"),
  requirePermission("block_users"),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { isBlocked } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (isBlocked) {
        user.status = "inactive";
        user.blockedAt = new Date();
      } else {
        user.status = "active";
        user.blockedAt = null;
      }

      await user.save();

      console.log(`${isBlocked ? "🚫" : "✅"} User ${user.name} ${isBlocked ? "blocked" : "unblocked"}`);

      res.json({
        message: `User ${isBlocked ? "blocked" : "unblocked"} successfully`,
        user: { id: user._id, name: user.name, status: user.status }
      });
    } catch (error) {
      res.status(500).json({ message: "Error updating user status", error: error.message });
    }
  }
);

/**
 * Get all users with filters
 * GET /api/admin/users?role=user&status=active
 */
router.get(
  "/users",
  authMiddleware,
  requireRole("admin"),
  requirePermission("manage_users"),
  async (req, res) => {
    try {
      const { role, status } = req.query;
      let filter = {};

      if (role) filter.role = role;
      if (status) filter.status = status;

      const users = await User.find(filter)
        .select("_id name email phone role status createdAt")
        .sort({ createdAt: -1 });

      res.json({
        total: users.length,
        users
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching users", error: error.message });
    }
  }
);

// ============= DASHBOARD STATS =============

/**
 * Get admin dashboard stats
 * GET /api/admin/stats
 */
router.get(
  "/stats",
  authMiddleware,
  requireRole("admin"),
  requirePermission("view_all_orders"),
  async (req, res) => {
    try {
      const totalUsers = await User.countDocuments({ role: "user" });
      const totalSubAdmins = await User.countDocuments({ role: { $regex: /^subadmin$/i } });
      const totalDeliveryBoys = await User.countDocuments({ role: { $regex: /^delivery(?:[-_ ]?boy|boy)$/i } });
      const blockedUsers = await User.countDocuments({ status: "inactive" });

      res.json({
        stats: {
          totalUsers,
          totalSubAdmins,
          totalDeliveryBoys,
          blockedUsers,
          totalActiveUsers: totalUsers + totalSubAdmins + totalDeliveryBoys - blockedUsers
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching stats", error: error.message });
    }
  }
);

export default router;
