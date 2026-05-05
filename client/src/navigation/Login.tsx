  import axios from "axios";
  import { useState, useEffect } from "react";
  import { Link, useNavigate, useSearchParams } from "react-router-dom";
  import { useNotificationContext } from "../context/NotificationContext";
  import { useUserContext } from "../context/UserContext";
  import { API_BASE_URL } from "../utils/apiConfig";

  const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { success, error } = useNotificationContext();
    const { refreshUser } = useUserContext();

    // Handle Google OAuth callback
    useEffect(() => {
      const token = searchParams.get("token");
      const userParam = searchParams.get("user");
      const errorParam = searchParams.get("error");

      console.log("🔍 Login callback check - Token:", !!token, "User param:", !!userParam, "Error param:", errorParam);

      if (errorParam) {
        console.error("❌ Google OAuth error:", errorParam);
        error(`❌ Google login failed: ${errorParam}`);
        return;
      }

      if (token && userParam) {
        void (async () => {
          try {
            console.log("📝 Raw user param:", userParam);
            const user = JSON.parse(decodeURIComponent(userParam));

            console.log("✅ Parsed user data:", user);
            console.log("💾 Saving to localStorage...");

            // Save all user data to localStorage
            localStorage.setItem("token", token);
            localStorage.setItem("userId", user.id);
            localStorage.setItem("userName", user.name);
            localStorage.setItem("userEmail", user.email);
            localStorage.setItem("userRole", user.role || "user");

            console.log("✅ Data saved to localStorage");
            console.log("📋 Saved user data:", {
              userId: user.id,
              userName: user.name,
              userEmail: user.email,
              userRole: user.role || "user"
            });

            await refreshUser();

            console.log("✅ Google login successful for:", user.email);
            success("✅ Google login successful! Welcome back to Peda-Wale!");

            // Clear URL params and redirect with a small delay to ensure state updates
            setTimeout(() => {
              console.log("🔄 Redirecting to home page...");
              window.history.replaceState({}, document.title, window.location.pathname);
              navigate("/", { replace: true });
            }, 500);
          } catch (err) {
            console.error("❌ Error parsing user data:", err);
            console.error("❌ userParam value:", userParam);
            error("❌ Failed to process login data. Please try again.");
          }
        })();
      }
    }, [searchParams, navigate, success, error]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (submitting) return;
      setSubmitting(true);
      try {
        const res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
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

    const handleGoogleLogin = async () => {
      // Use the API base URL to get the server URL
      const serverUrl = API_BASE_URL.replace(/\/api\/?$/i, "");

      try {
        console.log("🔄 Checking Google OAuth configuration...");
        const res = await axios.get(`${API_BASE_URL}/auth/debug/oauth-config`);
        console.log("📋 OAuth config response:", res.data);
        
        const configured = typeof res.data.googleOAuthConfigured === "string"
          ? res.data.googleOAuthConfigured.includes("Yes")
          : Boolean(res.data.googleOAuthConfigured);

        if (!configured) {
          console.error("❌ Google OAuth not configured");
          error("⚠️ Google OAuth is not configured on the server.");
          return;
        }

        console.log("✅ Google OAuth is configured");
        console.log("🔗 Redirecting to Google OAuth at:", `${serverUrl}/auth/google?flow=login`);
        window.location.href = `${serverUrl}/auth/google?flow=login`;
      } catch (err: any) {
        console.error("❌ Error checking OAuth config:", err);
        error("❌ Unable to contact server to start Google login.");
      }
    };

    return (
      <div className="login-page min-h-screen w-full bg-linear-to-br from-amber-50 via-white to-yellow-100 px-4 py-10 sm:px-6 lg:px-8 flex items-center justify-center">
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

          <div className="mt-6 mb-5">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full mt-4 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold px-4 py-2.5 sm:py-3 transition flex items-center justify-center gap-2"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 4 1.5l2.7-2.6C16.7 3.2 14.6 2.3 12 2.3 6.9 2.3 2.7 6.5 2.7 11.6S6.9 20.9 12 20.9c5.8 0 9.7-4 9.7-9.6 0-.7-.1-1.2-.2-1.7H12Z" />
                <path fill="#FBBC05" d="M3.6 7.3 6.9 9.7C7.8 7.8 9.8 6.5 12 6.5c1.9 0 3.2.8 4 1.5l2.7-2.6C16.7 3.2 14.6 2.3 12 2.3 8.3 2.3 5.1 4.4 3.6 7.3Z" />
                <path fill="#34A853" d="M12 20.9c2.5 0 4.6-.8 6.1-2.2l-3-2.4c-.8.5-1.9 1.1-3.1 1.1-2.3 0-4.3-1.3-5.1-3.1l-3.3 2.5C5.1 18.8 8.3 20.9 12 20.9Z" />
                <path fill="#4285F4" d="M21.7 11.6c0-.7-.1-1.2-.2-1.7H12v3.9h5.5c-.3 1.3-1.1 2.4-2.4 3.1l3 2.4c1.7-1.6 2.6-4 2.6-7.7Z" />
              </svg>
              Login with Google
            </button>
          </div>

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
