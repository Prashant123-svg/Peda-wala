import "dotenv/config";
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/user.js";// mongoose model
import Order from "../models/Order.js";
import { authMiddleware } from "../middlewares/Authentication.js";
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
    cb(new Error("Invalid file type. Only PDF, JPEG, PNG allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// ✅ Google OAuth Configuration
const getGoogleCallbackURL = () => {
  if (process.env.NODE_ENV === "production") {
    return process.env.GOOGLE_CALLBACK_URL || "https://pedhe-backend.onrender.com/auth/google/callback";
  }
  return process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/auth/google/callback";
};

const googleOAuthConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);

if (googleOAuthConfigured) {
  const maskedClientId = `${process.env.GOOGLE_CLIENT_ID.slice(0, 12)}...`;
  console.log(`✅ Google OAuth is enabled (client: ${maskedClientId}, callback: ${getGoogleCallbackURL()})`);

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: getGoogleCallbackURL(),
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails[0]?.value?.toLowerCase();
          
          if (!email) {
            console.error(`❌ Google OAuth: No email found in profile`);
            return done(new Error("No email provided by Google"), null);
          }
          
          console.log(`🔍 Google OAuth: Checking for user with email: ${email}`);
          
          // Find by lowercase email to avoid duplicates
          let user = await User.findOne({ email: email.toLowerCase() });

          if (!user) {
            console.log(`➕ Google OAuth: Creating new user for ${email}`);
            user = new User({
              googleId: profile.id,
              name: profile.displayName || "Google User",
              email: email.toLowerCase(), // Always store as lowercase
              role: "user",
              avatar: profile.photos?.[0]?.value || null,
              // password field is NOT set - will be undefined for Google OAuth users
            });
            
            await user.save();
            console.log(`✅ Google OAuth: User saved successfully!`);
            console.log(`   - ID: ${user._id}`);
            console.log(`   - Email: ${user.email}`);
            console.log(`   - GoogleId: ${user.googleId}`);
            
            // Fetch fresh user from database to ensure all fields are populated
            const freshUser = await User.findById(user._id);
            if (!freshUser) {
              console.error(`❌ Google OAuth: Failed to retrieve saved user from database`);
              return done(new Error("Failed to save user"), null);
            }
            
            return done(null, freshUser);
          } else {
            console.log(`✅ Google OAuth: Existing user found!`);
            console.log(`   - ID: ${user._id}`);
            console.log(`   - Email: ${user.email}`);
            
            // Update googleId if not already set
            if (!user.googleId) {
              user.googleId = profile.id;
              await user.save();
              console.log(`✅ Google OAuth: Updated googleId for existing user`);
            }
            
            // Return the user with all data populated
            const updatedUser = await User.findById(user._id);
            if (!updatedUser) {
              console.error(`❌ Google OAuth: Failed to retrieve user from database`);
              return done(new Error("User not found in database"), null);
            }
            
            return done(null, updatedUser);
          }
        } catch (error) {
          console.error(`❌ Google OAuth Strategy Error:`, error.message);
          console.error(`   Stack:`, error.stack);
          return done(error, null);
        }
      }
    )
  );
} else {
  console.warn(
    `⚠️ Google OAuth is disabled because GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing. Callback would be: ${getGoogleCallbackURL()}`
  );
}

passport.serializeUser((user, done) => {
  console.log(`🔐 Serializing user: ${user.email} (ID: ${user._id})`);
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    console.log(`🔐 Deserializing user with ID: ${id}`);
    const user = await User.findById(id);
    if (!user) {
      console.error(`❌ User not found during deserialization for ID: ${id}`);
      return done(null, false);
    }
    console.log(`✅ User deserialized successfully: ${user.email} (ID: ${user._id})`);
    done(null, user);
  } catch (error) {
    console.error(`❌ Deserialization error:`, error.message);
    done(error, null);
  }
});

// ✅ Signup Admin (First step - with admin secret key)
router.post("/signup-admin", async (req, res) => {
  try {
    const { name, email, password, adminSecret } = req.body;

    // Verify admin secret key
    if (adminSecret !== process.env.ADMIN_SECRET_KEY) {
      return res.status(403).json({ message: "Invalid admin secret key" });
    }

    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists, Please login" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user with role set to "admin"
    const newAdmin = new User({ name, email, password: hashedPassword, role: "admin" });
    await newAdmin.save();

    res.json({ 
      message: "✅ Admin signup successful!", 
      user: { id: newAdmin._id, name: newAdmin.name, email: newAdmin.email, role: newAdmin.role }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Signup (prashantchraya@gmail.com + Admin@123 becomes admin, others are users)
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, shopName, shopDescription, businessType } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    // Use lowercase email for consistency
    const normalizedEmail = email.toLowerCase();

    // Check existing user
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) return res.status(400).json({ message: "User already exists, Please login" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if email and password match admin credentials
    const isAdmin = normalizedEmail === process.env.ADMIN_EMAIL?.toLowerCase() && password === process.env.ADMIN_PASSWORD;
    const userRole = isAdmin ? "admin" : "user";

    // Create user with appropriate role and admin details if admin
    const newUser = new User({ 
      name, 
      email: normalizedEmail, 
      password: hashedPassword, 
      role: userRole,
      ...(isAdmin && { 
        shopName: shopName || "Pedhe Wale",
        shopDescription: shopDescription || "Premium Pedhe & Sweets",
        businessType: businessType || "E-commerce"
      })
    });
    
    await newUser.save();

    console.log(`✅ New user signed up: ${normalizedEmail} (ID: ${newUser._id}, Role: ${userRole})`);

    res.json({ 
      message: isAdmin ? "✅ Admin account created successfully!" : "✅ Signup successful",
      user: { 
        id: newUser._id, 
        name: newUser.name, 
        email: newUser.email, 
        role: newUser.role,
        ...(isAdmin && { shopName: newUser.shopName })
      }
    });
  } catch (err) {
    console.error(`❌ Signup error:`, err.message);
    res.status(500).json({ message: err.message });
  }
});

// ✅ Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user - use lowercase email for consistency
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ message: "❌ Email not registered. Please sign up first!" });

    // Check if user registered with Google OAuth
    if (user.googleId && !user.password) {
      return res.status(400).json({ 
        message: "❌ This account was registered with Google. Please login with Google instead!",
        hint: "Use the 'Login with Google' button"
      });
    }

    // Check password exists and is valid
    if (!user.password) {
      return res.status(400).json({ message: "❌ Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "❌ Incorrect password. Please try again!" });

    // Create JWT token (include role!)
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });

    console.log(`✅ User logged in: ${user.email} (ID: ${user._id}, Role: ${user.role})`);
    
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role || "user" 
      } 
    });
  } catch (err) {
    console.error(`❌ Login error:`, err.message);
    res.status(500).json({ message: err.message });
  }
});

  
// ✅ Get profile
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    console.log("📋 Profile Request - User ID:", req.user.id);
    
    const user = await User.findById(req.user.id).select("-password");
    
    if (!user) {
      console.error("❌ User not found in database - ID:", req.user.id);
      return res.status(404).json({ message: "User not found" });
    }
    
    console.log("✅ Profile fetched for user:", user.email);
    res.json(user);
  } catch (error) {
    console.error("❌ Error fetching profile:", error.message);
    res.status(500).json({ message: "Error fetching profile", error: error.message });
  }
});

// Update profile (name, phone + address)
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone, address },
      { new: true }
    ).select("-password");

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error updating profile", error });
  }
});

// ✅ Change Password
router.put("/change-password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Find user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password changed successfully ✅" });
  } catch (error) {
    res.status(500).json({ message: "Error changing password", error });
  }
});

// ✅ Get all users (Admin only)
router.get("/admin/all-users", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const allUsers = await User.find({}).select("-password").sort({ createdAt: -1 });
    res.json({
      message: "All users fetched successfully",
      count: allUsers.length,
      users: allUsers,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users", error });
  }
});

// ✅ Get user by ID (Admin only)
router.get("/admin/user/:userId", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const targetUser = await User.findById(req.params.userId).select("-password");
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User fetched successfully",
      user: targetUser,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Error fetching user", error });
  }
});

// ✅ Assign Admin Role to User (Admin only)
router.put("/admin/assign-admin/:userId", authMiddleware, async (req, res) => {
  try {
    // Check if current user is admin
    const currentUser = await User.findById(req.user.id);
    if (currentUser.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    // Find target user and update role to admin
    const targetUser = await User.findByIdAndUpdate(
      req.params.userId,
      { role: "admin" },
      { new: true }
    ).select("-password");

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "✅ User promoted to admin successfully",
      user: targetUser,
    });
  } catch (error) {
    console.error("Error assigning admin role:", error);
    res.status(500).json({ message: "Error assigning admin role", error });
  }
});

// ✅ Remove Admin Role from User (Admin only)
router.put("/admin/remove-admin/:userId", authMiddleware, async (req, res) => {
  try {
    // Check if current user is admin
    const currentUser = await User.findById(req.user.id);
    if (currentUser.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    // Find target user and update role back to user
    const targetUser = await User.findByIdAndUpdate(
      req.params.userId,
      { role: "user" },
      { new: true }
    ).select("-password");

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "✅ Admin role removed successfully",
      user: targetUser,
    });
  } catch (error) {
    console.error("Error removing admin role:", error);
    res.status(500).json({ message: "Error removing admin role", error });
  }
});

// ✅ Delete User (Admin only) - Also deletes all their orders
router.delete("/admin/user/:userId", authMiddleware, async (req, res) => {
  try {
    console.log("🗑️ Delete user request - userId:", req.params.userId);
    console.log("👤 Admin ID from token:", req.user.id);

    // Check if current user is admin
    const currentUser = await User.findById(req.user.id);
    console.log("👥 Current user:", currentUser?.email, "Role:", currentUser?.role);

    if (currentUser.role !== "admin") {
      console.log("❌ Current user is not admin");
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const userId = req.params.userId;

    // Prevent admin from deleting themselves
    if (currentUser._id.toString() === userId) {
      console.log("❌ Admin trying to delete themselves");
      return res.status(400).json({ message: "Cannot delete your own admin account" });
    }

    // Find and delete the user
    console.log("🔍 Finding user to delete...");
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      console.log("❌ User not found");
      return res.status(404).json({ message: "User not found" });
    }

    // Also delete all orders associated with this user
    console.log("🔍 Deleting all orders for user...");
    const deletedOrders = await Order.deleteMany({ userId: userId });
    console.log(`✅ Deleted ${deletedOrders.deletedCount} orders`);

    console.log("✅ User and their orders deleted successfully");
    res.json({
      message: "✅ User and their orders deleted successfully",
      deletedUser: { id: deletedUser._id, name: deletedUser.name, email: deletedUser.email },
    });
  } catch (error) {
    console.error("❌ Error deleting user:", error);
    res.status(500).json({ message: "Error deleting user", error: error.message });
  }
});

// ✅ Get user profile with documents (Admin view for role approval)
router.get("/admin/user-profile-with-docs/:userId", authMiddleware, async (req, res) => {
  try {
    // Check if current user is admin
    const currentUser = await User.findById(req.user.id);
    if (currentUser.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    // Import here to avoid circular dependency
    const UserProfileData = (await import("../models/UserProfileData.js")).default;

    // Fetch target user
    const targetUser = await User.findById(req.params.userId).select("-password");
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch profile data
    const profileData = await UserProfileData.findOne({ userId: req.params.userId });

    res.json({
      message: "User profile with documents fetched successfully",
      user: targetUser,
      profileData: profileData || null
    });
  } catch (error) {
    console.error("Error fetching user profile with documents:", error);
    res.status(500).json({ 
      message: "Error fetching user profile with documents", 
      error: error.message 
    });
  }
});

// 📤 Upload general user document (certificate, graduation, etc)
router.post(
  "/upload-general-document/:docType",
  authMiddleware,
  upload.single("document"),
  async (req, res) => {
    try {
      const { docType } = req.params;
      const userId = req.user.id;

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const documentUrl = `/profile-documents/${req.file.filename}`;
      const { default: UserProfileData } = await import("../models/UserProfileData.js");

      let profileData = await UserProfileData.findOne({ userId });
      if (!profileData) {
        profileData = new UserProfileData({ userId });
      }

      // Initialize generalDocuments if it doesn't exist
      if (!profileData.generalDocuments) {
        profileData.generalDocuments = {};
      }

      // Map docType to the correct field
      if (docType === "certificate") {
        profileData.generalDocuments.certificate = documentUrl;
      } else if (docType === "graduationCertificate") {
        profileData.generalDocuments.graduationCertificate = documentUrl;
      } else if (docType === "degreeCertificate") {
        profileData.generalDocuments.degreeCertificate = documentUrl;
      } else {
        return res.status(400).json({ message: "Invalid document type" });
      }

      await profileData.save();

      res.json({
        message: "Document uploaded successfully",
        documentUrl,
        docType
      });
    } catch (error) {
      console.error("Error uploading general document:", error);
      res.status(500).json({ 
        message: "Error uploading document", 
        error: error.message 
      });
    }
  }
);

// 📄 Get user's general documents
router.get("/general-documents", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { default: UserProfileData } = await import("../models/UserProfileData.js");

    let profileData = await UserProfileData.findOne({ userId });
    if (!profileData) {
      profileData = new UserProfileData({ userId });
      await profileData.save();
    }

    res.json({
      message: "General documents fetched successfully",
      documents: profileData.generalDocuments || {}
    });
  } catch (error) {
    console.error("Error fetching general documents:", error);
    res.status(500).json({ 
      message: "Error fetching documents", 
      error: error.message 
    });
  }
});

// 🗑️ Delete general document
router.delete("/general-documents/:docType", authMiddleware, async (req, res) => {
  try {
    const { docType } = req.params;
    const userId = req.user.id;
    const { default: UserProfileData } = await import("../models/UserProfileData.js");

    const profileData = await UserProfileData.findOne({ userId });
    if (!profileData || !profileData.generalDocuments) {
      return res.status(404).json({ message: "Document not found" });
    }

    if (docType === "certificate") {
      profileData.generalDocuments.certificate = undefined;
    } else if (docType === "graduationCertificate") {
      profileData.generalDocuments.graduationCertificate = undefined;
    } else if (docType === "degreeCertificate") {
      profileData.generalDocuments.degreeCertificate = undefined;
    } else {
      return res.status(400).json({ message: "Invalid document type" });
    }

    await profileData.save();

    res.json({
      message: "Document deleted successfully",
      docType
    });
  } catch (error) {
    console.error("Error deleting general document:", error);
    res.status(500).json({ 
      message: "Error deleting document", 
      error: error.message 
    });
  }
});

// ✅ Create Delivery Boy (Admin only)
router.post("/admin/create-delivery-boy", authMiddleware, async (req, res) => {
  try {
    // Check if current user is admin
    const currentUser = await User.findById(req.user.id);
    if (currentUser.role !== "admin") {
      return res.status(403).json({ message: "❌ Access denied. Admin only." });
    }

    const { name, email, password, phone } = req.body;

    // Validate inputs
    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: "❌ Name, email, and password are required" 
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        message: "❌ Email already registered" 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create delivery boy user
    const newDeliveryBoy = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone: phone || null,
      role: "deliveryBoy",
      status: "active"
    });

    await newDeliveryBoy.save();

    console.log(`✅ Delivery boy created: ${newDeliveryBoy.name} (${newDeliveryBoy.email})`);

    res.status(201).json({
      message: "✅ Delivery boy created successfully",
      deliveryBoy: {
        _id: newDeliveryBoy._id,
        name: newDeliveryBoy.name,
        email: newDeliveryBoy.email,
        phone: newDeliveryBoy.phone,
        role: newDeliveryBoy.role,
        status: newDeliveryBoy.status,
        createdAt: newDeliveryBoy.createdAt
      }
    });
  } catch (error) {
    console.error("❌ Error creating delivery boy:", error);
    res.status(500).json({
      message: "Error creating delivery boy",
      error: error.message
    });
  }
});

// ✅ Get all delivery boys (Admin only)
router.get("/admin/delivery-boys", authMiddleware, async (req, res) => {
  try {
    // Check if current user is admin
    const currentUser = await User.findById(req.user.id);
    if (currentUser.role !== "admin") {
      return res.status(403).json({ message: "❌ Access denied. Admin only." });
    }

    const deliveryBoys = await User.find({ role: "deliveryBoy" })
      .select("-password")
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${deliveryBoys.length} delivery boys`);

    res.json({
      success: true,
      count: deliveryBoys.length,
      deliveryBoys
    });
  } catch (error) {
    console.error("❌ Error fetching delivery boys:", error);
    res.status(500).json({
      message: "Error fetching delivery boys",
      error: error.message
    });
  }
});

// ✅ Update delivery boy status (Admin only)
router.put("/admin/delivery-boy/:deliveryBoyId/status", authMiddleware, async (req, res) => {
  try {
    // Check if current user is admin
    const currentUser = await User.findById(req.user.id);
    if (currentUser.role !== "admin") {
      return res.status(403).json({ message: "❌ Access denied. Admin only." });
    }

    const { deliveryBoyId } = req.params;
    const { status } = req.body;

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({ 
        message: "❌ Status must be 'active' or 'inactive'" 
      });
    }

    const deliveryBoy = await User.findById(deliveryBoyId);
    if (!deliveryBoy || deliveryBoy.role !== "deliveryBoy") {
      return res.status(404).json({ 
        message: "❌ Delivery boy not found" 
      });
    }

    deliveryBoy.status = status;
    await deliveryBoy.save();

    console.log(`✅ Delivery boy ${deliveryBoy.name} status updated to: ${status}`);

    res.json({
      message: `✅ Delivery boy status updated to ${status}`,
      deliveryBoy: {
        _id: deliveryBoy._id,
        name: deliveryBoy.name,
        email: deliveryBoy.email,
        phone: deliveryBoy.phone,
        status: deliveryBoy.status
      }
    });
  } catch (error) {
    console.error("❌ Error updating delivery boy status:", error);
    res.status(500).json({
      message: "Error updating delivery boy status",
      error: error.message
    });
  }
});

// ✅ Delete delivery boy (Admin only)
router.delete("/admin/delivery-boy/:deliveryBoyId", authMiddleware, async (req, res) => {
  try {
    // Check if current user is admin
    const currentUser = await User.findById(req.user.id);
    if (currentUser.role !== "admin") {
      return res.status(403).json({ message: "❌ Access denied. Admin only." });
    }

    const { deliveryBoyId } = req.params;

    const deliveryBoy = await User.findByIdAndDelete(deliveryBoyId);
    if (!deliveryBoy || deliveryBoy.role !== "deliveryBoy") {
      return res.status(404).json({ 
        message: "❌ Delivery boy not found" 
      });
    }

    console.log(`✅ Delivery boy deleted: ${deliveryBoy.name}`);

    res.json({
      message: "✅ Delivery boy deleted successfully",
      deletedDeliveryBoy: {
        _id: deliveryBoy._id,
        name: deliveryBoy.name,
        email: deliveryBoy.email
      }
    });
  } catch (error) {
    console.error("❌ Error deleting delivery boy:", error);
    res.status(500).json({
      message: "Error deleting delivery boy",
      error: error.message
    });
  }
});

// ✅ Debug: Check Google OAuth configuration
router.get("/debug/oauth-config", (req, res) => {
  res.json({
    message: "Google OAuth Configuration",
    nodeEnv: process.env.NODE_ENV,
    googleOAuthConfigured: googleOAuthConfigured ? "✅ Yes" : "❌ No",
    googleClientId: process.env.GOOGLE_CLIENT_ID ? "✅ Set" : "❌ Not set",
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ? "✅ Set" : "❌ Not set",
    googleCallbackUrl: getGoogleCallbackURL(),
    frontendUrl: process.env.NODE_ENV === "production"
      ? process.env.FRONTEND_URL || "https://peda-wala.onrender.com"
      : process.env.FRONTEND_URL || "http://localhost:3000",
    jwtSecret: process.env.JWT_SECRET ? "✅ Set" : "❌ Not set",
  });
});

// ✅ Google OAuth Routes
router.get(
  "/google",
  (req, res, next) => {
    if (!googleOAuthConfigured) {
      return res.status(503).json({
        message: "Google OAuth is not configured on this server.",
      });
    }

    req.session.googleOAuthFlow = req.query.flow === "signup" ? "signup" : "login";
    req.session.save(() => {
      return passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
    });
  }
);

router.get(
  "/google/callback",
  (req, res, next) => {
    if (!googleOAuthConfigured) {
      return res.status(503).json({
        message: "Google OAuth is not configured on this server.",
      });
    }

    return passport.authenticate("google", { failureRedirect: "/login" })(req, res, next);
  },
  async (req, res) => {
    try {
      const oauthFlow = req.session?.googleOAuthFlow === "signup" ? "signup" : "login";
      const authPath = "/";

      // Ensure we have the user from passport
      if (!req.user) {
        console.error(`❌ No user found in request after authentication`);
        const frontendURL = process.env.NODE_ENV === "production"
          ? process.env.FRONTEND_URL || "https://peda-wala.onrender.com"
          : process.env.FRONTEND_URL || "http://localhost:3000";
        const errorURL = new URL(frontendURL);
        errorURL.pathname = authPath;
        errorURL.searchParams.set("error", "no_user");
        return res.redirect(errorURL.toString());
      }

      // Fetch fresh user data from database to ensure we have all fields
      const freshUser = await User.findById(req.user._id);
      if (!freshUser) {
        console.error(`❌ User not found in database with ID: ${req.user._id}`);
        const frontendURL = process.env.NODE_ENV === "production"
          ? process.env.FRONTEND_URL || "https://peda-wala.onrender.com"
          : process.env.FRONTEND_URL || "http://localhost:3000";
        const errorURL = new URL(frontendURL);
        errorURL.pathname = authPath;
        errorURL.searchParams.set("error", "user_not_found");
        return res.redirect(errorURL.toString());
      }

      console.log(`✅ Google OAuth Callback - User authenticated successfully!`);
      console.log(`📝 User details from database:`, {
        id: freshUser._id,
        name: freshUser.name,
        email: freshUser.email,
        googleId: freshUser.googleId,
        role: freshUser.role,
      });

      // Create JWT token for the user using the fresh user data
      const token = jwt.sign(
        { id: freshUser._id, role: freshUser.role },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      // Get frontend URL based on environment
      const frontendURL = process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL || "https://peda-wala.onrender.com"
        : process.env.FRONTEND_URL || "http://localhost:3000";

      // Prepare user data object
      const userData = {
        id: freshUser._id.toString(),
        name: freshUser.name,
        email: freshUser.email,
        role: freshUser.role || "user",
      };

      console.log(`📦 Preparing redirect with:`, {
        token: token.substring(0, 20) + "...",
        userEmail: userData.email,
        userId: userData.id,
        userRole: userData.role
      });

      // Redirect to frontend with token and user data
      const redirectURL = new URL(frontendURL);
      redirectURL.pathname = authPath;
      redirectURL.searchParams.append("token", token);
      redirectURL.searchParams.append("user", encodeURIComponent(JSON.stringify(userData)));

      const finalURL = redirectURL.toString();
      console.log(`🔗 Final redirect URL (without params): ${redirectURL.origin}${redirectURL.pathname}?token=[TOKEN]&user=[USER_DATA]`);
      console.log(`✅ Google OAuth successful - Redirecting to frontend`);

      if (req.session) {
        req.session.googleOAuthFlow = undefined;
      }
      
      res.redirect(finalURL);
    } catch (error) {
      console.error(`❌ Google OAuth callback error:`, error);
      const frontendURL = process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL || "https://peda-wala.onrender.com"
        : process.env.FRONTEND_URL || "http://localhost:3000";
      const oauthFlow = req.session?.googleOAuthFlow === "signup" ? "signup" : "login";
      const authPath = "/";
      const errorURL = new URL(frontendURL);
      errorURL.pathname = authPath;
      errorURL.searchParams.set("error", "login_failed");
      res.redirect(errorURL.toString());
    }
  }
);

// ✅ Verify user exists in database by email (for debugging OAuth)
router.get("/verify-user/:email", async (req, res) => {
  try {
    const email = req.params.email.toLowerCase();
    console.log(`🔍 Verifying user with email: ${email}`);
    
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`❌ User not found in database`);
      return res.status(404).json({ 
        found: false,
        email: email,
        message: "User not found in database" 
      });
    }
    
    console.log(`✅ User found in database`);
    res.json({
      found: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        googleId: user.googleId ? "✅ Set" : "❌ Not set",
        role: user.role,
        hasPassword: user.password ? "✅ Set" : "❌ Not set (Google OAuth user)"
      }
    });
  } catch (error) {
    console.error(`❌ Error verifying user:`, error.message);
    res.status(500).json({ 
      error: error.message,
      email: req.params.email 
    });
  }
});

export default router;
