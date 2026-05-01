import express from "express";
import Order from "../models/Order.js";
import User from "../models/user.js";
import { authMiddleware } from "../middlewares/Authentication.js";

const router = express.Router();

// ✅ Create/Confirm a new order
router.post("/create-order", authMiddleware, async (req, res) => {
  try {
    console.log("\n📥 CREATE ORDER REQUEST");
    console.log("👤 User ID:", req.user?.id);
    console.log("📦 Items count:", req.body?.items?.length);
    console.log("💰 Total price:", req.body?.totalPrice);

    const { items, totalPrice, deliveryAddress, phoneNumber, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      console.error("❌ Cart is empty");
      return res.status(400).json({ message: "Cart is empty" });
    }

    if (!deliveryAddress) {
      console.error("❌ Delivery address missing");
      return res.status(400).json({ message: "Delivery address is required" });
    }

    if (!phoneNumber) {
      console.error("❌ Phone number missing");
      return res.status(400).json({ message: "Phone number is required" });
    }

    // Verify user exists
    const user = await User.findById(req.user.id);
    if (!user) {
      console.error("❌ User not found:", req.user.id);
      return res.status(404).json({ message: "User not found" });
    }
    console.log("✅ User verified:", user.email);

    // Create order in database
    const newOrder = new Order({
      userId: req.user.id,
      items,
      totalPrice,
      deliveryAddress,
      phoneNumber,
      paymentMethod: paymentMethod || "COD",
      status: "Pending",
      orderStatus: "Pending",
      subAdminId: null,
      deliveryBoyId: null,
    });

    console.log("💾 Saving order to DB...");
    const savedOrder = await newOrder.save();
    console.log("✅ Order saved successfully:", savedOrder._id);

    res.status(201).json({
      message: "✅ Order confirmed successfully!",
      order: savedOrder,
    });
  } catch (error) {
    console.error("\n❌ ERROR CREATING ORDER:", error);
    console.error("Stack:", error.stack);
    res.status(500).json({
      message: "Error creating order",
      error: error.message,
      details: error.errors || error.stack,
    });
  }
});

// ✅ Get all orders for the current user
router.get("/my-orders", authMiddleware, async (req, res) => {
  try {
    console.log("\n📋 FETCH MY ORDERS REQUEST");
    console.log("👤 User ID:", req.user?.id);

    const orders = await Order.find({ userId: req.user.id })
      .populate("subAdminId", "_id name email")
      .populate("deliveryBoyId", "_id name phone")
      .sort({
        createdAt: -1,
      });

    console.log("✅ Found", orders.length, "order(s) for user");

    res.json({
      message: "Orders fetched successfully",
      orders,
      count: orders.length,
    });
  } catch (error) {
    console.error("\n❌ ERROR FETCHING ORDERS:", error);
    res.status(500).json({
      message: "Error fetching orders",
      error: error.message,
    });
  }
});

// ✅ Get single order by ID
router.get("/order/:orderId", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      userId: req.user.id,
    })
      .populate("subAdminId", "_id name email")
      .populate("deliveryBoyId", "_id name phone");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({
      message: "Order fetched successfully",
      order,
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({
      message: "Error fetching order",
      error: error.message,
    });
  }
});

// ✅ Cancel order
router.put("/cancel-order/:orderId", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.orderId, userId: req.user.id },
      { status: "Cancelled", orderStatus: "Cancelled" },
      { new: true }
    )
      .populate("subAdminId", "_id name email")
      .populate("deliveryBoyId", "_id name phone");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({
      message: "Error cancelling order",
      error: error.message,
    });
  }
});

// ✅ Get all orders (Admin only)
router.get("/admin/all-orders", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const allOrders = await Order.find({})
      .populate("userId", "name email phone address")
      .populate("subAdminId", "_id name email")
      .populate("deliveryBoyId", "_id name phone")
      .sort({ createdAt: -1 });

    res.json({
      message: "All orders fetched successfully",
      count: allOrders.length,
      orders: allOrders,
    });
  } catch (error) {
    console.error("Error fetching all orders:", error);
    res.status(500).json({
      message: "Error fetching orders",
      error: error.message,
    });
  }
});

// ✅ Get orders by user ID (Admin only)
router.get("/admin/user-orders/:userId", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const userOrders = await Order.find({ userId: req.params.userId })
      .populate("userId", "name email phone address")
      .populate("subAdminId", "_id name email")
      .populate("deliveryBoyId", "_id name phone")
      .sort({ createdAt: -1 });

    res.json({
      message: "User orders fetched successfully",
      count: userOrders.length,
      orders: userOrders,
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({
      message: "Error fetching user orders",
      error: error.message,
    });
  }
});

// ✅ Update order status (Admin only)
router.put("/admin/order-status/:orderId", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const { status } = req.body;
    const validStatuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      { status },
      { new: true }
    ).populate("userId", "name email phone address");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({
      message: "Error updating order status",
      error: error.message,
    });
  }
});

// ✅ Get single order by ID (Admin only)
router.get("/admin/order/:orderId", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const order = await Order.findById(req.params.orderId)
      .populate("userId", "name email phone address");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({
      message: "Order fetched successfully",
      order,
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({
      message: "Error fetching order",
      error: error.message,
    });
  }
});

// ✅ Delete order (Admin only)
router.delete("/admin/delete-order/:orderId", authMiddleware, async (req, res) => {
  try {
    console.log("🗑️ Delete order request - orderId:", req.params.orderId);
    console.log("👤 User ID from token:", req.user.id);

    const user = await User.findById(req.user.id);
    console.log("👥 User found:", user?.email, "Role:", user?.role);

    if (user.role !== "admin") {
      console.log("❌ User is not admin, access denied");
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    console.log("🔍 Finding order to delete...");
    const order = await Order.findByIdAndDelete(req.params.orderId);

    if (!order) {
      console.log("❌ Order not found");
      return res.status(404).json({ message: "Order not found" });
    }

    console.log("✅ Order deleted successfully:", order._id);
    res.json({
      message: "✅ Order deleted successfully",
      deletedOrder: order,
    });
  } catch (error) {
    console.error("❌ Error deleting order:", error);
    res.status(500).json({
      message: "Error deleting order",
      error: error.message,
    });
  }
});

export default router;
