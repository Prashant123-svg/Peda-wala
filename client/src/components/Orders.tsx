// src/components/Orders.tsx
import React, { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";

interface Order {
  _id: string;
  items: any[];
  totalPrice: number;
  status: "Pending" | "Shipped" | "Delivered" | "Cancelled";
  deliveryAddress: string;
  phoneNumber: string;
  createdAt: string;
}

const Orders: React.FC = () => {
  const { cart, removeFromCart, clearCart, getCartTotal } = useCart();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");

  // Fetch past orders from database
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      if (!token) {
        setError("Please login to view orders");
        setLoadingOrders(false);
        return;
      }

      const response = await fetch("/api/orders/my-orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const { parseResponse, parseErrorResponse } = await import("../utils/fetchUtils");
      if (!response.ok) {
        const err = await parseErrorResponse(response);
        throw new Error(err.message || "Failed to fetch orders");
      }

      const data = (await parseResponse(response)) || {};
      setOrders(data.orders || []);
      setError("");
    } catch (err: any) {
      console.error("Error fetching orders:", err);
      setError(err.message || "Failed to load orders");
    } finally {
      setLoadingOrders(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!deliveryAddress.trim()) {
      setError("Delivery address is required");
      return;
    }

    if (!phoneNumber.trim()) {
      setError("Phone number is required");
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

      const response = await fetch("/api/orders/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: cart,
          totalPrice,
          deliveryAddress,
          phoneNumber,
          paymentMethod,
        }),
      });

      const { parseResponse: _parseResponse, parseErrorResponse: _parseError } = await import("../utils/fetchUtils");
      if (!response.ok) {
        const errorData = await _parseError(response);
        throw new Error(errorData.message || "Failed to create order");
      }

      // ✅ Clear cart globally
      clearCart();
      
      // ✅ Reset form
      setDeliveryAddress("");
      setPhoneNumber("");
      setShowForm(false);
      
      // ✅ Refresh orders
      await fetchOrders();
      
      alert("✅ Order confirmed successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-500 text-white";
      case "Shipped":
        return "bg-blue-500 text-white";
      case "Delivered":
        return "bg-green-500 text-white";
      case "Cancelled":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-400 text-white";
    }
  };

  const cartTotal = getCartTotal();

  return (
    <div className="orders-page w-full min-h-screen bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8 text-center text-gray-800">My Orders</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm sm:text-base">
          {error}
        </div>
      )}

      {/* Cart Section */}
      <div className="mb-10">
        <h3 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">🛒 My Cart ({cart.length})</h3>
        {cart.length === 0 ? (
          <p className="text-gray-500 text-sm sm:text-base">Your cart is empty.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-white shadow-md hover:shadow-lg rounded-lg p-4 sm:p-6 border border-gray-200 flex flex-col items-center transition-shadow"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded mb-3 sm:mb-4"
                  />
                  <h4 className="font-semibold text-center text-sm sm:text-base">{item.name}</h4>
                  <p className="text-gray-600 text-xs sm:text-sm">₹{item.price} x {item.qty}</p>
                  <p className="font-bold text-yellow-600 mt-2 text-sm sm:text-base">
                    Total: ₹{item.price * item.qty}
                  </p>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="mt-3 sm:mt-4 w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors text-xs sm:text-sm font-semibold"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 sm:mt-8 bg-gray-100 p-4 sm:p-6 rounded-lg">
              <p className="text-lg sm:text-xl font-bold text-gray-800">Cart Total: ₹{cartTotal}</p>
            </div>

            {!showForm ? (
              <button
                onClick={() => setShowForm(true)}
                className="w-full mt-4 sm:mt-6 bg-green-600 hover:bg-green-700 text-white px-6 py-3 sm:py-4 rounded-lg font-semibold transition-colors text-sm sm:text-base"
              >
                Proceed to Checkout
              </button>
            ) : (
              <div className="mt-6 sm:mt-8 bg-white border-2 border-yellow-500 p-4 sm:p-6 lg:p-8 rounded-lg">
                <h4 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Delivery Details</h4>

                <div className="mb-4 sm:mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Address *
                  </label>
                  <textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter your full delivery address"
                    className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    rows={3}
                  />
                </div>

                <div className="mb-4 sm:mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="10-digit phone number"
                    className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  />
                </div>

                <div className="mb-6 sm:mb-8">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base bg-white"
                  >
                    <option value="COD">Cash on Delivery (COD)</option>
                    <option value="Online">Online Payment</option>
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 disabled:bg-gray-400"
                  >
                    {loading ? "Processing..." : "Confirm Order"}
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    className="flex-1 bg-gray-500 text-white px-6 py-3 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <hr className="my-8" />

      {/* Past Orders Section */}
      <div>
        <h3 className="text-xl font-semibold mb-4">📦 Past Orders</h3>
        {loadingOrders ? (
          <p className="text-gray-500">Loading orders...</p>
        ) : orders.length === 0 ? (
          <p className="text-gray-500">No past orders yet.</p>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white shadow-md rounded-lg p-4 border"
              >
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold">Order #{order._id.substring(0, 8).toUpperCase()}</h4>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  Date: {new Date(order.createdAt).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600 mb-3">
                  📍 {order.deliveryAddress}
                </p>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 mb-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-center">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div>
                        <p>{item.name}</p>
                        <p className="text-sm text-gray-500">
                          ₹{item.price} x {item.qty}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="font-bold text-yellow-700">
                  Total: ₹{order.totalPrice}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-500 text-white";
      case "Shipped":
        return "bg-blue-500 text-white";
      case "Delivered":
        return "bg-green-500 text-white";
      case "Cancelled":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-400 text-white";
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div className="w-full px-4 py-8">
      <h2 className="text-2xl font-bold mb-6 text-center">My Orders</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Cart Section */}
      <div className="mb-10">
        <h3 className="text-xl font-semibold mb-4">🛒 My Cart</h3>
        {cart.length === 0 ? (
          <p className="text-gray-500">Your cart is empty.</p>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-white shadow-md rounded-lg p-4 flex flex-col items-center border"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-32 h-32 object-cover rounded mb-3"
                  />
                  <h4 className="font-semibold">{item.name}</h4>
                  <p className="text-gray-600">₹{item.price} x {item.qty}</p>
                  <p className="font-bold text-yellow-600 mt-1">
                    Total: ₹{item.price * item.qty}
                  </p>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="mt-3 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-gray-100 p-4 rounded">
              <p className="text-lg font-bold">Cart Total: ₹{cartTotal}</p>
            </div>

            {!showForm ? (
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 w-full"
              >
                Proceed to Checkout
              </button>
            ) : (
              <div className="mt-6 bg-white border-2 border-yellow-500 p-6 rounded">
                <h4 className="text-lg font-semibold mb-4">Delivery Details</h4>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Delivery Address *
                  </label>
                  <textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter your full delivery address"
                    className="w-full border p-2 rounded"
                    rows={3}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="10-digit phone number"
                    className="w-full border p-2 rounded"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full border p-2 rounded"
                  >
                    <option value="COD">Cash on Delivery (COD)</option>
                    <option value="Online">Online Payment</option>
                  </select>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 disabled:bg-gray-400"
                  >
                    {loading ? "Processing..." : "Confirm Order"}
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    className="flex-1 bg-gray-500 text-white px-6 py-3 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <hr className="my-8" />

      {/* Past Orders Section */}
      <div>
        <h3 className="text-xl font-semibold mb-4">📦 Past Orders</h3>
        {loadingOrders ? (
          <p className="text-gray-500">Loading orders...</p>
        ) : orders.length === 0 ? (
          <p className="text-gray-500">No past orders yet.</p>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white shadow-md rounded-lg p-4 border"
              >
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold">Order #{order._id.substring(0, 8).toUpperCase()}</h4>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  Date: {new Date(order.createdAt).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600 mb-3">
                  📍 {order.deliveryAddress}
                </p>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 mb-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-center">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div>
                        <p>{item.name}</p>
                        <p className="text-sm text-gray-500">
                          ₹{item.price} x {item.qty}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="font-bold text-yellow-700">
                  Total: ₹{order.totalPrice}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
