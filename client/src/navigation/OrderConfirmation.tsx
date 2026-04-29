import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface OrderItem {
  id: number;
  name: string;
  price: number;
  image: string;
  qty: number;
}

interface OrderState {
  items: OrderItem[];
  address: {
    name: string;
    phone: string;
    street: string;
    city: string;
    pincode: string;
  };
  paymentMethod: string;
  orderId: number;
  total: number;
}

const OrderConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as OrderState;

  if (!state || !state.items) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Order Not Found</h2>
        <p className="text-gray-600 mb-4">No order details available.</p>
        <button
          onClick={() => navigate("/")}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-2 px-6 rounded-lg"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const { items, address, paymentMethod, orderId, total } = state;

  const getImageUrl = (image: string | undefined): string => {
    if (!image) return "/images/placeholder.jpg";
    if (image.startsWith("http")) return image;
    return `http://localhost:5000${image}`;
  };

  return (
    <div className="order-confirmation-page page-section">
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-12 page-section">
        <div className="w-full max-w-4xl px-4 mx-auto section-content">
          {/* Success Header with Animation */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8 card-content-center border border-green-100">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-5xl">✓</span>
              </div>
            </div>
            
            {/* Success Message */}
            <h1 className="text-4xl font-black text-center bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent mb-3">
              Order Confirmed!
            </h1>
            <p className="text-center text-gray-600 text-lg mb-6">Thank you for your purchase</p>
            
            {/* Order ID Badge */}
            <div className="flex justify-center">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border-2 border-green-200 min-w-[280px]">
                <p className="text-center text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Order ID</p>
                <p className="text-center text-3xl font-black text-green-600 font-mono break-all">{orderId}</p>
              </div>
            </div>
          </div>

          {/* Order Details Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
            <h2 className="text-2xl font-bold mb-6 pb-4 border-b-2 border-green-200 text-gray-900 flex items-center gap-2">
              <span className="text-green-600">📦</span> Order Items
            </h2>
            
            <div className="space-y-4 list-center">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-green-50 rounded-xl hover:shadow-md transition-shadow border border-gray-100 content-wrapper-start">
                  <div className="relative">
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.name}
                      className="w-24 h-24 object-cover rounded-lg bg-gray-200 shadow-md"
                      onError={(e) => (e.currentTarget.src = "/images/placeholder.jpg")}
                    />
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-lg">
                      {item.qty}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg">{item.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">Qty: {item.qty}</p>
                    <p className="font-bold text-green-600 text-lg mt-2">₹{(item.price * item.qty).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Amount */}
            <div className="mt-8 pt-6 border-t-2 border-green-200">
              <div className="flex justify-between items-center bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200">
                <span className="text-lg font-bold text-gray-900">Total Amount</span>
                <span className="text-4xl font-black text-green-600">₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Shipping & Payment Details Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Shipping Address Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-blue-100 hover:shadow-2xl transition-shadow">
              <h3 className="text-lg font-bold mb-4 pb-3 border-b-2 border-blue-200 text-gray-900 flex items-center gap-2">
                <span className="text-xl">📍</span> Shipping Address
              </h3>
              <div className="space-y-3 text-gray-700">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="font-black text-gray-900 text-lg">{address.name}</p>
                  <p className="text-sm mt-2 text-gray-600">{address.street}</p>
                  <p className="text-sm text-gray-600">{address.city} - {address.pincode}</p>
                  <p className="font-semibold text-blue-600 mt-3 flex items-center gap-2">
                    <span>📞</span> {address.phone}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Method Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-purple-100 hover:shadow-2xl transition-shadow">
              <h3 className="text-lg font-bold mb-4 pb-3 border-b-2 border-purple-200 text-gray-900 flex items-center gap-2">
                <span className="text-xl">💳</span> Payment Method
              </h3>
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border-2 border-purple-200">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                    <span className="text-3xl">💳</span>
                  </div>
                  <div>
                    <p className="font-black text-gray-900 text-xl">{paymentMethod}</p>
                    <p className="text-sm text-gray-600 mt-1">✓ Secure Payment</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* What's Next Section */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl border-2 border-blue-400 p-8 mb-8 shadow-xl">
            <h3 className="font-black text-white mb-6 text-xl flex items-center gap-2">
              <span className="text-2xl">⏭️</span> What's Next?
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-white">
                <span className="text-xl flex-shrink-0 mt-1">✓</span>
                <span className="text-base">You will receive an order confirmation email shortly</span>
              </li>
              <li className="flex items-start gap-3 text-white">
                <span className="text-xl flex-shrink-0 mt-1">✓</span>
                <span className="text-base">Track your order using Order ID: <strong className="font-mono">{orderId}</strong></span>
              </li>
              <li className="flex items-start gap-3 text-white">
                <span className="text-xl flex-shrink-0 mt-1">✓</span>
                <span className="text-base">Expected delivery: <strong>3-5 business days</strong></span>
              </li>
              <li className="flex items-start gap-3 text-white">
                <span className="text-xl flex-shrink-0 mt-1">✓</span>
                <span className="text-base">For any queries, contact us at <strong className="underline">support@pedhewala.com</strong></span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/orders")}
              className="group relative bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2 text-lg"
            >
              <span>📦</span> View My Orders
            </button>
            <button
              onClick={() => navigate("/")}
              className="group relative bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2 text-lg"
            >
              <span>🛍️</span> Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
