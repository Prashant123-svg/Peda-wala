import mongoose from "mongoose";

const roleProfileRequirementSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["deliveryBoy", "subAdmin"],
      required: true,
      unique: true
    },
    requiredFields: {
      type: [String],
      required: true
    },
    description: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

const RoleProfileRequirement = mongoose.model(
  "RoleProfileRequirement",
  roleProfileRequirementSchema
);
export default RoleProfileRequirement;
