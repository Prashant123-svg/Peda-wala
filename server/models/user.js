import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, // ek hi email se multiple accounts nahi banenge
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6, // minimum 6 character ka password
    },
    phone: { type: String },     // optional initially
    address: { type: String },    // optional initially
    avatar: { type: String },     // optional initially
    isPhoneVerified: { type: Boolean, default: false },
    role: {
      type: String,
      enum: ["user", "deliveryBoy", "subAdmin", "admin"],
      default: "user"
    },
    // Admin-specific fields
    shopName: { type: String },
    shopDescription: { type: String },
    businessType: { type: String },
    status: { 
      type: String, 
      enum: ["active", "inactive"],
      default: "active"
    },
    // Subdomain for subAdmin
    subdomain: { type: String, unique: true, sparse: true }, // unique but optional (null for non-subAdmin)
    // Role request system
    requestedRole: { 
      type: String, 
      enum: ["deliveryBoy", "subAdmin", null],
      default: null 
    },
    requestStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", null],
      default: null
    },
    requestedAt: { type: Date },
    approvedAt: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rejectionReason: { type: String }
  },
  { timestamps: true } // automatically createdAt & updatedAt save karega
);

const User = mongoose.model("User", userSchema);
export default User;