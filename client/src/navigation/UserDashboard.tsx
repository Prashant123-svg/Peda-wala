import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface Order {
  _id: string;
  orderId: string;
  items: any[];
  total: number;
  status: string;
  createdAt: string;
}

interface UserData {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  address?: string;
  role: string;
}

const UserDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const profileRes = await axios.get("http://localhost:5000/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser(profileRes.data);

        const ordersRes = await axios.get("http://localhost:5000/api/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setOrders(ordersRes.data || []);
        setLoading(false);
      } catch (err) {
        navigate("/login");
      }
    };

    fetchUserData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 py-10 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">👤 My Dashboard</h1>
            <p className="text-blue-100 mt-1">Manage your account</p>
          </div>

          <div className="text-right">
            <p className="text-sm text-blue-100">Welcome back,</p>
            <p className="text-xl font-semibold">{user?.name}</p>
            <span className="text-xs bg-blue-700 px-2 py-1 rounded mt-1 inline-block">
              User
            </span>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* TABS */}
        <div className="flex gap-6 mb-8 border-b border-gray-700 overflow-x-auto">
          {["profile", "orders", "addresses", "settings"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 px-3 font-semibold whitespace-nowrap ${
                activeTab === tab
                  ? "border-b-2 border-blue-500 text-blue-400"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab === "profile" && "👤 Profile"}
              {tab === "orders" && "🛒 Orders"}
              {tab === "addresses" && "📍 Addresses"}
              {tab === "settings" && "⚙️ Settings"}
            </button>
          ))}
        </div>

        {/* PROFILE */}
        {activeTab === "profile" && (
          <div className="grid lg:grid-cols-3 gap-8">

            {/* LEFT CARD */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-md">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-4xl mb-4">
                  👤
                </div>
                <h2 className="text-xl font-bold">{user?.name}</h2>
                <p className="text-gray-400 text-sm">Member</p>
              </div>

              <div className="mt-6 space-y-3">
                <div className="bg-gray-900 p-3 rounded border border-gray-600">
                  <p className="text-gray-400 text-xs">Email</p>
                  <p className="text-sm">{user?.email}</p>
                </div>

                <div className="bg-gray-900 p-3 rounded border border-gray-600">
                  <p className="text-gray-400 text-xs">Phone</p>
                  <p className="text-sm">{user?.phone || "Not added"}</p>
                </div>
              </div>

              <button className="w-full mt-6 bg-blue-600 hover:bg-blue-700 py-2 rounded">
                ✏️ Edit Profile
              </button>
            </div>

            {/* RIGHT */}
            <div className="lg:col-span-2 bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-md">
              <h3 className="text-xl font-bold mb-6">Profile Info</h3>

              <div className="grid md:grid-cols-2 gap-4">
                <input
                  defaultValue={user?.name}
                  className="bg-gray-900 border border-gray-600 rounded px-3 py-2"
                />
                <input
                  defaultValue={user?.email}
                  className="bg-gray-900 border border-gray-600 rounded px-3 py-2"
                />
                <input
                  defaultValue={user?.phone}
                  className="bg-gray-900 border border-gray-600 rounded px-3 py-2"
                />
                <input
                  value="2024"
                  disabled
                  className="bg-gray-900 text-gray-500 border border-gray-600 rounded px-3 py-2"
                />
              </div>

              <button className="mt-6 bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded">
                💾 Save Changes
              </button>
            </div>
          </div>
        )}

        {/* ORDERS */}
        {activeTab === "orders" && (
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-md">
            <h2 className="text-xl font-bold mb-6">Orders</h2>

            {orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order._id}
                    className="bg-gray-900 p-4 rounded border border-gray-600 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-semibold">#{order.orderId}</p>
                      <p className="text-sm text-gray-400">
                        ₹{order.total.toFixed(2)}
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        navigate(`/order-confirmation`, {
                          state: { orderId: order.orderId },
                        })
                      }
                      className="bg-blue-600 hover:bg-blue-700 px-4 py-1 rounded"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No orders</p>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default UserDashboard;