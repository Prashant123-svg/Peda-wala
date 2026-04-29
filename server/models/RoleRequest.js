import mongoose from "mongoose";

const roleRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    userName: {
      type: String,
      required: true
    },
    userEmail: {
      type: String,
      required: true
    },
    requestedRole: {
      type: String,
      enum: ["deliveryBoy", "subAdmin"],
      required: true
    },
    currentRole: {
      type: String,
      enum: ["user", "deliveryBoy", "subAdmin", "admin"],
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },
    requestReason: {
      type: String,
      default: ""
    },
    approvalNotes: {
      type: String,
      default: ""
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    approverRole: {
      type: String,
      enum: ["deliveryBoy", "subAdmin", "admin"]
    },
    rejectionReason: {
      type: String,
      default: ""
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    respondedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

const RoleRequest = mongoose.model("RoleRequest", roleRequestSchema);
export default RoleRequest;
