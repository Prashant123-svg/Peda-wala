/**
 * Orders Management Routes
 * Shared routes for order operations - used by SubAdmin, DeliveryBoy, and Users
 * Each role has different permission levels
 */

import express from "express";
import { authMiddleware } from "../middlewares/Authentication.js";
import { requireRole, requireAnyPermission } from "../middlewares/PermissionGuard.js";
import { requireAdminOrSubAdmin } from "../middlewares/Authorization.js";
import Order from "../models/Order.js";
import User from "../models/user.js";

const router = express.Router();

// ============= USER/CUSTOMER ORDER OPERATIONS =============

/**
 * Get user's own orders
 * GET /api/orders/my-orders?limit=10&page=1
 */
router.get(
  "/my-orders",
  authMiddleware,
  async (req, res) => {
    try {
      const { limit = 10, page = 1 } = req.query;
      const userId = req.user.id;

      const skip = (page - 1) * limit;

      const orders = await Order.find({ userId })
        .populate("deliveryBoyId", "name phone")
        .select("_id orderNumber status totalPrice createdAt updatedAt deliveryAddress")
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip));

      const total = await Order.countDocuments({ userId });

      res.json({
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
        orders
      });
    } catch (error) {
      console.error("Error fetching user orders:", error.message);
      res.status(500).json({ message: "Error fetching orders", error: error.message });
    }
  }
);

/**
 * Get single order details
 * GET /api/orders/:orderId
 */
router.get(
  "/:orderId",
  authMiddleware,
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;

      const order = await Order.findById(orderId)
        .populate("userId", "_id name email phone address")
        .populate("deliveryBoyId", "_id name phone address")
        .populate("items.productId", "name price description image");

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Users can only see their own orders (unless SubAdmin or higher)
      if (
        req.user.role === "user" &&
        order.userId.toString() !== userId
      ) {
        return res.status(403).json({ message: "Unauthorized: Cannot access this order" });
      }

      res.json({ order });
    } catch (error) {
      res.status(500).json({ message: "Error fetching order", error: error.message });
    }
  }
);

/**
 * Create new order
 * POST /api/orders/create
 * body: { items: [{productId, quantity, price}], deliveryAddress, notes }
 */
router.post(
  "/create",
  authMiddleware,
  requireRole("user"),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { items, deliveryAddress, notes } = req.body;

      if (!items || items.length === 0) {
        return res.status(400).json({ message: "Order must contain at least one item" });
      }

      if (!deliveryAddress) {
        return res.status(400).json({ message: "Delivery address is required" });
      }

      // Calculate total
      const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      const newOrder = new Order({
        userId,
        orderNumber: `ORD-${Date.now()}`,
        items,
        deliveryAddress,
        notes,
        totalPrice,
        status: "Pending",
        orderStatus: "Pending",
        subAdminId: null,
        deliveryBoyId: null,
        createdAt: new Date()
      });

      await newOrder.save();

      console.log(`📝 New order created: ${newOrder.orderNumber} by user ${userId}`);

      // Populate empty references before returning
      const populatedOrder = await Order.findById(newOrder._id)
        .populate("subAdminId", "_id name email")
        .populate("deliveryBoyId", "_id name phone");

      res.status(201).json({
        message: "Order created successfully",
        order: {
          id: populatedOrder._id,
          orderNumber: populatedOrder.orderNumber,
          status: populatedOrder.status,
          orderStatus: populatedOrder.orderStatus,
          totalPrice: populatedOrder.totalPrice,
          subAdminId: populatedOrder.subAdminId,
          deliveryBoyId: populatedOrder.deliveryBoyId
        }
      });
    } catch (error) {
      console.error("Error creating order:", error.message);
      res.status(500).json({ message: "Error creating order", error: error.message });
    }
  }
);

/**
 * Cancel order (only if status is pending)
 * PUT /api/orders/:orderId/cancel
 */
router.put(
  "/:orderId/cancel",
  authMiddleware,
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Users can only cancel their own orders
      if (req.user.role === "user" && order.userId.toString() !== userId) {
        return res.status(403).json({ message: "Unauthorized: Cannot cancel this order" });
      }

      if (order.status !== "pending") {
        return res.status(400).json({
          message: `Cannot cancel order with status: ${order.status}`
        });
      }

      order.status = "cancelled";
      order.updatedAt = new Date();
      await order.save();

      console.log(`❌ Order ${order.orderNumber} cancelled by user ${userId}`);

      res.json({
        message: "Order cancelled successfully",
        order: { id: order._id, orderNumber: order.orderNumber, status: order.status }
      });
    } catch (error) {
      res.status(500).json({ message: "Error cancelling order", error: error.message });
    }
  }
);

// ============= DELIVERYBOY ORDER OPERATIONS =============

/**
 * Get assigned orders for delivery boy or subadmin
 * GET /api/orders/delivery-boy/assigned
 */
router.get(
  "/delivery-boy/assigned",
  authMiddleware,
  requireAdminOrSubAdmin,
  async (req, res) => {
    try {
      let filter = {};
      
      // If delivery boy, show only their assigned orders
      if (req.user.role === "deliveryBoy") {
        filter.deliveryBoyId = req.user.id;
        filter.status = { $in: ["assigned", "in-transit", "delivered"] };
      }
      // If subAdmin/admin, show all assigned orders
      else {
        filter.deliveryBoyId = { $ne: null };
      }

      const assignedOrders = await Order.find(filter)
        .populate("userId", "name phone address email")
        .select("_id orderNumber status totalPrice createdAt deliveryAddress notes")
        .sort({ createdAt: -1 });

      res.json({
        total: assignedOrders.length,
        orders: assignedOrders
      });
    } catch (error) {
      res.status(500).json({
        message: "Error fetching assigned orders",
        error: error.message
      });
    }
  }
);

/**
 * Update delivery status
 * PUT /api/orders/:orderId/delivery-status
 * body: { status: "in-transit" | "delivered", notes: "..." }
 */
router.put(
  "/:orderId/delivery-status",
  authMiddleware,
  requireAdminOrSubAdmin,
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status, notes } = req.body;

      const validStatuses = ["in-transit", "delivered", "failed"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid status. Valid statuses: in-transit, delivered, failed"
        });
      }

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Verify delivery boy is assigned to this order (only for delivery boys)
      if (req.user.role === "deliveryBoy" && order.deliveryBoyId?.toString() !== req.user.id) {
        return res.status(403).json({
          message: "Unauthorized: This order is not assigned to you"
        });
      }
      // Sub-Admin can update any assigned order

      // Can only update if order is assigned to delivery boy
      if (!["assigned", "in-transit"].includes(order.status)) {
        return res.status(400).json({
          message: `Cannot update order with status: ${order.status}`
        });
      }

      order.status = status;
      if (notes) order.notes = notes;
      if (status === "delivered") order.deliveredAt = new Date();
      if (status === "failed") order.failedAt = new Date();
      order.updatedAt = new Date();

      await order.save();

      console.log(`🚗 Delivery Boy updated order ${order.orderNumber} status to: ${status}`);

      res.json({
        message: "Delivery status updated",
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          updatedAt: order.updatedAt
        }
      });
    } catch (error) {
      res.status(500).json({
        message: "Error updating delivery status",
        error: error.message
      });
    }
  }
);

// ============= ADMIN/SUBADMIN VIEW ALL ORDERS =============

/**
 * Get all orders (Admin/SubAdmin view)
 * GET /api/orders/all?status=pending&limit=20&page=1
 */
router.get(
  "/all",
  authMiddleware,
  requireAnyPermission(["view_all_orders", "view_orders"]),
  async (req, res) => {
    try {
      const { status, limit = 20, page = 1 } = req.query;
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
      res.status(500).json({ message: "Error fetching orders", error: error.message });
    }
  }
);

// ============= ORDER ANALYTICS =============

/**
 * Get order statistics
 * GET /api/orders/stats/summary
 */
router.get(
  "/stats/summary",
  authMiddleware,
  requireAnyPermission(["view_all_orders", "view_orders", "view_basic_reports"]),
  async (req, res) => {
    try {
      const stats = {
        pending: await Order.countDocuments({ status: "pending" }),
        confirmed: await Order.countDocuments({ status: "confirmed" }),
        assigned: await Order.countDocuments({ status: "assigned" }),
        intransit: await Order.countDocuments({ status: "in-transit" }),
        delivered: await Order.countDocuments({ status: "delivered" }),
        cancelled: await Order.countDocuments({ status: "cancelled" }),
        failed: await Order.countDocuments({ status: "failed" })
      };

      const totalOrders = Object.values(stats).reduce((sum, val) => sum + val, 0);

      res.json({
        stats,
        totalOrders,
        successRate: totalOrders > 0
          ? ((stats.delivered / totalOrders) * 100).toFixed(2) + "%"
          : "0%"
      });
    } catch (error) {
      res.status(500).json({
        message: "Error generating statistics",
        error: error.message
      });
    }
  }
);

export default router;
