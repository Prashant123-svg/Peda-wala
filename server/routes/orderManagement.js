import express from "express";
import { authMiddleware } from "../middlewares/Authentication.js";
import { requireRole, requireAdminOrSubAdmin } from "../middlewares/Authorization.js";
import Order from "../models/Order.js";
import User from "../models/user.js";

const router = express.Router();

/**
 * ======================================
 * SUB-ADMIN ORDER MANAGEMENT ENDPOINTS
 * ======================================
 */

// ✅ Get all available delivery boys (for Sub-admin assignment)
router.get(
  "/delivery-boys",
  authMiddleware,
  requireAdminOrSubAdmin,
  async (req, res) => {
    try {
      console.log("👥 Fetching available delivery boys for Sub-Admin");
      console.log("   Requester role:", req.user.role);
      
      // Fetch delivery boys.
      // NOTE: some older DB records may contain role variants (e.g. deliveryboy, delivery-boy, delivery_boy).
      // Use a tolerant regex so the dashboard doesn't go empty because of role string drift.
      const deliveryBoyRoleRegex = /^delivery(?:[-_ ]?boy|boy)$/i;
      const deliveryBoys = await User.find({
        role: { $regex: deliveryBoyRoleRegex },
      }).select("_id name email phone status createdAt role");
      
      console.log(`✅ Found ${deliveryBoys.length} delivery boys`);
      console.log("   Delivery boys:", deliveryBoys.map(db => ({ _id: db._id, name: db.name, status: db.status })));
      
      res.json({
        success: true,
        deliveryBoys: deliveryBoys.map(db => ({
          _id: db._id,
          name: db.name,
          email: db.email,
          phone: db.phone,
          isActive: db.status === "active"
        })),
        count: deliveryBoys.length
      });
    } catch (error) {
      console.error("❌ Error fetching delivery boys:", error);
      res.status(500).json({
        success: false,
        msg: "Error fetching delivery boys",
        error: error.message,
      });
    }
  }
);

// ✅ Get all pending orders (for Sub-admin)
router.get(
  "/sub-admin/pending",
  authMiddleware,
  requireAdminOrSubAdmin,
  async (req, res) => {
    try {
      console.log("📌 Fetching pending orders for Sub-Admin. User ID:", req.user.id);
      
      // Fetch ALL pending orders (not just assigned to this sub-admin)
      const orders = await Order.find({
        $or: [
          { orderStatus: "Pending" },
          { status: "Pending" }
        ]
      })
        .populate("userId", "_id name email phone")
        .populate("subAdminId", "_id name email")
        .populate("deliveryBoyId", "_id name phone")
        .sort({ createdAt: -1 });

      console.log(`✅ Found ${orders.length} pending orders`);
      
      res.json({
        count: orders.length,
        orders,
      });
    } catch (error) {
      console.error("❌ Error fetching pending orders:", error);
      res.status(500).json({
        msg: "Error fetching pending orders",
        error: error.message,
      });
    }
  }
);

// ✅ Approve order by Sub-admin
router.put(
  "/sub-admin/approve/:orderId",
  authMiddleware,
  requireAdminOrSubAdmin,
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const { approvalNotes } = req.body;

      console.log("🔄 Approving order:", orderId, "by user:", req.user.id);

      // Find order with detailed logging
      const order = await Order.findById(orderId);

      if (!order) {
        console.log("❌ Order not found:", orderId);
        return res.status(404).json({ msg: "Order not found" });
      }

      console.log("📋 Current order details:");
      console.log("   - orderStatus:", order.orderStatus);
      console.log("   - status:", order.status);
      console.log("   - subAdminId:", order.subAdminId);
      console.log("   - deliveryBoyId:", order.deliveryBoyId);

      // Check if order is pending (must be "Pending" in at least one field)
      const isPending = order.orderStatus === "Pending" || order.status === "Pending";
      
      if (!isPending) {
        console.log("❌ Order is not pending. Cannot approve.");
        return res.status(400).json({
          msg: "Only pending orders can be approved",
          currentOrderStatus: order.orderStatus,
          currentLegacyStatus: order.status,
        });
      }

      console.log("✅ Order is pending. Approving now...");

      // Update both status fields to ensure consistency
      order.orderStatus = "Confirmed";
      order.status = "Shipped"; // Keep "Shipped" for legacy compatibility
      order.subAdminId = req.user.id;
      order.approvedAt = new Date();
      
      if (approvalNotes) {
        order.approvalNotes = approvalNotes;
      }

      // Add to status history if it exists
      if (!order.statusHistory) {
        order.statusHistory = [];
      }
      
      order.statusHistory.push({
        status: "Confirmed",
        updatedBy: req.user.id,
        notes: `Approved by ${req.user.role}. ${approvalNotes || "No notes"}`,
        timestamp: new Date(),
      });

      const updatedOrder = await order.save();

      console.log("✅ Order approved successfully!");
      console.log("   - New orderStatus:", updatedOrder.orderStatus);
      console.log("   - New status:", updatedOrder.status);
      console.log("   - SubAdminId:", updatedOrder.subAdminId);

      // Populate and send response
      const populatedOrder = await updatedOrder
        .populate("userId", "_id name email phone")
        .populate("subAdminId", "_id name email role")
        .execPopulate();

      res.json({
        msg: "Order approved successfully",
        order: populatedOrder,
      });
    } catch (error) {
      console.error("❌ Error approving order:", error.message);
      console.error("   Stack:", error.stack);
      res.status(500).json({
        msg: "Error approving order",
        error: error.message,
      });
    }
  }
);

// ✅ Approve order by Admin
router.put(
  "/admin/approve/:orderId",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const { approvalNotes } = req.body;

      console.log("🔄 Admin approving order:", orderId, "by user:", req.user.id);

      // Find order with detailed logging
      const order = await Order.findById(orderId);

      if (!order) {
        console.log("❌ Order not found:", orderId);
        return res.status(404).json({ msg: "Order not found" });
      }

      console.log("📋 Current order details:");
      console.log("   - orderStatus:", order.orderStatus);
      console.log("   - status:", order.status);
      console.log("   - subAdminId:", order.subAdminId);

      // Check if order is pending (must be "Pending" in at least one field)
      const isPending = order.orderStatus === "Pending" || order.status === "Pending";
      
      if (!isPending) {
        console.log("❌ Order is not pending. Cannot approve.");
        return res.status(400).json({
          msg: "Only pending orders can be approved",
          currentOrderStatus: order.orderStatus,
          currentLegacyStatus: order.status,
        });
      }

      console.log("✅ Order is pending. Approving now...");

      // Update both status fields to ensure consistency
      order.orderStatus = "Confirmed";
      order.status = "Shipped"; // Keep "Shipped" for legacy compatibility
      order.subAdminId = req.user.id; // Set admin as the approver
      order.approvedAt = new Date();
      
      if (approvalNotes) {
        order.approvalNotes = approvalNotes;
      }

      // Add to status history if it exists
      if (!order.statusHistory) {
        order.statusHistory = [];
      }
      
      order.statusHistory.push({
        status: "Confirmed",
        updatedBy: req.user.id,
        notes: `Approved by Admin. ${approvalNotes || "No notes"}`,
        timestamp: new Date(),
      });

      const updatedOrder = await order.save();

      console.log("✅ Order approved successfully by Admin!");
      console.log("   - New orderStatus:", updatedOrder.orderStatus);
      console.log("   - New status:", updatedOrder.status);
      console.log("   - ApprovedBy (subAdminId):", updatedOrder.subAdminId);

      // Populate and send response
      const populatedOrder = await updatedOrder
        .populate("userId", "_id name email phone")
        .populate("subAdminId", "_id name email role")
        .execPopulate();

      res.json({
        msg: "Order approved successfully by Admin",
        order: populatedOrder,
      });
    } catch (error) {
      console.error("❌ Error approving order:", error.message);
      console.error("   Stack:", error.stack);
      res.status(500).json({
        msg: "Error approving order",
        error: error.message,
      });
    }
  }
);

// ✅ Reject order by Sub-admin
router.put(
  "/sub-admin/reject/:orderId",
  authMiddleware,
  requireAdminOrSubAdmin,
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const { rejectionReason } = req.body;

      if (!rejectionReason) {
        return res.status(400).json({
          msg: "Rejection reason is required",
        });
      }

      const order = await Order.findById(orderId);

      if (!order) {
        return res.status(404).json({ msg: "Order not found" });
      }

      if (order.orderStatus !== "Pending") {
        return res.status(400).json({
          msg: "Only pending orders can be rejected",
          currentStatus: order.orderStatus,
        });
      }

      // Update order status
      order.orderStatus = "Rejected";
      order.rejectionReason = rejectionReason;
      order.status = "Cancelled";

      // Add to status history
      order.statusHistory?.push({
        status: "Rejected",
        updatedBy: req.user.id,
        notes: `Rejected: ${rejectionReason}`,
      });

      await order.save();

      res.json({
        msg: "Order rejected successfully",
        order,
      });
    } catch (error) {
      res.status(500).json({
        msg: "Error rejecting order",
        error: error.message,
      });
    }
  }
);

// ✅ Assign delivery boy to order
router.put(
  "/sub-admin/assign/:orderId",
  authMiddleware,
  requireAdminOrSubAdmin,
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const { deliveryBoyId } = req.body;

      if (!deliveryBoyId) {
        return res.status(400).json({
          msg: "Delivery boy ID is required",
        });
      }

      // Verify delivery boy exists and has correct role
      const deliveryBoy = await User.findById(deliveryBoyId);
      if (!deliveryBoy || deliveryBoy.role !== "deliveryBoy") {
        return res.status(400).json({
          msg: "Invalid delivery boy",
        });
      }

      const order = await Order.findById(orderId);

      if (!order) {
        return res.status(404).json({ msg: "Order not found" });
      }

      if (order.orderStatus !== "Confirmed") {
        return res.status(400).json({
          msg: "Only confirmed orders can be assigned",
          currentStatus: order.orderStatus,
        });
      }

      // Assign delivery boy
      order.deliveryBoyId = deliveryBoyId;
      order.assignedAt = new Date();
      order.orderStatus = "Assigned";

      // Add to status history
      order.statusHistory?.push({
        status: "Assigned",
        updatedBy: req.user.id,
        notes: `Assigned to delivery boy: ${deliveryBoy.name}`,
      });

      await order.save();

      res.json({
        msg: "Order assigned successfully",
        order: await order.populate("deliveryBoyId", "name phone"),
      });
    } catch (error) {
      res.status(500).json({
        msg: "Error assigning order",
        error: error.message,
      });
    }
  }
);

// ✅ Get all confirmed/assigned orders (for dashboard overview)
router.get(
  "/sub-admin/active",
  authMiddleware,
  requireAdminOrSubAdmin,
  async (req, res) => {
    try {
      const orders = await Order.find({
        orderStatus: { $in: ["Confirmed", "Assigned", "Out for Delivery"] },
      })
        .populate("userId", "_id name email phone")
        .populate("subAdminId", "_id name email")
        .populate("deliveryBoyId", "_id name phone")
        .sort({ createdAt: -1 });

      res.json({
        count: orders.length,
        orders,
      });
    } catch (error) {
      res.status(500).json({
        msg: "Error fetching active orders",
        error: error.message,
      });
    }
  }
);

/**
 * ======================================
 * DELIVERY BOY ORDER ENDPOINTS
 * ======================================
 */

// ✅ Get assigned orders for delivery boy
router.get(
  "/delivery-boy/assigned",
  authMiddleware,
  async (req, res) => {
    try {
      console.log("🚚 Delivery Boy /assigned endpoint");
      console.log("   User ID:", req.user.id);
      console.log("   User Role:", req.user.role);

      if (req.user.role !== "deliveryBoy") {
        console.error("❌ Role check failed. Expected: deliveryBoy, Got:", req.user.role);
        return res.status(403).json({
          success: false,
          msg: `Only delivery boys can access this endpoint. Your role: ${req.user.role}`,
        });
      }

      const orders = await Order.find({
        deliveryBoyId: req.user.id,
        orderStatus: { $in: ["Assigned", "Out for Delivery"] },
      })
        .populate("userId", "name email phone deliveryAddress")
        .sort({ assignedAt: -1 });

      console.log("✅ Found", orders.length, "assigned orders for delivery boy", req.user.id);

      res.json({
        success: true,
        count: orders.length,
        orders: orders || [],
        msg: orders.length === 0 ? "No assigned orders at this time" : "Assigned orders fetched successfully",
      });
    } catch (error) {
      console.error("❌ Error in /delivery-boy/assigned:", error.message);
      console.error("Stack:", error.stack);
      res.status(500).json({
        success: false,
        msg: "Error fetching assigned orders",
        error: error.message,
      });
    }
  }
);

// ✅ Update order status by delivery boy
router.put(
  "/delivery-boy/update-status/:orderId",
  authMiddleware,
  async (req, res) => {
    try {
      console.log("🚚 Delivery Boy /update-status endpoint");
      console.log("   User ID:", req.user.id);
      console.log("   User Role:", req.user.role);
      console.log("   Order ID:", req.params.orderId);

      if (req.user.role !== "deliveryBoy") {
        console.error("❌ Role check failed. Expected: deliveryBoy, Got:", req.user.role);
        return res.status(403).json({
          success: false,
          msg: "Only delivery boys can update status",
        });
      }

      const { orderId } = req.params;
      const { orderStatus, deliveryNotes } = req.body;

      const order = await Order.findById(orderId);

      if (!order) {
        console.error("❌ Order not found:", orderId);
        return res.status(404).json({
          success: false,
          msg: "Order not found",
        });
      }

      // Verify delivery boy owns this order
      if (order.deliveryBoyId?.toString() !== req.user.id) {
        console.error("❌ Unauthorized. Order delivery boy:", order.deliveryBoyId, "Current user:", req.user.id);
        return res.status(403).json({
          success: false,
          msg: "You can only update your assigned orders",
        });
      }

      // Validate status transitions
      const validTransitions = {
        Assigned: ["Out for Delivery"],
        "Out for Delivery": ["Delivered"],
      };

      if (
        !validTransitions[order.orderStatus] ||
        !validTransitions[order.orderStatus].includes(orderStatus)
      ) {
        console.error("❌ Invalid transition from", order.orderStatus, "to", orderStatus);
        return res.status(400).json({
          success: false,
          msg: `Cannot transition from ${order.orderStatus} to ${orderStatus}`,
          validTransitions: validTransitions[order.orderStatus],
        });
      }

      // Update order
      order.orderStatus = orderStatus;
      if (deliveryNotes) {
        order.deliveryNotes = deliveryNotes;
      }

      // Set delivered timestamp if order is delivered
      if (orderStatus === "Delivered") {
        order.deliveredAt = new Date();
        order.status = "Delivered";
      } else if (orderStatus === "Out for Delivery") {
        order.status = "Shipped";
      }

      // Add to status history
      order.statusHistory?.push({
        status: orderStatus,
        updatedBy: req.user.id,
        notes: deliveryNotes || "",
      });

      await order.save();
      console.log("✅ Order status updated successfully to:", orderStatus);

      res.json({
        success: true,
        msg: `Order status updated to ${orderStatus}`,
        order,
      });
    } catch (error) {
      console.error("❌ Error in /update-status:", error.message);
      console.error("Stack:", error.stack);
      res.status(500).json({
        success: false,
        msg: "Error updating order status",
        error: error.message,
      });
    }
  }
);

// ✅ Get delivered orders (history)
router.get(
  "/delivery-boy/completed",
  authMiddleware,
  async (req, res) => {
    try {
      console.log("🚚 Delivery Boy /completed endpoint");
      console.log("   User ID:", req.user.id);
      console.log("   User Role:", req.user.role);

      if (req.user.role !== "deliveryBoy") {
        console.error("❌ Role check failed. Expected: deliveryBoy, Got:", req.user.role);
        return res.status(403).json({
          success: false,
          msg: `Only delivery boys can access this endpoint. Your role: ${req.user.role}`,
        });
      }

      const orders = await Order.find({
        deliveryBoyId: req.user.id,
        orderStatus: "Delivered",
      }).sort({ deliveredAt: -1 });

      console.log("✅ Found", orders.length, "completed orders for delivery boy", req.user.id);

      res.json({
        success: true,
        count: orders.length,
        completedOrders: orders || [],
        msg: orders.length === 0 ? "No completed deliveries yet" : "Completed orders fetched successfully",
      });
    } catch (error) {
      console.error("❌ Error in /delivery-boy/completed:", error.message);
      console.error("Stack:", error.stack);
      res.status(500).json({
        success: false,
        msg: "Error fetching completed orders",
        error: error.message,
      });
    }
  }
);

/**
 * ======================================
 * ADMIN ORDER MANAGEMENT ENDPOINTS
 * ======================================
 */

// ✅ Get all orders with filters (Admin only)
router.get(
  "/admin/all",
  authMiddleware,
  async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({
          msg: "Only admins can access this endpoint",
        });
      }

      const { status, subAdminId, deliveryBoyId } = req.query;
      const query = {};

      if (status) query.orderStatus = status;
      if (subAdminId) query.subAdminId = subAdminId;
      if (deliveryBoyId) query.deliveryBoyId = deliveryBoyId;

      const orders = await Order.find(query)
        .populate("userId", "_id name email phone")
        .populate("subAdminId", "_id name email")
        .populate("deliveryBoyId", "_id name phone")
        .sort({ createdAt: -1 });

      res.json({
        count: orders.length,
        orders,
      });
    } catch (error) {
      res.status(500).json({
        msg: "Error fetching orders",
        error: error.message,
      });
    }
  }
);

// ✅ Delete order (Admin only)
router.delete(
  "/admin/delete/:orderId",
  authMiddleware,
  async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({
          msg: "Only admins can delete orders",
        });
      }

      const { orderId } = req.params;
      console.log("🗑️ Admin deleting order:", orderId);

      const order = await Order.findByIdAndDelete(orderId);

      if (!order) {
        return res.status(404).json({
          msg: "Order not found",
        });
      }

      console.log("✅ Order deleted successfully:", orderId);

      res.json({
        success: true,
        msg: "Order deleted successfully",
        deletedOrder: order,
      });
    } catch (error) {
      console.error("❌ Error deleting order:", error);
      res.status(500).json({
        msg: "Error deleting order",
        error: error.message,
      });
    }
  }
);

export default router;
