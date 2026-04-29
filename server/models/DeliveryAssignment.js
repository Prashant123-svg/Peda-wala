/**
 * DeliveryAssignment Model
 * Location: server/models/DeliveryAssignment.js
 * 
 * Schema for managing delivery assignments when orders come from external API
 */

import mongoose from "mongoose";

const DeliveryAssignmentSchema = new mongoose.Schema({
  // ============= Order Information (from External API) =============
  orderId: {
    type: String,
    required: true,
    unique: true,
    description: "Unique order ID from external API"
  },

  orderNumber: {
    type: String,
    required: true,
    description: "Display order number (e.g., ORD-2024-001)"
  },

  // ============= Customer Information (from External API) =============
  customerName: String,
  customerPhone: String,
  customerAddress: String,

  // ============= Delivery Boy Assignment =============
  deliveryBoyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    index: true,
    description: "Reference to delivery boy user in database"
  },

  deliveryBoyName: String,
  deliveryBoyPhone: String,

  // ============= Delivery Status =============
  currentStatus: {
    type: String,
    enum: ["assigned", "out_for_delivery", "delivered", "failed"],
    default: "assigned",
    index: true,
    description: "Current delivery status"
  },

  // ============= Status Change History =============
  statusHistory: [
    {
      status: String,
      timestamp: { type: Date, default: Date.now },
      updatedBy: mongoose.Schema.Types.ObjectId,
      notes: String,
      latitude: Number,          // For tracking delivery location
      longitude: Number
    }
  ],

  // ============= Order Details (cached from API) =============
  orderDetails: {
    totalAmount: Number,
    paymentMethod: String,
    specialInstructions: String,
    items: [                     // Optional: cache items if from API
      {
        productName: String,
        quantity: Number,
        price: Number
      }
    ]
  },

  // ============= External API Synchronization =============
  lastSyncedAt: Date,

  syncStatus: {
    type: String,
    enum: ["pending", "synced", "failed"],
    default: "pending",
    description: "Status of sync with external API"
  },

  syncError: String,             // Error message if sync failed
  syncRetryCount: {
    type: Number,
    default: 0
  },

  // ============= Delivery Completion Info =============
  deliveredAt: Date,
  failureReason: String,         // e.g., "Customer not home", "Phone unreachable"

  // ============= Timestamps =============
  assignedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// ============= INDEXES (CRITICAL FOR PERFORMANCE) =============

// Query: Get all orders assigned to a delivery boy
DeliveryAssignmentSchema.index({ deliveryBoyId: 1, currentStatus: 1 });

// Query: Get all undelivered orders for dashboard
DeliveryAssignmentSchema.index({ currentStatus: 1, assignedAt: -1 });

// Query: Filter by date range
DeliveryAssignmentSchema.index({ assignedAt: -1 });

// Pre-save hook to update timestamps
DeliveryAssignmentSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model("DeliveryAssignment", DeliveryAssignmentSchema);
