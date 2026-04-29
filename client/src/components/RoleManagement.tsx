import React, { useState, useEffect } from "react";
import axios from "axios";
import AnimatedNotification from "./AnimatedNotification";
import "./RoleManagement.css";

interface PendingRequest {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  requestedRole: string;
  currentRole: string;
  status: string;
  requestReason: string;
  requestedAt: string;
  userName: string;
  userEmail: string;
  profileData?: {
    [key: string]: string;
  };
}

interface ApprovedUser {
  _id: string;
  role: string;
  subdomain?: string;
}

const RoleManagement: React.FC = () => {
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("");
  const [notification, setNotification] = useState<{
    message: string;
    type: string;
  } | null>(null);
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [responseNotes, setResponseNotes] = useState<{ [key: string]: string }>({});
  const [generatedSubdomains, setGeneratedSubdomains] = useState<{ [key: string]: string }>({});

  const roleColors: { [key: string]: string } = {
    user: "#3498db",
    deliveryBoy: "#e67e22",
    subAdmin: "#9b59b6",
    admin: "#e74c3c"
  };

  useEffect(() => {
    fetchUserRole();
    fetchPendingRequests();
  }, []);

  const fetchUserRole = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/api/auth/profile",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setUserRole(response.data.role);
    } catch (err) {
      console.error("Error fetching user role:", err);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/api/role/pending",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      console.log("🔍 Pending Requests Debug:", {
        userRole,
        totalRequests: response.data.totalRequests,
        requests: response.data.requests,
        requestedRoles: response.data.requests?.map((r: any) => r.requestedRole)
      });
      
      setRequests(response.data.requests || []);
      
      // Generate preview subdomains for subAdmin requests
      const subdomains: { [key: string]: string } = {};
      response.data.requests?.forEach((req: PendingRequest) => {
        if (req.requestedRole === "subAdmin") {
          const preview = req.userName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "")
            .substring(0, 20);
          subdomains[req._id] = preview;
        }
      });
      setGeneratedSubdomains(subdomains);
    } catch (err: any) {
      console.error("❌ Error fetching requests:", err.response?.data);
      setNotification({
        message: err.response?.data?.message || "Failed to fetch pending requests",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5000/api/role/approve/${requestId}`,
        {
          approvalNotes: responseNotes[requestId] || ""
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setNotification({
        message: "✅ Role request approved successfully!",
        type: "success"
      });

      setRequests(requests.filter((r) => r._id !== requestId));
      setExpandedRequest(null);
    } catch (err: any) {
      setNotification({
        message: err.response?.data?.message || "Failed to approve request",
        type: "error"
      });
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5000/api/role/reject/${requestId}`,
        {
          rejectionReason: responseNotes[requestId] || ""
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setNotification({
        message: "✓ Role request rejected",
        type: "info"
      });

      setRequests(requests.filter((r) => r._id !== requestId));
      setExpandedRequest(null);
    } catch (err: any) {
      setNotification({
        message: err.response?.data?.message || "Failed to reject request",
        type: "error"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (!["deliveryBoy", "subAdmin", "admin"].includes(userRole)) {
    return (
      <div className="role-management-container">
        <div className="no-permission">
          <p>You don't have permission to manage role requests.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="role-management-container">
      <div className="management-header">
        <h1>🔐 Role Request Management</h1>
        <p>Review and approve/reject role upgrade requests</p>
      </div>

      {/* Info message for SubAdmin */}
      {userRole === "subAdmin" && (
        <div style={{
          backgroundColor: "#f0e6ff",
          border: "1px solid #9b59b6",
          borderRadius: "6px",
          padding: "12px 16px",
          marginBottom: "16px",
          color: "#9b59b6",
          fontSize: "0.95rem",
          fontWeight: "500",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <strong>👤 As a Sub-Admin:</strong> You can approve or reject all Delivery Boy role requests
            {requests.length === 0 && (
              <p style={{ margin: "8px 0 0 0", fontSize: "0.9rem", color: "#7f8c8d" }}>
                💡 No pending Delivery Boy requests at the moment. Check back later!
              </p>
            )}
          </div>
          <button
            onClick={async () => {
              try {
                const response = await axios.get("/api/role/debug/deliveryboy-requests", {
                  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                });
                console.log("🐛 DeliveryBoy Requests Debug:", response.data);
                alert(`Debug Info:\n- All DeliveryBoy Requests: ${response.data.allDeliveryBoyRequests}\n- Pending: ${response.data.pendingDeliveryBoyRequests}\n- SubAdmin Can See: ${response.data.subAdminCanSee}\n\nCheck console for full details.`);
              } catch (error) {
                console.error("Debug error:", error);
                alert("Debug failed - check console");
              }
            }}
            style={{
              padding: "6px 12px",
              backgroundColor: "#9b59b6",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: "500",
              whiteSpace: "nowrap"
            }}
          >
            🐛 Debug
          </button>
        </div>
      )}

      {notification && (
        <AnimatedNotification
          message={notification.message}
          type={notification.type}
        />
      )}

      {loading ? (
        <div className="loading-state">Loading pending requests...</div>
      ) : requests.length === 0 ? (
        <div className="empty-state">
          <h3>No Pending Requests</h3>
          <p>
            {userRole === "subAdmin"
              ? "✓ All Delivery Boy role requests have been approved or rejected."
              : "✓ All role requests have been processed."}
          </p>
          {userRole === "subAdmin" && (
            <p style={{ fontSize: "0.9rem", color: "#7f8c8d", marginTop: "8px" }}>
              As a Sub-Admin, you can approve/reject all Delivery Boy requests.
            </p>
          )}
        </div>
      ) : (
        <div className="requests-container">
          <div className="requests-stats">
            <div className="stat-card">
              <span className="stat-number">{requests.length}</span>
              <span className="stat-label">Pending Requests</span>
            </div>
          </div>

          <div className="requests-list">
            {requests.map((request) => (
              <div
                key={request._id}
                className={`request-card ${
                  expandedRequest === request._id ? "expanded" : ""
                }`}
              >
                <div
                  className="request-card-header"
                  onClick={() =>
                    setExpandedRequest(
                      expandedRequest === request._id ? null : request._id
                    )
                  }
                >
                  <div className="request-summary">
                    <div className="user-info">
                      <h3>{request.userName}</h3>
                      <p>{request.userEmail}</p>
                    </div>

                    <div className="role-transition">
                      <span
                        className="role-badge"
                        style={{
                          backgroundColor: roleColors[request.currentRole]
                        }}
                      >
                        {request.currentRole}
                      </span>
                      <span className="transition-arrow">→</span>
                      <span
                        className="role-badge requested"
                        style={{
                          backgroundColor: roleColors[request.requestedRole]
                        }}
                      >
                        {request.requestedRole}
                      </span>
                    </div>
                  </div>

                  <div className="request-meta">
                    <span className="requested-time">
                      📅 {formatDate(request.requestedAt)}
                    </span>
                    <span className="expand-icon">
                      {expandedRequest === request._id ? "▼" : "▶"}
                    </span>
                  </div>
                </div>

                {expandedRequest === request._id && (
                  <div className="request-details-panel">
                    {request.requestReason && (
                      <div className="detail-section">
                        <h4>Request Reason</h4>
                        <p>{request.requestReason}</p>
                      </div>
                    )}

                    {request.userId && (
                      <div className="detail-section">
                        <h4>User Information</h4>
                        <div className="info-grid">
                          <div className="info-item">
                            <span className="label">Phone:</span>
                            <span className="value">
                              {request.userId.phone || "Not provided"}
                            </span>
                          </div>
                          <div className="info-item">
                            <span className="label">Address:</span>
                            <span className="value">
                              {request.userId.address || "Not provided"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {request.requestedRole === "subAdmin" && (
                      <div className="detail-section" style={{ 
                        backgroundColor: "#f0e6ff", 
                        padding: "12px 16px", 
                        borderRadius: "6px", 
                        borderLeft: "4px solid #9b59b6" 
                      }}>
                        <h4 style={{ color: "#9b59b6", marginBottom: "8px" }}>
                          📪 Subdomain Assignment
                        </h4>
                        <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "8px" }}>
                          When approved, this user will be assigned a subdomain:
                        </p>
                        <div style={{ 
                          backgroundColor: "#fff", 
                          padding: "8px 12px", 
                          borderRadius: "4px", 
                          fontFamily: "monospace", 
                          color: "#9b59b6", 
                          fontWeight: "bold" 
                        }}>
                          {generatedSubdomains[request._id] || "generating..."}
                        </div>
                      </div>
                    )}

                    {/* Uploaded Documents Section */}
                    {request.profileData && Object.keys(request.profileData).length > 0 && (
                      <div className="detail-section" style={{ 
                        backgroundColor: "#f0f9ff", 
                        padding: "12px 16px", 
                        borderRadius: "6px", 
                        borderLeft: "4px solid #3498db" 
                      }}>
                        <h4 style={{ color: "#3498db", marginBottom: "12px" }}>
                          📄 Uploaded Documents
                        </h4>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                          {Object.entries(request.profileData).map(([docType, docUrl]) => {
                            if (!docUrl) return null;
                            
                            let docLabel = docType;
                            // Format document labels
                            if (docType === "idProof") docLabel = "ID Proof 🆔";
                            if (docType === "intermediateMarksheet") docLabel = "Intermediate Marksheet 📚";
                            if (docType.includes("Marksheet")) docLabel = docType.replace("Marksheet", "").toUpperCase() + " Marksheet 📊";
                            if (docType.includes("Proof")) docLabel = docType.replace("Proof", "").toUpperCase() + " Proof 🆔";
                            
                            return (
                              <div
                                key={docType}
                                style={{
                                  backgroundColor: "#fff",
                                  padding: "10px 12px",
                                  borderRadius: "4px",
                                  border: "1px solid #e0e0e0",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  gap: "8px"
                                }}
                              >
                                <span style={{ fontSize: "0.9rem", color: "#333", fontWeight: "500" }}>
                                  {docLabel}
                                </span>
                                <a
                                  href={docUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    padding: "4px 10px",
                                    backgroundColor: "#3498db",
                                    color: "#fff",
                                    borderRadius: "3px",
                                    textDecoration: "none",
                                    fontSize: "0.85rem",
                                    fontWeight: "500",
                                    cursor: "pointer"
                                  }}
                                  onMouseOver={(e) => {
                                    e.currentTarget.style.backgroundColor = "#2980b9";
                                  }}
                                  onMouseOut={(e) => {
                                    e.currentTarget.style.backgroundColor = "#3498db";
                                  }}
                                >
                                  👁️ View
                                </a>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="response-section">
                      <h4>
                        {userRole === "deliveryBoy"
                          ? "Approval/Rejection Notes"
                          : "Your Notes"}
                      </h4>
                      <textarea
                        value={responseNotes[request._id] || ""}
                        onChange={(e) =>
                          setResponseNotes({
                            ...responseNotes,
                            [request._id]: e.target.value
                          })
                        }
                        placeholder="Add notes for your decision..."
                        maxLength={300}
                        className="response-textarea"
                      />
                      <span className="char-count">
                        {(responseNotes[request._id] || "").length}/300
                      </span>
                    </div>

                    <div className="action-buttons">
                      <button
                        className="btn-approve"
                        onClick={() => handleApprove(request._id)}
                      >
                        ✓ Approve
                      </button>
                      <button
                        className="btn-reject"
                        onClick={() => handleReject(request._id)}
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;
