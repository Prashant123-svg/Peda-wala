import UserProfileData from "../models/UserProfileData.js";
import RoleProfileRequirement from "../models/RoleProfileRequirement.js";

/**
 * Middleware to check if user's profile is complete for a requested role
 * Blocks role requests if profile is incomplete
 */
export const checkProfileCompletion = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const requestedRole = req.body.requestedRole;

    console.log(`\n🔍 [ProfileCompletion] Checking profile for user ${userId}, role ${requestedRole}`);

    if (!requestedRole) {
      console.log(`⏭️  [ProfileCompletion] No role in request body, skipping`);
      return next();
    }

    // Map role names to profile role types
    const roleNameMap = {
      deliveryBoy: "deliveryBoy",
      "delivery-boy": "deliveryBoy",
      subAdmin: "subAdmin",
      "sub-admin": "subAdmin"
    };

    const profileRole = roleNameMap[requestedRole.toLowerCase()] || requestedRole.toLowerCase();
    console.log(`🔍 [ProfileCompletion] Mapped role: ${requestedRole} -> ${profileRole}`);

    // Get requirements for this role
    const requirements = await RoleProfileRequirement.findOne({ role: profileRole });
    if (!requirements) {
      console.log(`⏭️  [ProfileCompletion] No requirements found for role ${profileRole}, skipping`);
      return next();
    }

    // Get user's profile data
    let userProfileData = await UserProfileData.findOne({ userId });
    if (!userProfileData) {
      console.log(`❌ [ProfileCompletion] User profile data not found for ${userId}`);
      return res.status(400).json({
        message: "Profile data not found. Please complete your profile first.",
        incomplete: true
      });
    }

    console.log(`✅ [ProfileCompletion] Found user profile data`);

    let profileData;
    if (profileRole === "deliveryBoy") {
      profileData = userProfileData.deliveryBoyProfile;
    } else if (profileRole === "subAdmin") {
      profileData = userProfileData.subAdminProfile;
    }

    console.log(`🔍 [ProfileCompletion] Profile complete status: ${profileData?.isProfileComplete}`);

    if (!profileData || !profileData.isProfileComplete) {
      console.log(`❌ [ProfileCompletion] Profile incomplete for role ${profileRole}`);
      return res.status(400).json({
        message: `Please complete your ${profileRole === "deliveryBoy" ? "Delivery Boy" : "Sub-Admin"} profile before requesting this role.`,
        incomplete: true,
        missingFields: requirements.requiredFields
      });
    }

    // Attach profile data to request for further use
    req.userProfileData = profileData;
    console.log(`✅ [ProfileCompletion] Profile complete, proceeding`);
    next();
  } catch (error) {
    console.error("Profile completion check error:", error);
    next(); // Continue even if check fails
  }
};

export default checkProfileCompletion;
