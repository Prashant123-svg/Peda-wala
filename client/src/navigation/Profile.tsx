import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import ProfileSettings from "../components/ProfileSettings";

interface UserProfile {
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  avatar?: string;
  isPhoneVerified?: boolean;
  role?: string;
  status?: string;
}

interface Order {
  _id: string;
  orderId?: string;
  orderNumber?: string;
  items: any[];
  totalPrice: number;
  status: string;
  createdAt: string;
  userId?: {
    _id?: string;
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
}

interface AdminStats {
  totalUsers: number;
  totalSubAdmins: number;
  totalDeliveryBoys: number;
  blockedUsers: number;
  totalActiveUsers: number;
}

interface OrderAnalytics {
  totalOrders: number;
  totalRevenue: number;
}

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [adminOrderTotal, setAdminOrderTotal] = useState<number | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [orderAnalytics, setOrderAnalytics] = useState<OrderAnalytics | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passwordMode, setPasswordMode] = useState(false);
  const [phoneVerificationMode, setPhoneVerificationMode] = useState(false);
  const [tempPhone, setTempPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("profile");
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // Fetch profile and orders on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login", { replace: true, state: { from: "/profile" } });
          return;
        }

        console.log("📋 Fetching profile with token:", token ? "Present" : "Missing");
        
        const res = await axios.get("http://localhost:5000/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("✅ Profile fetched successfully:", res.data);
        
        setUser(res.data);
        setTempPhone(res.data.phone || "");

        // Set default tab based on role
        if (res.data.role === "admin") {
          setActiveTab("overview");
        } else if (res.data.role === "deliveryBoy") {
          setActiveTab("settings");
        } else {
          setActiveTab("profile");
        }

        // calculate progress
        let p = 50; // name + email base
        if (res.data.phone) p += 25;
        if (res.data.address) p += 25;
        setProgress(p);

        // Fetch orders if user is regular user
        if (res.data.role === "admin") {
          try {
            const [usersRes, adminStatsRes, analyticsRes, adminOrdersRes] = await Promise.allSettled([
              axios.get("http://localhost:5000/api/auth/admin/all-users", {
                headers: { Authorization: `Bearer ${token}` },
              }),
              axios.get("http://localhost:5000/api/admin/stats", {
                headers: { Authorization: `Bearer ${token}` },
              }),
              axios.get("http://localhost:5000/api/order-status/analytics/summary", {
                headers: { Authorization: `Bearer ${token}` },
              }),
              axios.get("http://localhost:5000/api/orders/admin/all-orders", {
                headers: { Authorization: `Bearer ${token}` },
              }),
            ]);

            if (usersRes.status === "fulfilled") {
              setAllUsers(usersRes.value.data.users || []);
            }

            if (adminStatsRes.status === "fulfilled") {
              setAdminStats(adminStatsRes.value.data.stats || null);
            }

            if (analyticsRes.status === "fulfilled") {
              setOrderAnalytics(analyticsRes.value.data.analytics || null);
            }

            if (adminOrdersRes.status === "fulfilled") {
              setOrders(adminOrdersRes.value.data.orders || []);
              setAdminOrderTotal(adminOrdersRes.value.data.count ?? adminOrdersRes.value.data.total ?? null);
            }
          } catch (err) {
            console.log("Error fetching admin dashboard data:", err instanceof Error ? err.message : err);
            setAllUsers([]);
            setAdminOrderTotal(null);
            setAdminStats(null);
            setOrderAnalytics(null);
            setOrders([]);
          }
        } else {
          try {
            const ordersRes = await axios.get("http://localhost:5000/api/orders/my-orders", {
              headers: { Authorization: `Bearer ${token}` },
            });
            setOrders(ordersRes.data.orders || []);
          } catch (err) {
            console.log("Error fetching orders:", err instanceof Error ? err.message : err);
            setOrders([]);
          }
        }
        
        setLoading(false);
      } catch (err: any) {
        console.error("❌ Error fetching profile:", {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        });

        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
          localStorage.removeItem("userName");
          localStorage.removeItem("userEmail");
          localStorage.removeItem("userRole");
          navigate("/login", { replace: true, state: { from: "/profile" } });
          return;
        }

        setError(err.response?.data?.message || "Failed to load profile. Please try again.");
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  // Handle change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (user) {
      setUser({ ...user, [e.target.name]: e.target.value });
    }
  };

  // Handle password change
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  // Save profile changes
  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token || !user) return;

      const res = await axios.put(
        "http://localhost:5000/api/auth/profile",
        {
          name: user.name,
          phone: user.phone,
          address: user.address,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setUser(res.data);
      setEditMode(false);
      alert("Profile updated successfully ✅");
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError(err.response?.data?.message || "Failed to update profile");
    }
  };

  const handleDeleteCustomer = async (customerId?: string) => {
    if (!customerId) return;

    const confirmed = window.confirm("Delete this customer and all of their orders?");
    if (!confirmed) return;

    setDeleteLoading(customerId);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await axios.delete(`http://localhost:5000/api/auth/admin/user/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAllUsers((currentUsers) => currentUsers.filter((item) => item._id !== customerId));
      setOrders((currentOrders) =>
        currentOrders.filter((order) => order.userId?._id !== customerId)
      );

      if (user?._id === customerId) {
        setActiveTab("overview");
      }

      setAdminOrderTotal((currentTotal) =>
        currentTotal !== null ? Math.max(0, currentTotal - 1) : currentTotal
      );
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete customer");
    } finally {
      setDeleteLoading(null);
    }
  };

  // Send OTP for phone verification
  const handleSendOtp = async () => {
    setOtpError(null);
    setOtpSuccess(null);

    if (!tempPhone) {
      setOtpError("Please enter a phone number");
      return;
    }

    setOtpLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.post(
        "http://localhost:5000/api/otp/send-otp",
        { phone: tempPhone },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setOtpSent(true);
      // Display the actual message from server which includes method (SMS/Email/Console)
      setOtpSuccess(response.data.message || "OTP sent successfully ✅");
    } catch (err: any) {
      setOtpError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    setOtpError(null);
    setOtpSuccess(null);

    if (!otp) {
      setOtpError("Please enter OTP");
      return;
    }

    setOtpLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await axios.post(
        "http://localhost:5000/api/otp/verify-otp",
        { otp },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setUser(res.data.user);
      setOtpSuccess("Phone number verified successfully ✅");
      setOtp("");
      setOtpSent(false);
      setPhoneVerificationMode(false);
      
      // Update progress
      let p = 50;
      if (res.data.user.phone) p += 25;
      if (res.data.user.address) p += 25;
      setProgress(p);
    } catch (err: any) {
      setOtpError(err.response?.data?.message || "Failed to verify OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  // Save password change
  const handlePasswordSave = async () => {
    setPasswordError(null);
    setPasswordSuccess(null);

    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError("All fields are required");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await axios.put(
        "http://localhost:5000/api/change-password",
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          confirmPassword: passwordData.confirmPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setPasswordSuccess("Password changed successfully ✅");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordMode(false);
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || "Failed to change password");
    }
  };

  if (loading) return <p className="text-center py-5">Loading profile...</p>;

  if (error && !user) return <p className="text-center py-5 text-danger">{error}</p>;

  if (!user)
    return <p className="text-center py-5">No profile data available.</p>;

  const isAdmin = user.role === "admin";
  const isDeliveryBoy = user.role === "deliveryBoy";
  const adminUsers = allUsers;
  const adminOrders = orders;
  const totalOrders = orderAnalytics?.totalOrders ?? adminOrderTotal ?? adminOrders.length;
  const totalRevenue = orderAnalytics?.totalRevenue ?? adminOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
  const activeUsers = adminStats?.totalActiveUsers ?? adminUsers.length;
  const availableUsers = adminStats
    ? adminStats.totalUsers + adminStats.totalSubAdmins + adminStats.totalDeliveryBoys
    : adminUsers.length;

  return (
    <div className="profile-page min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold mb-2">
                {isAdmin ? "🔐 Admin Dashboard" : "👤 My Dashboard"}
              </h1>
              <p className="text-blue-100 text-lg">
                {isAdmin ? "Manage your store and users" : "Manage your account and orders"}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-blue-100 text-sm mb-1">Welcome back,</p>
              <p className="text-2xl sm:text-3xl font-bold">{user?.name}</p>
              <span className={`inline-block mt-2 px-4 py-1.5 rounded-full text-sm font-semibold ${
                isAdmin 
                  ? "bg-purple-200 text-purple-900" 
                  : "bg-blue-200 text-blue-900"
              }`}>
                {isAdmin ? "👨‍💼 Admin" : "👤 User"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Tabs */}
        <div className="flex gap-2 sm:gap-4 mb-8 border-b-2 border-gray-200 overflow-x-auto pb-0">
          {!isAdmin && !isDeliveryBoy && (
            <>
              <button
                onClick={() => setActiveTab("profile")}
                className={`pb-4 px-2 sm:px-4 font-semibold whitespace-nowrap text-sm sm:text-base border-b-2 -mb-px transition-all ${
                  activeTab === "profile"
                    ? "text-blue-600 border-blue-600"
                    : "text-gray-600 border-transparent hover:text-gray-900"
                }`}
              >
                👤 Profile
              </button>
              <button
                onClick={() => setActiveTab("orders")}
                className={`pb-4 px-2 sm:px-4 font-semibold whitespace-nowrap text-sm sm:text-base border-b-2 -mb-px transition-all ${
                  activeTab === "orders"
                    ? "text-blue-600 border-blue-600"
                    : "text-gray-600 border-transparent hover:text-gray-900"
                }`}
              >
                🛒 Orders
              </button>
            </>
          )}

          {isAdmin && (
            <>
              <button
                onClick={() => setActiveTab("overview")}
                className={`pb-4 px-2 sm:px-4 font-semibold whitespace-nowrap text-sm sm:text-base border-b-2 -mb-px transition-all ${
                  activeTab === "overview"
                    ? "text-purple-600 border-purple-600"
                    : "text-gray-600 border-transparent hover:text-gray-900"
                }`}
              >
                📊 Overview
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className={`pb-4 px-2 sm:px-4 font-semibold whitespace-nowrap text-sm sm:text-base border-b-2 -mb-px transition-all ${
                  activeTab === "users"
                    ? "text-purple-600 border-purple-600"
                    : "text-gray-600 border-transparent hover:text-gray-900"
                }`}
              >
                👥 Users
              </button>
              <button
                onClick={() => setActiveTab("admin-orders")}
                className={`pb-4 px-2 sm:px-4 font-semibold whitespace-nowrap text-sm sm:text-base border-b-2 -mb-px transition-all ${
                  activeTab === "admin-orders"
                    ? "text-purple-600 border-purple-600"
                    : "text-gray-600 border-transparent hover:text-gray-900"
                }`}
              >
                🛒 Orders
              </button>
            </>
          )}

          <button
            onClick={() => setActiveTab("settings")}
            className={`pb-4 px-2 sm:px-4 font-semibold whitespace-nowrap text-sm sm:text-base border-b-2 -mb-px transition-all ${
              activeTab === "settings"
                ? isAdmin ? "text-purple-600 border-purple-600" : "text-blue-600 border-blue-600"
                : "text-gray-600 border-transparent hover:text-gray-900"
            }`}
          >
            ⚙️ Settings
          </button>
        </div>

        {/* Profile Tab */}
        {!isAdmin && activeTab === "profile" && (
          <>
            {isDeliveryBoy ? (
              <div className="mb-8 bg-blue-50 border-2 border-blue-300 rounded-xl p-6 text-center">
                <div className="text-4xl mb-3">🚚</div>
                <h3 className="text-xl font-bold text-blue-900 mb-2">Delivery Boy Account</h3>
                <p className="text-blue-800 mb-4">
                  As a Delivery Boy, your profile information is managed by the admin. 
                  You cannot update your details through this interface.
                </p>
                <p className="text-sm text-blue-700">
                  Contact the admin if you need to make any changes to your profile.
                </p>
              </div>
            ) : (
              <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
                {/* Left Column - Form */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-blue-400">Profile Information</h2>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      title="Full name"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                      value={user.name}
                      onChange={(e) => setUser({ ...user, name: e.target.value })}
                      disabled={!editMode}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      title="Email address"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      value={user.email}
                      disabled
                    />
                    <p className="text-xs text-gray-600 mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        placeholder="Enter your phone number"
                        title="Phone number"
                        className={`flex-1 px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                          editMode ? "border-gray-300 bg-white" : "border-gray-300 bg-gray-50"
                        }`}
                        value={user.phone || ""}
                        onChange={(e) => setUser({ ...user, phone: e.target.value })}
                        disabled={!editMode}
                      />
                    </div>
                    <div className="mt-2">
                      {user.isPhoneVerified ? (
                        <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">✅ Verified</span>
                      ) : (
                        <span className="inline-block px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">❌ Not Verified</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                    <textarea
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                        editMode ? "border-gray-300 bg-white" : "border-gray-300 bg-gray-50"
                      }`}
                      value={user.address || ""}
                      onChange={(e) => setUser({ ...user, address: e.target.value })}
                      disabled={!editMode}
                      placeholder="Enter your address"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        if (editMode) {
                          handleSave();
                        }
                        setEditMode(!editMode);
                      }}
                      className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
                        editMode
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-blue-100 hover:bg-blue-200 text-blue-900"
                      }`}
                    >
                      {editMode ? "💾 Save Changes" : "✏️ Edit Profile"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Stats */}
            <div className="space-y-6">
              {/* Profile Completion */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Profile Completion</h3>
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Progress</span>
                    <span className="text-2xl font-bold text-blue-600">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div className="grid h-full grid-cols-4 gap-0.5 p-0.5">
                      {[25, 50, 75, 100].map((step) => (
                        <div
                          key={step}
                          className={`rounded-full transition-colors ${
                            progress >= step
                              ? "bg-gradient-to-r from-blue-500 to-blue-600"
                              : "bg-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                {progress < 100 ? (
                  <p className="text-sm text-gray-600">Complete your profile to unlock better experience! 🚀</p>
                ) : (
                  <p className="text-sm text-green-600 font-semibold">✅ Your profile is 100% complete!</p>
                )}
              </div>
            </div>
          </div>

          {/* Phone Verification - Full Width for All Screens */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mt-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">📱 Phone Verification</h3>
            {user.isPhoneVerified ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm sm:text-base text-green-800 font-semibold">✅ Phone verified and secure!</p>
              </div>
            ) : (
              <button
                onClick={() => setPhoneVerificationMode(!phoneVerificationMode)}
                className="w-full px-4 py-3 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-base sm:text-sm"
              >
                🔐 Verify Phone
              </button>
            )}

            {phoneVerificationMode && !user.isPhoneVerified && (
              <div className="mt-4 space-y-4">
                {otpError && <div className="p-3 sm:p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm sm:text-base font-medium">{otpError}</div>}
                {otpSuccess && <div className="p-3 sm:p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm sm:text-base font-medium">{otpSuccess}</div>}

                {!otpSent ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        className="w-full px-4 py-3 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 text-base sm:text-sm placeholder-gray-400"
                        value={tempPhone}
                        onChange={(e) => setTempPhone(e.target.value)}
                        placeholder="Enter 10-digit phone number"
                      />
                    </div>
                    <button
                      onClick={handleSendOtp}
                      disabled={otpLoading}
                      className="w-full px-4 py-3 sm:py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors text-base sm:text-sm"
                    >
                      {otpLoading ? "Sending..." : "📱 Send OTP"}
                    </button>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 uppercase text-center text-base sm:text-sm tracking-widest placeholder-gray-400 font-semibold"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.toUpperCase())}
                        placeholder="000000"
                        maxLength={6}
                      />
                      <p className="text-xs sm:text-sm text-gray-500 mt-2">6-digit OTP sent to your phone</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
                      <button
                        onClick={handleVerifyOtp}
                        disabled={otpLoading}
                        className="flex-1 px-4 py-3 sm:py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors text-base sm:text-sm"
                      >
                        {otpLoading ? "Verifying..." : "✅ Verify OTP"}
                      </button>
                      <button
                        onClick={() => {
                          setOtp("");
                          setOtpSent(false);
                        }}
                        disabled={otpLoading}
                        className="flex-1 px-4 py-3 sm:py-2.5 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-300 text-gray-900 font-semibold rounded-lg transition-colors text-base sm:text-sm"
                      >
                        🔙 Back
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          </>
          </>
        )}

        {/* Orders Tab */}
        {!isAdmin && activeTab === "orders" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-blue-400">My Orders</h2>
            
            {orders.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {orders.map((order) => (
                  <div key={order._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-3 gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">Order #{order._id.substring(0, 8).toUpperCase()}</h4>
                        <p className="text-xs text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                        order.status === "Delivered" ? "bg-green-100 text-green-800" :
                        order.status === "Shipped" ? "bg-blue-100 text-blue-800" :
                        order.status === "Pending" ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-4 space-y-1">
                      <p>{order.items.length} item(s)</p>
                      <p className="font-semibold text-gray-900">₹{(order.totalPrice || 0).toFixed(2)}</p>
                    </div>
                    <NavLink 
                      to="/orders"
                      className="block w-full text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-sm"
                    >
                      View Details
                    </NavLink>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">📦</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No orders yet</h3>
                <p className="text-gray-600 mb-6">Start shopping to see your orders here!</p>
                <NavLink
                  to="/products"
                  className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  🛍️ Shop Now
                </NavLink>
              </div>
            )}
          </div>
        )}

        {/* Admin Overview Tab */}
        {isAdmin && activeTab === "overview" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6">
              <p className="text-sm text-purple-600 font-semibold mb-2">Total Orders</p>
              <p className="text-4xl font-bold text-purple-900">{totalOrders.toLocaleString()}</p>
              <p className="text-sm text-purple-600 mt-3">Live order count</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
              <p className="text-sm text-green-600 font-semibold mb-2">Total Revenue</p>
              <p className="text-4xl font-bold text-green-900">₹{totalRevenue.toLocaleString("en-IN")}</p>
              <p className="text-sm text-green-600 mt-3">Live revenue from orders</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
              <p className="text-sm text-blue-600 font-semibold mb-2">Active Users</p>
              <p className="text-4xl font-bold text-blue-900">{activeUsers.toLocaleString()}</p>
              <p className="text-sm text-blue-600 mt-3">Users currently active</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6">
              <p className="text-sm text-orange-600 font-semibold mb-2">Available Users</p>
              <p className="text-4xl font-bold text-orange-900">{availableUsers.toLocaleString()}</p>
              <p className="text-sm text-orange-600 mt-3">Total users available in the system</p>
            </div>
          </div>
        )}

        {/* Admin Users Tab */}
        {isAdmin && activeTab === "users" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-purple-400">Manage Users</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Phone</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsers.length > 0 ? (
                    adminUsers.slice(0, 10).map((adminUser) => (
                      <tr key={adminUser._id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-900">{adminUser.name}</td>
                        <td className="py-3 px-4 text-gray-700">{adminUser.email}</td>
                        <td className="py-3 px-4 text-gray-700">{adminUser.phone || "N/A"}</td>
                        <td className="py-3 px-4">
                          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                            {(adminUser.role || "user").charAt(0).toUpperCase() + (adminUser.role || "user").slice(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomer(adminUser._id)}
                            disabled={!adminUser._id || deleteLoading === adminUser._id || user?._id === adminUser._id}
                            className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                          >
                            {deleteLoading === adminUser._id ? "Deleting..." : "Delete User"}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-6 px-4 text-center text-gray-500" colSpan={5}>
                        No users available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Admin Orders Tab */}
        {isAdmin && activeTab === "admin-orders" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-purple-400">Manage Orders</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Order ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {adminOrders.length > 0 ? (
                    adminOrders.slice(0, 10).map((order) => (
                      <tr key={order._id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-4 font-semibold text-gray-900">#{order.orderId || order._id.slice(0, 6)}</td>
                        <td className="py-3 px-4 text-gray-700">{order.userId?.name || "Customer order"}</td>
                        <td className="py-3 px-4 text-gray-900 font-semibold">₹{(order.totalPrice || 0).toLocaleString("en-IN")}</td>
                        <td className="py-3 px-4">
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-6 px-4 text-center text-gray-500" colSpan={4}>
                        No orders available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div>
            {!isAdmin ? (
              <ProfileSettings />
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-purple-400">Admin Settings</h2>

                {/* Change Password Section */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
                  {passwordError && <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{passwordError}</div>}
                  {passwordSuccess && <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{passwordSuccess}</div>}
                  
                  {passwordMode ? (
                    <div className="space-y-4 bg-gray-50 p-6 rounded-lg">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
                        <input
                          type="password"
                          name="currentPassword"
                          placeholder="Enter current password"
                          title="Current password"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                        <input
                          type="password"
                          name="newPassword"
                          placeholder="Enter new password"
                          title="New password"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                        <input
                          type="password"
                          name="confirmPassword"
                          placeholder="Confirm new password"
                          title="Confirm new password"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                        />
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={handlePasswordSave}
                          className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                        >
                          💾 Save Password
                        </button>
                        <button
                          onClick={() => setPasswordMode(false)}
                          className="flex-1 px-4 py-2.5 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setPasswordMode(true)}
                      className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                    >
                      🔐 Change Password
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
