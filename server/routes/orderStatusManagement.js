import express from "express";
import Order from "../models/Order.js";
import User from "../models/user.js";
import { authMiddleware } from "../middlewares/Authentication.js";

const router = express.Router();

/**
 * ========================================
 * ORDER MANAGEMENT - ROLE-BASED SYSTEM
 * ========================================
 */

// ✅ Get orders based on role
router.get("/dashboard-orders", authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    let query = {};

    if (user.role === "admin") {
      // Admin sees all orders
      query = {};
    } else if (user.role === "subAdmin") {
      // Sub-admin sees unassigned and their own orders
      query = { $or: [{ subAdminId: user.id }, { subAdminId: null }] };
    } else if (user.role === "deliveryBoy") {
      // Delivery boy only sees assigned orders
      query = { deliveryBoyId: user.id };
    } else {
      // Regular user sees only their orders
      query = { userId: user.id };
    }

    const orders = await Order.find(query)
      .populate("userId", "name email phone")
      .populate("subAdminId", "name email")
      .populate("deliveryBoyId", "name phone")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      message: "Orders fetched based on role",
      role: user.role,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Error fetching dashboard orders:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching orders",
      error: error.message,
    });
  }
});

// ✅ Update order status with role-based restrictions
router.put("/update-status/:orderId", authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { newStatus, reason, remarks } = req.body;
    const user = req.user;

    // Find the order
    const order = await Order.findById(orderId).populate("userId subAdminId deliveryBoyId");
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const currentStatus = order.status;

    // ========================================
    // AUTHORIZATION CHECKS
    // ========================================

    // Admin can do anything
    if (user.role === "admin") {
      // Admin allowed for all transitions
    }
    // Sub-admin restrictions
    else if (user.role === "subAdmin") {
      // Can update: Pending → Processing, Processing → Shipped, Any → Cancelled
      const allowedTransitions = {
        Pending: ["Processing", "Cancelled"],
        Processing: ["Shipped", "Cancelled"],
        Shipped: ["Cancelled"],
      };

      const allowed = allowedTransitions[currentStatus] || [];
      if (!allowed.includes(newStatus)) {
        return res.status(403).json({
          success: false,
          message: `Sub-admin cannot change order from ${currentStatus} to ${newStatus}`,
          allowedTransitions: allowed,
        });
      }
    }
    // Delivery boy restrictions
    else if (user.role === "deliveryBoy") {
      // Can only change Shipped → Delivered
      if (currentStatus !== "Shipped" || newStatus !== "Delivered") {
        return res.status(403).json({
          success: false,
          message: "Delivery Boy can only mark Shipped orders as Delivered",
        });
      }

      // Check if delivery boy is assigned to this order
      if (order.deliveryBoyId?.toString() !== user.id) {
        return res.status(403).json({
          success: false,
          message: "This order is not assigned to you",
        });
      }
    }
    // Regular user cannot update status
    else {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update order status",
      });
    }

    // ========================================
    // STATUS UPDATE LOGIC
    // ========================================

    // Update status based on workflow
    const updateData = {
      status: newStatus,
      orderStatus: newStatus,
    };

    // Handle cancellation
    if (newStatus === "Cancelled") {
      updateData.rejectionReason = reason || "Order cancelled";
    }

    // Handle delivery completion
    if (newStatus === "Delivered") {
      updateData.deliveredAt = new Date();
      if (remarks) {
        updateData.deliveryNotes = remarks;
      }
    }

    // Handle processing start
    if (newStatus === "Processing") {
      updateData.subAdminId = user.id;
    }

    // Add to status history
    order.statusHistory.push({
      status: newStatus,
      timestamp: new Date(),
      updatedBy: user.id,
      notes: reason || remarks || null,
    });

    // Update the order
    Object.assign(order, updateData);
    await order.save();

    // Repopulate for response
    await order.populate("userId subAdminId deliveryBoyId");

    res.json({
      success: true,
      message: `Order status updated to ${newStatus}`,
      order,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({
      success: false,
      message: "Error updating order status",
      error: error.message,
    });
  }
});

// ✅ Assign delivery boy to order (Admin/Sub-admin only)
router.put("/assign-delivery-boy/:orderId", authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryBoyId } = req.body;
    const user = req.user;

    // Authorization check
    if (user.role !== "admin" && user.role !== "subAdmin") {
      return res.status(403).json({
        success: false,
        message: "Only Admin or Sub-admin can assign delivery boys",
      });
    }

    // Find order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Order must be in Shipped status to assign delivery boy
    if (order.status !== "Shipped") {
      return res.status(400).json({
        success: false,
        message: "Order must be in Shipped status to assign delivery boy",
      });
    }

    // Verify delivery boy exists
    const deliveryBoy = await User.findById(deliveryBoyId);
    if (!deliveryBoy || deliveryBoy.role !== "deliveryBoy") {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery boy ID",
      });
    }

    // Assign delivery boy
    order.deliveryBoyId = deliveryBoyId;
    order.assignedAt = new Date();
    order.statusHistory.push({
      status: "Assigned to Delivery Boy",
      timestamp: new Date(),
      updatedBy: user.id,
      notes: `Assigned to ${deliveryBoy.name}`,
    });

    await order.save();
    await order.populate("userId subAdminId deliveryBoyId");

    res.json({
      success: true,
      message: `Order assigned to ${deliveryBoy.name}`,
      order,
    });
  } catch (error) {
    console.error("Error assigning delivery boy:", error);
    res.status(500).json({
      success: false,
      message: "Error assigning delivery boy",
      error: error.message,
    });
  }
});

// ✅ Get available delivery boys (for assignment)
router.get("/available-delivery-boys", authMiddleware, async (req, res) => {
  try {
    const user = req.user;

    // Authorization check
    if (user.role !== "admin" && user.role !== "subAdmin") {
      return res.status(403).json({
        success: false,
        message: "Only Admin or Sub-admin can view delivery boys",
      });
    }

    // Tolerate legacy/variant role strings in DB so this endpoint doesn't return empty unexpectedly.
    const deliveryBoyRoleRegex = /^delivery(?:[-_ ]?boy|boy)$/i;
    const deliveryBoys = await User.find({
      role: { $regex: deliveryBoyRoleRegex },
      isBlocked: false,
    }).select("_id name phone email address role");

    res.json({
      success: true,
      count: deliveryBoys.length,
      deliveryBoys,
    });
  } catch (error) {
    console.error("Error fetching delivery boys:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching delivery boys",
      error: error.message,
    });
  }
});

// ✅ Get order status history
router.get("/status-history/:orderId", authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const user = req.user;

    const order = await Order.findById(orderId).populate({
      path: "statusHistory.updatedBy",
      select: "name email role",
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Authorization: User can only see their own order history
    if (
      user.role === "user" &&
      order.userId?.toString() !== user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own order history",
      });
    }

    res.json({
      success: true,
      orderId,
      currentStatus: order.status,
      history: order.statusHistory,
    });
  } catch (error) {
    console.error("Error fetching status history:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching status history",
      error: error.message,
    });
  }
});

// ✅ Get orders by status (Admin/Sub-admin only)
router.get("/by-status/:status", authMiddleware, async (req, res) => {
  try {
    const { status } = req.params;
    const user = req.user;

    // Authorization check
    if (user.role !== "admin" && user.role !== "subAdmin") {
      return res.status(403).json({
        success: false,
        message: "Only Admin or Sub-admin can filter orders by status",
      });
    }

    let query = { status };

    // Sub-admin only sees their assigned orders
    if (user.role === "subAdmin") {
      query.$or = [{ subAdminId: user.id }, { subAdminId: null }];
    }

    const orders = await Order.find(query)
      .populate("userId", "name email phone")
      .populate("subAdminId", "name email")
      .populate("deliveryBoyId", "name phone")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      status,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Error fetching orders by status:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching orders by status",
      error: error.message,
    });
  }
});

// ✅ Get order analytics (Admin/Sub-admin only)
router.get("/analytics/summary", authMiddleware, async (req, res) => {
  try {
    const user = req.user;

    // Authorization check
    if (user.role !== "admin" && user.role !== "subAdmin") {
      return res.status(403).json({
        success: false,
        message: "Only Admin or Sub-admin can view analytics",
      });
    }

    let query = {};
    if (user.role === "subAdmin") {
      query = { $or: [{ subAdminId: user.id }, { subAdminId: null }] };
    }

    const totalOrders = await Order.countDocuments(query);
    const pendingOrders = await Order.countDocuments({
      ...query,
      status: "Pending",
    });
    const processingOrders = await Order.countDocuments({
      ...query,
      status: "Processing",
    });
    const shippedOrders = await Order.countDocuments({
      ...query,
      status: "Shipped",
    });
    const deliveredOrders = await Order.countDocuments({
      ...query,
      status: "Delivered",
    });
    const cancelledOrders = await Order.countDocuments({
      ...query,
      status: "Cancelled",
    });

    const totalRevenue = await Order.aggregate([
      { $match: { ...query, status: "Delivered" } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);

    res.json({
      success: true,
      analytics: {
        totalOrders,
        pendingOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching analytics",
      error: error.message,
    });
  }
});

export default router;
