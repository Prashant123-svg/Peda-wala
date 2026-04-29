import axios from "axios";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useNotificationContext } from "../context/NotificationContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { success, error } = useNotificationContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", { email, password });
      console.log("✅ Login response:", res.data.user);
      
      localStorage.setItem("token", res.data.token); // token save
      localStorage.setItem("userId", res.data.user.id); // ✅ user ID save - for user-specific cart
      localStorage.setItem("userName", res.data.user.name); // ✅ user name save
      localStorage.setItem("userEmail", res.data.user.email); // ✅ user email save
      localStorage.setItem("userRole", res.data.user.role || "user"); // ✅ user role save (admin or user)
      
      const userRole = res.data.user.role;
      console.log("💾 Saved to localStorage - Role:", userRole);
      
      success("✅ Login successful!");
      if (res.status === 200) {
        // Redirect to home page after login
        setTimeout(() => {
          console.log(`🔄 Redirecting to home page...`);
          navigate("/", { replace: true });
        }, 500);
      }
    } catch (err: any) {
      error(err.response?.data?.message || "❌ Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page min-h-screen w-full bg-gradient-to-br from-amber-50 via-white to-yellow-100 px-4 py-10 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-yellow-200 bg-white shadow-xl p-5 sm:p-7">
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Welcome Back</h2>
          <p className="text-sm text-gray-600">Login to continue ordering your favorite pedas.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 transition"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <input
              type="password"
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 transition"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-black hover:bg-gray-800 disabled:bg-gray-500 text-white font-semibold px-4 py-2.5 sm:py-3 transition"
          >
            {submitting ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-5">
          New user?{" "}
          <Link to="/signup" className="font-semibold text-yellow-700 hover:text-yellow-800 no-underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
