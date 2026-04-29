import React, { useState } from "react";
import axios from "axios";
import AnimatedNotification from "./AnimatedNotification";
import ProfileCompletionModal from "./ProfileCompletionModal";
import "./RoleRequestModal.css";

interface RoleOption {
  role: string;
  description: string;
}

interface RoleRequestModalProps {
  availableRoles: RoleOption[];
  onClose: () => void;
  roleColors: { [key: string]: string };
}

const RoleRequestModal: React.FC<RoleRequestModalProps> = ({
  availableRoles,
  onClose,
  roleColors
}) => {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: string;
  } | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedRoleForProfile, setSelectedRoleForProfile] = useState<"deliveryBoy" | "subAdmin" | null>(null);
  const [profileComplete, setProfileComplete] = useState<{ [key: string]: boolean }>({});
  const [checkingProfile, setCheckingProfile] = useState(false);

  const roleNameMap: { [key: string]: "deliveryBoy" | "subAdmin" } = {
    deliveryBoy: "deliveryBoy",
    "delivery-boy": "deliveryBoy",
    subAdmin: "subAdmin",
    "sub-admin": "subAdmin"
  };

  const handleRoleSelect = async (role: string) => {
    setSelectedRole(role);

    // Convert role name to profile role type
    const profileRole = roleNameMap[role.toLowerCase()] || (role.toLowerCase() as "deliveryBoy" | "subAdmin");

    // Check if we already know this profile status
    if (profileComplete[role] !== undefined) {
      return;
    }

    // Check profile completion status
    try {
      setCheckingProfile(true);
      const response = await axios.get(
        `http://localhost:3001/api/profile/check-completion/${profileRole}`
      );

      setProfileComplete(prev => ({
        ...prev,
        [role]: response.data.isComplete
      }));

      // If profile not complete, show modal
      if (!response.data.isComplete) {
        setSelectedRoleForProfile(profileRole);
        setNotification({
          message: "⚠️ Please complete your profile before requesting this role",
          type: "warning"
        });
        setShowProfileModal(true);
        setSelectedRole(null); // Reset selection
      }
    } catch (error) {
      console.error("Error checking profile:", error);
      setNotification({
        message: "Failed to check profile status. Please try again.",
        type: "error"
      });
      setSelectedRole(null);
    } finally {
      setCheckingProfile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRole) {
      setNotification({ message: "Please select a role", type: "error" });
      return;
    }

    // Double-check profile completion
    const profileRole = roleNameMap[selectedRole.toLowerCase()] || (selectedRole.toLowerCase() as "deliveryBoy" | "subAdmin");
    
    if (!profileComplete[selectedRole]) {
      setNotification({
        message: "⚠️ Please complete your profile first",
        type: "warning"
      });
      setSelectedRoleForProfile(profileRole);
      setShowProfileModal(true);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await axios.post(
        "http://localhost:3001/api/role/request",
        {
          requestedRole: selectedRole,
          requestReason: reason
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setNotification({
        message:
          "✅ Role request submitted successfully! Your request is now pending approval.",
        type: "success"
      });

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setNotification({
        message: err.response?.data?.message || "Failed to submit request",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="role-modal-overlay" onClick={onClose}>
        <div className="role-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Request Role Upgrade</h2>
            <button className="close-btn" onClick={onClose}>
              ✕
            </button>
          </div>

          {notification && (
            <AnimatedNotification
              message={notification.message}
              type={notification.type}
            />
          )}

          <form onSubmit={handleSubmit}>
            {/* Role Selection */}
            <div className="form-group">
              <label className="form-label">Select a Role *</label>
              <div className="role-selection-grid">
                {availableRoles.map((role) => (
                  <div
                    key={role.role}
                    className={`role-selection-card ${
                      selectedRole === role.role ? "selected" : ""
                    } ${checkingProfile && selectedRole === role.role ? "checking" : ""}`}
                    style={{
                      borderColor:
                        selectedRole === role.role ? roleColors[role.role] : "#ddd"
                    }}
                    onClick={() => handleRoleSelect(role.role)}
                  >
                    <div
                      className="selection-indicator"
                      style={{
                        backgroundColor:
                          selectedRole === role.role
                            ? roleColors[role.role]
                            : "#ccc"
                      }}
                    >
                      {selectedRole === role.role && "✓"}
                    </div>
                    <h4 style={{ color: roleColors[role.role] }}>
                      {role.role.charAt(0).toUpperCase() + role.role.slice(1)}
                    </h4>
                    <p>{role.description}</p>
                    {profileComplete[role.role] && (
                      <span className="profile-ok-badge">✓ Profile complete</span>
                    )}
                    {profileComplete[role.role] === false && (
                      <span className="profile-incomplete-badge">⚠️ Complete profile</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Reason Input */}
            <div className="form-group">
              <label htmlFor="reason" className="form-label">
                Why do you want this role? (Optional)
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Tell us why you're requesting this role. This helps us make better decisions."
                className="form-textarea"
                rows={4}
                maxLength={500}
              />
              <span className="char-count">{reason.length}/500</span>
            </div>

            {/* Info Box */}
            <div className="info-box">
              <h4>ℹ️ Next Steps</h4>
              <ul>
                <li>Your request will be reviewed by the appropriate approver</li>
                <li>You'll receive a notification once your request is processed</li>
                <li>You can only have one pending request at a time</li>
                <li>Profile must be complete before submitting request</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="modal-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-submit"
                disabled={loading || !selectedRole || !profileComplete[selectedRole]}
                title={selectedRole && !profileComplete[selectedRole] ? "Please complete profile first" : ""}
              >
                {loading ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Profile Completion Modal */}
      {showProfileModal && selectedRoleForProfile && (
        <ProfileCompletionModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          role={selectedRoleForProfile}
          onComplete={() => {
            // Mark profile as complete for this role
            const roleName = selectedRoleForProfile === "deliveryBoy" ? "deliveryBoy" : "subAdmin";
            setProfileComplete(prev => ({
              ...prev,
              [roleName]: true
            }));
            setShowProfileModal(false);
            setSelectedRole(roleName);
          }}
        />
      )}
    </>
  );
};

export default RoleRequestModal;
