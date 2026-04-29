import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Order {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  items: Array<{
    productId: string;
    name: string;
    price: number;
    qty: number;
    image: string;
  }>;
  totalPrice: number;
  orderStatus: string;
  deliveryAddress: string;
  phoneNumber: string;
  paymentMethod: string;
  deliveryNotes?: string;
  createdAt: string;
  assignedAt?: string;
  deliveredAt?: string;
}

export function DeliveryBoyDashboard() {
  const navigate = useNavigate();
  const [assignedOrders, setAssignedOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'assigned' | 'completed'>('assigned');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Modal States
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [nextStatus, setNextStatus] = useState<'Out for Delivery' | 'Delivered'>('Out for Delivery');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

        // Only allow delivery boy to access this page
        if (response.data.role !== 'deliveryBoy') {
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

  // Fetch orders
  useEffect(() => {
    if (!authorized) return;

    const fetchOrders = async () => {
      try {
        console.log("🚚 Fetching delivery boy orders...");
        console.log("   Token present:", !!token);

        // Fetch assigned orders
        const assignedResponse = await axios.get(
          'http://localhost:5000/api/order-management/delivery-boy/assigned',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log("✅ Assigned orders response:", assignedResponse.data);
        setAssignedOrders(assignedResponse.data.orders || []);

        // Fetch completed orders
        const completedResponse = await axios.get(
          'http://localhost:5000/api/order-management/delivery-boy/completed',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log("✅ Completed orders response:", completedResponse.data);
        setCompletedOrders(completedResponse.data.completedOrders || []);

        setMessage(null); // Clear any previous error
      } catch (error: any) {
        console.error("❌ Error fetching orders:", error);
        
        const errorMsg = error.response?.data?.msg || 
                        error.response?.data?.error || 
                        error.message || 
                        'Failed to load orders';
        
        const statusCode = error.response?.status;
        const fullMessage = `${errorMsg}${statusCode ? ` (${statusCode})` : ''}`;
        
        console.error("Error message:", fullMessage);
        setMessage({ type: 'error', text: fullMessage });
      } finally {
        setLoading(false);
      }
    };

    if (authorized && token) {
      fetchOrders();
    }
  }, [authorized, token]);

  // Handle status update
  const handleStatusUpdate = async () => {
    if (!selectedOrder) return;

    setSubmitting(true);
    try {
      await axios.put(
        `http://localhost:5000/api/order-management/delivery-boy/update-status/${selectedOrder._id}`,
        {
          orderStatus: nextStatus,
          deliveryNotes,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage({ 
        type: 'success', 
        text: `Order status updated to ${nextStatus}!` 
      });
      setShowStatusModal(false);
      setDeliveryNotes('');

      // Refresh orders
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.msg || 'Failed to update order status',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Open status update modal
  const openStatusModal = (order: Order, status: 'Out for Delivery' | 'Delivered') => {
    setSelectedOrder(order);
    setNextStatus(status);
    setShowStatusModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowStatusModal(false);
    setSelectedOrder(null);
    setDeliveryNotes('');
  };

  // Get next valid status
  const getNextStatus = (currentStatus: string): ('Out for Delivery' | 'Delivered') | null => {
    if (currentStatus === 'Assigned') return 'Out for Delivery';
    if (currentStatus === 'Out for Delivery') return 'Delivered';
    return null;
  };

  const displayOrders = selectedTab === 'assigned' ? assignedOrders : completedOrders;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-yellow-400 rounded-full animate-spin"></div>
          <p className="text-gray-600 text-lg">Loading your orders...</p>
        </div>
      </div>
    );
  }

  // Show access denied if user is not delivery boy
  if (!authorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className="bg-white p-10 rounded-xl text-center shadow-lg">
            <h1 className="text-4xl mb-4">🚫 Access Denied</h1>
            <p className="text-lg text-gray-600 mb-5">
              You do not have permission to access this page.
            </p>
            <p className="text-base text-gray-600 mb-5">
              Only Delivery Boys can view this dashboard.
            </p>
            <p className="text-sm text-gray-400 mb-8">
              Your role: <strong className="capitalize">{userRole}</strong>
            </p>
            <button
              onClick={() => navigate('/orders')}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer text-base font-bold transition-colors"
            >
              Go to My Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalDelivered = completedOrders.length;
  const totalAssigned = assignedOrders.length;
  const todayOrders = assignedOrders.filter(
    (order) => {
      const createdDate = new Date(order.createdAt).toDateString();
      const today = new Date().toDateString();
      return createdDate === today;
    }
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 font-sans">
      <div className="mb-12 bg-white p-8 rounded-xl shadow-lg">
        <h1 className="m-0 mb-8 text-gray-800 text-4xl font-bold">🚚 Delivery Boy Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-6 rounded-lg text-white text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
            <h3 className="m-0 text-4xl font-bold">{totalAssigned}</h3>
            <p className="m-2 opacity-90 text-sm">Active Orders</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-6 rounded-lg text-white text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
            <h3 className="m-0 text-4xl font-bold">{todayOrders}</h3>
            <p className="m-2 opacity-90 text-sm">Today's Orders</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-6 rounded-lg text-white text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
            <h3 className="m-0 text-4xl font-bold">{totalDelivered}</h3>
            <p className="m-2 opacity-90 text-sm">Total Delivered</p>
          </div>
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`mb-8 p-4 rounded-lg flex items-center animate-in slide-in-from-top-2 duration-300 ${
          message.type === 'success' 
            ? 'bg-green-100 border border-green-300 text-green-800' 
            : 'bg-red-100 border border-red-300 text-red-800'
        }`}>
          <div className="flex justify-between items-center w-full gap-4">
            <span>{message.text}</span>
            <button
              className="bg-none border-none text-xl cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
              onClick={() => setMessage(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-8 bg-white p-4 rounded-lg shadow-md flex-wrap">
        <button
          className={`flex-1 min-w-[200px] px-6 py-4 rounded-lg font-semibold text-base cursor-pointer transition-all duration-300 border-2 ${
            selectedTab === 'assigned' 
              ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white border-yellow-400 shadow-lg' 
              : 'bg-white text-gray-600 border-gray-300 hover:border-yellow-400 hover:bg-amber-50'
          }`}
          onClick={() => setSelectedTab('assigned')}
        >
          📍 Assigned Orders ({assignedOrders.length})
        </button>
        <button
          className={`flex-1 min-w-[200px] px-6 py-4 rounded-lg font-semibold text-base cursor-pointer transition-all duration-300 border-2 ${
            selectedTab === 'completed' 
              ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white border-yellow-400 shadow-lg' 
              : 'bg-white text-gray-600 border-gray-300 hover:border-yellow-400 hover:bg-amber-50'
          }`}
          onClick={() => setSelectedTab('completed')}
        >
          ✅ Completed ({completedOrders.length})
        </button>
      </div>

      {/* Orders List */}
      <div className="mt-8">
        {displayOrders.length === 0 ? (
          <div className="bg-white p-12 rounded-lg text-center text-gray-400 text-lg shadow-md">
            <p>📭 No {selectedTab} orders at the moment</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {displayOrders.map((order) => (
              <div key={order._id} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                <div
                  className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 cursor-pointer flex justify-between items-center hover:from-gray-100 hover:to-gray-200 transition-all duration-300"
                  onClick={() =>
                    setExpandedOrderId(
                      expandedOrderId === order._id ? null : order._id
                    )
                  }
                >
                  <div className="flex items-center gap-4 flex-1">
                    <h3 className="m-0 text-gray-800 text-lg">Order #{order._id.slice(-8)}</h3>
                    <span className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide ${
                      order.orderStatus === 'Assigned' ? 'bg-blue-100 text-blue-800' :
                      order.orderStatus === 'Out for Delivery' ? 'bg-purple-100 text-purple-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {order.orderStatus}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <p className="m-0 text-2xl font-bold text-yellow-500">₹{order.totalPrice.toFixed(2)}</p>
                    <span className="text-gray-500 text-xl transition-transform duration-300">
                      {expandedOrderId === order._id ? '▲' : '▼'}
                    </span>
                  </div>
                </div>

                {expandedOrderId === order._id && (
                  <div className="p-8 bg-gray-50 animate-in fade-in duration-300">
                    <div className="mb-8 pb-8 border-b border-gray-300">
                      <h4 className="m-0 mb-4 text-gray-800 text-base font-bold uppercase tracking-wider">Customer Information</h4>
                      <div className="flex justify-between items-center py-3 gap-4">
                        <span className="font-semibold text-gray-600 min-w-[120px]">Name:</span>
                        <span className="text-gray-800 flex-1 text-right">{order.userId?.name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 gap-4">
                        <span className="font-semibold text-gray-600 min-w-[120px]">Phone:</span>
                        <span className="text-gray-800 flex-1 text-right">{order.userId?.phone || order.phoneNumber}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 gap-4">
                        <span className="font-semibold text-gray-600 min-w-[120px]">Email:</span>
                        <span className="text-gray-800 flex-1 text-right">{order.userId?.email || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="mb-8 pb-8 border-b border-gray-300">
                      <h4 className="m-0 mb-4 text-gray-800 text-base font-bold uppercase tracking-wider">📍 Delivery Address</h4>
                      <p className="m-0 text-gray-800 leading-relaxed p-4 bg-white rounded-lg border-l-4 border-yellow-400">
                        {order.deliveryAddress}
                      </p>
                    </div>

                    <div className="mb-8 pb-8 border-b border-gray-300">
                      <h4 className="m-0 mb-4 text-gray-800 text-base font-bold uppercase tracking-wider">Order Items ({order.items?.length || 0})</h4>
                      <div className="bg-white rounded-lg overflow-hidden">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className={`flex justify-between items-center p-4 ${idx < order.items.length - 1 ? 'border-b border-gray-200' : ''}`}>
                            <span className="flex-1 text-gray-800 font-medium">{item.name}</span>
                            <span className="text-gray-600 mr-4">x{item.qty}</span>
                            <span className="text-yellow-500 font-bold">₹{item.price}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center p-4 bg-white border-t-2 border-dashed border-gray-300 font-bold text-gray-800">
                        <span>Total Amount:</span>
                        <span className="text-lg text-yellow-500">₹{order.totalPrice.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="mb-8 pb-8 border-b border-gray-300">
                      <h4 className="m-0 mb-4 text-gray-800 text-base font-bold uppercase tracking-wider">Order Timeline</h4>
                      <div className="bg-white rounded-lg p-4 border-l-4 border-yellow-400">
                        <div className="flex justify-between items-center py-3 border-b border-gray-200">
                          <span className="font-bold text-gray-600">Created:</span>
                          <span className="text-gray-800 text-sm">
                            {new Date(order.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {order.assignedAt && (
                          <div className="flex justify-between items-center py-3 border-b border-gray-200">
                            <span className="font-bold text-gray-600">Assigned:</span>
                            <span className="text-gray-800 text-sm">
                              {new Date(order.assignedAt).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {order.deliveredAt && (
                          <div className="flex justify-between items-center py-3">
                            <span className="font-bold text-gray-600">Delivered:</span>
                            <span className="text-gray-800 text-sm">
                              {new Date(order.deliveredAt).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {order.deliveryNotes && (
                      <div className="mb-8 pb-8 border-b border-gray-300">
                        <h4 className="m-0 mb-4 text-gray-800 text-base font-bold uppercase tracking-wider">Delivery Notes</h4>
                        <p className="m-0 text-gray-800 leading-relaxed p-4 bg-white rounded-lg border-l-4 border-yellow-400">
                          {order.deliveryNotes}
                        </p>
                      </div>
                    )}

                    {selectedTab === 'assigned' && getNextStatus(order.orderStatus) && (
                      <div className="flex gap-4 mt-8">
                        <button
                          className="flex-1 py-3 px-6 bg-gradient-to-br from-yellow-400 to-orange-500 text-white rounded-lg font-bold uppercase tracking-wider cursor-pointer transition-all duration-300 hover:-translate-y-0.5 shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                          onClick={() => openStatusModal(order, getNextStatus(order.orderStatus)!)}
                        >
                          {getNextStatus(order.orderStatus) === 'Out for Delivery'
                            ? '📤 Start Delivery'
                            : '✅ Mark Delivered'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      {showStatusModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-300" onClick={closeModal}>
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-11/12 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-gray-300 bg-gradient-to-br from-yellow-400 to-orange-500 text-white">
              <h2 className="m-0 text-xl font-semibold">
                {nextStatus === 'Out for Delivery'
                  ? '📤 Start Delivery'
                  : '✅ Mark as Delivered'}
              </h2>
              <button className="bg-none border-none text-2xl cursor-pointer text-white opacity-80 hover:opacity-100 transition-opacity" onClick={closeModal}>×</button>
            </div>
            <div className="p-8">
              <div className="mb-6 pb-6 border-b border-gray-300">
                <p className="m-0 mb-2 text-gray-600 text-sm font-medium">Order #{selectedOrder._id.slice(-8)}</p>
                <p className="m-0 text-gray-800">
                  Delivering to: <strong>{selectedOrder.userId?.name || 'Customer'}</strong>
                </p>
              </div>

              <div className="mb-6">
                <label className="block mb-2 text-gray-800 font-bold text-sm">Delivery Notes</label>
                <textarea
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder={
                    nextStatus === 'Out for Delivery'
                      ? 'e.g., Picked up from warehouse, on the way...'
                      : 'e.g., Delivered successfully at 3:45 PM...'
                  }
                  rows={5}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg text-base font-sans transition-colors duration-300 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 resize-vertical"
                />
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg border-l-4 border-yellow-400">
                <h4 className="m-0 mb-2 text-gray-800 text-sm font-bold">📍 Delivery Address:</h4>
                <p className="m-0 text-gray-800 leading-relaxed">{selectedOrder.deliveryAddress}</p>
              </div>
            </div>
            <div className="flex gap-4 p-6 border-t border-gray-300 bg-gray-50">
              <button
                className="flex-1 py-3 px-6 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-bold uppercase tracking-wider cursor-pointer transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={closeModal}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className="flex-1 py-3 px-6 bg-gradient-to-br from-yellow-400 to-orange-500 hover:shadow-lg text-white rounded-lg font-bold uppercase tracking-wider cursor-pointer transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
                onClick={handleStatusUpdate}
                disabled={submitting}
              >
                {submitting
                  ? 'Updating...'
                  : nextStatus === 'Out for Delivery'
                  ? 'Start Delivery'
                  : 'Mark Delivered'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeliveryBoyDashboard;
