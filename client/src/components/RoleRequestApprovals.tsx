import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../utils/apiConfig";

interface ProfileData {
  deliveryBoyProfile?: {
    aadhaarNumber?: string;
    licenseNumber?: string;
    vehicleType?: string;
    documents?: {
      aadhaarDoc?: string;
      licenseDoc?: string;
      vehicleDoc?: string;
    };
    isProfileComplete?: boolean;
  };
  subAdminProfile?: {
    departmentId?: string;
    departmentName?: string;
    idProof?: string;
    isProfileComplete?: boolean;
  };
}

interface ManagedUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role?: string;
  status?: string;
  createdAt?: string;
}

interface RoleRequest {
  _id: string;
  userId?: {
    id?: string;
    _id?: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  userName: string;
  userEmail: string;
  requestedRole: string;
  currentRole: string;
  requestReason: string;
  status: string;
  requestedAt: string;
  respondedAt?: string;
  approvedBy?: {
    _id?: string;
    name: string;
    email: string;
    role?: string;
  };
  approvalNotes?: string;
  rejectionReason?: string;
  profileData?: ProfileData;
}

interface RoleRequestApprovalsProps {
  isVisible: boolean;
}

const RoleRequestApprovals: React.FC<RoleRequestApprovalsProps> = ({ isVisible }) => {
  const [requests, setRequests] = useState<RoleRequest[]>([]);
  const [subAdmins, setSubAdmins] = useState<ManagedUser[]>([]);
  const [deliveryBoys, setDeliveryBoys] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [managementLoading, setManagementLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<{
    userId: string;
    role: "subAdmin" | "deliveryBoy";
    name: string;
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState<{ [key: string]: string }>({});
  const [showRejectForm, setShowRejectForm] = useState<string | null>(null);
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [showDocumentModal, setShowDocumentModal] = useState<{
    requestId: string;
    docType: string;
    docUrl?: string;
  } | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isApprover, setIsApprover] = useState(false);
  const [approvalHistory, setApprovalHistory] = useState<any>(null);

  const token = localStorage.getItem("token");
  const userRoleFromStorage = localStorage.getItem("userRole");

  const normalizeRole = (role?: string) => (role || "").toLowerCase().replace(/[-_\s]/g, "");

  const roleDescriptions: { [key: string]: string } = {
    deliveryBoy: "🚚 Delivery Boy - Deliver orders to customers",
    subAdmin: "👨‍💼 Sub-Admin - Manage orders and delivery boys",
    admin: "🔐 Admin - Full platform administration",
  };

  useEffect(() => {
    if (isVisible) {
      const role = userRoleFromStorage;
      // If role is present in localStorage use it, otherwise fetch fresh profile
      if (role) {
        setUserRole(role);
        if (role === "admin" || role === "subAdmin") fetchPendingRequests();
        if (role === "admin") fetchManagedRoles();
      } else {
        // fetch profile to determine role and then fetch pending requests if allowed
        (async () => {
          try {
            const profileRes = await axios.get("http://localhost:5000/api/auth/profile", {
              headers: { Authorization: `Bearer ${token}` },
            });
            const fetchedRole = profileRes.data.role;
            setUserRole(fetchedRole);
            // also sync to localStorage so other components can use it
            if (fetchedRole) localStorage.setItem("userRole", fetchedRole);
            if (fetchedRole === "admin" || fetchedRole === "subAdmin") {
              fetchPendingRequests();
            }
            if (fetchedRole === "admin") {
              fetchManagedRoles();
            }
          } catch (err) {
            console.error("Error fetching profile for role detection:", err);
          }
        })();
      }
    }
  }, [isVisible, userRoleFromStorage]);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "http://localhost:5000/api/role/pending",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setRequests(response.data.requests || []);
      setIsApprover(response.data.isApprover || false);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching role requests:", err);
      setError(
        err.response?.data?.message || "Failed to fetch pending role requests"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchManagedRoles = async () => {
    try {
      setManagementLoading(true);

      const response = await axios.get("http://localhost:5000/api/auth/admin/all-users", {
        const response = await axios.get(`${API_BASE_URL}/auth/admin/all-users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const users: ManagedUser[] = response.data.users || [];
      setSubAdmins(users.filter((user) => normalizeRole(user.role) === "subadmin"));
      setDeliveryBoys(users.filter((user) => normalizeRole(user.role) === "deliveryboy"));
    } catch (err: any) {
      console.error("Error fetching managed roles:", err);
      setError(err.response?.data?.message || "Failed to load role management data");
    } finally {
      setManagementLoading(false);
    }
  };

  const fetchApprovalHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "http://localhost:5000/api/role/admin/approval-history",
         `${API_BASE_URL}/role/admin/approval-history`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setApprovalHistory(response.data);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching approval history:", err);
      setError(
        err.response?.data?.message || "Failed to fetch approval history"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      const response = await axios.post(
        `http://localhost:5000/api/role/approve/${requestId}`,
        { approvalNotes: "Approved" },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const { updatedUser, redirectTo } = response.data;
      
      setSuccessMessage(
        `✅ ${updatedUser.name} has been promoted to ${updatedUser.role}${updatedUser.subdomain ? ` - Subdomain: ${updatedUser.subdomain}` : ""}`
      );
      
      // Update localStorage with new role
      if (updatedUser.role) {
        localStorage.setItem("userRole", updatedUser.role);
      }
      
      // If subdomain is available, redirect after 2 seconds
      if (updatedUser.subdomain) {
        console.log(`🚀 Redirecting to subdomain: ${updatedUser.subdomain}`);
        setTimeout(() => {
          // Redirect to subdomain dashboard
          const subdomainUrl = `http://${updatedUser.subdomain}.localhost:5173`;
          console.log(`📍 Going to: ${subdomainUrl}`);
          window.location.href = subdomainUrl;
        }, 2000);
      } else {
        setRequests(requests.filter((r) => r._id !== requestId));
        setExpandedRequest(null);
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to approve request");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!rejectionReason[requestId]?.trim()) {
      setError("Please provide a rejection reason");
      return;
    }

    setProcessingId(requestId);
    try {
      await axios.post(
        `http://localhost:5000/api/role/reject/${requestId}`,
        { rejectionReason: rejectionReason[requestId] },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccessMessage("✅ Request has been rejected");
      setRequests(requests.filter((r) => r._id !== requestId));
      setShowRejectForm(null);
      setExpandedRequest(null);
      setRejectionReason((prev) => {
        delete prev[requestId];
        return prev;
      });
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reject request");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRemoveRole = async () => {
    if (!pendingRemoval) return;

    const { userId, role } = pendingRemoval;
    setProcessingId(userId);

    try {
      const endpoint =
        role === "subAdmin"
          ? `http://localhost:5000/api/admin/remove-subadmin/${userId}`
           ? `${API_BASE_URL}/admin/remove-subadmin/${userId}`
          : `http://localhost:5000/api/admin/remove-deliveryboy/${userId}`;
           : `${API_BASE_URL}/admin/remove-deliveryboy/${userId}`;

      await axios.delete(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (role === "subAdmin") {
        setSubAdmins((prev) => prev.filter((user) => user._id !== userId));
      } else {
        setDeliveryBoys((prev) => prev.filter((user) => user._id !== userId));
      }

      setSuccessMessage(`✅ ${pendingRemoval.name} has been removed from ${role === "subAdmin" ? "Sub-Admin" : "Delivery Boy"}`);
      setPendingRemoval(null);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error("Error removing role:", err);
      setError(err.response?.data?.message || "Failed to remove role");
    } finally {
      setProcessingId(null);
    }
  };

  const renderProfileDocuments = (request: RoleRequest) => {
    const profileData = request.profileData;
    if (!profileData) return null;

    if (request.requestedRole === "deliveryBoy") {
      const dbProfile = profileData.deliveryBoyProfile;
      if (!dbProfile) return null;

      return (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h5 className="text-sm font-semibold uppercase tracking-wide text-slate-700">📄 Delivery Boy Documents</h5>
          <div className="mt-3 space-y-3">
            {dbProfile.documents?.aadhaarDoc && (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
                <span className="text-sm font-medium text-slate-800">🆔 Aadhaar Card</span>
                <button
                  className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                  onClick={() =>
                    setShowDocumentModal({
                      requestId: request._id,
                      docType: "Aadhaar",
                      docUrl: dbProfile.documents.aadhaarDoc,
                    })
                  }
                >
                  View
                </button>
              </div>
            )}
            {dbProfile.documents?.licenseDoc && (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
                <span className="text-sm font-medium text-slate-800">🪪 License</span>
                <button
                  className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                  onClick={() =>
                    setShowDocumentModal({
                      requestId: request._id,
                      docType: "License",
                      docUrl: dbProfile.documents.licenseDoc,
                    })
                  }
                >
                  View
                </button>
              </div>
            )}
            {dbProfile.documents?.vehicleDoc && (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
                <span className="text-sm font-medium text-slate-800">🚗 Vehicle Document</span>
                <button
                  className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                  onClick={() =>
                    setShowDocumentModal({
                      requestId: request._id,
                      docType: "Vehicle",
                      docUrl: dbProfile.documents.vehicleDoc,
                    })
                  }
                >
                  View
                </button>
              </div>
            )}
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            {dbProfile.aadhaarNumber && <p><span className="font-semibold text-slate-900">Aadhaar:</span> {dbProfile.aadhaarNumber}</p>}
            {dbProfile.licenseNumber && <p><span className="font-semibold text-slate-900">License:</span> {dbProfile.licenseNumber}</p>}
            {dbProfile.vehicleType && <p><span className="font-semibold text-slate-900">Vehicle Type:</span> {dbProfile.vehicleType}</p>}
            <p>
              <span className="font-semibold text-slate-900">Profile Status:</span>{" "}
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${dbProfile.isProfileComplete ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                {dbProfile.isProfileComplete ? "✅ Complete" : "⏳ Incomplete"}
              </span>
            </p>
          </div>
        </div>
      );
    } else if (request.requestedRole === "subAdmin") {
      const subProfile = profileData.subAdminProfile;
      if (!subProfile) return null;

      // Support both old structure (direct idProof) and new structure (documents object)
      const documents = subProfile.documents || {};
      const idProof = documents.idProof || subProfile.idProof;

      return (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h5 className="text-sm font-semibold uppercase tracking-wide text-slate-700">📄 Sub-Admin Documents</h5>
          <div className="mt-3 space-y-3">
            {idProof && (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
                <span className="text-sm font-medium text-slate-800">🪪 ID Proof</span>
                <button
                  className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                  onClick={() =>
                    setShowDocumentModal({
                      requestId: request._id,
                      docType: "ID Proof",
                      docUrl: idProof,
                    })
                  }
                >
                  View
                </button>
              </div>
            )}
            {documents.highschoolMarksheet && (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
                <span className="text-sm font-medium text-slate-800">📚 High School Marksheet</span>
                <button
                  className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                  onClick={() =>
                    setShowDocumentModal({
                      requestId: request._id,
                      docType: "High School Marksheet",
                      docUrl: documents.highschoolMarksheet,
                    })
                  }
                >
                  View
                </button>
              </div>
            )}
            {documents.intermediateMarksheet && (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
                <span className="text-sm font-medium text-slate-800">📖 Intermediate Marksheet</span>
                <button
                  className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                  onClick={() =>
                    setShowDocumentModal({
                      requestId: request._id,
                      docType: "Intermediate Marksheet",
                      docUrl: documents.intermediateMarksheet,
                    })
                  }
                >
                  View
                </button>
              </div>
            )}
            {documents.degreeCertificate && (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
                <span className="text-sm font-medium text-slate-800">🎓 Degree Certificate</span>
                <button
                  className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                  onClick={() =>
                    setShowDocumentModal({
                      requestId: request._id,
                      docType: "Degree Certificate",
                      docUrl: documents.degreeCertificate,
                    })
                  }
                >
                  View
                </button>
              </div>
            )}
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            {subProfile.departmentId && <p><span className="font-semibold text-slate-900">Department ID:</span> {subProfile.departmentId}</p>}
            {subProfile.departmentName && <p><span className="font-semibold text-slate-900">Department:</span> {subProfile.departmentName}</p>}
            <p>
              <span className="font-semibold text-slate-900">Profile Status:</span>{" "}
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${subProfile.isProfileComplete ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                {subProfile.isProfileComplete ? "✅ Complete" : "⏳ Incomplete"}
              </span>
            </p>
          </div>
        </div>
      );
    }

    return null;
  };

  if (!isVisible) return null;

  return (
    <div className="min-h-screen bg-slate-100 p-4 text-slate-900 sm:p-6">
      {error && (
        <div className="mb-4 flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-sm">
          <div className="flex items-start gap-3">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
          <button className="text-lg font-semibold leading-none text-red-500 hover:text-red-700" onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 flex items-start justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-sm">
          <div className="flex items-start gap-3">
            <span>✓</span>
            <span>{successMessage}</span>
          </div>
          <button className="text-lg font-semibold leading-none text-emerald-500 hover:text-emerald-700" onClick={() => setSuccessMessage(null)}>✕</button>
        </div>
      )}

      {pendingRemoval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onClick={() => setPendingRemoval(null)}>
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <h4 className="text-lg font-semibold text-slate-900">Confirm Role Removal</h4>
              <button className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900" onClick={() => setPendingRemoval(null)}>✕</button>
            </div>
            <div className="space-y-4 pt-4 text-sm text-slate-700">
              <p>
                Approve removal of <strong className="text-slate-900">{pendingRemoval.name}</strong> from the {pendingRemoval.role === "subAdmin" ? "Sub-Admin" : "Delivery Boy"} role?
              </p>
              <p className="text-red-600">This will delete the account from that role and release any linked assignments.</p>
              <div className="flex justify-end gap-3 pt-2">
                <button className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" onClick={() => setPendingRemoval(null)}>Cancel</button>
                <button
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={handleRemoveRole}
                  disabled={processingId === pendingRemoval.userId}
                >
                  {processingId === pendingRemoval.userId ? "Removing..." : "Approve Removal"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {userRole === "admin" && (
        <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-1">
            <h3 className="text-xl font-semibold text-slate-900">🛡️ Role Removal Approval</h3>
            <p className="text-sm text-slate-600">Review and approve removal of Sub-Admin or Delivery Boy access.</p>
          </div>

          {managementLoading ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center text-sm text-slate-600">Loading role management data...</div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {[{ title: "Sub-Admins", items: subAdmins, tone: "blue" as const, role: "subAdmin" as const }, { title: "Delivery Boys", items: deliveryBoys, tone: "emerald" as const, role: "deliveryBoy" as const }].map((group) => (
                <div key={group.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h4 className="text-lg font-semibold text-slate-900">{group.title}</h4>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${group.tone === "blue" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {group.items.length}
                    </span>
                  </div>

                  {group.items.length === 0 ? (
                    <p className="text-sm text-slate-500">No active {group.role === "subAdmin" ? "sub-admins" : "delivery boys"} found.</p>
                  ) : (
                    <div className="space-y-3">
                      {group.items.map((user) => (
                        <div key={user._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-1">
                              <p className="font-semibold text-slate-900">{user.name}</p>
                              <p className="text-sm text-slate-600">{user.email}</p>
                              {user.phone && <p className="text-xs text-slate-500">📞 {user.phone}</p>}
                            </div>
                            <button
                              className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                              onClick={() => setPendingRemoval({ userId: user._id, role: group.role, name: user.name })}
                              disabled={processingId === user._id}
                            >
                              Approve Removal
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {showDocumentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onClick={() => setShowDocumentModal(null)}>
          <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
              <h4 className="text-lg font-semibold text-slate-900">{showDocumentModal.docType}</h4>
              <button className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900" onClick={() => setShowDocumentModal(null)}>✕</button>
            </div>
            <div className="space-y-4 p-6">
              {showDocumentModal.docUrl ? (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  {showDocumentModal.docUrl.endsWith(".pdf") ? (
                    <embed src={showDocumentModal.docUrl} type="application/pdf" className="h-[70vh] w-full" />
                  ) : (
                    <img src={showDocumentModal.docUrl} alt={showDocumentModal.docType} className="max-h-[70vh] w-full object-contain" />
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-600">Document not available</p>
              )}
              <a href={showDocumentModal.docUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700">
                📥 Download
              </a>
            </div>
          </div>
        </div>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        {loading && requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-600">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />
            <p className="text-sm font-medium">Loading pending requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-600">
            <div className="text-4xl">📋</div>
            <p className="text-lg font-semibold text-slate-900">No pending role requests</p>
            <small className="text-sm">All role requests have been reviewed</small>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => {
              const expanded = expandedRequest === request._id;
              return (
                <div key={request._id} className={`rounded-3xl border bg-white shadow-sm transition ${expanded ? "border-slate-300" : "border-slate-200"}`}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 p-5 text-left"
                    onClick={() => setExpandedRequest(expanded ? null : request._id)}
                  >
                    <div className="min-w-0">
                      <h4 className="truncate text-lg font-semibold text-slate-900">{request.userName}</h4>
                      <p className="truncate text-sm text-slate-600">{request.userEmail}</p>
                      {request.userId?.phone && <p className="mt-1 text-xs text-slate-500">📞 {request.userId.phone}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${request.currentRole === "admin" ? "bg-slate-900 text-white" : request.currentRole === "subAdmin" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}>
                        {request.currentRole.charAt(0).toUpperCase() + request.currentRole.slice(1)}
                      </span>
                      <span className="text-slate-400">→</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${request.requestedRole === "admin" ? "bg-slate-900 text-white" : request.requestedRole === "subAdmin" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}>
                        {request.requestedRole.charAt(0).toUpperCase() + request.requestedRole.slice(1)}
                      </span>
                    </div>
                  </button>

                  {expanded && (
                    <div className="border-t border-slate-200 px-5 pb-5 pt-4">
                      <div className="space-y-4">
                        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                          <p><span className="font-semibold text-slate-900">Why:</span> {request.requestReason || "No reason provided"}</p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <h5 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700">👤 User Information</h5>
                          <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                            <p><span className="font-semibold text-slate-900">Name:</span> {request.userId?.name}</p>
                            <p><span className="font-semibold text-slate-900">Email:</span> {request.userId?.email}</p>
                            {request.userId?.phone && <p><span className="font-semibold text-slate-900">Phone:</span> {request.userId.phone}</p>}
                            {request.userId?.address && <p><span className="font-semibold text-slate-900">Address:</span> {request.userId.address}</p>}
                          </div>
                        </div>

                        {renderProfileDocuments(request)}

                        <div className="text-xs font-medium uppercase tracking-wide text-slate-500">📅 Requested: {new Date(request.requestedAt).toLocaleDateString()}</div>

                        {showRejectForm === request._id && (
                          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                            <label className="mb-2 block text-sm font-semibold text-slate-900">Rejection Reason *</label>
                            <textarea
                              value={rejectionReason[request._id] || ""}
                              onChange={(e) => setRejectionReason((prev) => ({ ...prev, [request._id]: e.target.value }))}
                              placeholder="Why are you rejecting this request?"
                              rows={3}
                              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-400"
                            />
                          </div>
                        )}

                        {(userRole === "subAdmin" || userRole === "admin") && (
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="mb-4">
                              <h5 className="text-base font-semibold text-slate-900">✅ Approval Decision</h5>
                              <p className="text-sm text-slate-600">Choose to approve or reject this {request.requestedRole} role request</p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                              {showRejectForm === request._id ? (
                                <>
                                  <button
                                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white"
                                    onClick={() => setShowRejectForm(null)}
                                    disabled={processingId === request._id}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    onClick={() => handleReject(request._id)}
                                    disabled={processingId === request._id}
                                  >
                                    {processingId === request._id ? "Rejecting..." : "Confirm Reject"}
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    className="rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                                    onClick={() => setShowRejectForm(request._id)}
                                    disabled={processingId === request._id}
                                  >
                                    ❌ Reject
                                  </button>
                                  <button
                                    className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${request.requestedRole === "subAdmin" ? "bg-blue-600 hover:bg-blue-700" : request.requestedRole === "deliveryBoy" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-900 hover:bg-slate-700"}`}
                                    onClick={() => handleApprove(request._id)}
                                    disabled={processingId === request._id}
                                  >
                                    {processingId === request._id ? "Processing..." : "✅ Approve"}
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        {userRole !== "subAdmin" && userRole !== "admin" && request.status !== "pending" && (
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">👁️ View Only - You don't have approval permissions</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {userRole === "admin" && approvalHistory && (
        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <h3 className="text-xl font-semibold text-slate-900">👮 Admin Approval History</h3>
            <p className="text-sm text-slate-600">View who approved what requests (View-only access)</p>
          </div>
          {approvalHistory.groupedByApprover && Object.keys(approvalHistory.groupedByApprover).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(approvalHistory.groupedByApprover).map(([approverName, data]: any) => (
                <div key={approverName} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h4 className="text-base font-semibold text-slate-900">👤 {approverName}</h4>
                    <div className="flex gap-2 text-xs font-semibold">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">✅ {data.totalApprovals} Approved</span>
                      <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-700">❌ {data.totalRejections} Rejected</span>
                    </div>
                  </div>

                  {data.approved.length > 0 && (
                    <div className="mb-4 space-y-2">
                      <h5 className="text-sm font-semibold uppercase tracking-wide text-slate-700">✅ Approved Requests</h5>
                      {data.approved.map((req: RoleRequest, idx: number) => (
                        <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
                          <p><strong className="text-slate-900">{req.userName}</strong> → <span className="font-semibold text-emerald-700">{req.requestedRole}</span></p>
                          <small className="text-slate-500">📅 {new Date(req.respondedAt || "").toLocaleDateString()}</small>
                          {req.approvalNotes && <p className="mt-1 text-slate-600">📝 {req.approvalNotes}</p>}
                        </div>
                      ))}
                    </div>
                  )}

                  {data.rejected.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-semibold uppercase tracking-wide text-slate-700">❌ Rejected Requests</h5>
                      {data.rejected.map((req: RoleRequest, idx: number) => (
                        <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
                          <p><strong className="text-slate-900">{req.userName}</strong> → <span className="font-semibold text-rose-700">{req.requestedRole}</span></p>
                          <small className="text-slate-500">📅 {new Date(req.respondedAt || "").toLocaleDateString()}</small>
                          {req.rejectionReason && <p className="mt-1 text-slate-600">🚫 {req.rejectionReason}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-600">
              <div className="text-4xl">📋</div>
              <p className="text-lg font-semibold text-slate-900">No approval history yet</p>
              <small className="text-sm">All approvals and rejections will appear here</small>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default RoleRequestApprovals;
