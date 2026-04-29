import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Order {
  _id: string;
  userId: {
    _id: string;
    name: string;
  };
  totalPrice: number;
  orderStatus: string;
  deliveryAddress: string;
  subAdminId?: string | { _id: string; name: string; email: string };
  deliveryBoyId?: string | { _id: string; name: string; phone: string };
  createdAt: string;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);

  // Filter States
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Delete States
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // Get token from localStorage
  const token = localStorage.getItem('token') || '';

  // Check user role authorization
  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get('http://localhost:5000/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUserRole(response.data.role);

        // Only allow admin to access this page
        if (response.data.role !== 'admin') {
          setAuthorized(false);
          setLoading(false);
          return;
        }

        setAuthorized(true);
      } catch (error) {
        console.error('Error checking authorization:', error);
        setLoading(false);
      }
    };

    checkAuthorization();
  }, [token, navigate]);

  // Fetch orders (only if authorized)
  useEffect(() => {
    if (!authorized) return;

    const fetchOrders = async () => {
      try {
        // Build query string
        const params = new URLSearchParams();
        if (filterStatus) params.append('status', filterStatus);

        const response = await axios.get(
          `http://localhost:5000/api/order-management/admin/all?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setOrders(response.data.orders || []);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setMessage({ type: 'error', text: 'Failed to load orders' });
      } finally {
        setLoading(false);
      }
    };

    if (authorized && token) {
      fetchOrders();
    }
  }, [authorized, token, filterStatus]);

  // Delete Order Handler
  const handleDeleteOrder = async (orderId: string) => {
    setDeleteLoading(orderId);
    try {
      await axios.delete(
        `http://localhost:5000/api/order-management/admin/delete/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      // Remove order from the list
      setOrders(orders.filter(o => o._id !== orderId));
      setMessage({ type: 'success', text: '✅ Order deleted successfully!' });
      setShowDeleteConfirm(null);
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error deleting order:', error);
      const errorMsg = error.response?.data?.msg || error.response?.data?.error || 'Failed to delete order';
      setMessage({ type: 'error', text: `❌ ${errorMsg}` });
    } finally {
      setDeleteLoading(null);
    }
  };

  // Calculate Statistics
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.orderStatus === 'Pending').length,
    confirmed: orders.filter((o) => o.orderStatus === 'Confirmed').length,
    assigned: orders.filter((o) => o.orderStatus === 'Assigned').length,
    outForDelivery: orders.filter((o) => o.orderStatus === 'Out for Delivery').length,
    delivered: orders.filter((o) => o.orderStatus === 'Delivered').length,
    rejected: orders.filter((o) => o.orderStatus === 'Rejected').length,
    totalRevenue: orders.reduce((sum, order) => sum + order.totalPrice, 0),
  };

  const getStatusPercentage = (count: number) => {
    return stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : '0';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="animate-spin text-5xl mb-4">⏳</div>
          <p className="text-lg text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  // Show access denied if user is not admin
  if (!authorized) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <div className="text-center">
              <div className="text-6xl mb-4">🚫</div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
              <p className="text-gray-600 mb-6">
                You do not have permission to access this page. Only administrators can view the Order Analytics Dashboard.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Your role: <span className="font-semibold capitalize">{userRole}</span>
              </p>
              <button
                onClick={() => navigate('/orders')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition-colors"
              >
                Go to My Orders
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-gray-800">📊 Admin Order Dashboard</h1>
          <p className="text-gray-600 mt-2">Complete admin-only order management and analytics</p>
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`m-4 p-4 rounded border flex justify-between items-start ${
          message.type === 'success' ? 'bg-green-100 border-green-400 text-green-800' :
          message.type === 'error' ? 'bg-red-100 border-red-400 text-red-800' :
          'bg-blue-100 border-blue-400 text-blue-800'
        }`}>
          <span>{message.text}</span>
          <button
            className="text-lg hover:opacity-70 transition-opacity"
            onClick={() => setMessage(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-semibold mb-1">📦 Total Orders</h3>
            <div className="stat-value">{stats.total}</div>
            <p className="stat-description">All orders in system</p>
          </div>

          <div className="stat-card pending">
          <div className="stat-header">
            <h3>⏳ Pending</h3>
            <span className="stat-icon">⏳</span>
          </div>
          <div className="stat-value">{stats.pending}</div>
          <p className="stat-description">{getStatusPercentage(stats.pending)}% of total</p>
        </div>

        <div className="stat-card confirmed">
          <div className="stat-header">
            <h3>✓ Confirmed</h3>
            <span className="stat-icon">✓</span>
          </div>
          <div className="stat-value">{stats.confirmed}</div>
          <p className="stat-description">{getStatusPercentage(stats.confirmed)}% of total</p>
        </div>

        <div className="stat-card assigned">
          <div className="stat-header">
            <h3>🚚 Assigned</h3>
            <span className="stat-icon">🚚</span>
          </div>
          <div className="stat-value">{stats.assigned}</div>
          <p className="stat-description">{getStatusPercentage(stats.assigned)}% of total</p>
        </div>

        <div className="stat-card in-transit">
          <div className="stat-header">
            <h3>📤 Out for Delivery</h3>
            <span className="stat-icon">📤</span>
          </div>
          <div className="stat-value">{stats.outForDelivery}</div>
          <p className="stat-description">{getStatusPercentage(stats.outForDelivery)}% of total</p>
        </div>

        <div className="stat-card delivered">
          <div className="stat-header">
            <h3>✅ Delivered</h3>
            <span className="stat-icon">✅</span>
          </div>
          <div className="stat-value">{stats.delivered}</div>
          <p className="stat-description">{getStatusPercentage(stats.delivered)}% of total</p>
        </div>

        <div className="stat-card rejected">
          <div className="stat-header">
            <h3>❌ Rejected</h3>
            <span className="stat-icon">❌</span>
          </div>
          <div className="stat-value">{stats.rejected}</div>
          <p className="stat-description">{getStatusPercentage(stats.rejected)}% of total</p>
        </div>

          <div className="stat-card revenue">
            <div className="stat-header">
              <h3>💰 Total Revenue</h3>
              <span className="stat-icon">💰</span>
            </div>
            <div className="stat-value">₹{(stats.totalRevenue / 1000).toFixed(1)}K</div>
            <p className="stat-description">From {stats.total} orders</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <h3>🔍 Filter Orders</h3>
        <div className="filters-grid">
          <div className="filter-group">
            <label>Order Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              aria-label="Order status filter"
              className="filter-select"
            >
              <option value="">-- All Statuses --</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Assigned">Assigned</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="flex justify-end">
            <button
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded transition-colors"
              onClick={() => {
                setFilterStatus('');
              }}
            >
              ✗ Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="mt-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">📋 Orders List</h3>
        {orders.length === 0 ? (
          <div className="bg-blue-50 border border-blue-200 rounded p-8 text-center">
            <p className="text-blue-700 text-lg">📭 No orders matching the selected filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order._id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div
                  className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() =>
                    setExpandedOrderId(
                      expandedOrderId === order._id ? null : order._id
                    )
                  }
                >
                  <div className="flex items-center gap-4">
                    <h4 className="font-bold text-gray-800">Order #{order._id.slice(-8)}</h4>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      order.orderStatus === 'Delivered'
                        ? 'bg-green-100 text-green-800'
                        : order.orderStatus === 'Pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : order.orderStatus === 'Cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {order.orderStatus}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-gray-900">₹{order.totalPrice.toFixed(2)}</span>
                    <span className="text-lg text-gray-600">
                      {expandedOrderId === order._id ? '▲' : '▼'}
                    </span>
                  </div>
                </div>

                {expandedOrderId === order._id && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-600 uppercase">Customer:</span>
                        <span className="text-gray-800">{order.userId?.name || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-600 uppercase">Delivery Address:</span>
                        <span className="text-gray-800 whitespace-pre-wrap">{order.deliveryAddress}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-600 uppercase">Sub-Admin ID:</span>
                        <span className="text-gray-800 font-mono text-sm break-all">
                          {order.subAdminId 
                            ? (typeof order.subAdminId === 'object' ? order.subAdminId._id : order.subAdminId)
                            : 'Not assigned'}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-600 uppercase">Delivery Boy ID:</span>
                        <span className="text-gray-800 font-mono text-sm break-all">
                          {order.deliveryBoyId 
                            ? (typeof order.deliveryBoyId === 'object' ? order.deliveryBoyId._id : order.deliveryBoyId)
                            : 'Not assigned'}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-600 uppercase">Created:</span>
                        <span className="text-gray-800">{new Date(order.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-600 uppercase">Total Amount:</span>
                        <span className="text-lg font-bold text-gray-900">₹{order.totalPrice.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 pt-4 border-t border-gray-300 flex gap-2">
                      <button
                        onClick={() => setShowDeleteConfirm(order._id)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded transition-colors"
                      >
                        🗑️ Delete Order
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Order?</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this order? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white font-semibold rounded transition-colors"
                disabled={deleteLoading === showDeleteConfirm}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteOrder(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded transition-colors disabled:opacity-50"
                disabled={deleteLoading === showDeleteConfirm}
              >
                {deleteLoading === showDeleteConfirm ? '⏳ Deleting...' : '🗑️ Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Footer */}
      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded">
        <p className="text-gray-700">
          Showing <strong>{orders.length}</strong> orders
          {filterStatus && ` with status "${filterStatus}"`}
        </p>
      </div>
    </div>
  );
}

export default AdminDashboard;
