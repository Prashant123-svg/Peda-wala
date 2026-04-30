import React, { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useUserContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../utils/apiConfig";

const INDIAN_STATES = [
  "Select a state",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

const STATE_CITY_MAP: {[key: string]: string[]} = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Tirupati", "Nellore", "Kurnool"],
  "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Pasighat"],
  "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Nagaon"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga"],
  "Chhattisgarh": ["Raipur", "Bilaspur", "Durg", "Rajnandgaon"],
  "Goa": ["Panaji", "Margao", "Vasco da Gama"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhidham", "Junagadh"],
  "Haryana": ["Gurgaon", "Faridabad", "Hisar", "Rohtak", "Panipat"],
  "Himachal Pradesh": ["Shimla", "Solan", "Mandi", "Kullu"],
  "Jharkhand": ["Ranchi", "Dhanbad", "Jamshedpur", "Giridih"],
  "Karnataka": ["Bangalore", "Kalyan", "Kolar", "Mangalore", "Belgaum", "Mysore"],
  "Kerala": ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Pimpri-Chinchwad", "Nashik", "Aurangabad"],
  "Manipur": ["Imphal", "Bishnupur"],
  "Meghalaya": ["Shillong", "Tura"],
  "Mizoram": ["Aizawl", "Lunglei"],
  "Nagaland": ["Kohima", "Dimapur"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Balasore"],
  "Punjab": ["Ludhiana", "Amritsar", "Chandigarh", "Patiala", "Jalandhar"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Kota", "Udaipur", "Bikaner"],
  "Sikkim": ["Gangtok", "Namchi"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem", "Tiruppur"],
  "Telangana": ["Hyderabad", "Warangal", "Karimnagar"],
  "Tripura": ["Agartala", "Udaipur"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Allahabad", "Ghaziabad", "Meerut", "Agra", "Mathura", "Varanasi"],
  "Uttarakhand": ["Dehradun", "Haldwani", "Nainital"],
  "West Bengal": ["Kolkata", "Howrah", "Darjeeling", "Siliguri"],
};

const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

const resolveImageUrl = (image?: string) => {
  if (!image) return "";
  if (image.startsWith("http://localhost:5000/api")) return image.replace("http://localhost:5000/api", API_BASE_URL);
  if (image.startsWith("http://localhost:5000")) return image.replace("http://localhost:5000", API_ORIGIN);
  if (image.startsWith("/")) return `${API_ORIGIN}${image}`;
  return image;
};

interface Order {
  _id: string;
  items: any[];
  totalPrice: number;
  status: "Pending" | "Processing" | "Confirmed" | "Shipped" | "Out for Delivery" | "Delivered" | "Cancelled";
  deliveryAddress: string;
  phoneNumber: string;
  createdAt: string;
}

const Orders: React.FC = () => {
  const { cart, removeFromCart, clearCart, getCartTotal } = useCart();
  const { isAdmin: contextIsAdmin } = useUserContext();
  const navigate = useNavigate();
  
  // Check: user is admin if EITHER context or localStorage confirms it
  const userRole = localStorage.getItem("userRole");
  const isAdmin = contextIsAdmin === true || userRole === "admin";

  useEffect(() => {
    console.log(`📦 Orders Debug - ContextIsAdmin: ${contextIsAdmin}, UserRole: ${userRole}, FinalIsAdmin: ${isAdmin}`);
  }, [contextIsAdmin, userRole, isAdmin]);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedOrderStatus, setSelectedOrderStatus] = useState<{ [key: string]: string }>({});

  // Detailed address form states (same as Checkout)
  const [address, setAddress] = useState({
    name: "",
    phone: "",
    street: "",
    state: "",
    city: "",
    pincode: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [filterStatus, setFilterStatus] = useState("");

  // Fetch past orders from database
  useEffect(() => {
    fetchOrders();
  }, [isAdmin]);

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      
      if (!token) {
        setError("Please login to view orders");
        setLoadingOrders(false);
        return;
      }

      // Use different endpoint for admin vs regular users
      // Default to user orders if isAdmin is undefined
      const endpoint = isAdmin ? "/orders/admin/all-orders" : "/orders/my-orders";
      console.log(`📋 Fetching orders - User Role: ${userRole}, isAdmin: ${isAdmin}, Endpoint: ${endpoint}`);
      const apiUrl = `${API_BASE_URL}${endpoint}`;

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP Error: ${response.status} ${response.statusText}`);
      }

      const text = await response.text();
      if (!text) {
        setOrders([]);
        setLoadingOrders(false);
        return;
      }

      const data = JSON.parse(text);
      setOrders(data.orders || []);
      setError("");
    } catch (err: any) {
      console.error("Error fetching orders:", err.message);
      setError(err.message || "Failed to load orders");
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!address.name.trim()) {
      setError("Full name is required");
      return;
    }

    if (!address.phone.trim()) {
      setError("Phone number is required");
      return;
    }

    if (!address.street.trim()) {
      setError("Street address is required");
      return;
    }

    if (!address.state || address.state === "Select a state") {
      setError("State is required");
      return;
    }

    if (!address.city) {
      setError("City is required");
      return;
    }

    if (!address.pincode.trim()) {
      setError("Pincode is required");
      return;
    }

    if (cart.length === 0) {
      setError("Cart is empty");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const totalPrice = getCartTotal();
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      
      if (!token) {
        setError("Please login to place an order");
        setLoading(false);
        return;
      }

      const apiUrl = `${API_BASE_URL}/orders/create-order`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: cart,
          totalPrice,
          deliveryAddress: `${address.street}, ${address.city}, ${address.state} - ${address.pincode}`,
          phoneNumber: address.phone,
          paymentMethod,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create order");
      }

      const data = await response.json();
      console.log("Order created:", data);

      // Clear cart and refresh orders
      clearCart();
      setAddress({ name: "", phone: "", street: "", state: "", city: "", pincode: "" });
      setShowForm(false);
      
      alert("✅ Order placed successfully!");
      await fetchOrders();
    } catch (err: any) {
      console.error("Error placing order:", err);
      setError(err.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-warning text-dark";
      case "Shipped":
        return "bg-info text-white";
      case "Delivered":
        return "bg-success text-white";
      case "Cancelled":
        return "bg-danger text-white";
      default:
        return "bg-secondary text-white";
    }
  };

  // Admin function to update order status
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      if (!token) {
        setError("Please login to update order status");
        return;
      }

      const apiUrl = `${API_BASE_URL}/orders/admin/order-status/${orderId}`;

      const response = await fetch(apiUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update order status");
      }

      // Refresh orders
      await fetchOrders();
      alert("✅ Order status updated successfully!");
    } catch (err: any) {
      console.error("Error updating order status:", err);
      setError(err.message || "Failed to update order status");
    }
  };

  const cartTotal = getCartTotal();

  return (
    <div className="orders-page min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      {/* Main Container */}
      <div className="max-w-7xl mx-auto">
        {/* Header Section - Admin Only */}
        {isAdmin && (
          <div className="mb-12">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                  📊 Admin Dashboard
                </h1>
                <p className="text-gray-600 text-lg">
                  Manage all customer orders efficiently
                </p>
              </div>
              {isAdmin && (
                <div className="flex flex-wrap gap-3">
                  <div className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl text-white font-bold shadow-lg">
                    <span className="block text-sm text-yellow-100">Revenue</span>
                    <span className="text-3xl">₹{orders.reduce((sum, o) => sum + o.totalPrice, 0)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Error Alert */}
            {error && (
              <div className="bg-red-500 bg-opacity-10 border-l-4 border-red-500 rounded-lg p-4 mb-6 flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className="text-red-400 font-semibold">Error</p>
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                </div>
                <button
                  onClick={() => setError("")}
                  className="text-red-400 hover:text-red-300 text-2xl font-bold"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        )}

        {/* Admin Analytics Dashboard */}
        {isAdmin && (
          <div className="mb-12">
            {/* Analytics Section Title */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">📊 Order Analytics</h2>
              <p className="text-gray-600">Complete order management and analytics</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              {/* Total Orders */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-4 shadow-lg">
                <p className="text-blue-100 text-sm font-semibold mb-1">📦 Total Orders</p>
                <p className="text-3xl font-bold text-white">{orders.length}</p>
                <p className="text-blue-200 text-xs mt-1">All orders in system</p>
              </div>

              {/* Pending */}
              <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-xl p-4 shadow-lg">
                <p className="text-yellow-100 text-sm font-semibold mb-1">⏳ Pending</p>
                <p className="text-3xl font-bold text-white">{orders.filter(o => o.status === "Pending").length}</p>
                <p className="text-yellow-200 text-xs mt-1">
                  {orders.length > 0 
                    ? ((orders.filter(o => o.status === "Pending").length / orders.length) * 100).toFixed(1) 
                    : "0"}% of total
                </p>
              </div>

              {/* Confirmed */}
              <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-4 shadow-lg">
                <p className="text-purple-100 text-sm font-semibold mb-1">✓ Confirmed</p>
                <p className="text-3xl font-bold text-white">{orders.filter(o => o.status === "Processing" || o.status === "Confirmed").length}</p>
                <p className="text-purple-200 text-xs mt-1">
                  {orders.length > 0 
                    ? ((orders.filter(o => o.status === "Processing" || o.status === "Confirmed").length / orders.length) * 100).toFixed(1) 
                    : "0"}% of total
                </p>
              </div>

              {/* Assigned */}
              <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl p-4 shadow-lg">
                <p className="text-indigo-100 text-sm font-semibold mb-1">🚚 Assigned</p>
                <p className="text-3xl font-bold text-white">{orders.filter(o => o.status === "Shipped").length}</p>
                <p className="text-indigo-200 text-xs mt-1">
                  {orders.length > 0 
                    ? ((orders.filter(o => o.status === "Shipped").length / orders.length) * 100).toFixed(1) 
                    : "0"}% of total
                </p>
              </div>

              {/* Out for Delivery */}
              <div className="bg-gradient-to-br from-cyan-600 to-cyan-700 rounded-xl p-4 shadow-lg">
                <p className="text-cyan-100 text-sm font-semibold mb-1">📤 Out for Delivery</p>
                <p className="text-3xl font-bold text-white">{orders.filter(o => o.status === "Out for Delivery").length}</p>
                <p className="text-cyan-200 text-xs mt-1">
                  {orders.length > 0 
                    ? ((orders.filter(o => o.status === "Out for Delivery").length / orders.length) * 100).toFixed(1) 
                    : "0"}% of total
                </p>
              </div>

              {/* Delivered */}
              <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-4 shadow-lg">
                <p className="text-green-100 text-sm font-semibold mb-1">✅ Delivered</p>
                <p className="text-3xl font-bold text-white">{orders.filter(o => o.status === "Delivered").length}</p>
                <p className="text-green-200 text-xs mt-1">
                  {orders.length > 0 
                    ? ((orders.filter(o => o.status === "Delivered").length / orders.length) * 100).toFixed(1) 
                    : "0"}% of total
                </p>
              </div>

              {/* Rejected */}
              <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-4 shadow-lg">
                <p className="text-red-100 text-sm font-semibold mb-1">❌ Rejected</p>
                <p className="text-3xl font-bold text-white">{orders.filter(o => o.status === "Cancelled").length}</p>
                <p className="text-red-200 text-xs mt-1">
                  {orders.length > 0 
                    ? ((orders.filter(o => o.status === "Cancelled").length / orders.length) * 100).toFixed(1) 
                    : "0"}% of total
                </p>
              </div>

              {/* Total Revenue */}
              <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-4 shadow-lg">
                <p className="text-orange-100 text-sm font-semibold mb-1">💰 Total Revenue</p>
                <p className="text-2xl font-bold text-white">₹{(orders.reduce((sum, o) => sum + o.totalPrice, 0) / 1000).toFixed(1)}K</p>
                <p className="text-orange-200 text-xs mt-1">From {orders.length} orders</p>
              </div>
            </div>

            {/* Filter Section */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  🔍 Filter Orders
                </h3>
                <button
                  onClick={() => setFilterStatus("")}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors text-sm"
                >
                  ✗ Clear All
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Order Status Filter */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-sm">Order Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                  >
                    <option value="">-- All Statuses --</option>
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Sub-Admin Filter */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-sm">Sub-Admin ID (optional)</label>
                  <input
                    type="text"
                    placeholder="Enter sub-admin ID"
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                  />
                </div>

                {/* Delivery Boy Filter */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-sm">Delivery Boy ID (optional)</label>
                  <input
                    type="text"
                    placeholder="Enter delivery boy ID"
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Orders List Header */}
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                📋 Orders List
                <span className="px-4 py-2 bg-yellow-500 text-black rounded-full text-lg font-bold">
                  {orders.filter(o => !filterStatus || o.status === filterStatus).length}
                </span>
              </h3>
            </div>
          </div>
        )}

        {/* User Orders Header - Non-Admin Only */}
        {!isAdmin && (
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">🛒 Orders</h1>
            <p className="text-gray-600 text-lg">View your order history and track purchases</p>
          </div>
        )}

      {/* Cart Section - Hide for Admin */}
      {!isAdmin && (
        <div className="mb-12">
          {/* Cart Header */}
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              🛒 My Cart
              <span className="px-4 py-2 bg-yellow-500 text-black rounded-full text-lg font-bold">
                {cart.length}
              </span>
            </h2>
          </div>

          {cart.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
              <p className="text-gray-600 text-xl mb-4">✨ Your cart is empty</p>
              <button 
                onClick={() => navigate("/products")}
                className="px-8 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition-all transform hover:scale-105"
              >
                🛍️ Start Shopping
              </button>
            </div>
          ) : (
            <>
              {/* Cart Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-8">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl hover:shadow-yellow-500/20 transition-all"
                  >
                    {/* Image */}
                    <div className="relative overflow-hidden bg-gray-100 h-48">
                      <img
                        src={resolveImageUrl(item.image)}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>

                    {/* Content */}
                    <div className="p-4 flex flex-col">
                      <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{item.name}</h3>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-gray-600">₹{item.price}</span>
                        <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold">×{item.qty}</span>
                      </div>
                      <p className="text-yellow-400 font-bold text-lg mb-4">₹{item.price * item.qty}</p>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart Summary & Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Summary Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 lg:col-span-2 shadow-sm">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">📋 Order Summary</h3>
                  <div className="space-y-3 border-b border-gray-200 pb-4 mb-4">
                    <div className="flex justify-between text-gray-700">
                      <span>Items ({cart.length})</span>
                      <span className="font-bold">{cart.reduce((sum, item) => sum + item.qty, 0)} pcs</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>Subtotal</span>
                      <span>₹{cartTotal}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>Delivery</span>
                      <span className="text-green-400 font-bold">FREE</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-900">Total:</span>
                    <span className="text-3xl font-bold text-yellow-400">₹{cartTotal}</span>
                  </div>
                </div>

                {/* Actions Card */}
                <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Ready to Checkout?</h3>
                    <p className="text-yellow-100 text-sm">Complete your order in just 2 steps</p>
                  </div>
                  <button
                    onClick={() => setShowForm(true)}
                    className="w-full px-6 py-3 bg-white hover:bg-gray-100 text-yellow-600 font-bold rounded-lg transition-all transform hover:scale-105"
                  >
                    ✓ Checkout Now
                  </button>
                </div>
              </div>

              {/* Checkout Form */}
              {!showForm ? null : (
                <div className="bg-white border-2 border-yellow-400 rounded-xl p-8 shadow-sm">
                  <h3 className="text-2xl font-bold text-yellow-400 mb-6">📍 Delivery Details</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block font-semibold text-gray-800 mb-2">Full Name *</label>
                      <input
                        type="text"
                        value={address.name}
                        onChange={(e) => setAddress({ ...address, name: e.target.value })}
                        placeholder="Enter your full name"
                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-800 mb-2">Phone Number *</label>
                      <input
                        type="tel"
                        value={address.phone}
                        onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                        placeholder="10-digit phone number"
                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block font-semibold text-gray-800 mb-2">Street Address *</label>
                      <input
                        type="text"
                        value={address.street}
                        onChange={(e) => setAddress({ ...address, street: e.target.value })}
                        placeholder="Enter your street address"
                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                      />
                </div>

                    <div>
                      <label className="block font-semibold text-gray-800 mb-2">State *</label>
                      <select
                        value={address.state}
                        onChange={(e) => setAddress({ ...address, state: e.target.value, city: "" })}
                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                      >
                        {INDIAN_STATES.map((state) => (
                          <option key={state} value={state === "Select a state" ? "" : state}>
                            {state}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-800 mb-2">City *</label>
                      <select
                        value={address.city}
                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                        disabled={!address.state}
                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">Select a city</option>
                        {address.state && STATE_CITY_MAP[address.state] ? (
                          STATE_CITY_MAP[address.state].map((city) => (
                            <option key={city} value={city}>
                              {city}
                            </option>
                          ))
                        ) : (
                          <option disabled>Please select a state first</option>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-800 mb-2">Pincode *</label>
                      <input
                        type="text"
                        value={address.pincode}
                        onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                        placeholder="6-digit pincode"
                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-800 mb-2">💳 Payment Method</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                      >
                        <option value="COD">💵 Cash on Delivery (COD)</option>
                        <option value="Online">💳 Online Payment</option>
                      </select>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-6">
                    <button
                      onClick={handlePlaceOrder}
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <span>✅</span>
                      {loading ? "Processing..." : "Confirm Order"}
                    </button>
                    <button
                      onClick={() => setShowForm(false)}
                      className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-lg transition-all"
                    >
                      ✕ Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <hr className="my-8 border-gray-200" />

      {/* Past Orders Section */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            {isAdmin ? "📊 All Orders" : "📦 Past Orders"}
          </h2>
          <span className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-semibold">
            {orders.length} {orders.length === 1 ? "Order" : "Orders"}
          </span>
        </div>
        
        {loadingOrders ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-yellow-500"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
            <p className="text-gray-600 text-lg">✨ {isAdmin ? "No orders yet." : "No past orders yet."}</p>
            {!isAdmin && (
              <button 
                onClick={() => navigate("/products")}
                className="mt-4 px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition"
              >
                🛍️ Start Shopping
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {orders
              .filter(order => !filterStatus || order.status === filterStatus)
              .map((order: any) => (
              <div
                key={order._id}
                className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-2xl hover:shadow-yellow-500/20 transition-all duration-300 flex flex-col"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">#{order._id.substring(0, 8).toUpperCase()}</h3>
                      <p className="text-sm text-gray-800">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div className={`px-4 py-2 rounded-full text-sm font-bold text-white ${getStatusColor(order.status)}`}>
                      {order.status}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 px-6 py-5 space-y-4">
                  {/* Customer Info (Admin Only) */}
                  {isAdmin && order.userId && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 pl-4 py-3 rounded">
                      <p className="text-yellow-700 text-sm font-semibold">
                        👤 {order.userId.name}
                      </p>
                      <p className="text-yellow-600 text-xs">
                        ✉️ {order.userId.email}
                      </p>
                    </div>
                  )}

                  {/* Delivery Info */}
                  <div>
                    <p className="text-gray-600 text-sm mb-1">📍 Delivery Address</p>
                    <p className="text-gray-800 text-sm font-medium">{order.deliveryAddress}</p>
                  </div>

                  {/* Phone */}
                  <div>
                    <p className="text-gray-600 text-sm">📞 {order.phoneNumber}</p>
                  </div>

                  {/* Items */}
                  <div>
                    <p className="text-gray-600 text-sm mb-2">📦 Items ({order.items.length})</p>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="bg-gray-100 px-3 py-2 rounded text-xs flex justify-between items-center">
                          <span className="text-gray-700">{item.name} x {item.qty}</span>
                          <span className="text-yellow-400 font-bold">₹{item.price * item.qty}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-600">Total Amount</span>
                    <span className="text-2xl font-bold text-yellow-400">₹{order.totalPrice}</span>
                  </div>

                  {isAdmin && (
                    <div className="flex gap-2">
                      <select
                        value={selectedOrderStatus[order._id] || order.status}
                        onChange={(e) => setSelectedOrderStatus({ ...selectedOrderStatus, [order._id]: e.target.value })}
                        className="flex-1 bg-white border border-gray-300 text-gray-900 text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                      <button
                        onClick={() => handleUpdateOrderStatus(order._id, selectedOrderStatus[order._id] || order.status)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2"
                      >
                        ✓ Update
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default Orders;
