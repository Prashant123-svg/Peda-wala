import express from "express";
import { authMiddleware } from "../middlewares/Authentication.js";
import User from "../models/user.js";
import UserProfileData from "../models/UserProfileData.js";
import RoleProfileRequirement from "../models/RoleProfileRequirement.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "public", "profile-documents");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const userId = req.user.id;
    const timestamp = Date.now();
    cb(null, `${userId}-${timestamp}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ["application/pdf", "image/jpeg", "image/png"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, JPEG, and PNG files are allowed"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Initialize profile requirements
const initializeRoleRequirements = async () => {
  try {
    const existingRequirements = await RoleProfileRequirement.countDocuments();
    if (existingRequirements === 0) {
      await RoleProfileRequirement.insertMany([
        {
          role: "deliveryBoy",
          requiredFields: [
            "name",
            "email",
            "phone",
            "aadhaarNumber",
            "licenseNumber",
            "vehicleType",
            "aadhaarDoc",
            "licenseDoc"
          ],
          description: "Delivery Boy profile requirements"
        },
        {
          role: "subAdmin",
          requiredFields: [
            "name",
            "email",
            "phone",
            "departmentId",
            "departmentName",
            "idProof",
            "highschoolMarksheet",
            "intermediateMarksheet",
            "degreeCertificate"
          ],
          description: "Sub-Admin profile requirements"
        }
      ]);
    }
  } catch (error) {
    console.error("Error initializing role requirements:", error);
  }
};

// Initialize on router load
initializeRoleRequirements();

// 📋 Get profile requirements for a specific role
router.get("/requirements/:role", async (req, res) => {
  try {
    const { role } = req.params;

    if (!["deliveryBoy", "subAdmin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const requirements = await RoleProfileRequirement.findOne({ role });

    if (!requirements) {
      return res.status(404).json({ message: "Requirements not found" });
    }

    res.json(requirements);
  } catch (error) {
    res.status(500).json({ message: "Error fetching requirements", error: error.message });
  }
});

// 🔍 Check profile completion status
router.get("/check-completion/:role", authMiddleware, async (req, res) => {
  try {
    const { role } = req.params;
    const userId = req.user.id;

    if (!["deliveryBoy", "subAdmin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const requirements = await RoleProfileRequirement.findOne({ role });
    if (!requirements) {
      return res.status(404).json({ message: "Requirements not found" });
    }

    const user = await User.findById(userId).select("-password");
    let profileData = await UserProfileData.findOne({ userId });

    if (!profileData) {
      profileData = new UserProfileData({ userId });
      await profileData.save();
    }

    // Check completion based on role
    let isComplete = false;
    let missingFields = [];

    if (role === "deliveryBoy") {
      const requiredFields = [
        { field: "name", value: user.name },
        { field: "email", value: user.email },
        { field: "phone", value: user.phone },
        { field: "aadhaarNumber", value: profileData.deliveryBoyProfile?.aadhaarNumber },
        { field: "licenseNumber", value: profileData.deliveryBoyProfile?.licenseNumber },
        { field: "vehicleType", value: profileData.deliveryBoyProfile?.vehicleType },
        { field: "aadhaarDoc", value: profileData.deliveryBoyProfile?.documents?.aadhaarDoc },
        { field: "licenseDoc", value: profileData.deliveryBoyProfile?.documents?.licenseDoc }
      ];

      missingFields = requiredFields
        .filter(item => !item.value)
        .map(item => item.field);

      isComplete = missingFields.length === 0;
    } else if (role === "subAdmin") {
      const requiredFields = [
        { field: "name", value: user.name },
        { field: "email", value: user.email },
        { field: "phone", value: user.phone },
        { field: "departmentId", value: profileData.subAdminProfile?.departmentId },
        { field: "departmentName", value: profileData.subAdminProfile?.departmentName },
        { field: "idProof", value: profileData.subAdminProfile?.idProof }
      ];

      missingFields = requiredFields
        .filter(item => !item.value)
        .map(item => item.field);

      isComplete = missingFields.length === 0;
    }

    res.json({
      isComplete,
      missingFields,
      completionPercentage: Math.round(
        ((requirements.requiredFields.length - missingFields.length) /
          requirements.requiredFields.length) *
          100
      ),
      requirements: requirements.requiredFields,
      currentData: role === "deliveryBoy" 
        ? profileData.deliveryBoyProfile 
        : profileData.subAdminProfile
    });
  } catch (error) {
    res.status(500).json({ message: "Error checking completion", error: error.message });
  }
});

// 📤 Upload document
router.post(
  "/upload-document/:role/:docType",
  authMiddleware,
  upload.single("document"),
  async (req, res) => {
    try {
      const { role, docType } = req.params;
      const userId = req.user.id;

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const documentUrl = `/profile-documents/${req.file.filename}`;

      let profileData = await UserProfileData.findOne({ userId });
      if (!profileData) {
        profileData = new UserProfileData({ userId });
      }

      if (role === "deliveryBoy") {
        if (!profileData.deliveryBoyProfile) {
          profileData.deliveryBoyProfile = { documents: {} };
        }
        if (!profileData.deliveryBoyProfile.documents) {
          profileData.deliveryBoyProfile.documents = {};
        }

        if (docType === "aadhaar") {
          profileData.deliveryBoyProfile.documents.aadhaarDoc = documentUrl;
        } else if (docType === "license") {
          profileData.deliveryBoyProfile.documents.licenseDoc = documentUrl;
        } else if (docType === "vehicle") {
          profileData.deliveryBoyProfile.documents.vehicleDoc = documentUrl;
        }
      } else if (role === "subAdmin") {
        if (!profileData.subAdminProfile) {
          profileData.subAdminProfile = { documents: {} };
        }
        if (!profileData.subAdminProfile.documents) {
          profileData.subAdminProfile.documents = {};
        }

        if (docType === "idProof") {
          profileData.subAdminProfile.documents.idProof = documentUrl;
        } else if (docType === "highschoolMarksheet") {
          profileData.subAdminProfile.documents.highschoolMarksheet = documentUrl;
        } else if (docType === "intermediateMarksheet") {
          profileData.subAdminProfile.documents.intermediateMarksheet = documentUrl;
        } else if (docType === "degreeCertificate") {
          profileData.subAdminProfile.documents.degreeCertificate = documentUrl;
        }
      }

      await profileData.save();

      res.json({
        message: "Document uploaded successfully",
        documentUrl,
        docType
      });
    } catch (error) {
      res.status(500).json({ message: "Error uploading document", error: error.message });
    }
  }
);

// 💾 Save role-specific profile data
router.post("/save-profile/:role", authMiddleware, async (req, res) => {
  try {
    const { role } = req.params;
    const userId = req.user.id;
    const profileData = req.body;

    if (!["deliveryBoy", "subAdmin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    let userProfileData = await UserProfileData.findOne({ userId });
    if (!userProfileData) {
      userProfileData = new UserProfileData({ userId });
    }

    if (role === "deliveryBoy") {
      userProfileData.deliveryBoyProfile = {
        ...userProfileData.deliveryBoyProfile,
        aadhaarNumber: profileData.aadhaarNumber,
        licenseNumber: profileData.licenseNumber,
        vehicleType: profileData.vehicleType
      };
    } else if (role === "subAdmin") {
      userProfileData.subAdminProfile = {
        ...userProfileData.subAdminProfile,
        departmentId: profileData.departmentId,
        departmentName: profileData.departmentName
      };
    }

    await userProfileData.save();

    res.json({
      message: "Profile data saved successfully",
      userProfileData
    });
  } catch (error) {
    res.status(500).json({ message: "Error saving profile data", error: error.message });
  }
});

// 🎯 Complete profile for role
router.post("/complete-profile/:role", authMiddleware, async (req, res) => {
  try {
    const { role } = req.params;
    const userId = req.user.id;

    let userProfileData = await UserProfileData.findOne({ userId });
    if (!userProfileData) {
      userProfileData = new UserProfileData({ userId });
    }

    if (role === "deliveryBoy") {
      userProfileData.deliveryBoyProfile.isProfileComplete = true;
      userProfileData.deliveryBoyProfile.completedAt = new Date();
    } else if (role === "subAdmin") {
      userProfileData.subAdminProfile.isProfileComplete = true;
      userProfileData.subAdminProfile.completedAt = new Date();
    }

    await userProfileData.save();

    res.json({
      message: "Profile marked as complete",
      userProfileData
    });
  } catch (error) {
    res.status(500).json({ message: "Error completing profile", error: error.message });
  }
});

export default router;
