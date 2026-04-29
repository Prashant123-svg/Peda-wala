import React from "react";

const DeliveryBoyDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useUserContext();
  const [profile, setProfile] = useState<DeliveryBoyProfile | null>(null);
  const [assignedOrders, setAssignedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    completedDeliveries: 0,
    pendingDeliveries: 0,
    rating: 4.5
  });

  const subdomain = getCurrentSubdomain();
  const token = localStorage.getItem("token");

  useEffect(() => {
    // Check if user is actually a delivery boy
    if (user?.role !== "deliveryBoy") {
      console.warn("⚠️ Access denied - Not a delivery boy");
      navigate("/");
      return;
    }

    fetchProfile();
    fetchAssignedOrders();
  }, [user, navigate]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/auth/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(response.data);
      console.log("✅ Delivery Boy Profile:", response.data);
    } catch (err: any) {
      console.error("❌ Error fetching profile:", err);
      setError("Failed to fetch profile");
    }
  };

  const fetchAssignedOrders = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/delivery/my-orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Backend returns 'assignments', not 'orders'
      setAssignedOrders(response.data.assignments || []);
      
      // Calculate stats
      const completed = response.data.assignments?.filter((o: any) => o.currentStatus === "delivered").length || 0;
      const pending = response.data.assignments?.filter((o: any) => o.currentStatus !== "delivered").length || 0;
      
      setStats(prev => ({
        ...prev,
        totalDeliveries: response.data.assignments?.length || 0,
        completedDeliveries: completed,
        pendingDeliveries: pending
      }));
      
      console.log("✅ Assigned orders:", response.data);
    } catch (err: any) {
      console.error("❌ Error fetching orders:", err);
      setError("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = "http://localhost:5173";
  };

  if (loading) {
    return (
      <div className="delivery-boy-dashboard loading">
        <div className="spinner"></div>
        <p>Loading Delivery Boy Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="delivery-boy-dashboard">
      {/* Header */}
      <div className="db-header">
        <div className="db-header-content">
          <div className="db-branding">
            <h1>🚚 Delivery Boy Dashboard</h1>
            <p className="subdomain-info">Subdomain: <strong>{subdomain}</strong></p>
          </div>
          <div className="db-user-info">
            <button 
              className="user-profile-btn"
              onClick={() => navigate('/profile')}
              title="View Profile"
            >
              <span className="user-name">{profile?.name || user?.name}</span>
              <span className="user-email">{profile?.email || user?.email}</span>
            </button>
            <button className="btn-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-error">
          <span>❌ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Stats Section */}
      <div className="db-stats">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <p className="stat-label">Total Deliveries</p>
            <p className="stat-value">{stats.totalDeliveries}</p>
          </div>
        </div>

        <div className="stat-card completed">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <p className="stat-label">Completed</p>
            <p className="stat-value">{stats.completedDeliveries}</p>
          </div>
        </div>

        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <p className="stat-label">Pending</p>
            <p className="stat-value">{stats.pendingDeliveries}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <p className="stat-label">Rating</p>
            <p className="stat-value">{stats.rating}</p>
          </div>
        </div>
      </div>

      {/* Orders Section */}
      <div className="db-orders">
        <h2>📋 My Assigned Orders</h2>
        
        {assignedOrders.length === 0 ? (
          <div className="empty-state">
            <p>No orders assigned yet</p>
            <small>Check back later for delivery assignments</small>
          </div>
        ) : (
          <div className="orders-list">
            {assignedOrders.map((order) => (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <div className="order-id">Order #{order.orderNumber}</div>
                  <div className={`order-status status-${order.currentStatus}`}>{order.currentStatus}</div>
                </div>

                <div className="order-details">
                  <p>
                    <strong>Amount:</strong> ₹{order.totalAmount}
                  </p>
                  <p>
                    <strong>Delivery Address:</strong> {order.customerAddress}
                  </p>
                  <p>
                    <strong>Customer:</strong> {order.customerName}
                  </p>
                  <p>
                    <strong>Phone:</strong> <a href={`tel:${order.customerPhone}`}>{order.customerPhone}</a>
                  </p>
                </div>

                <button className="btn-view-details">View Details →</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .delivery-boy-dashboard {
          min-height: 100vh;
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          color: #e5e7eb;
          padding: 20px;
          max-width: 100% !important;
          width: 100%;
          margin: 0 auto;
          box-sizing: border-box;
        }

        .delivery-boy-dashboard.loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
        }

        .db-header {
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          backdrop-filter: blur(10px);
          max-width: 100%;
          box-sizing: border-box;
        }

        .db-header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
        }

        .db-branding h1 {
          margin: 0;
          font-size: 1.8rem;
          font-weight: 700;
          background: linear-gradient(135deg, #3b82f6, #10b981);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .subdomain-info {
          margin: 8px 0 0 0;
          color: #94a3b8;
          font-size: 0.9rem;
        }

        .db-user-info {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .user-profile {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }

        .user-name {
          font-weight: 600;
          color: #f1f5f9;
        }

        .user-email {
          font-size: 0.85rem;
          color: #94a3b8;
        }

        .user-profile-btn {
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.3);
          color: inherit;
          padding: 10px 15px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          transition: all 0.2s;
        }

        .user-profile-btn:hover {
          background: rgba(59, 130, 246, 0.2);
          border-color: rgba(59, 130, 246, 0.6);
          transform: translateY(-2px);
        }

        .user-profile-btn .user-name {
          font-size: 0.95rem;
          font-weight: 600;
          color: #f1f5f9;
        }

        .user-profile-btn .user-email {
          font-size: 0.85rem;
          color: #94a3b8;
        }

        .btn-logout {
          background: #ef4444;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-logout:hover {
          background: #dc2626;
          transform: translateY(-2px);
        }

        .db-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
          max-width: 100%;
        }

        .stat-card {
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 8px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.3s;
        }

        .stat-card:hover {
          border-color: rgba(59, 130, 246, 0.5);
          background: rgba(30, 41, 59, 1);
        }

        .stat-card.completed {
          border-color: rgba(16, 185, 129, 0.3);
        }

        .stat-card.pending {
          border-color: rgba(251, 191, 36, 0.3);
        }

        .stat-icon {
          font-size: 1.8rem;
        }

        .stat-content {
          flex: 1;
        }

        .stat-label {
          margin: 0;
          color: #94a3b8;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-value {
          margin: 4px 0 0 0;
          font-size: 1.5rem;
          font-weight: 700;
          color: #f1f5f9;
        }

        .alert {
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .alert-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
        }

        .db-orders {
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          max-width: 100%;
          box-sizing: border-box;
        }

        .db-orders h2 {
          margin: 0 0 16px 0;
          font-size: 1.2rem;
          color: #f1f5f9;
        }

        .orders-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .order-card {
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 6px;
          padding: 12px;
          transition: all 0.2s;
        }

        .order-card:hover {
          border-color: rgba(59, 130, 246, 0.5);
        }

        .order-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .order-id {
          font-weight: 600;
          color: #3b82f6;
        }

        .order-status {
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .status-delivered {
          background: rgba(16, 185, 129, 0.2);
          color: #6ee7b7;
        }

        .status-pending {
          background: rgba(251, 191, 36, 0.2);
          color: #fcd34d;
        }

        .order-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 8px;
          max-width: 100%;
        }

        .order-details p {
          margin: 0;
          font-size: 0.9rem;
          color: #d1d5db;
        }

        .btn-view-details {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-view-details:hover {
          background: #2563eb;
        }

        .badge {
          display: inline-block;
          background: rgba(59, 130, 246, 0.2);
          color: #93c5fd;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 600;
          font-size: 0.85rem;
        }

        .badge.subdomain {
          background: rgba(168, 85, 247, 0.2);
          color: #d8b4fe;
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #94a3b8;
        }

        .empty-state p {
          margin: 0 0 8px 0;
          font-size: 1.1rem;
          color: #d1d5db;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(59, 130, 246, 0.2);
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 640px) {
          .delivery-boy-dashboard {
            padding: 12px;
          }

          .db-header {
            padding: 16px;
          }

          .db-header-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }

          .db-user-info {
            width: 100%;
            justify-content: space-between;
            gap: 12px;
          }

          .db-stats {
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }

          .stat-card {
            padding: 12px;
          }

          .db-orders {
            padding: 16px;
          }

          .order-card {
            padding: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default DeliveryBoyDashboard;
