import { useEffect } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ChatbotWidget from "./components/ChatbotWidget";
import Home from "./navigation/Home";
import Products from "./navigation/Products";
import Orders from "./navigation/Orders";
import OrderDetails from "./navigation/OrderDetails";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { NotificationProvider } from "./context/NotificationContext";
import { CartProvider } from "./context/CartContext";
import { UserProvider } from "./context/UserContext";
import Signup from "./navigation/SignUp";
import Categories from "./navigation/Categories";
import CategoryDetail from "./navigation/CategoryDetail";
import Profile from "./navigation/Profile";
import Login from "./navigation/Login";
import Checkout from "./navigation/Checkout"; 
import OrderConfirmation from "./navigation/OrderConfirmation";
import Help from "./navigation/Help";
import ProductDetail from "./navigation/ProductDetail";
import AdminDashboard from "./navigation/AdminDashboard";
import AdminCustomerDetails from "./navigation/AdminCustomerDetails";
import AdminOrderDetails from "./navigation/AdminOrderDetails";
import DeliveryBoyRolesPage from "./pages/DeliveryBoyRolesPage";
import SubAdminDashboard from "./pages/SubAdminDashboard";
import DeliveryBoyDashboard from "./pages/DeliveryBoyDashboard";
import OrderAdminDashboard from "./pages/AdminDashboard";
import OrderManagement from "./components/OrderManagement";
import RoleRequestApprovals from "./components/RoleRequestApprovals";
import { getSubdomainFromHost } from "./utils/subdomainUtils";

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const subdomain = getSubdomainFromHost();
  const userRole = localStorage.getItem("userRole");
  const token = localStorage.getItem("token");
  const isLoginPage = location.pathname === "/login";
  const isSignupPage = location.pathname === "/signup";

  // Check subdomain on mount and route accordingly
  useEffect(() => {
    // Only apply subdomain routing if actually on a subdomain
    if (subdomain) {
      console.log(`🌐 Subdomain detected: ${subdomain}`);
      
      // If on subdomain and user is sub-admin, show sub-admin dashboard
      if (userRole === "subAdmin" && token) {
        console.log("👨‍💼 Routing to Sub-Admin Dashboard");
        navigate("/admin", { replace: true });
      } else if (userRole === "deliveryBoy" && token) {
        console.log("🚚 Routing to Delivery Boy Dashboard");
        navigate("/delivery-boy/dashboard", { replace: true });
      } else if (!isLoginPage) {
        // If not logged in and not on login page, show login
        console.log("⚠️ No valid role on subdomain, redirecting to login");
        navigate("/login", { replace: true });
      }
    }
  }, [subdomain, userRole, token, navigate, isLoginPage]);

  return (
    <div className="app-container w-full min-h-screen flex flex-col">
      {/* Hide header/footer on subdomain dashboards and auth pages */}
      {!subdomain && !isLoginPage && !isSignupPage && <Header />}
      
      <div className={`content w-full flex-1 ${!subdomain && !isLoginPage && !isSignupPage ? 'mt-16' : ''}`}>
        <div className="main-content w-full">
          <Routes>
            {/* Main App Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/category/:name" element={<CategoryDetail />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/products" element={<Products />} />
            <Route path="/orders" element={<Orders />} />
            <Route
              path="/orders/:orderId"
              element={token ? <OrderDetails /> : <Navigate to="/login" replace state={{ from: location.pathname }} />}
            />
            <Route
              path="/profile"
              element={token ? <Profile /> : <Navigate to="/login" replace state={{ from: location.pathname }} />}
            />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/checkout"
              element={token ? <Checkout /> : <Navigate to="/login" replace state={{ from: location.pathname }} />}
            />
            <Route path="/order-confirmation" element={<OrderConfirmation />} />
            <Route path="/help" element={<Help />} />
            <Route path="/delivery-boy-roles" element={<DeliveryBoyRolesPage />} />
            
            {/* New Role-Based Dashboards */}
            <Route path="/sub-admin/dashboard" element={<SubAdminDashboard />} />
            <Route path="/delivery-boy/dashboard" element={<DeliveryBoyDashboard />} />
            <Route path="/admin/orders" element={<OrderAdminDashboard />} />
            <Route path="/admin/approvals" element={<RoleRequestApprovals isVisible={true} />} />
            <Route path="/order-management" element={<OrderManagement />} />
            
            {/* Legacy Admin Routes */}
            <Route path="/AdminDashboard" element={<AdminDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/customer/:customerId" element={<AdminCustomerDetails />} />
            <Route path="/admin/order/:orderId" element={<AdminOrderDetails />} />
          </Routes>
        </div>
      </div>
      
      {!subdomain && !isLoginPage && !isSignupPage && <Footer />}

      {/* Floating Chatbot Widget */}
      <ChatbotWidget position="bottom-right" />
    </div>
  );
}

function App() {
  return (
    <UserProvider>
      <CartProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </CartProvider>
    </UserProvider>
  );
}

export default App;
