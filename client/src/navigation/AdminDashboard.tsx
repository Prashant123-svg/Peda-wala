import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface UserData {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: string;
  createdAt: string;
}

interface OrderData {
  _id: string;
  userId: { _id: string; name: string; email: string; phone?: string };
  items: any[];
  totalPrice: number;
  status: string;
  deliveryAddress: string;
  phoneNumber: string;
  createdAt: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [subAdmins, setSubAdmins] = useState<UserData[]>([]);
  const [deliveryBoys, setDeliveryBoys] = useState<UserData[]>([]);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userOrders, setUserOrders] = useState<OrderData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusUpdateLoading, setStatusUpdateLoading] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // Approval Modal States
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Role Request Approval States
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        if (!token) {
          navigate("/login");
          return;
        }

        // Fetch current admin profile
        const profileRes = await axios.get("http://localhost:5000/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Check if user is admin
        if (profileRes.data.role !== "admin") {
          navigate("/profile");
          return;
        }

        setAdminUser(profileRes.data);

        // Fetch all users and orders
        const usersRes = await axios.get("http://localhost:5000/api/auth/admin/all-users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(usersRes.data.users);

        const [subAdminsRes, deliveryBoysRes] = await Promise.all([
          axios.get("http://localhost:5000/api/admin/subadmins", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:5000/api/admin/deliveryboys", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setSubAdmins(subAdminsRes.data.subadmins || []);
        setDeliveryBoys(deliveryBoysRes.data.deliveryboys || []);

        const ordersRes = await axios.get("http://localhost:5000/api/orders/admin/all-orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(ordersRes.data.orders);
        
        // Fetch pending role requests for approval
        try {
          const requestsRes = await axios.get("http://localhost:5000/api/role/pending", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setPendingRequests(requestsRes.data.requests || []);
        } catch (err) {
          console.error("Error fetching pending requests:", err);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching admin data:", err);
        setError("Failed to load admin dashboard");
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [token, navigate]);

  const handleUserSelect = async (userId: string) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/orders/admin/user-orders/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUserOrders(res.data.orders);
      setSelectedUser(userId);
    } catch (err) {
      console.error("Error fetching user orders:", err);
    }
  };

  // Approval Modal Handlers
  const openApprovalModal = (order: OrderData) => {
    setSelectedOrder(order);
    setShowApprovalModal(true);
    setApprovalNotes('');
  };

  const closeApprovalModal = () => {
    setShowApprovalModal(false);
    setSelectedOrder(null);
    setApprovalNotes('');
  };

  const handleApprove = async () => {
    if (!selectedOrder) return;

    setSubmitting(true);
    try {
      console.log("🔄 Approving order:", selectedOrder._id);

      const response = await axios.put(
        `http://localhost:5000/api/order-management/admin/approve/${selectedOrder._id}`,
        { approvalNotes },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("✅ Approval response:", response.data);
      setMessage({ type: 'success', text: '✅ Order approved successfully! Refreshing...' });
      closeApprovalModal();

      // Refresh orders after 1 second
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error("❌ Approval error:", error.response?.data || error.message);
      
      const errorMsg = error.response?.data?.msg || error.response?.data?.error || error.message || 'Failed to approve order';
      setMessage({ 
        type: 'error', 
        text: `❌ ${errorMsg}` 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    setStatusUpdateLoading(orderId);
    try {
      const res = await axios.put(
        `http://localhost:5000/api/orders/admin/order-status/${orderId}`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update orders list
      setOrders(
        orders.map((order) =>
          order._id === orderId ? (res.data.order as OrderData) : order
        )
      );

      // Update user orders if selected
      if (selectedUser) {
        setUserOrders(
          userOrders.map((order) =>
            order._id === orderId ? (res.data.order as OrderData) : order
          )
        );
      }
    } catch (err) {
      console.error("Error updating order status:", err);
      alert("Failed to update order status");
    } finally {
      setStatusUpdateLoading(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to delete this order?")) {
      return;
    }

    setDeleteLoading(orderId);
    try {
      const response = await axios.delete(
        `http://localhost:5000/api/orders/admin/delete-order/${orderId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Delete response:", response.data);

      // Remove order from list
      setOrders(orders.filter((order) => order._id !== orderId));
      setUserOrders(userOrders.filter((order) => order._id !== orderId));
      alert("✅ Order deleted successfully");
    } catch (err: any) {
      console.error("Error deleting order:", err.response?.data || err.message);
      alert(`Failed to delete order: ${err.response?.data?.message || err.message}`);
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const user = users.find((u) => u._id === userId);
    if (!window.confirm(`Are you sure you want to delete ${user?.name}? All their orders will also be deleted.`)) {
      return;
    }

    setDeleteLoading(userId);
    try {
      const response = await axios.delete(
        `http://localhost:5000/api/auth/admin/user/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Delete user response:", response.data);

      // Remove user from list
      setUsers(users.filter((u) => u._id !== userId));
      
      // Remove user's orders from list
      setOrders(orders.filter((order) => order.userId?._id !== userId));
      setUserOrders([]);
      setSelectedUser(null);
      
      alert("✅ User and their orders deleted successfully");
    } catch (err: any) {
      console.error("Error deleting user:", err.response?.data || err.message);
      alert(`Failed to delete user: ${err.response?.data?.message || err.message}`);
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleDeleteSubAdmin = async (subAdminId: string) => {
    const subAdmin = subAdmins.find((item) => item._id === subAdminId);
    if (!window.confirm(`Delete ${subAdmin?.name} from the database? This cannot be undone.`)) {
      return;
    }

    setDeleteLoading(subAdminId);
    try {
      await axios.delete(`http://localhost:5000/api/admin/remove-subadmin/${subAdminId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSubAdmins(subAdmins.filter((item) => item._id !== subAdminId));
      setUsers(users.filter((item) => item._id !== subAdminId));
      setMessage({ type: 'success', text: '✅ Sub-admin account deleted successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to delete sub-admin' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleDeleteDeliveryBoy = async (deliveryBoyId: string) => {
    const deliveryBoy = deliveryBoys.find((item) => item._id === deliveryBoyId);
    if (!window.confirm(`Delete ${deliveryBoy?.name} from the database? This cannot be undone.`)) {
      return;
    }

    setDeleteLoading(deliveryBoyId);
    try {
      await axios.delete(`http://localhost:5000/api/admin/remove-deliveryboy/${deliveryBoyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setDeliveryBoys(deliveryBoys.filter((item) => item._id !== deliveryBoyId));
      setUsers(users.filter((item) => item._id !== deliveryBoyId));
      setMessage({ type: 'success', text: '✅ Delivery boy account deleted successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to delete delivery boy' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setDeleteLoading(null);
    }
  };

  // Navigation handlers
  const handleViewCustomer = (customerId: string) => {
    navigate(`/admin/customer/${customerId}`);
  };

  const handleViewOrder = (orderId: string) => {
    navigate(`/admin/order/${orderId}`);
  };

  const handleApproveRoleRequest = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await axios.post(
        `http://localhost:5000/api/role/approve/${requestId}`,
        { approvalNotes: "Approved by Admin" },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessage({ type: 'success', text: '✅ Request approved successfully!' });
      setTimeout(() => setMessage(null), 3000);
      // Refresh pending requests
      const requestsRes = await axios.get("http://localhost:5000/api/role/pending", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPendingRequests(requestsRes.data.requests || []);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to approve request' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRoleRequest = async (requestId: string, reason: string) => {
    setProcessingId(requestId);
    try {
      await axios.post(
        `http://localhost:5000/api/role/reject/${requestId}`,
        { rejectionReason: reason || "Rejected by Admin" },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessage({ type: 'error', text: '❌ Request rejected successfully!' });
      setTimeout(() => setMessage(null), 3000);
      // Refresh pending requests
      const requestsRes = await axios.get("http://localhost:5000/api/role/pending", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPendingRequests(requestsRes.data.requests || []);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to reject request' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalCustomers: users.filter((u) => u.role === "user").length,
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, order) => sum + order.totalPrice, 0),
    pendingOrders: orders.filter((order) => order.status === "Pending").length,
  };

  const statusColors: { [key: string]: string } = {
    Pending: "warning",
    Processing: "info",
    Shipped: "primary",
    Delivered: "success",
    Cancelled: "danger",
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-warning" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger m-5" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-header">
        <div className="w-full px-4">
          <div className="admin-header-content">
            <div>
              <h1 className="admin-title">🔐 Admin Dashboard</h1>
              <p className="admin-subtitle">Manage your store, customers, and orders</p>
            </div>
            <div className="admin-profile">
              <p className="admin-welcome">Welcome back,</p>
              <p className="admin-name">{adminUser?.name}</p>
              <span className="badge bg-warning text-dark">Admin</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="w-full px-4 py-4">
        <div className="row g-3 mb-4">
          <div className="col-md-3 col-sm-6">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <div className="stat-label">Total Customers</div>
                <div className="stat-value">{stats.totalCustomers}</div>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6">
            <div className="stat-card">
              <div className="stat-icon">🛒</div>
              <div className="stat-content">
                <div className="stat-label">Total Orders</div>
                <div className="stat-value">{stats.totalOrders}</div>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6">
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <div className="stat-label">Total Revenue</div>
                <div className="stat-value">₹{stats.totalRevenue.toLocaleString()}</div>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6">
            <div className="stat-card">
              <div className="stat-icon">⏳</div>
              <div className="stat-content">
                <div className="stat-label">Pending Orders</div>
                <div className="stat-value">{stats.pendingOrders}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="w-full px-4">
        <div className="nav-tabs-wrapper">
          <ul className="nav nav-tabs admin-tabs">
            <li className="nav-item">
              <button
                onClick={() => setActiveTab("overview")}
                className={`nav-link ${activeTab === "overview" ? "active" : ""}`}
              >
                <i className="bi bi-speedometer2 me-2"></i> Overview
              </button>
            </li>
            <li className="nav-item">
              <button
                onClick={() => setActiveTab("customers")}
                className={`nav-link ${activeTab === "customers" ? "active" : ""}`}
              >
                <i className="bi bi-people me-2"></i> Customers
              </button>
            </li>
            <li className="nav-item">
              <button
                onClick={() => setActiveTab("orders")}
                className={`nav-link ${activeTab === "orders" ? "active" : ""}`}
              >
                <i className="bi bi-bag-check me-2"></i> Orders
              </button>
            </li>
            <li className="nav-item">
              <button
                onClick={() => setActiveTab("settings")}
                className={`nav-link ${activeTab === "settings" ? "active" : ""}`}
              >
                <i className="bi bi-gear me-2"></i> Settings
                {pendingRequests.length > 0 && (
                  <span className="badge bg-danger ms-2">{pendingRequests.length}</span>
                )}
              </button>
            </li>
          </ul>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="tab-content py-4">
            <div className="row">
              <div className="col-lg-8">
                <div className="card shadow-sm">
                  <div className="card-header bg-primary text-white">
                    <h5 className="m-0">
                      <i className="bi bi-bar-chart me-2"></i>Recent Orders
                    </h5>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Customer</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.slice(0, 10).map((order) => (
                            <tr key={order._id}>
                              <td>{order.userId?.name}</td>
                              <td>
                                <strong>₹{order.totalPrice}</strong>
                              </td>
                              <td>
                                <span
                                  className={`badge bg-${statusColors[order.status] || "secondary"}`}
                                >
                                  {order.status}
                                </span>
                              </td>
                              <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                              <td>
                                {(order.status === "Pending" || order.status === "Pending") && (
                                  <button
                                    className="btn btn-sm btn-success"
                                    onClick={() => openApprovalModal(order)}
                                  >
                                    ✅ Approve
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-4">
                <div className="card shadow-sm">
                  <div className="card-header bg-success text-white">
                    <h5 className="m-0">
                      <i className="bi bi-graph-up me-2"></i>Order Status
                    </h5>
                  </div>
                  <div className="card-body">
                    {["Pending", "Processing", "Shipped", "Delivered", "Cancelled"].map((status) => (
                      <div key={status} className="d-flex justify-content-between mb-2">
                        <span>{status}:</span>
                        <strong>{orders.filter((o) => o.status === status).length}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Customers Tab */}
        {activeTab === "customers" && (
          <div className="tab-content py-4">
            <div className="row">
              <div className="col-lg-4">
                <div className="card shadow-sm">
                  <div className="card-header bg-info text-white">
                    <h5 className="m-0">
                      <i className="bi bi-search me-2"></i>Search Customers
                    </h5>
                  </div>
                  <div className="card-body">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="list-group list-group-flush" style={{ maxHeight: "600px", overflowY: "auto" }}>
                    {filteredUsers.map((user) => (
                      <div
                        key={user._id}
                        className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                          selectedUser === user._id ? "active" : ""
                        }`}
                      >
                        <button
                          onClick={() => handleUserSelect(user._id)}
                          className="btn btn-link text-start flex-grow-1"
                          style={{ textDecoration: "none", color: "inherit" }}
                        >
                          <div className="d-flex justify-content-between align-items-start w-100">
                            <div className="flex-grow-1">
                              <div className="fw-bold">{user.name}</div>
                              <small className="text-muted">{user.email}</small>
                            </div>
                            {user.role === "admin" && (
                              <span className="badge bg-danger ms-2">👑</span>
                            )}
                          </div>
                        </button>
                        <button
                          onClick={() => handleViewCustomer(user._id)}
                          className="btn btn-sm btn-outline-primary ms-2"
                          title="View customer details"
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="col-lg-8">
                {selectedUser ? (
                  <div className="card shadow-sm">
                    <div className="card-header bg-warning">
                      <h5 className="m-0">
                        <i className="bi bi-person-check me-2"></i>Customer Details & Orders
                      </h5>
                    </div>
                    <div className="card-body">
                      {(() => {
                        const customer = users.find((u) => u._id === selectedUser);
                        return customer ? (
                          <>
                            <div className="customer-info mb-4 p-3 bg-light rounded">
                              <div className="row">
                                <div className="col-md-6">
                                  <div className="mb-2">
                                    <strong>Name:</strong> {customer.name}
                                  </div>
                                  <div className="mb-2">
                                    <strong>Email:</strong> {customer.email}
                                  </div>
                                  <div className="mb-2">
                                    <strong>Role:</strong>{" "}
                                    <span className={`badge ${customer.role === "admin" ? "bg-danger" : "bg-primary"}`}>
                                      {customer.role === "admin" ? "👑 Admin" : "👤 User"}
                                    </span>
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="mb-2">
                                    <strong>Phone:</strong> {customer.phone || "N/A"}
                                  </div>
                                  <div className="mb-2">
                                    <strong>Joined:</strong>{" "}
                                    {new Date(customer.createdAt).toLocaleDateString("en-IN", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </div>
                                  <div className="mb-2">
                                    <strong>Status:</strong> <span className="badge bg-success">Active</span>
                                  </div>
                                </div>
                              </div>
                              {customer.address && (
                                <div className="mt-2">
                                  <strong>Address:</strong> {customer.address}
                                </div>
                              )}
                              <div className="mt-3 pt-3 border-top">
                                <button
                                  onClick={() => handleDeleteUser(customer._id)}
                                  disabled={deleteLoading === customer._id}
                                  className="btn btn-danger btn-sm"
                                >
                                  {deleteLoading === customer._id ? (
                                    <>
                                      <span
                                        className="spinner-border spinner-border-sm me-2"
                                        role="status"
                                        aria-hidden="true"
                                      ></span>
                                      Deleting...
                                    </>
                                  ) : (
                                    <>
                                      <i className="bi bi-trash me-2"></i>Delete User & Orders
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            <h6 className="mb-3">
                              <strong>Orders ({userOrders.length})</strong>
                            </h6>
                            {userOrders.length > 0 ? (
                              <div className="table-responsive">
                                <table className="table table-sm table-hover">
                                  <thead className="table-light">
                                    <tr>
                                      <th>Order ID</th>
                                      <th>Amount</th>
                                      <th>Status</th>
                                      <th>Date</th>
                                      <th>Action</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {userOrders.map((order) => (
                                      <tr key={order._id}>
                                        <td>
                                          <small>{order._id.slice(0, 8)}</small>
                                        </td>
                                        <td>₹{order.totalPrice}</td>
                                        <td>
                                          <span
                                            className={`badge bg-${
                                              statusColors[order.status] || "secondary"
                                            }`}
                                          >
                                            {order.status}
                                          </span>
                                        </td>
                                        <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                        <td>
                                          <div className="btn-group btn-group-sm" role="group">
                                            <select
                                              className="form-select form-select-sm"
                                              defaultValue={order.status}
                                              onChange={(e) =>
                                                handleUpdateOrderStatus(order._id, e.target.value)
                                              }
                                              disabled={statusUpdateLoading === order._id}
                                              style={{ maxWidth: "120px" }}
                                            >
                                              <option value="">Update</option>
                                              {["Pending", "Processing", "Shipped", "Delivered", "Cancelled"].map(
                                                (status) => (
                                                  <option key={status} value={status}>
                                                    {status}
                                                  </option>
                                                )
                                              )}
                                            </select>
                                            <button
                                              onClick={() => handleDeleteOrder(order._id)}
                                              disabled={deleteLoading === order._id}
                                              className="btn btn-danger btn-sm"
                                              title="Delete order"
                                            >
                                              {deleteLoading === order._id ? (
                                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                              ) : (
                                                <i className="bi bi-trash"></i>
                                              )}
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="alert alert-info mb-0">No orders found for this customer</div>
                            )}
                          </>
                        ) : null;
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="card shadow-sm">
                    <div className="card-body text-center py-5">
                      <p className="text-muted">Select a customer to view details and orders</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="tab-content py-4">
            {/* Admin Settings Card */}
            <div className="card shadow-sm mb-4">
              <div className="card-header bg-warning text-dark">
                <h5 className="m-0">
                  <i className="bi bi-gear me-2"></i>Admin Settings
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-bold">Admin Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={adminUser?.name || ""}
                        disabled
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-bold">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={adminUser?.email || ""}
                        disabled
                      />
                    </div>
                  </div>
                </div>
                <button className="btn btn-primary">
                  <i className="bi bi-shield-lock me-2"></i>Change Password
                </button>
              </div>
            </div>

            {/* SubAdmins Card */}
            <div className="card shadow-sm mb-4">
              <div className="card-header bg-dark text-white">
                <h5 className="m-0">
                  <i className="bi bi-shield-lock me-2"></i>Sub-Admins ({subAdmins.length})
                </h5>
              </div>
              <div className="card-body" style={{ maxHeight: "320px", overflowY: "auto" }}>
                {subAdmins.length === 0 ? (
                  <div className="alert alert-secondary mb-0">No sub-admin accounts found</div>
                ) : (
                  <div className="list-group">
                    {subAdmins.map((subAdmin) => (
                      <div key={subAdmin._id} className="list-group-item d-flex justify-content-between align-items-center gap-3">
                        <div>
                          <div className="fw-bold">{subAdmin.name}</div>
                          <small className="text-muted">{subAdmin.email}</small>
                          <div><span className="badge bg-primary mt-2">Sub-Admin</span></div>
                        </div>
                        <button
                          onClick={() => handleDeleteSubAdmin(subAdmin._id)}
                          disabled={deleteLoading === subAdmin._id}
                          className="btn btn-outline-danger btn-sm"
                        >
                          {deleteLoading === subAdmin._id ? "Deleting..." : "Delete Account"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Boys Card */}
            <div className="card shadow-sm mb-4">
              <div className="card-header bg-success text-white">
                <h5 className="m-0">
                  <i className="bi bi-truck me-2"></i>Delivery Boys ({deliveryBoys.length})
                </h5>
              </div>
              <div className="card-body" style={{ maxHeight: "320px", overflowY: "auto" }}>
                {deliveryBoys.length === 0 ? (
                  <div className="alert alert-secondary mb-0">No delivery boy accounts found</div>
                ) : (
                  <div className="list-group">
                    {deliveryBoys.map((deliveryBoy) => (
                      <div key={deliveryBoy._id} className="list-group-item d-flex justify-content-between align-items-center gap-3">
                        <div>
                          <div className="fw-bold">{deliveryBoy.name}</div>
                          <small className="text-muted d-block">{deliveryBoy.email}</small>
                          <small className="text-muted">{deliveryBoy.phone || "No phone"}</small>
                          <div><span className="badge bg-success mt-2">Delivery Boy</span></div>
                        </div>
                        <button
                          onClick={() => handleDeleteDeliveryBoy(deliveryBoy._id)}
                          disabled={deleteLoading === deliveryBoy._id}
                          className="btn btn-outline-danger btn-sm"
                        >
                          {deleteLoading === deliveryBoy._id ? "Deleting..." : "Delete Account"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Role Request Approvals Card */}
            <div className="card shadow-sm">
              <div className="card-header bg-info text-white">
                <h5 className="m-0">
                  <i className="bi bi-check-circle me-2"></i>Pending Role Requests for Approval
                  {pendingRequests.length > 0 && (
                    <span className="badge bg-danger ms-2">{pendingRequests.length}</span>
                  )}
                </h5>
              </div>
              <div className="card-body" style={{ maxHeight: "600px", overflowY: "auto" }}>
                {pendingRequests.length === 0 ? (
                  <div className="alert alert-success mb-0" role="alert">
                    <i className="bi bi-check-lg me-2"></i>No pending role requests!
                  </div>
                ) : (
                  <div className="approvals-section">
                    {pendingRequests.map((request: any) => (
                      <div
                        key={request._id}
                        className="card mb-3 shadow-sm"
                        style={{
                          borderLeft: "5px solid #0d6efd",
                          transition: "all 0.3s ease",
                          backgroundColor: expandedRequestId === request._id ? "#f8f9fa" : "white",
                        }}
                      >
                        <div
                          className="card-header bg-gradient d-flex justify-content-between align-items-center"
                          onClick={() =>
                            setExpandedRequestId(
                              expandedRequestId === request._id ? null : request._id
                            )
                          }
                          style={{
                            cursor: "pointer",
                            background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
                            padding: "15px",
                            borderRadius: "4px 4px 0 0",
                          }}
                        >
                          <div className="d-flex align-items-center gap-3">
                            <div
                              style={{
                                width: "45px",
                                height: "45px",
                                borderRadius: "50%",
                                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "white",
                                fontSize: "20px",
                                fontWeight: "bold",
                              }}
                            >
                              {request.userId?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="fw-bold" style={{ fontSize: "16px" }}>
                                {request.userId?.name}
                              </div>
                              <small className="text-muted">{request.userId?.email}</small>
                            </div>
                            <span
                              className="badge"
                              style={{
                                background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                                color: "white",
                                padding: "8px 12px",
                                fontSize: "12px",
                              }}
                            >
                              <i className="bi bi-arrow-up-right me-1"></i>
                              {request.requestedRole.toUpperCase()}
                            </span>
                          </div>
                          <i
                            className={`bi bi-chevron-down ${
                              expandedRequestId === request._id ? "rotate-180" : ""
                            }`}
                            style={{
                              transition: "transform 0.3s",
                              fontSize: "20px",
                              color: "#0d6efd",
                            }}
                          ></i>
                        </div>

                        {expandedRequestId === request._id && (
                          <div className="card-body" style={{ padding: "20px" }}>
                            {/* User Info Section */}
                            <div className="mb-4 p-3 rounded" style={{ backgroundColor: "#f8f9fa" }}>
                              <h6 className="fw-bold mb-3">
                                <i className="bi bi-person-circle me-2" style={{ color: "#0d6efd" }}></i>
                                User Information
                              </h6>
                              <div className="row">
                                <div className="col-md-6">
                                  <div className="mb-3">
                                    <small className="text-muted d-block">Email Address</small>
                                    <strong className="d-block text-dark">{request.userId?.email}</strong>
                                  </div>
                                  <div className="mb-3">
                                    <small className="text-muted d-block">Current Role</small>
                                    <span
                                      className="badge bg-secondary"
                                      style={{ padding: "6px 12px", fontSize: "13px" }}
                                    >
                                      {request.userId?.role}
                                    </span>
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="mb-3">
                                    <small className="text-muted d-block">Phone Number</small>
                                    <strong className="d-block text-dark">
                                      {request.userId?.phone || "Not provided"}
                                    </strong>
                                  </div>
                                  <div className="mb-3">
                                    <small className="text-muted d-block">Requested Role</small>
                                    <span
                                      className="badge"
                                      style={{
                                        background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                                        color: "white",
                                        padding: "6px 12px",
                                        fontSize: "13px",
                                      }}
                                    >
                                      {request.requestedRole}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Profile Data Section */}
                            {request.profileData && Object.keys(request.profileData).length > 0 && (
                              <div className="mb-4 p-3 rounded" style={{ backgroundColor: "#fffbf0" }}>
                                <h6 className="fw-bold mb-3">
                                  <i
                                    className="bi bi-file-earmark-text me-2"
                                    style={{ color: "#ff9800" }}
                                  ></i>
                                  Profile Documents & Data
                                </h6>
                                <div className="row">
                                  {Object.entries(request.profileData).map(([key, value]: any) => (
                                    <div key={key} className="col-md-6 mb-3">
                                      <div className="p-2 bg-white rounded border border-warning">
                                        <small className="text-muted d-block">
                                          {key.replace(/([A-Z])/g, " $1").trim()}
                                        </small>
                                        <strong className="text-dark d-block text-truncate">
                                          {String(value).substring(0, 50)}...
                                        </strong>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="border-top pt-3">
                              <div className="row">
                                <div className="col-md-6">
                                  <button
                                    onClick={() => handleApproveRoleRequest(request._id)}
                                    disabled={processingId === request._id}
                                    className="btn btn-success w-100"
                                    style={{
                                      padding: "12px",
                                      fontSize: "15px",
                                      fontWeight: "600",
                                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                      border: "none",
                                      transition: "all 0.3s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.transform = "translateY(-2px)";
                                      e.currentTarget.style.boxShadow = "0 8px 15px rgba(16, 185, 129, 0.3)";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.transform = "translateY(0)";
                                      e.currentTarget.style.boxShadow = "none";
                                    }}
                                  >
                                    {processingId === request._id ? (
                                      <>
                                        <span
                                          className="spinner-border spinner-border-sm me-2"
                                          role="status"
                                          aria-hidden="true"
                                        ></span>
                                        Processing...
                                      </>
                                    ) : (
                                      <>
                                        <i className="bi bi-check-circle me-2"></i>
                                        Approve Request
                                      </>
                                    )}
                                  </button>
                                </div>
                                <div className="col-md-6">
                                  <button
                                    onClick={() => {
                                      const reason = prompt("Rejection reason (optional):", "");
                                      if (reason !== null) {
                                        handleRejectRoleRequest(request._id, reason);
                                      }
                                    }}
                                    disabled={processingId === request._id}
                                    className="btn btn-danger w-100"
                                    style={{
                                      padding: "12px",
                                      fontSize: "15px",
                                      fontWeight: "600",
                                      background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                                      border: "none",
                                      transition: "all 0.3s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.transform = "translateY(-2px)";
                                      e.currentTarget.style.boxShadow = "0 8px 15px rgba(239, 68, 68, 0.3)";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.transform = "translateY(0)";
                                      e.currentTarget.style.boxShadow = "none";
                                    }}
                                  >
                                    {processingId === request._id ? (
                                      <>
                                        <span
                                          className="spinner-border spinner-border-sm me-2"
                                          role="status"
                                          aria-hidden="true"
                                        ></span>
                                        Processing...
                                      </>
                                    ) : (
                                      <>
                                        <i className="bi bi-x-circle me-2"></i>
                                        Reject Request
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="tab-content py-4">
            <div className="card shadow-sm">
              <div className="card-header bg-success text-white">
                <h5 className="m-0">
                  <i className="bi bi-bag-check me-2"></i>All Orders ({orders.length})
                </h5>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr
                          key={order._id}
                          style={{ cursor: "pointer" }}
                          onClick={() => handleViewOrder(order._id)}
                          className="order-row-clickable"
                        >
                          <td>
                            <small>{order._id.slice(0, 8)}...</small>
                          </td>
                          <td>{order.userId?.name}</td>
                          <td>
                            <strong>₹{order.totalPrice}</strong>
                          </td>
                          <td>
                            <span
                              className={`badge bg-${statusColors[order.status] || "secondary"}`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <div className="btn-group btn-group-sm" role="group">
                              <select
                                className="form-select form-select-sm"
                                defaultValue={order.status}
                                onChange={(e) =>
                                  handleUpdateOrderStatus(order._id, e.target.value)
                                }
                                disabled={statusUpdateLoading === order._id}
                                style={{ maxWidth: "120px" }}
                              >
                                <option value="">Update</option>
                                {["Pending", "Processing", "Shipped", "Delivered", "Cancelled"].map(
                                  (status) => (
                                    <option key={status} value={status}>
                                      {status}
                                    </option>
                                  )
                                )}
                              </select>
                              <button
                                onClick={() => handleDeleteOrder(order._id)}
                                disabled={deleteLoading === order._id}
                                className="btn btn-danger btn-sm"
                                title="Delete order"
                              >
                                {deleteLoading === order._id ? (
                                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                ) : (
                                  <i className="bi bi-trash"></i>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>✅ Approve Order</h2>
            </div>
            <div className="modal-body">
              <p><strong>Order ID:</strong> {selectedOrder._id}</p>
              <p><strong>Customer:</strong> {selectedOrder.userId?.name}</p>
              <p><strong>Amount:</strong> ₹{selectedOrder.totalPrice}</p>
              <p><strong>Status:</strong> {selectedOrder.status}</p>
              <div style={{ marginTop: '16px' }}>
                <label>Approval Notes (Optional):</label>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Enter any approval notes here..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={closeApprovalModal}
                className="btn-cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={submitting}
                className="btn-approve"
              >
                {submitting ? 'Approving...' : 'Approve Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Alert */}
      {message && (
        <div className={`message-alert ${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
