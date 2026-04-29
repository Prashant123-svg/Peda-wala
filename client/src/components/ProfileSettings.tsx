import React, { useState, useEffect } from "react";
import axios from "axios";
import RoleApplicationForm from "./RoleApplicationForm";
import RequestHistoryModal from "./RequestHistoryModal";
import "./ProfileSettings.css";

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  subdomain?: string;
}

interface RoleOption {
  role: string;
  description: string;
}

const ProfileSettings: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<RoleOption[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [generalDocuments, setGeneralDocuments] = useState<any>({});
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [uploadedDocs, setUploadedDocs] = useState<{[key: string]: string}>({});
  const [documentLoading, setDocumentLoading] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);

  const roleDescriptions: { [key: string]: string } = {
    user: "👤 Basic Customer - Browse and purchase from our catalog",
    deliveryBoy: "🚚 Delivery Boy - Deliver orders to customers",
    subAdmin: "👨‍💼 Sub-Admin - Manage orders and delivery boys",
    admin: "👨‍💼 Admin - Full platform administration"
  };

  const roleColors: { [key: string]: string } = {
    user: "#3498db",
    deliveryBoy: "#e67e22",
    subAdmin: "#9b59b6",
    admin: "#e74c3c"
  };

  useEffect(() => {
    fetchUserProfile();
  }, [refreshTrigger]);

  useEffect(() => {
    if (user) {
      fetchRoleHierarchy();
      fetchGeneralDocuments();
      // Fetch pending requests if user is admin or subAdmin
      if (user.role === 'admin' || user.role === 'subAdmin') {
        fetchPendingRequests();
      }
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/api/auth/profile",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setUser(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoleHierarchy = async () => {
    if (!user) return;
    
    try {
      console.log("📋 Fetching role hierarchy for user:", user.role);
      const response = await axios.get(
        "http://localhost:5000/api/role/hierarchy"
      );
      console.log("✅ Role hierarchy response:", response.data);
      const hierarchy = response.data;
      const userRole = user.role || "user";
      const canRequest = hierarchy[userRole]?.canRequestRoles || [];
      console.log("🎯 Available roles for", userRole, ":", canRequest);

      const roles = canRequest.map((roleKey: string) => ({
        role: roleKey,
        description: roleDescriptions[roleKey] || roleKey
      }));

      setAvailableRoles(roles);
      console.log("✅ Available roles state updated:", roles);
    } catch (err: any) {
      console.error("❌ Error fetching role hierarchy:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        config: err.config?.url
      });
    }
  };

  const fetchGeneralDocuments = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/api/auth/general-documents",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setGeneralDocuments(response.data.documents || {});
      setUploadedDocs(response.data.documents || {});
    } catch (err: any) {
      console.error("Error fetching general documents:", err);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      setLoadingRequests(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/api/role/pending",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setPendingRequests(response.data.requests || []);
    } catch (err: any) {
      console.error("Error fetching pending requests:", err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5000/api/role/approve/${requestId}`,
        { approvalNotes: "Approved by " + user?.name },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setSuccessMessage("✅ Request approved successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
      fetchPendingRequests();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to approve request");
      setTimeout(() => setError(null), 3000);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRequest = async (requestId: string, reason: string) => {
    setProcessingId(requestId);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5000/api/role/reject/${requestId}`,
        { rejectionReason: reason || "Request rejected" },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setSuccessMessage("❌ Request rejected successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
      fetchPendingRequests();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reject request");
      setTimeout(() => setError(null), 3000);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDocumentUpload = async (docType: string, file: File) => {
    try {
      setUploadProgress(prev => ({
        ...prev,
        [docType]: 0
      }));

      const formData = new FormData();
      formData.append("document", file);

      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5000/api/auth/upload-general-document/${docType}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(prev => ({
              ...prev,
              [docType]: percentCompleted
            }));
          }
        }
      );

      setUploadedDocs(prev => ({
        ...prev,
        [docType]: response.data.documentUrl
      }));

      setUploadProgress(prev => ({
        ...prev,
        [docType]: 100
      }));

      setTimeout(() => {
        setUploadProgress(prev => {
          const updated = { ...prev };
          delete updated[docType];
          return updated;
        });
      }, 2000);

      setSuccessMessage(`✅ ${docType} uploaded successfully!`);
      setTimeout(() => setSuccessMessage(null), 3000);

      await fetchGeneralDocuments();
    } catch (error: any) {
      console.error("Error uploading document:", error);
      alert(error.response?.data?.message || "Failed to upload document");
    }
  };

  const handleDeleteDocument = async (docType: string) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/auth/general-documents/${docType}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setUploadedDocs(prev => {
        const updated = { ...prev };
        delete updated[docType];
        return updated;
      });
      setSuccessMessage(`✅ ${docType} deleted successfully!`);
      setTimeout(() => setSuccessMessage(null), 3000);
      await fetchGeneralDocuments();
    } catch (error: any) {
      console.error("Error deleting document:", error);
      alert(error.response?.data?.message || "Failed to delete document");
    }
  };

  if (loading) {
    return <div className="settings-loading">Loading profile settings...</div>;
  }

  if (!user) {
    return <div className="settings-error">User data not found</div>;
  }

  return (
    <div className="profile-settings-container">
      <div className="settings-header">
        <h1>Profile Settings</h1>
        <p>Manage your account and role preferences</p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="settings-summary-grid">
        <div className="summary-item">
          <span className="summary-label">User</span>
          <p className="summary-value">{user?.name || "N/A"}</p>
        </div>
        <div className="summary-item">
          <span className="summary-label">Current Role</span>
          <p className="summary-value">{user?.role || "N/A"}</p>
        </div>
        <div className="summary-item">
          <span className="summary-label">Available Roles</span>
          <p className="summary-value">
            {availableRoles.length} ({availableRoles.map((r) => r.role).join(", ") || "None"})
          </p>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="settings-success-banner">
          {successMessage}
        </div>
      )}

      {/* Current Role Section */}
      <div className="settings-section role-section">
        <div className="section-header">
          <h2>Current Role</h2>
        </div>
        <div className={`role-card role-${user.role}`}>
          <div className="role-header">
            <span className={`role-badge role-${user.role}`}>
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </span>
            <span className="role-status active">Active</span>
          </div>
          <p className="role-description">{roleDescriptions[user.role]}</p>
          <div className="role-details">
            <div className="detail-item">
              <span className="detail-label">Member Since:</span>
              <span className="detail-value">
                {new Date().toLocaleDateString()}
              </span>
            </div>
            {user.subdomain && user.role === "subAdmin" && (
              <div className="detail-item">
                <span className="detail-label">Subdomain:</span>
                <span className="detail-value subdomain-value">
                  {user.subdomain}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Role Request Section */}
      {availableRoles.length > 0 && (
        <div className="settings-section request-section">
          <div className="section-header">
            <h2>Request a Role Upgrade</h2>
            <p>Apply for a higher role to unlock more features</p>
          </div>

          <div className="available-roles">
            {availableRoles.map((roleOption) => (
              <div
                key={roleOption.role}
                className={`role-option-card role-option-${roleOption.role}`}
              >
                <div className="option-header">
                  <h3>
                    <span className={`role-arrow role-${roleOption.role}`}>
                      →
                    </span>{" "}
                    {roleOption.role.charAt(0).toUpperCase() +
                      roleOption.role.slice(1)}
                  </h3>
                  <button
                    className={`request-btn role-btn-${roleOption.role}`}
                    onClick={() => {
                      setSelectedRole(roleOption.role);
                      setSuccessMessage(null);
                    }}
                  >
                    Apply Now
                  </button>
                </div>
                <p className="option-description">{roleOption.description}</p>
              </div>
            ))}
          </div>

          <button
            className="view-history-btn"
            onClick={() => setShowHistoryModal(true)}
          >
            📋 View Request History
          </button>
        </div>
      )}

      {/* Inline Role Application Form */}
      {selectedRole && (
        <RoleApplicationForm
          selectedRole={selectedRole}
          userName={user?.name || ""}
          onSubmit={() => {
            setSuccessMessage(
              `✅ Your application for ${selectedRole} has been submitted! Check your history for updates.`
            );
            setSelectedRole(null);
            setRefreshTrigger((prev) => prev + 1);
            setTimeout(() => setSuccessMessage(null), 5000);
          }}
          onCancel={() => {
            setSelectedRole(null);
          }}
        />
      )}

      {availableRoles.length === 0 && user.role !== "admin" && (
        <div className="settings-section no-requests">
          <p>You have the highest available role for your current tier.</p>
        </div>
      )}

      {/* Role Permissions Section */}
      {(user.role === "deliveryBoy" || user.role === "subAdmin" || user.role === "admin") && (
        <div className="settings-section permissions-section">
          <div className="section-header">
            <h2>Your Permissions</h2>
          </div>
          <div className="permissions-grid">
            {user.role === "deliveryBoy" && (
              <div className="permission-item">
                <span className="permission-icon">✓</span>
                <p>Approve Sub-Admin requests from other Delivery Boys</p>
              </div>
            )}
            {user.role === "subAdmin" && (
              <>
                <div className="permission-item">
                  <span className="permission-icon">✓</span>
                  <p>Approve Sub-Admin requests from Users</p>
                </div>
                <div className="permission-item">
                  <span className="permission-icon">✓</span>
                  <p>Manage orders and delivery personnel</p>
                </div>
              </>
            )}
            {user.role === "admin" && (
              <>
                <div className="permission-item">
                  <span className="permission-icon">✓</span>
                  <p>Approve all role upgrade requests</p>
                </div>
                <div className="permission-item">
                  <span className="permission-icon">✓</span>
                  <p>Full platform management</p>
                </div>
                <div className="permission-item">
                  <span className="permission-icon">✓</span>
                  <p>View all users and statistics</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Approval Requests Section - For Admin/SubAdmin */}
      {(user?.role === 'admin' || user?.role === 'subAdmin') && (
        <div className="settings-section approvals-section">
          <div className="section-header">
            <h2>📋 Pending Role Requests for Approval</h2>
            <p>Review and approve/reject role upgrade requests from users</p>
          </div>

          {loadingRequests ? (
            <div className="approvals-loading">Loading pending requests...</div>
          ) : pendingRequests.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
              ✅ No pending requests to review
            </div>
          ) : (
            <div className="pending-requests-list">
              {pendingRequests.map((request: any) => (
                <div key={request._id} className="request-card">
                  <div className="request-header" onClick={() => setExpandedRequestId(expandedRequestId === request._id ? null : request._id)}>
                    <div className="request-info">
                      <h4>{request.userName}</h4>
                      <p className="request-email">{request.userEmail}</p>
                      <div className="request-meta">
                        <span className="role-badge-sm">{request.currentRole} → {request.requestedRole}</span>
                        <span className="request-date">{new Date(request.requestedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span className="expand-icon">{expandedRequestId === request._id ? '▼' : '▶'}</span>
                  </div>

                  {expandedRequestId === request._id && (
                    <div className="request-details">
                      <div className="detail-section">
                        <h5>Request Reason:</h5>
                        <p>{request.requestReason}</p>
                      </div>

                      {request.profileData && (
                        <div className="detail-section">
                          <h5>Profile Information:</h5>
                          {request.profileData.deliveryBoyProfile && (
                            <div className="profile-info">
                              <p><strong>Aadhaar Number:</strong> {request.profileData.deliveryBoyProfile.aadhaarNumber}</p>
                              <p><strong>License Number:</strong> {request.profileData.deliveryBoyProfile.licenseNumber}</p>
                              <p><strong>Vehicle Type:</strong> {request.profileData.deliveryBoyProfile.vehicleType}</p>
                              <p><strong>Profile Complete:</strong> {request.profileData.deliveryBoyProfile.isProfileComplete ? '✅ Yes' : '❌ No'}</p>
                            </div>
                          )}
                          {request.profileData.subAdminProfile && (
                            <div className="profile-info">
                              <p><strong>Department:</strong> {request.profileData.subAdminProfile.departmentName}</p>
                              <p><strong>ID Proof:</strong> {request.profileData.subAdminProfile.idProof}</p>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="action-buttons">
                        <button
                          className="approve-btn"
                          onClick={() => handleApproveRequest(request._id)}
                          disabled={processingId === request._id}
                        >
                          {processingId === request._id ? '⏳ Processing...' : '✅ Approve'}
                        </button>
                        <button
                          className="reject-btn"
                          onClick={() => handleRejectRequest(request._id, 'Rejected by approver')}
                          disabled={processingId === request._id}
                        >
                          {processingId === request._id ? '⏳ Processing...' : '❌ Reject'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showHistoryModal && (
        <RequestHistoryModal
          onClose={() => setShowHistoryModal(false)}
          roleColors={roleColors}
        />
      )}
    </div>
  );
};

export default ProfileSettings;
