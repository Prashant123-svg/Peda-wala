import React, { useState, useEffect } from "react";
import axios from "axios";

interface RoleRequest {
  _id: string;
  requestedRole: string;
  currentRole: string;
  status: string;
  requestReason: string;
  approvalNotes: string;
  rejectionReason: string;
  requestedAt: string;
  respondedAt: string;
  approverRole: string;
}

interface User {
  subdomain?: string;
  role: string;
}

interface RequestHistoryModalProps {
  onClose: () => void;
  roleColors: { [key: string]: string };
}

const RequestHistoryModal: React.FC<RequestHistoryModalProps> = ({
  onClose,
  roleColors
}) => {
  const [requests, setRequests] = useState<RoleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    fetchRequestHistory();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/api/auth/profile",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setCurrentUser(response.data);
    } catch (err) {
      console.error("Error fetching current user:", err);
    }
  };

  const fetchRequestHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/api/role/history",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setRequests(response.data.requests || []);
    } catch (err) {
      console.error("Error fetching request history:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: {
      [key: string]: { color: string; bgColor: string; icon: string };
    } = {
      pending: { color: "#f39c12", bgColor: "#fff9e6", icon: "⏳" },
      approved: { color: "#27ae60", bgColor: "#d5f4e6", icon: "✓" },
      rejected: { color: "#e74c3c", bgColor: "#fadbd8", icon: "✕" }
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span
        className="status-badge"
        style={{ backgroundColor: config.bgColor, color: config.color }}
      >
        {config.icon} {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
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

  return (
    <div className="history-modal-overlay" onClick={onClose}>
      <div
        className="history-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="history-modal-header">
          <h2>📋 Request History</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="history-content">
          {loading ? (
            <div className="loading-state">Loading your request history...</div>
          ) : requests.length === 0 ? (
            <div className="no-requests-state">
              <p>You haven't submitted any role requests yet.</p>
              <p style={{ fontSize: "0.9rem", color: "#7f8c8d" }}>
                Head back to request a role upgrade when you're ready!
              </p>
            </div>
          ) : (
            <div className="requests-list">
              {requests.map((request) => (
                <div key={request._id} className="request-item">
                  <div className="request-header">
                    <div className="role-transition">
                      <span
                        className="role-badge"
                        style={{
                          backgroundColor: roleColors[request.currentRole]
                        }}
                      >
                        {request.currentRole}
                      </span>
                      <span className="arrow">→</span>
                      <span
                        className="role-badge"
                        style={{
                          backgroundColor: roleColors[request.requestedRole]
                        }}
                      >
                        {request.requestedRole}
                      </span>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>

                  <div className="request-details">
                    <div className="detail">
                      <span className="label">Requested:</span>
                      <span className="value">
                        {formatDate(request.requestedAt)}
                      </span>
                    </div>

                    {request.respondedAt && (
                      <div className="detail">
                        <span className="label">
                          {request.status === "approved" ? "Approved" : "Responded"}:
                        </span>
                        <span className="value">
                          {formatDate(request.respondedAt)}
                        </span>
                      </div>
                    )}

                    {request.requestReason && (
                      <div className="detail">
                        <span className="label">Your Reason:</span>
                        <span className="value">{request.requestReason}</span>
                      </div>
                    )}

                    {request.status === "approved" && request.approvalNotes && (
                      <div className="detail approved-note">
                        <span className="label">✓ Approval Note:</span>
                        <span className="value">{request.approvalNotes}</span>
                      </div>
                    )}

                    {request.status === "approved" && request.requestedRole === "subAdmin" && currentUser?.subdomain && (
                      <div className="detail approved-note">
                        <span className="label">✓ Your Subdomain:</span>
                        <span className="value" style={{ fontFamily: "monospace", color: "#9b59b6" }}>
                          {currentUser.subdomain}
                        </span>
                      </div>
                    )}

                    {request.status === "rejected" && request.rejectionReason && (
                      <div className="detail rejected-note">
                        <span className="label">✕ Rejection Reason:</span>
                        <span className="value">{request.rejectionReason}</span>
                      </div>
                    )}

                    {request.approverRole && (
                      <div className="detail">
                        <span className="label">Reviewed by:</span>
                        <span className="value">
                          {request.approverRole.charAt(0).toUpperCase() +
                            request.approverRole.slice(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="history-modal-footer">
          <button className="btn-close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestHistoryModal;
