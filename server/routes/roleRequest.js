import express from "express";
import { authMiddleware } from "../middlewares/Authentication.js";
import { checkProfileCompletion } from "../middlewares/ProfileCompletion.js";
import User from "../models/user.js";
import RoleRequest from "../models/RoleRequest.js";
import UserProfileData from "../models/UserProfileData.js";
import RoleProfileRequirement from "../models/RoleProfileRequirement.js";

// Helper function to generate unique subdomain
const generateSubdomain = async (userName) => {
  const baseSubdomain = userName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "") // Remove special characters
    .substring(0, 20); // Limit to 20 characters

  let subdomain = baseSubdomain;
  let counter = 1;

  // Check if subdomain already exists, if so, add a number
  while (await User.findOne({ subdomain })) {
    subdomain = `${baseSubdomain}${counter}`;
    counter++;
  }

  return subdomain;
};

const router = express.Router();

// 📋 Get role hierarchy rules
router.get("/hierarchy", (req, res) => {
  const hierarchy = {
    user: {
      canRequestRoles: ["deliveryBoy", "subAdmin"],
      canApproveRoles: [],
      description: "Basic customer"
    },
    deliveryBoy: {
      canRequestRoles: ["subAdmin"],
      canApproveRoles: ["subAdmin"],
      description: "Delivery personnel"
    },
    subAdmin: {
      canRequestRoles: [],
      canApproveRoles: ["subAdmin"],
      description: "Sub administrator"
    },
    admin: {
      canRequestRoles: [],
      canApproveRoles: ["deliveryBoy", "subAdmin"],
      description: "Full administrator"
    }
  };

  res.json(hierarchy);
});
// 🔍 Debug: Check current user's role and permissions
router.get("/debug/check-user", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userRole = user.role || "user";
    
    // Check pending requests this user would see
    let accessibleRequests = [];
    if (userRole === "subAdmin") {
      accessibleRequests = await RoleRequest.find({
        requestedRole: "deliveryBoy",
        status: "pending"
      }).populate("userId", "name email phone");
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: userRole,
        subdomain: user.subdomain || null
      },
      permissions: {
        role: userRole,
        canApprovePendingDeliveryBoys: userRole === "subAdmin",
        canViewApprovalHistory: userRole === "admin"
      },
      accessibleRequests: {
        count: accessibleRequests.length,
        requests: accessibleRequests
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error checking user permissions", error: error.message });
  }
});

// 🔍 Debug: Complete profile check
router.get("/debug/profile-status", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const profileData = await UserProfileData.findOne({ userId: req.user.id });
    const requirements = await RoleProfileRequirement.findOne({ role: "deliveryBoy" });

    res.json({
      user: {
        name: user.name,
        email: user.email,
        role: user.role
      },
      profileData: {
        exists: !!profileData,
        deliveryBoyProfile: profileData?.deliveryBoyProfile ? {
          isProfileComplete: profileData.deliveryBoyProfile.isProfileComplete,
          hasAadhaar: !!profileData.deliveryBoyProfile.aadhaarNumber,
          hasLicense: !!profileData.deliveryBoyProfile.licenseNumber,
          hasVehicle: !!profileData.deliveryBoyProfile.vehicleType,
          completedAt: profileData.deliveryBoyProfile.completedAt
        } : null
      },
      requirements: {
        exists: !!requirements,
        requiredFields: requirements?.requiredFields
      },
      canRequestDeliveryBoy: profileData?.deliveryBoyProfile?.isProfileComplete === true ? "✅ YES" : "❌ NO - Profile incomplete"
    });
  } catch (error) {
    res.status(500).json({ message: "Error checking profile", error: error.message });
  }
});

// 🔍 Debug: Get ALL pending delivery boy requests (for debugging)
router.get("/debug/pending-delivery-boys", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    console.log(`\n🔍[DB_QUERY] Querying ALL pending delivery boy requests from database`);
    
    const pendingDeliveryBoys = await RoleRequest.find({
      requestedRole: "deliveryBoy",
      status: "pending"
    })
      .populate("userId", "_id name email role")
      .sort({ requestedAt: -1 });

    console.log(`✅ [DB_QUERY] Found ${pendingDeliveryBoys.length} pending delivery boy requests in database`);

    res.json({
      currentUserRole: user?.role || "user",
      currentUserName: user?.name || "Unknown",
      totalPendingDeliveryBoyRequests: pendingDeliveryBoys.length,
      databaseContainsTheseRequests: pendingDeliveryBoys.map(r => ({
        id: r._id,
        userName: r.userName,
        requestedRole: r.requestedRole,
        status: r.status,
        createdAt: r.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching pending delivery boys", error: error.message });
  }
});
// � Debug: Get ALL role requests (for admin only)
router.get("/debug/all-requests", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user?.role !== "admin") {
      return res.status(403).json({ message: "Only admins can access debug info" });
    }

    const allRequests = await RoleRequest.find({})
      .populate("userId", "_id name email role")
      .sort({ requestedAt: -1 });

    res.json({
      totalRequests: allRequests.length,
      byStatus: {
        pending: allRequests.filter((r) => r.status === "pending").length,
        approved: allRequests.filter((r) => r.status === "approved").length,
        rejected: allRequests.filter((r) => r.status === "rejected").length,
      },
      byRole: {
        deliveryBoy: allRequests.filter((r) => r.requestedRole === "deliveryBoy").length,
        subAdmin: allRequests.filter((r) => r.requestedRole === "subAdmin").length,
      },
      requests: allRequests
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching debug info", error: error.message });
  }
});

// �🔄 Request a role upgrade
router.post("/request", authMiddleware, checkProfileCompletion, async (req, res) => {
  try {
    const { requestedRole, requestReason } = req.body;
    const userId = req.user.id;
    
    console.log(`\n📝 [REQUEST] New request starting`);
    console.log(`📝 [REQUEST] User ID: ${userId}, Role requested: ${requestedRole}`);

    // Validate input
    if (!requestedRole || !["deliveryBoy", "subAdmin"].includes(requestedRole)) {
      console.log(`❌ [REQUEST] Invalid role: ${requestedRole}`);
      return res.status(400).json({ message: "Invalid role requested" });
    }

    // Get current user
    const user = await User.findById(userId);
    if (!user) {
      console.log(`❌ [REQUEST] User not found: ${userId}`);
      return res.status(404).json({ message: "User not found" });
    }
    
    console.log(`✅ [REQUEST] User found: ${user.name}, Current role: ${user.role}`);

    // Check if user already has a pending request
    const existingRequest = await RoleRequest.findOne({
      userId,
      status: "pending"
    });

    if (existingRequest) {
      return res.status(400).json({ message: "You already have a pending role request" });
    }

    // Validate role hierarchy: user can request deliveryBoy or subAdmin
    // deliveryBoy can request subAdmin
    const hierarchy = {
      user: ["deliveryBoy", "subAdmin"],
      deliveryBoy: ["subAdmin"]
    };

    const userRole = user.role || "user";
    const allowedRoles = hierarchy[userRole] || [];

    if (!allowedRoles.includes(requestedRole)) {
      return res.status(403).json({ 
        message: `You cannot request the role of ${requestedRole}. Your current role is ${userRole}` 
      });
    }

    // Create role request
    const newRequest = new RoleRequest({
      userId,
      userName: user.name,
      userEmail: user.email,
      requestedRole,
      currentRole: userRole,
      requestReason: requestReason || ""
    });

    console.log(`\n📝 [CREATING REQUEST] Object created:`, {
      userId: userId,
      userName: user.name,
      userEmail: user.email,
      requestedRole: requestedRole,
      currentRole: userRole,
      status: "pending"
    });
    
    try {
      await newRequest.save();
      console.log(`✅ [REQUEST SAVED] ID: ${newRequest._id}`);
      console.log(`✅ [REQUEST SAVED] Full document:`, {
        _id: newRequest._id,
        userName: newRequest.userName,
        requestedRole: newRequest.requestedRole,
        status: newRequest.status,
        createdAt: newRequest.createdAt
      });
    } catch (saveError) {
      console.log(`❌ [SAVE ERROR] Failed to save request:`, saveError.message);
      throw saveError;
    }

    // Also update user's requestedRole field so it's visible in profile
    user.requestedRole = requestedRole;
    user.requestStatus = "pending";
    user.requestedAt = new Date();
    await user.save();
    console.log(`✅ User profile updated with pending request`);

    res.status(201).json({
      message: "Role request submitted successfully",
      request: newRequest
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating role request", error: error.message });
  }
});

// � DEBUG: Check all requests in database
router.get("/debug/db-check", authMiddleware, async (req, res) => {
  try {
    const allRequests = await RoleRequest.find({}).lean();
    const deliveryBoyRequests = await RoleRequest.find({ requestedRole: "deliveryBoy" }).lean();
    const pendingRequests = await RoleRequest.find({ status: "pending" }).lean();
    const deliveryBoyPending = await RoleRequest.find({ 
      requestedRole: "deliveryBoy", 
      status: "pending" 
    }).lean();

    res.json({
      totalInDB: allRequests.length,
      deliveryBoyTotal: deliveryBoyRequests.length,
      pendingTotal: pendingRequests.length,
      deliveryBoyPending: deliveryBoyPending.length,
      allRequests: allRequests,
      deliveryBoyPendingDetails: deliveryBoyPending
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// �📬 Get pending requests for approval
router.get("/pending", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userRole = user.role || "user";
    let filter = {};
    let isApprover = false;

    // Admin approves pending SubAdmin requests
    if (userRole === "admin") {
      filter = { requestedRole: "subAdmin", status: "pending" };
      isApprover = true;
      console.log(`👤 Admin ${user.name} fetching pending subAdmin requests`);
    }
    // SubAdmin approves pending DeliveryBoy requests
    else if (userRole === "subAdmin") {
      filter = { requestedRole: "deliveryBoy", status: "pending" };
      isApprover = true;
      console.log(`👤 SubAdmin ${user.name} fetching pending deliveryBoy requests`);
    }
    // Other roles cannot approve
    else {
      console.log(`⛔ User ${user.name} (role: ${userRole}) cannot approve requests`);
      return res.json({
        totalRequests: 0,
        requests: [],
        isApprover: false,
        userRole: userRole
      });
    }

    // Query pending requests
    const pendingRequests = await RoleRequest.find(filter)
      .populate("userId", "_id name email phone address")
      .sort({ requestedAt: -1 })
      .lean();

    console.log(`✅ Found ${pendingRequests.length} pending requests for ${userRole}`);

    return res.json({
      totalRequests: pendingRequests.length,
      requests: pendingRequests,
      isApprover: isApprover,
      userRole: userRole
    });
    
  } catch (error) {
    console.error("Error in /pending:", error.message);
    return res.status(500).json({ 
      message: "Error fetching pending requests", 
      error: error.message 
    });
  }
});

// ✅ Approve role request
router.post("/approve/:requestId", authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { approvalNotes } = req.body;
    const approverId = req.user.id;

    // Get approver
    const approver = await User.findById(approverId);
    if (!approver) {
      return res.status(404).json({ message: "Approver not found" });
    }

    // Get request
    const roleRequest = await RoleRequest.findById(requestId);
    if (!roleRequest) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (roleRequest.status !== "pending") {
      return res.status(400).json({ message: "Request is not pending" });
    }

    // Validate approver permissions
    // Sub-Admin can approve: Delivery Boy requests
    // Admin can approve: SubAdmin requests
    const approverRole = approver.role || "user";
    let canApprove = false;

    console.log(`🔍 Approval Check - Approver Role: ${approverRole}, Requested Role: ${roleRequest.requestedRole}`);

    // SubAdmin approves DeliveryBoy requests
    if (approverRole === "subAdmin" && roleRequest.requestedRole === "deliveryBoy") {
      canApprove = true;
      console.log(`✅ SubAdmin ${approver.name} can approve DeliveryBoy request`);
    }
    // Admin approves SubAdmin requests
    else if (approverRole === "admin" && roleRequest.requestedRole === "subAdmin") {
      canApprove = true;
      console.log(`✅ Admin ${approver.name} can approve SubAdmin request`);
    }

    if (!canApprove) {
      const allowedApprovers = roleRequest.requestedRole === "deliveryBoy" ? "SubAdmin" : "Admin";
      return res.status(403).json({ 
        message: `Only ${allowedApprovers} can approve ${roleRequest.requestedRole} requests. Your role: ${approverRole}`
      });
    }

    // Update request
    roleRequest.status = "approved";
    roleRequest.approvedBy = approverId;
    roleRequest.approverRole = approverRole;
    roleRequest.approvalNotes = approvalNotes || "";
    roleRequest.respondedAt = new Date();
    await roleRequest.save();

    // Update user role
    const targetUser = await User.findById(roleRequest.userId);
    targetUser.role = roleRequest.requestedRole;
    targetUser.requestedRole = null;
    targetUser.requestStatus = null;

    // Generate and assign subdomain for BOTH subAdmin AND deliveryBoy
    if (["subAdmin", "deliveryBoy"].includes(roleRequest.requestedRole)) {
      const subdomain = await generateSubdomain(targetUser.name);
      targetUser.subdomain = subdomain;
      console.log(`✅ Subdomain generated for ${roleRequest.requestedRole}: ${subdomain}`);
    }

    await targetUser.save();

    res.json({
      message: "Role request approved successfully",
      request: roleRequest,
      updatedUser: {
        id: targetUser._id,
        name: targetUser.name,
        role: targetUser.role,
        subdomain: targetUser.subdomain || null
      },
      redirectTo: targetUser.subdomain ? `//${targetUser.subdomain}.localhost:5173` : null
    });
  } catch (error) {
    res.status(500).json({ message: "Error approving request", error: error.message });
  }
});

// ❌ Reject role request
router.post("/reject/:requestId", authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { rejectionReason } = req.body;
    const approverId = req.user.id;

    // Get approver
    const approver = await User.findById(approverId);
    if (!approver) {
      return res.status(404).json({ message: "Approver not found" });
    }

    // Get request
    const roleRequest = await RoleRequest.findById(requestId);
    if (!roleRequest) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (roleRequest.status !== "pending") {
      return res.status(400).json({ message: "Request is not pending" });
    }

    // Validate approver permissions
    // Sub-Admin can reject: Delivery Boy requests
    // Admin can reject: SubAdmin requests
    const approverRole = approver.role || "user";
    let canReject = false;

    // SubAdmin rejects DeliveryBoy requests
    if (approverRole === "subAdmin" && roleRequest.requestedRole === "deliveryBoy") {
      canReject = true;
    }
    // Admin rejects SubAdmin requests
    else if (approverRole === "admin" && roleRequest.requestedRole === "subAdmin") {
      canReject = true;
    }

    if (!canReject) {
      const allowedApprovers = roleRequest.requestedRole === "deliveryBoy" ? "SubAdmin" : "Admin";
      return res.status(403).json({ 
        message: `Only ${allowedApprovers} can reject ${roleRequest.requestedRole} requests. Your role: ${approverRole}`
      });
    }

    // Update request
    roleRequest.status = "rejected";
    roleRequest.approvedBy = approverId;
    roleRequest.approverRole = approverRole;
    roleRequest.rejectionReason = rejectionReason || "";
    roleRequest.respondedAt = new Date();
    await roleRequest.save();

    // Also clear user's requestedRole field
    const targetUser = await User.findById(roleRequest.userId);
    if (targetUser) {
      targetUser.requestedRole = null;
      targetUser.requestStatus = null;
      await targetUser.save();
    }

    res.json({
      message: "Role request rejected successfully",
      request: roleRequest
    });
  } catch (error) {
    res.status(500).json({ message: "Error rejecting request", error: error.message });
  }
});

// 📊 Get user's role request history
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const requests = await RoleRequest.find({ userId })
      .populate("approvedBy", "name email")
      .sort({ requestedAt: -1 });

    res.json({
      totalRequests: requests.length,
      requests
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching request history", error: error.message });
  }
});

// � Get ALL approval history (Admin view only) - Who approved what
router.get("/admin/approval-history", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can view approval history" });
    }

    const requests = await RoleRequest.find({ status: { $in: ["approved", "rejected"] } })
      .populate("userId", "name email")
      .populate("approvedBy", "name email role")
      .sort({ respondedAt: -1 });

    // Group by approver (who approved what)
    const groupedByApprover = {};
    requests.forEach((req) => {
      const approverName = req.approvedBy?.name || "Unknown";
      if (!groupedByApprover[approverName]) {
        groupedByApprover[approverName] = {
          approver: req.approvedBy,
          approved: [],
          rejected: [],
          totalApprovals: 0,
          totalRejections: 0
        };
      }
      if (req.status === "approved") {
        groupedByApprover[approverName].approved.push(req);
        groupedByApprover[approverName].totalApprovals++;
      } else {
        groupedByApprover[approverName].rejected.push(req);
        groupedByApprover[approverName].totalRejections++;
      }
    });

    res.json({
      message: "👮 Admin Approval History - View only, cannot approve",
      totalRequests: requests.length,
      groupedByApprover,
      allRequests: requests
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching approval history", error: error.message });
  }
});

// �🔍 Get all users by role (for admins)
router.get("/users-by-role/:role", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can access this" });
    }

    const { role } = req.params;
    const users = await User.find({ role })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      role,
      totalUsers: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error: error.message });
  }
});

// 🐛 Debug endpoint to check DeliveryBoy requests visibility
router.get("/debug/deliveryboy-requests", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get all DeliveryBoy requests from database
    const allDeliveryBoyRequests = await RoleRequest.find({
      requestedRole: "deliveryBoy"
    })
      .populate("userId", "name email role")
      .sort({ requestedAt: -1 });

    // Get pending DeliveryBoy requests
    const pendingDeliveryBoyRequests = await RoleRequest.find({
      requestedRole: "deliveryBoy",
      status: "pending"
    })
      .populate("userId", "name email role")
      .sort({ requestedAt: -1 });

    // Simulate what SubAdmin would see
    let subAdminCanSee = [];
    if (user.role === "subAdmin") {
      subAdminCanSee = await RoleRequest.find({
        requestedRole: "deliveryBoy",
        status: "pending"
      })
        .populate("userId", "name email role")
        .sort({ requestedAt: -1 });
    }

    res.json({
      currentUser: {
        id: user._id,
        name: user.name,
        role: user.role,
        email: user.email
      },
      allDeliveryBoyRequests: allDeliveryBoyRequests.length,
      pendingDeliveryBoyRequests: pendingDeliveryBoyRequests.length,
      subAdminCanSee: subAdminCanSee.length,
      requests: {
        all: allDeliveryBoyRequests,
        pending: pendingDeliveryBoyRequests,
        subAdminView: user.role === "subAdmin" ? subAdminCanSee : "N/A (not SubAdmin)"
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching debug info", error: error.message });
  }
});

export default router;
