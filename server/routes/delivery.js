import express from "express";
import { authMiddleware } from "../middlewares/Authentication.js";
import { requireRole, requireDeliveryBoyOrHigher, requireAdminOrSubAdmin } from "../middlewares/Authorization.js";
import { requirePermission } from "../middlewares/PermissionGuard.js";
import Order from "../models/Order.js";
import User from "../models/user.js";

const router = express.Router();

// ✅ Get all assigned orders (Delivery Boy sees their own, Sub-Admin sees all)
router.get("/my-orders", authMiddleware, requireDeliveryBoyOrHigher, async (req, res) => {
  try {
    let query = {};
    
    // If delivery boy, only show their orders
    if (req.user.role === "deliveryBoy") {
      query.deliveryBoyId = req.user.id;
    }
    // If subAdmin or admin, show all delivery orders
    
    const orders = await Order.find(query)
      .populate("userId", "name email phone address")
      .sort({ createdAt: -1 });

    res.json({
      count: orders.length,
      orders,
    });
  } catch (error) {
    res.status(500).json({ msg: "Error fetching assigned orders", error: error.message });
  }
});

// ✅ Get specific order details (Delivery Boy sees only their orders, Sub-Admin sees all)
router.get("/order/:orderId", authMiddleware, requireAdminOrSubAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate("userId", "name email phone address")
      .populate("deliveryBoyId", "name phone");

    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    // Delivery boy can only see their own assigned orders
    if (req.user.role === "deliveryBoy" && order.deliveryBoyId?.toString() !== req.user.id) {
      return res.status(403).json({ msg: "You can only view your assigned orders" });
    }
    // Sub-Admin and Admin can see all orders

    res.json(order);
  } catch (error) {
    res.status(500).json({ msg: "Error fetching order", error: error.message });
  }
});

// ✅ Update delivery status (Delivery Boy or Sub-Admin)
router.put("/order/:orderId/delivery-status", authMiddleware, requireAdminOrSubAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryStatus, deliveryNotes } = req.body;

    // Validate delivery status
    const validStatuses = ["Out for Delivery", "Delivered", "Failed Delivery"];
    if (!validStatuses.includes(deliveryStatus)) {
      return res.status(400).json({
        msg: "Invalid delivery status",
        validStatuses,
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    // Ensure delivery boy only updates their assigned orders
    if (order.deliveryBoyId?.toString() !== req.user.id) {
      return res.status(403).json({ msg: "You can only update your assigned orders" });
    }

    // Update order
    order.deliveryStatus = deliveryStatus;
    if (deliveryNotes) {
      order.deliveryNotes = deliveryNotes;
    }

    // Update main status based on delivery status
    if (deliveryStatus === "Delivered") {
      order.status = "Delivered";
    } else if (deliveryStatus === "Failed Delivery") {
      order.status = "Failed Delivery";
    } else if (deliveryStatus === "Out for Delivery") {
      order.status = "Shipped"; // or keep as "Out for Delivery" based on your logic
    }

    await order.save();

    res.json({
      msg: "Delivery status updated successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({ msg: "Error updating delivery status", error: error.message });
  }
});

// ✅ Admin/Sub-Admin: Get all delivery boys
router.get("/all-delivery-boys", authMiddleware, requireAdminOrSubAdmin, async (req, res) => {
  try {
    console.log("👥 Fetching delivery boys for user:", req.user.id, "Role:", req.user.role);
    
    // Simple query first - just get delivery boys without stats
    const deliveryBoys = await User.find({ role: "deliveryBoy" });

    if (!deliveryBoys || deliveryBoys.length === 0) {
      console.log("⚠️ No delivery boys found");
      return res.json({
        count: 0,
        deliveryBoys: [],
      });
    }

    console.log("✅ Found", deliveryBoys.length, "delivery boys");

    // Convert to plain objects and format response
    const formattedBoys = deliveryBoys.map((db) => ({
      _id: db._id.toString ? db._id.toString() : db._id,
      name: db.name,
      email: db.email,
      phone: db.phone,
      address: db.address || "",
      status: db.status || "active",
      createdAt: db.createdAt,
    }));

    console.log("✅ Returning", formattedBoys.length, "delivery boys");

    res.json({
      count: formattedBoys.length,
      deliveryBoys: formattedBoys,
    });
  } catch (error) {
    console.error("❌ Error fetching delivery boys:", error.message);
    console.error("Stack:", error.stack);
    res.status(500).json({ 
      msg: "Error fetching delivery boys", 
      error: error.message
    });
  }
});

// ✅ Admin/Sub-Admin: Assign order to delivery boy
router.put("/order/:orderId/assign", authMiddleware, requireAdminOrSubAdmin, requirePermission("assign_deliveryboys"), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryBoyId } = req.body;

    if (!deliveryBoyId) {
      return res.status(400).json({ msg: "Delivery Boy ID is required" });
    }

    // Verify delivery boy exists
    const deliveryBoy = await User.findById(deliveryBoyId);
    if (!deliveryBoy || deliveryBoy.role !== "deliveryBoy") {
      return res.status(400).json({ msg: "Invalid Delivery Boy" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    order.deliveryBoyId = deliveryBoyId;
    order.deliveryStatus = "Assigned";
    order.assignedAt = new Date();
    await order.save();

    res.json({
      msg: "Order assigned to delivery boy successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({ msg: "Error assigning order", error: error.message });
  }
});

// ✅ Admin/Sub-Admin: Unassign delivery boy (remove assignment)
router.put("/order/:orderId/unassign", authMiddleware, requireAdminOrSubAdmin, requirePermission("assign_deliveryboys"), async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    if (!order.deliveryBoyId) {
      return res.status(400).json({ msg: "Order is not assigned to any delivery boy" });
    }

    order.deliveryBoyId = null;
    order.deliveryStatus = "Not Assigned";
    order.assignedAt = null;
    await order.save();

    res.json({
      msg: "Order unassigned successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({ msg: "Error unassigning order", error: error.message });
  }
});

// ✅ Admin/Sub-Admin: Get unassigned orders (ready for delivery)
router.get("/unassigned-orders", authMiddleware, requireAdminOrSubAdmin, async (req, res) => {
  try {
    const orders = await Order.find({
      deliveryBoyId: null,
      status: { $in: ["Pending", "Shipped"] },
    })
      .populate("userId", "name email phone address")
      .sort({ createdAt: -1 });

    res.json({
      count: orders.length,
      orders,
    });
  } catch (error) {
    res.status(500).json({ msg: "Error fetching unassigned orders", error: error.message });
  }
});

// ✅ Admin/Sub-Admin: Get assigned orders (currently being delivered)
router.get("/assigned-orders", authMiddleware, requireAdminOrSubAdmin, async (req, res) => {
  try {
    const orders = await Order.find({
      deliveryBoyId: { $ne: null },
      status: { $in: ["Pending", "Shipped", "In Transit"] },
    })
      .populate("userId", "name email phone address")
      .populate("deliveryBoyId", "name phone vehicleType")
      .sort({ assignedAt: -1, createdAt: -1 });

    res.json({
      count: orders.length,
      orders,
    });
  } catch (error) {
    res.status(500).json({ msg: "Error fetching assigned orders", error: error.message });
  }
});

// ✅ Delivery Boy: Get personal sales/performance summary
router.get("/my-performance", authMiddleware, requireAdminOrSubAdmin, async (req, res) => {
  try {
    let query = {};
    
    // If delivery boy, show their performance
    if (req.user.role === "deliveryBoy") {
      query.deliveryBoyId = req.user.id;
    }
    // If subAdmin/admin, they can query a specific delivery boy if needed
    // Via query param: ?deliveryBoyId=...
    const { deliveryBoyId } = req.query;
    if (deliveryBoyId && req.user.role !== "deliveryBoy") {
      query.deliveryBoyId = deliveryBoyId;
    }
    
    const orders = await Order.find(query);

    const totalOrders = orders.length;
    const deliveredOrders = orders.filter((o) => o.status === "Delivered").length;
    const failedOrders = orders.filter((o) => o.status === "Failed Delivery").length;
    const pendingOrders = orders.filter((o) => o.status === "Pending" || o.status === "Shipped").length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

    const performance = {
      totalOrders,
      deliveredOrders,
      failedOrders,
      pendingOrders,
      totalRevenue,
      successRate: totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    };

    res.json(performance);
  } catch (error) {
    res.status(500).json({ msg: "Error fetching performance", error: error.message });
  }
});

export default router;
