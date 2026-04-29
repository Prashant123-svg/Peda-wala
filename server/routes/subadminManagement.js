/**
 * SubAdmin Management Routes
 * Handles order management, delivery boy assignment, customer queries, etc.
 */

import express from "express";
import { authMiddleware } from "../middlewares/Authentication.js";
import { requireRole, requirePermission } from "../middlewares/PermissionGuard.js";
import Order from "../models/Order.js";
import User from "../models/user.js";

const router = express.Router();

// ============= ORDER MANAGEMENT =============

/**
 * Get all orders (SubAdmin can see all orders in their region/zone)
 * GET /api/subadmin/orders?status=pending&limit=10&page=1
 */
router.get(
  "/orders",
  authMiddleware,
  requireRole("subAdmin"),
  requirePermission("view_orders"),
  async (req, res) => {
    try {
      const { status, limit = 10, page = 1 } = req.query;
      let filter = {};

      if (status) filter.status = status;

      const skip = (page - 1) * limit;

      const orders = await Order.find(filter)
        .populate("userId", "name email phone")
        .populate("deliveryBoyId", "name phone")
        .select("_id orderNumber userId status totalPrice deliveryAddress createdAt")
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip));

      const total = await Order.countDocuments(filter);

      res.json({
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
        orders
      });
    } catch (error) {
      console.error("Error fetching orders:", error.message);
      res.status(500).json({ message: "Error fetching orders", error: error.message });
    }
  }
);

/**
 * Get single order details
 * GET /api/subadmin/orders/:orderId
 */
router.get(
  "/orders/:orderId",
  authMiddleware,
  requireRole("subAdmin"),
  requirePermission("view_orders"),
  async (req, res) => {
    try {
      const { orderId } = req.params;

      const order = await Order.findById(orderId)
        .populate("userId", "_id name email phone address")
        .populate("deliveryBoyId", "_id name phone")
        .populate("items.productId", "name price image");

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json({ order });
    } catch (error) {
      res.status(500).json({ message: "Error fetching order", error: error.message });
    }
  }
);

/**
 * Update order status
 * PUT /api/subadmin/orders/:orderId/status
 * body: { status: "confirmed", notes: "..." }
 */
router.put(
  "/orders/:orderId/status",
  authMiddleware,
  requireRole("subAdmin"),
  requirePermission("update_orders"),
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status, notes } = req.body;

      // Valid status transitions
      const validStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      order.status = status;
      if (notes) order.notes = notes;
      order.updatedAt = new Date();

      await order.save();

      console.log(`📦 Order ${order.orderNumber} status updated to: ${status}`);

      res.json({
        message: "Order status updated",
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          updatedAt: order.updatedAt
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Error updating order status", error: error.message });
    }
  }
);

// ============= DELIVERY BOY ASSIGNMENT =============

/**
 * Assign delivery boy to order
 * POST /api/subadmin/assign-delivery-boy
 * body: { orderId, deliveryBoyId }
 */
router.post(
  "/assign-delivery-boy",
  authMiddleware,
  requireRole("subAdmin"),
  requirePermission("assign_deliveryboys"),
  async (req, res) => {
    try {
      const { orderId, deliveryBoyId } = req.body;

      if (!orderId || !deliveryBoyId) {
        return res.status(400).json({ message: "Order ID and Delivery Boy ID are required" });
      }

      // Verify order exists
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Verify delivery boy exists and has correct role
      const deliveryBoy = await User.findById(deliveryBoyId);
      if (!deliveryBoy || deliveryBoy.role !== "deliveryBoy") {
        return res.status(404).json({ message: "Delivery Boy not found or invalid" });
      }

      order.deliveryBoyId = deliveryBoyId;
      order.status = "assigned"; // Change status to assigned
      await order.save();

      console.log(`🚗 Delivery Boy ${deliveryBoy.name} assigned to order ${order.orderNumber}`);

      res.json({
        message: "Delivery Boy assigned to order",
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          deliveryBoyId: order.deliveryBoyId,
          status: order.status
        }
      });
    } catch (error) {
      res.status(500).json({
        message: "Error assigning delivery boy",
        error: error.message
      });
    }
  }
);

/**
 * Get unassigned orders
 * GET /api/subadmin/unassigned-orders
 */
router.get(
  "/unassigned-orders",
  authMiddleware,
  requireRole("subAdmin"),
  requirePermission("assign_deliveryboys"),
  async (req, res) => {
    try {
      const unassignedOrders = await Order.find({
        $or: [{ deliveryBoyId: null }, { deliveryBoyId: undefined }],
        status: { $in: ["confirmed", "processing"] }
      })
        .populate("userId", "name phone")
        .select("_id orderNumber status totalPrice createdAt")
        .sort({ createdAt: 1 });

      res.json({
        total: unassignedOrders.length,
        orders: unassignedOrders
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching unassigned orders", error: error.message });
    }
  }
);

/**
 * Get available delivery boys with order count
 * GET /api/subadmin/available-delivery-boys
 */
router.get(
  "/available-delivery-boys",
  authMiddleware,
  requireRole("subAdmin"),
  requirePermission("assign_deliveryboys"),
  async (req, res) => {
    try {
      const deliveryBoys = await User.find({ role: "deliveryBoy", status: "active" })
        .select("_id name phone email");

      // Get order count for each delivery boy
      const deliveryBoysWithStats = await Promise.all(
        deliveryBoys.map(async (db) => {
          const assignedOrders = await Order.countDocuments({
            deliveryBoyId: db._id,
            status: { $in: ["assigned", "in-transit"] }
          });

          return {
            id: db._id,
            name: db.name,
            phone: db.phone,
            email: db.email,
            activeOrders: assignedOrders
          };
        })
      );

      res.json({
        total: deliveryBoysWithStats.length,
        deliveryBoys: deliveryBoysWithStats
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching delivery boys", error: error.message });
    }
  }
);

// ============= CUSTOMER QUERIES =============

/**
 * Get customer queries/complaints
 * GET /api/subadmin/customer-queries?status=open
 */
router.get(
  "/customer-queries",
  authMiddleware,
  requireRole("subAdmin"),
  requirePermission("view_queries"),
  async (req, res) => {
    try {
      const { status = "open", limit = 10, page = 1 } = req.query;
      const skip = (page - 1) * limit;

      // Note: You may need to create a separate Query/Complaint model
      // For now, this is a placeholder showing structure

      res.json({
        message: "Customer queries endpoint",
        note: "Requires separate Query/Complaint model to be created",
        queries: []
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching customer queries", error: error.message });
    }
  }
);

// ============= REPORTS =============

/**
 * Get basic reports/analytics
 * GET /api/subadmin/reports?period=week
 */
router.get(
  "/reports",
  authMiddleware,
  requireRole("subAdmin"),
  requirePermission("view_basic_reports"),
  async (req, res) => {
    try {
      const { period = "week" } = req.query;

      // Calculate date range
      const now = new Date();
      let startDate;

      switch (period) {
        case "day":
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case "week":
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case "month":
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          startDate = new Date(now.setDate(now.getDate() - 7));
      }

      // Get order stats
      const totalOrders = await Order.countDocuments({
        createdAt: { $gte: startDate }
      });

      const completedOrders = await Order.countDocuments({
        createdAt: { $gte: startDate },
        status: "delivered"
      });

      const totalRevenue = await Order.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } }
      ]);

      const ordersByStatus = await Order.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]);

      res.json({
        period,
        stats: {
          totalOrders,
          completedOrders,
          completionRate: totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(2) + "%" : "0%",
          totalRevenue: totalRevenue[0]?.total || 0,
          ordersByStatus: ordersByStatus.reduce(
            (acc, item) => ({ ...acc, [item._id]: item.count }),
            {}
          )
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Error generating reports", error: error.message });
    }
  }
);

/**
 * Get dashboard summary for SubAdmin
 * GET /api/subadmin/dashboard-summary
 */
router.get(
  "/dashboard-summary",
  authMiddleware,
  requireRole("subAdmin"),
  async (req, res) => {
    try {
      const pendingOrders = await Order.countDocuments({ status: "pending" });
      const confirmedOrders = await Order.countDocuments({ status: "confirmed" });
      const deliveredToday = await Order.countDocuments({
        status: "delivered",
        updatedAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      });

      const activeDeliveryBoys = await User.countDocuments({
        role: "deliveryBoy",
        status: "active"
      });

      res.json({
        summary: {
          pendingOrders,
          confirmedOrders,
          deliveredToday,
          activeDeliveryBoys
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching dashboard summary", error: error.message });
    }
  }
);

export default router;
