import mongoose from "mongoose";

const apiConfigSchema = new mongoose.Schema(
  {
    // API details
    apiKey: {
      type: String,
      required: true,
      // In production, this should be encrypted using a package like bcrypt
    },
    apiSource: {
      type: String,
      required: true,
      // Example: "https://api.example.com/v1/products"
    },
    apiName: {
      type: String,
      required: true,
      default: "External Peda API",
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },

    // Audit trail
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Additional fields
    description: String,
    timeout: {
      type: Number,
      default: 5000, // 5 seconds
    },
    retryAttempts: {
      type: Number,
      default: 3,
    },
  },
  { timestamps: true }
);

const APIConfig = mongoose.model("APIConfig", apiConfigSchema);

export default APIConfig;
