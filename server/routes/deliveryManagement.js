/**
 * Delivery Assignment Routes
 * Location: server/routes/deliveryManagement.js
 * 
 * Handles delivery management when orders are fetched from external API:
 * - SubAdmin: Assigning orders to delivery boys
 * - DeliveryBoy: Viewing assigned orders and updating status
 * - Admin: Monitoring all deliveries
 */

import express from "express";
import axios from "axios";
import { authMiddleware } from "../middlewares/Authentication.js";
import { requireRole, requirePermission } from "../middlewares/PermissionGuard.js";
import { requireAdminOrSubAdmin } from "../middlewares/Authorization.js";
import DeliveryAssignment from "../models/DeliveryAssignment.js";
import User from "../models/user.js";

const router = express.Router();

// ============= HELPER FUNCTIONS =============

/**
 * Fetch order details from external API
 */
async function fetchOrderFromAPI(orderId) {
  try {
    const apiUrl = `${process.env.EXTERNAL_API_URL}/orders/${orderId}`;
    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${process.env.EXTERNAL_API_KEY}`,
        "Content-Type": "application/json"
      },
      timeout: 5000
    });
    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching order ${orderId} from API:`, error.message);
    return null;
  }
}

/**
 * Sync delivery status back to external API
 * IMPORTANT: Send updates to external API when status changes
 */
async function syncDeliveryStatusToAPI(orderId, internalStatus, metadata = {}) {
  try {
    // Map internal status to API status
    const statusMapping = {
      assigned: "processing",
      out_for_delivery: "in_transit",
      delivered: "delivered",
      failed: "delivery_failed"
    };

    const apiStatus = statusMapping[internalStatus] || internalStatus;

    const apiUrl = `${process.env.EXTERNAL_API_URL}/orders/${orderId}/update-delivery-status`;
    
    const response = await axios.put(
      apiUrl,
      {
        deliveryStatus: apiStatus,
        timestamp: new Date().toISOString(),
        ...metadata
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.EXTERNAL_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 5000
      }
    );

    console.log(`✅ Status synced to API for order ${orderId}: ${apiStatus}`);
    return response.data;
  } catch (error) {
    console.error(`⚠️ Failed to sync status to API for order ${orderId}:`, error.message);
    throw new Error(`API sync failed: ${error.message}`);
  }
}

/**
 * Retry sync with exponential backoff
 */
async function retrySync(deliveryAssignment) {
  const maxRetries = parseInt(process.env.API_SYNC_RETRY_COUNT || 3);
  const retryDelay = parseInt(process.env.API_SYNC_RETRY_DELAY || 5000);

  if (deliveryAssignment.syncRetryCount < maxRetries) {
    setTimeout(async () => {
      try {
        await syncDeliveryStatusToAPI(
          deliveryAssignment.orderId,
          deliveryAssignment.currentStatus
        );
        deliveryAssignment.syncStatus = "synced";
        deliveryAssignment.lastSyncedAt = new Date();
        await deliveryAssignment.save();
        console.log(`🔄 Retry successful for order ${deliveryAssignment.orderId}`);
      } catch (error) {
        deliveryAssignment.syncRetryCount += 1;
        await deliveryAssignment.save();
        console.log(`🔄 Retry ${deliveryAssignment.syncRetryCount} failed, will retry again`);
      }
    }, retryDelay * (deliveryAssignment.syncRetryCount + 1));
  }
}

// ============= SUBADMIN ROUTES =============

/**
 * Get orders ready for delivery from external API (not yet assigned)
 * GET /api/delivery/orders-to-assign?status=ready&limit=10&page=1
 */
router.get(
  "/orders-to-assign",
  authMiddleware,
  requireRole("admin", "subAdmin"),
  async (req, res) => {
    try {
      const { status = "ready_for_delivery", limit = 10, page = 1 } = req.query;

      // Fetch from external API
      const apiUrl = `${process.env.EXTERNAL_API_URL}/orders?status=${status}&limit=${limit}&page=${page}`;
      
      const apiResponse = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${process.env.EXTERNAL_API_KEY}`
        }
      });

      const ordersFromAPI = apiResponse.data.orders || [];

      // Check which orders are already assigned in our database
      const orderIds = ordersFromAPI.map(o => o.id);
      const assignedOrders = await DeliveryAssignment.find(
        { orderId: { $in: orderIds }, currentStatus: { $ne: "delivered" } }
      );

      const assignedOrderIds = new Set(assignedOrders.map(a => a.orderId));

      // Filter out already assigned orders
      const unassignedOrders = ordersFromAPI.filter(o => !assignedOrderIds.has(o.id));

      res.json({
        total: unassignedOrders.length,
        orders: unassignedOrders.map(o => ({
          orderId: o.id,
          orderNumber: o.orderNumber,
          customerName: o.customerName,
          customerPhone: o.customerPhone,
          customerAddress: o.customerAddress,
          totalAmount: o.totalAmount,
          orderDate: o.createdAt,
          specialInstructions: o.notes
        })),
        assignedOrders: Array.from(assignedOrderIds)
      });
    } catch (error) {
      console.error("Error fetching orders:", error.message);
      res.status(500).json({
        message: "Error fetching orders from API",
        error: error.message
      });
    }
  }
);

/**
 * SubAdmin: Assign delivery boy to order
 * POST /api/delivery/assign
 */
router.post(
  "/assign",
  authMiddleware,
  requireRole("admin", "subAdmin"),
  requirePermission("assign_deliveryboys"),
  async (req, res) => {
    try {
      const { orderId, deliveryBoyId, specialInstructions } = req.body;

      // Validate input
      if (!orderId || !deliveryBoyId) {
        return res.status(400).json({
          message: "Order ID and Delivery Boy ID are required"
        });
      }

      console.log(`📋 Attempting to assign order ${orderId} to delivery boy ${deliveryBoyId}`);

      // 1. Fetch order details from external API
      const orderData = await fetchOrderFromAPI(orderId);
      if (!orderData) {
        return res.status(404).json({
          message: "Order not found in external API"
        });
      }

      // 2. Verify delivery boy exists and is active
      const deliveryBoy = await User.findById(deliveryBoyId);
      if (!deliveryBoy || deliveryBoy.role !== "deliveryBoy") {
        return res.status(404).json({
          message: "Delivery boy not found or invalid role"
        });
      }

      if (!deliveryBoy.deliveryBoyProfile?.active) {
        return res.status(400).json({
          message: `Delivery boy ${deliveryBoy.name} is inactive`
        });
      }

      // 3. Check if order already assigned to someone else
      const existingAssignment = await DeliveryAssignment.findOne({ orderId });
      if (
        existingAssignment &&
        existingAssignment.currentStatus !== "delivered" &&
        existingAssignment.currentStatus !== "failed"
      ) {
        return res.status(400).json({
          message: `Order already assigned to ${existingAssignment.deliveryBoyName}`,
          currentDeliveryBoy: existingAssignment.deliveryBoyName
        });
      }

      // 4. Create or update delivery assignment
      let assignment;
      if (existingAssignment && (existingAssignment.currentStatus === "delivered" || existingAssignment.currentStatus === "failed")) {
        // Reuse old assignment document for the same order
        assignment = existingAssignment;
        assignment.deliveryBoyId = deliveryBoyId;
        assignment.deliveryBoyName = deliveryBoy.name;
        assignment.deliveryBoyPhone = deliveryBoy.phone;
        assignment.currentStatus = "assigned";
        assignment.statusHistory = [];
      } else {
        // Create new assignment
        assignment = new DeliveryAssignment({
          orderId,
          orderNumber: orderData.orderNumber,
          customerName: orderData.customerName,
          customerPhone: orderData.customerPhone,
          customerAddress: orderData.customerAddress,
          deliveryBoyId,
          deliveryBoyName: deliveryBoy.name,
          deliveryBoyPhone: deliveryBoy.phone,
          currentStatus: "assigned",
          orderDetails: {
            totalAmount: orderData.totalAmount,
            paymentMethod: orderData.paymentMethod,
            specialInstructions
          },
          assignedAt: new Date()
        });
      }

      // Add to status history
      assignment.statusHistory.push({
        status: "assigned",
        timestamp: new Date(),
        updatedBy: req.user.id,
        notes: "Order assigned by SubAdmin"
      });

      await assignment.save();

      console.log(
        `✅ Order ${orderId} assigned to ${deliveryBoy.name} (${deliveryBoy.phone})`
      );

      res.status(201).json({
        success: true,
        message: `Order assigned to ${deliveryBoy.name}`,
        delivery: {
          _id: assignment._id,
          orderId: assignment.orderId,
          orderNumber: assignment.orderNumber,
          deliveryBoyName: assignment.deliveryBoyName,
          customerName: assignment.customerName,
          currentStatus: assignment.currentStatus,
          assignedAt: assignment.assignedAt
        }
      });
    } catch (error) {
      console.error("Error assigning delivery:", error.message);
      res.status(500).json({
        message: "Error assigning delivery",
        error: error.message
      });
    }
  }
);

/**
 * Get all active deliveries (for SubAdmin dashboard)
 * GET /api/delivery/active?status=assigned&limit=20&page=1
 */
router.get(
  "/active",
  authMiddleware,
  requireRole("admin", "subAdmin"),
  requirePermission("view_orders"),
  async (req, res) => {
    try {
      const { status, limit = 20, page = 1 } = req.query;
      let filter = {};

      if (status) {
        filter.currentStatus = status;
      }

      const skip = (page - 1) * limit;

      const deliveries = await DeliveryAssignment.find(filter)
        .populate("deliveryBoyId", "name phone")
        .select(
          "_id orderId orderNumber customerName customerPhone currentStatus assignedAt totalAmount"
        )
        .sort({ assignedAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip));

      const total = await DeliveryAssignment.countDocuments(filter);

      res.json({
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        deliveries
      });
    } catch (error) {
      res.status(500).json({
        message: "Error fetching deliveries",
        error: error.message
      });
    }
  }
);

// ============= DELIVERY BOY ROUTES =============

/**
 * Delivery Boy/Sub-Admin: Get assigned orders
 * Delivery Boy sees their own, Sub-Admin sees all
 * GET /api/delivery/my-orders?status=assigned
 */
router.get(
  "/my-orders",
  authMiddleware,
  requireAdminOrSubAdmin,
  async (req, res) => {
    try {
      const { status } = req.query;
      let filter = {};

      // If delivery boy, only show their assignments
      if (req.user.role === "deliveryBoy") {
        filter.deliveryBoyId = req.user.id;
      }
      // If subAdmin/admin, show all assignments

      if (status) {
        filter.currentStatus = status;
      } else {
        // By default, show assigned and out for delivery (not completed)
        filter.currentStatus = {
          $in: ["assigned", "out_for_delivery"]
        };
      }

      const assignments = await DeliveryAssignment.find(filter)
        .select(
          "_id orderId orderNumber customerName customerPhone customerAddress totalAmount currentStatus specialInstructions assignedAt"
        )
        .sort({ assignedAt: 1 });

      res.json({
        total: assignments.length,
        assignments
      });
    } catch (error) {
      res.status(500).json({
        message: "Error fetching your orders",
        error: error.message
      });
    }
  }
);

/**
 * Delivery Boy/Sub-Admin: Get single delivery details
 * Delivery Boy sees only their own, Sub-Admin sees all
 * GET /api/delivery/:assignmentId
 */
router.get(
  "/:assignmentId",
  authMiddleware,
  requireAdminOrSubAdmin,
  async (req, res) => {
    try {
      const { assignmentId } = req.params;

      const delivery = await DeliveryAssignment.findById(assignmentId);

      if (!delivery) {
        return res.status(404).json({ message: "Delivery not found" });
      }

      // Delivery boy can only see their own deliveries
      if (req.user.role === "deliveryBoy" && delivery.deliveryBoyId.toString() !== req.user.id) {
        return res.status(403).json({
          message: "Unauthorized: This delivery is not assigned to you"
        });
      }
      // SubAdmin/Admin can see all deliveries

      res.json({ delivery });
    } catch (error) {
      res.status(500).json({
        message: "Error fetching delivery details",
        error: error.message
      });
    }
  }
);

/**
 * Delivery Boy/Sub-Admin: Update delivery status
 * PUT /api/delivery/update-status
 * 
 * CRITICAL: This syncs the status back to the external API
 */
router.put(
  "/update-status",
  authMiddleware,
  requireAdminOrSubAdmin,
  async (req, res) => {
    try {
      const { assignmentId, status, notes, latitude, longitude } = req.body;
      const deliveryBoyId = req.user.id;

      // Validate status
      const validStatuses = ["assigned", "out_for_delivery", "delivered", "failed"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          message: `Invalid status. Valid: ${validStatuses.join(", ")}`
        });
      }

      // Get assignment
      const assignment = await DeliveryAssignment.findById(assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: "Delivery assignment not found" });
      }

      // Verify ownership - Delivery boy can only update their own, SubAdmin can update any
      if (req.user.role === "deliveryBoy" && assignment.deliveryBoyId.toString() !== req.user.id) {
        return res.status(403).json({
          message: "Unauthorized: This delivery is not assigned to you"
        });
      }

      console.log(
        `📦 Delivery Boy updating order ${assignment.orderId} status to: ${status}`
      );

      // Update status
      const oldStatus = assignment.currentStatus;
      assignment.currentStatus = status;
      assignment.updatedAt = new Date();

      // Add to status history
      assignment.statusHistory.push({
        status,
        timestamp: new Date(),
        updatedBy: deliveryBoyId,
        notes: notes || "",
        latitude,
        longitude
      });

      if (status === "delivered") {
        assignment.deliveredAt = new Date();
      } else if (status === "failed") {
        assignment.failureReason = notes;
      }

      // 🔄 SYNC TO EXTERNAL API - CRITICAL!
      try {
        console.log(`🔄 Syncing status to external API for order ${assignment.orderId}`);
        
        await syncDeliveryStatusToAPI(assignment.orderId, status, {
          latitude,
          longitude,
          notes
        });

        assignment.lastSyncedAt = new Date();
        assignment.syncStatus = "synced";
        assignment.syncError = null;
        assignment.syncRetryCount = 0;

        console.log(`✅ Status synced successfully`);
      } catch (syncError) {
        console.error("⚠️ API sync failed:", syncError.message);
        
        // Store error but don't reject - local update is still made
        assignment.syncStatus = "failed";
        assignment.syncError = syncError.message;
        assignment.syncRetryCount = 0;

        // Retry sync in background
        retrySync(assignment);
      }

      await assignment.save();

      // Update delivery boy statistics
      if (status === "delivered") {
        await User.findByIdAndUpdate(deliveryBoyId, {
          $inc: { "deliveryBoyProfile.successfulDeliveries": 1 }
        });
        console.log(`📊 Updated delivery boy stats`);
      } else if (status === "failed") {
        await User.findByIdAndUpdate(deliveryBoyId, {
          $inc: { "deliveryBoyProfile.failedDeliveries": 1 }
        });
      }

      res.json({
        success: true,
        message: `Status updated to ${status}`,
        delivery: {
          _id: assignment._id,
          orderId: assignment.orderId,
          orderNumber: assignment.orderNumber,
          currentStatus: assignment.currentStatus,
          deliveredAt: assignment.deliveredAt,
          syncStatus: assignment.syncStatus,
          syncError: assignment.syncError,
          lastSyncedAt: assignment.lastSyncedAt
        }
      });
    } catch (error) {
      console.error("Error updating delivery status:", error.message);
      res.status(500).json({
        message: "Error updating delivery status",
        error: error.message
      });
    }
  }
);

// ============= ADMIN ROUTES =============

/**
 * Admin: Get delivery statistics
 * GET /api/delivery/stats
 */
router.get(
  "/stats",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    try {
      const stats = {
        totalAssignments: await DeliveryAssignment.countDocuments(),
        assigned: await DeliveryAssignment.countDocuments({ currentStatus: "assigned" }),
        outForDelivery: await DeliveryAssignment.countDocuments({ currentStatus: "out_for_delivery" }),
        delivered: await DeliveryAssignment.countDocuments({ currentStatus: "delivered" }),
        failed: await DeliveryAssignment.countDocuments({ currentStatus: "failed" })
      };

      res.json({ stats });
    } catch (error) {
      res.status(500).json({
        message: "Error fetching statistics",
        error: error.message
      });
    }
  }
);

export default router;
