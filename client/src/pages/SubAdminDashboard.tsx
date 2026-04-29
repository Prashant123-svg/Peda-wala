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
  createdAt: string;
}

interface DeliveryBoy {
  _id: string;
  name: string;
  email: string;
  phone: string;
  vehicle?: string;
}

export function SubAdminDashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [deliveryBoys, setDeliveryBoys] = useState<DeliveryBoy[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'pending' | 'active'>('pending');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Modal States
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [subAdminName, setSubAdminName] = useState<string>('Sub-Admin');
  const [totalApproved, setTotalApproved] = useState(0);
  const [totalRejected, setTotalRejected] = useState(0);

  // Get token from localStorage
  const token = localStorage.getItem('token') || '';
  const userName = localStorage.getItem('userName') || 'Sub-Admin';

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

        // Only allow sub-admin to access this page
        if (response.data.role !== 'subAdmin') {
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

  // Fetch pending orders
  useEffect(() => {
    if (!authorized) return;

    const fetchPendingOrders = async () => {
      try {
        console.log("📌 Fetching pending orders... Token:", token ? "✅" : "❌");
        const response = await axios.get(
          'http://localhost:5000/api/order-management/sub-admin/pending',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log("✅ Pending orders received:", response.data.orders?.length || 0);
        setOrders(response.data.orders || []);
      } catch (error: any) {
        console.error('❌ Error fetching pending orders:', error.response?.data || error.message);
        setMessage({ type: 'error', text: 'Failed to load pending orders' });
      }
    };

    // Fetch active orders
    const fetchActiveOrders = async () => {
      try {
        console.log("🚚 Fetching active orders...");
        const response = await axios.get(
          'http://localhost:5000/api/order-management/sub-admin/active',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log("✅ Active orders received:", response.data.orders?.length || 0);
        setActiveOrders(response.data.orders || []);
      } catch (error: any) {
        console.error('❌ Error fetching active orders:', error.response?.data || error.message);
      }
    };

    // Fetch delivery boys
    const fetchDeliveryBoys = async () => {
      try {
        console.log("👥 Fetching delivery boys...");
        const response = await axios.get(
          'http://localhost:5000/api/order-management/delivery-boys',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log("✅ Delivery boys received:", response.data.deliveryBoys?.length || 0);
        console.log("   Response:", response.data);
        setDeliveryBoys(response.data.deliveryBoys || []);
      } catch (error: any) {
        console.error('❌ Error fetching delivery boys:');
        console.error('   Status:', error.response?.status);
        console.error('   Message:', error.response?.data?.msg || error.message);
        console.error('   Error Details:', error.response?.data?.error);
        console.error('   Full Response:', error.response?.data);
        
        // Set empty array on error so UI shows "No delivery boys available"
        setDeliveryBoys([]);
      } finally {
        setLoading(false);
      }
    };

    if (authorized && token) {
      Promise.all([fetchPendingOrders(), fetchActiveOrders(), fetchDeliveryBoys()]);
    }
  }, [authorized, token]);

  // Handle Approve
  const handleApprove = async () => {
    if (!selectedOrder) return;

    setSubmitting(true);
    try {
      console.log("🔄 Approving order:", selectedOrder._id);
      console.log("   Selected Order Details:", {
        id: selectedOrder._id,
        orderStatus: (selectedOrder as any).orderStatus,
        status: (selectedOrder as any).status,
        userId: (selectedOrder as any).userId,
      });

      const response = await axios.put(
        `http://localhost:5000/api/order-management/sub-admin/approve/${selectedOrder._id}`,
        { approvalNotes },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("✅ Approval response:", response.data);
      console.log("   New Status:", response.data.order?.orderStatus);
      console.log("   Sub-Admin ID:", response.data.order?.subAdminId);
      console.log("   Legacy Status:", response.data.order?.status);

      setMessage({ type: 'success', text: '✅ Order approved successfully! Refreshing...' });
      setShowApprovalModal(false);
      setApprovalNotes('');
      setSelectedOrder(null);

      // Refresh orders after 1 second
      console.log("⏳ Refreshing orders in 1 second...");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error("❌ Approval error:", error.response?.data || error.message);
      console.error("   Full error:", error);
      console.error("   Status Code:", error.response?.status);
      
      const errorMsg = error.response?.data?.msg || error.response?.data?.error || error.message || 'Failed to approve order';
      setMessage({ 
        type: 'error', 
        text: `❌ ${errorMsg}` 
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Reject
  const handleReject = async () => {
    if (!selectedOrder) return;

    setSubmitting(true);
    try {
      await axios.put(
        `http://localhost:5000/api/order-management/sub-admin/reject/${selectedOrder._id}`,
        { rejectionReason },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage({ type: 'success', text: 'Order rejected successfully!' });
      setShowRejectionModal(false);
      setRejectionReason('');

      // Refresh orders
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.msg || 'Failed to reject order' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Assign
  const handleAssign = async () => {
    if (!selectedOrder || !selectedDeliveryBoy) return;

    setSubmitting(true);
    try {
      console.log("🚚 Assigning order to delivery boy:", selectedDeliveryBoy);
      const response = await axios.put(
        `http://localhost:5000/api/order-management/sub-admin/assign/${selectedOrder._id}`,
        { deliveryBoyId: selectedDeliveryBoy },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("✅ Assignment response:", response.data);
      console.log("   New Status:", response.data.order?.orderStatus);
      console.log("   Delivery Boy ID:", response.data.order?.deliveryBoyId);

      setMessage({ type: 'success', text: '✅ Order assigned successfully! Refreshing...' });
      setShowAssignmentModal(false);
      setSelectedDeliveryBoy('');
      setSelectedOrder(null);

      // Refresh orders
      console.log("⏳ Refreshing orders in 1 second...");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error("❌ Assignment error:", error.response?.data || error.message);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.msg || 'Failed to assign order' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Modal Functions
  const openApprovalModal = (order: Order) => {
    setSelectedOrder(order);
    setShowApprovalModal(true);
  };

  const openRejectionModal = (order: Order) => {
    setSelectedOrder(order);
    setShowRejectionModal(true);
  };

  const openAssignmentModal = (order: Order) => {
    setSelectedOrder(order);
    setShowAssignmentModal(true);
  };

  const closeAllModals = () => {
    setShowApprovalModal(false);
    setShowRejectionModal(false);
    setShowAssignmentModal(false);
    setSelectedOrder(null);
    setApprovalNotes('');
    setRejectionReason('');
    setSelectedDeliveryBoy('');
  };

  const displayOrders = selectedTab === 'pending' ? orders : activeOrders;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-5 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-purple-500 rounded-full animate-spin"></div>
          <p className="text-gray-600 text-lg">Loading orders...</p>
        </div>
      </div>
    );
  }

  // Show access denied if user is not sub-admin
  if (!authorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-5 flex items-center justify-center">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="bg-white p-10 rounded-xl text-center shadow-lg">
            <h1 className="text-4xl mb-4">🚫 Access Denied</h1>
            <p className="text-lg text-gray-600 mb-5">You do not have permission to access this page.</p>
            <p className="text-base text-gray-600 mb-5">Only Sub-Administrators can view this dashboard.</p>
            <p className="text-sm text-gray-400 mb-8">Your role: <strong className="capitalize">{userRole}</strong></p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-5">
      <div className="max-w-5xl mx-auto">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-8 mb-10 shadow-lg text-white">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-8 mb-10 flex-wrap">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold m-0 mb-2">📋 Dashboard</h1>
              <p className="text-base text-purple-100 m-0 font-medium">Welcome back, <span className="text-yellow-300 font-bold capitalize">{userName}</span></p>
            </div>
            <div className="flex items-center">
              <div className="flex items-center gap-4 bg-white/15 backdrop-blur-sm px-6 py-4 rounded-xl border border-white/20">
                <span className="text-4xl">👨‍💼</span>
                <div>
                  <p className="m-0 text-sm text-white/90 font-semibold">Sub-Administrator</p>
                  <p className="m-0 text-xs font-bold text-green-300 uppercase tracking-wider">Active</p>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white/12 backdrop-blur-sm border border-white/20 rounded-xl p-6 flex gap-4 items-start hover:bg-white/18 hover:shadow-lg transition-all duration-300 cursor-pointer group">
              <div className="text-4xl flex items-center justify-center min-w-[50px]">📌</div>
              <div className="flex-1">
                <p className="text-xs text-white/80 m-0 mb-2 font-bold uppercase tracking-wider">Pending Orders</p>
                <h3 className="text-3xl font-bold m-0 mb-1 text-white">{orders.length}</h3>
                <p className="text-xs text-white/70 m-0 font-medium">Awaiting approval</p>
              </div>
            </div>

            <div className="bg-white/12 backdrop-blur-sm border border-white/20 rounded-xl p-6 flex gap-4 items-start hover:bg-white/18 hover:shadow-lg transition-all duration-300 cursor-pointer group">
              <div className="text-4xl flex items-center justify-center min-w-[50px]">🚚</div>
              <div className="flex-1">
                <p className="text-xs text-white/80 m-0 mb-2 font-bold uppercase tracking-wider">Active Orders</p>
                <h3 className="text-3xl font-bold m-0 mb-1 text-white">{activeOrders.length}</h3>
                <p className="text-xs text-white/70 m-0 font-medium">In delivery</p>
              </div>
            </div>

            <div className="bg-white/12 backdrop-blur-sm border border-white/20 rounded-xl p-6 flex gap-4 items-start hover:bg-white/18 hover:shadow-lg transition-all duration-300 cursor-pointer group">
              <div className="text-4xl flex items-center justify-center min-w-[50px]">👥</div>
              <div className="flex-1">
                <p className="text-xs text-white/80 m-0 mb-2 font-bold uppercase tracking-wider">Delivery Boys</p>
                <h3 className="text-3xl font-bold m-0 mb-1 text-white">{deliveryBoys.length}</h3>
                <p className="text-xs text-white/70 m-0 font-medium">Available</p>
              </div>
            </div>

            <div className="bg-white/12 backdrop-blur-sm border border-white/20 rounded-xl p-6 flex gap-4 items-start hover:bg-white/18 hover:shadow-lg transition-all duration-300 cursor-pointer group">
              <div className="text-4xl flex items-center justify-center min-w-[50px]">📊</div>
              <div className="flex-1">
                <p className="text-xs text-white/80 m-0 mb-2 font-bold uppercase tracking-wider">Total Handled</p>
                <h3 className="text-3xl font-bold m-0 mb-1 text-white">{orders.length + activeOrders.length}</h3>
                <p className="text-xs text-white/70 m-0 font-medium">This session</p>
              </div>
            </div>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mb-8 p-4 rounded-lg flex items-center animate-in slide-in-from-top-2 duration-300 border-l-4 shadow-md ${
            message.type === 'success' 
              ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-500 text-green-800' 
              : 'bg-gradient-to-r from-red-50 to-red-100 border-red-500 text-red-800'
          }`}>
            <div className="flex justify-between items-center w-full gap-4">
              <span className="font-medium">{message.text}</span>
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
        <div className="flex gap-3 mb-8 border-b-2 border-gray-300 pb-0 flex-wrap bg-white px-4 py-2 rounded-t-lg">
          <button
            className={`pb-4 px-6 font-bold text-base cursor-pointer transition-all border-b-4 -mb-px whitespace-nowrap ${
              selectedTab === 'pending'
                ? 'text-purple-600 border-purple-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
            onClick={() => setSelectedTab('pending')}
          >
            📌 Pending Orders ({orders.length})
          </button>
          <button
            className={`pb-4 px-6 font-bold text-base cursor-pointer transition-all border-b-4 -mb-px whitespace-nowrap ${
              selectedTab === 'active'
                ? 'text-purple-600 border-purple-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
            onClick={() => setSelectedTab('active')}
          >
            🚚 Active Orders ({activeOrders.length})
          </button>
        </div>

        {/* Orders List */}
        <div className="mb-8">
          {displayOrders.length === 0 ? (
            <div className="bg-white p-12 rounded-lg text-center text-gray-400 text-lg shadow-md border-2 border-dashed border-gray-300">
              <p>📭 No {selectedTab} orders at the moment</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {displayOrders.map((order) => (
                <div key={order._id} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden border border-gray-200">
                  <div
                    className="p-5 flex justify-between items-center cursor-pointer border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    onClick={() =>
                      setExpandedOrderId(
                        expandedOrderId === order._id ? null : order._id
                      )
                    }
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <h3 className="m-0 text-gray-900 font-bold text-lg">Order #{order._id.slice(-8)}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        order.orderStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.orderStatus === 'Confirmed' ? 'bg-green-100 text-green-800' :
                        order.orderStatus === 'Assigned' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.orderStatus}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <p className="m-0 text-2xl font-bold text-purple-600">₹{order.totalPrice.toFixed(2)}</p>
                      <span className="text-gray-500 text-lg transition-transform duration-300">
                        {expandedOrderId === order._id ? '▲' : '▼'}
                      </span>
                    </div>
                  </div>

                  {expandedOrderId === order._id && (
                    <div className="p-6 bg-gray-50 space-y-6 animate-in fade-in duration-300">
                      <div className="border-b border-gray-300 pb-6">
                        <h4 className="m-0 mb-4 text-gray-800 font-bold uppercase text-sm tracking-wider">Customer Information</h4>
                        <div className="flex justify-between py-2 gap-2">
                          <span className="font-bold text-gray-600 min-w-[100px]">Name:</span>
                          <span className="text-gray-800 flex-1 text-right">{order.userId?.name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between py-2 gap-2">
                          <span className="font-bold text-gray-600 min-w-[100px]">Email:</span>
                          <span className="text-gray-800 flex-1 text-right">{order.userId?.email || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between py-2 gap-2">
                          <span className="font-bold text-gray-600 min-w-[100px]">Phone:</span>
                          <span className="text-gray-800 flex-1 text-right">{order.userId?.phone || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="border-b border-gray-300 pb-6">
                        <h4 className="m-0 mb-3 text-gray-800 font-bold uppercase text-sm tracking-wider">📍 Delivery Address</h4>
                        <p className="m-0 text-gray-800 leading-relaxed p-3 bg-white rounded border-l-4 border-purple-500">{order.deliveryAddress}</p>
                      </div>

                      <div className="border-b border-gray-300 pb-6">
                        <h4 className="m-0 mb-3 text-gray-800 font-bold uppercase text-sm tracking-wider">Order Items ({order.items?.length || 0})</h4>
                        <div className="bg-white rounded overflow-hidden">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className={`flex justify-between items-center p-3 ${idx < order.items.length - 1 ? 'border-b border-gray-200' : ''}`}>
                              <span className="flex-1 text-gray-800 font-medium">{item.name}</span>
                              <span className="text-gray-600 mr-4">x{item.qty}</span>
                              <span className="text-purple-600 font-bold">₹{item.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-b border-gray-300 pb-6">
                        <h4 className="m-0 mb-3 text-gray-800 font-bold uppercase text-sm tracking-wider">Order Details</h4>
                        <div className="flex justify-between py-2 gap-2">
                          <span className="font-bold text-gray-600 min-w-[150px]">Payment Method:</span>
                          <span className="text-gray-800 flex-1 text-right">{order.paymentMethod}</span>
                        </div>
                        <div className="flex justify-between py-2 gap-2">
                          <span className="font-bold text-gray-600 min-w-[150px]">Created:</span>
                          <span className="text-gray-800 flex-1 text-right text-sm">{new Date(order.createdAt).toLocaleString()}</span>
                        </div>
                      </div>

                      {(order.orderStatus === 'Pending' || (order as any).status === 'Pending') && (
                        <div className="flex gap-3 pt-4">
                          <button
                            className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
                            onClick={() => openApprovalModal(order)}
                          >
                            ✅ Approve
                          </button>
                          <button
                            className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
                            onClick={() => openRejectionModal(order)}
                          >
                            ❌ Reject
                          </button>
                        </div>
                      )}

                      {(order.orderStatus === 'Confirmed' || (order as any).status === 'Shipped') && (
                        <div className="flex gap-3 pt-4">
                          <button
                            className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
                            onClick={() => openAssignmentModal(order)}
                          >
                            🚚 Assign Delivery Boy
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
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeAllModals}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="m-0 text-2xl font-bold text-gray-800">✅ Approve Order</h2>
              <button className="bg-none border-none text-3xl cursor-pointer text-gray-500 hover:text-gray-700 transition-colors" onClick={closeAllModals}>×</button>
            </div>
            <div className="p-6">
              <p className="m-0 mb-6 text-gray-600 font-semibold">Order #{selectedOrder._id.slice(-8)}</p>
              <div className="mb-4">
                <label className="block text-gray-700 font-bold mb-3">Approval Notes</label>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Add any notes about this approval..."
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end p-6 bg-gray-50 border-t border-gray-200">
              <button
                className="px-5 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-lg cursor-pointer hover:bg-gray-100 transition-colors disabled:opacity-50"
                onClick={closeAllModals}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                onClick={handleApprove}
                disabled={submitting}
              >
                {submitting ? 'Approving...' : 'Approve Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeAllModals}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="m-0 text-2xl font-bold text-gray-800">❌ Reject Order</h2>
              <button className="bg-none border-none text-3xl cursor-pointer text-gray-500 hover:text-gray-700 transition-colors" onClick={closeAllModals}>×</button>
            </div>
            <div className="p-6">
              <p className="m-0 mb-6 text-gray-600 font-semibold">Order #{selectedOrder._id.slice(-8)}</p>
              <div className="mb-4">
                <label className="block text-gray-700 font-bold mb-3">Rejection Reason</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end p-6 bg-gray-50 border-t border-gray-200">
              <button
                className="px-5 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-lg cursor-pointer hover:bg-gray-100 transition-colors disabled:opacity-50"
                onClick={closeAllModals}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                onClick={handleReject}
                disabled={submitting || !rejectionReason.trim()}
              >
                {submitting ? 'Rejecting...' : 'Reject Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignmentModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeAllModals}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="m-0 text-2xl font-bold text-gray-800">🚚 Assign Delivery Boy</h2>
              <button className="bg-none border-none text-3xl cursor-pointer text-gray-500 hover:text-gray-700 transition-colors" onClick={closeAllModals}>×</button>
            </div>
            <div className="p-6">
              <p className="m-0 mb-6 text-gray-600 font-semibold">Order #{selectedOrder._id.slice(-8)}</p>
              <div className="mb-4">
                <label className="block text-gray-700 font-bold mb-3">Select Delivery Boy</label>
                {deliveryBoys.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No delivery boys available</p>
                ) : (
                  <select
                    value={selectedDeliveryBoy}
                    onChange={(e) => setSelectedDeliveryBoy(e.target.value)}
                    title="Select a delivery boy"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">-- Choose a delivery boy --</option>
                    {deliveryBoys.map((db) => (
                      <option key={db._id} value={db._id}>
                        {db.name} - {db.phone}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            <div className="flex gap-3 justify-end p-6 bg-gray-50 border-t border-gray-200">
              <button
                className="px-5 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-lg cursor-pointer hover:bg-gray-100 transition-colors disabled:opacity-50"
                onClick={closeAllModals}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                onClick={handleAssign}
                disabled={submitting || !selectedDeliveryBoy}
              >
                {submitting ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubAdminDashboard;
