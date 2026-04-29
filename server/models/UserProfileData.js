import mongoose from "mongoose";

const userProfileDataSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    // General user documents (for all users)
    generalDocuments: {
      certificate: { type: String }, // URL to uploaded file
      graduationCertificate: { type: String }, // URL to uploaded file
      degreeCertificate: { type: String } // URL to uploaded file
    },
    // Delivery Boy specific fields
    deliveryBoyProfile: {
      aadhaarNumber: { type: String },
      licenseNumber: { type: String },
      vehicleType: { 
        type: String,
        enum: ["bike", "scooter", "bicycle", "car", "auto"],
      },
      documents: {
        aadhaarDoc: { type: String }, // URL to uploaded file
        licenseDoc: { type: String },
        vehicleDoc: { type: String }
      },
      isProfileComplete: { type: Boolean, default: false },
      completedAt: { type: Date }
    },
    // Sub-Admin specific fields
    subAdminProfile: {
      departmentId: { type: String },
      departmentName: { type: String },
      documents: {
        idProof: { type: String }, // URL to uploaded file
        highschoolMarksheet: { type: String }, // URL to uploaded file
        intermediateMarksheet: { type: String }, // URL to uploaded file
        degreeCertificate: { type: String } // URL to uploaded file
      },
      isProfileComplete: { type: Boolean, default: false },
      completedAt: { type: Date }
    },
    documentUploadStatus: {
      aadhaarDoc: { status: String, uploadedAt: Date },
      licenseDoc: { status: String, uploadedAt: Date },
      vehicleDoc: { status: String, uploadedAt: Date },
      idProofDoc: { status: String, uploadedAt: Date }
    }
  },
  { timestamps: true }
);

const UserProfileData = mongoose.model("UserProfileData", userProfileDataSchema);
export default UserProfileData;
