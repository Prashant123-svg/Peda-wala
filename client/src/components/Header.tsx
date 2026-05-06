import { NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import logo from "../assets/logo.png";
import AdminPanel from "./AdminPanel";
import { useUserContext } from "../context/UserContext";

const Header = () => {
  const navigate = useNavigate();
  const { user, isAdmin: contextIsAdmin, logout, refreshUser } = useUserContext();
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const liveUserName = user?.name || "Profile";
  
  // Double-check: user is admin/subAdmin if BOTH context and localStorage confirm it
  const isAdmin = contextIsAdmin === true || userRole === "admin" || userRole === "subAdmin";
  const isDeliveryBoy = userRole === "deliveryBoy";

  useEffect(() => {
    console.log(`👤 Header Debug - Token: ${!!token}, UserName: ${liveUserName}, UserRole: ${userRole}, isAdmin: ${isAdmin}`);
  }, [token, liveUserName, userRole, isAdmin]);

  useEffect(() => {
    if (token) {
      refreshUser().catch((error) => {
        console.error("Error refreshing header user:", error);
      });
    }
  }, [token, refreshUser]);

  useEffect(() => {
    // Listen for changes in localStorage to update admin status
    const handleStorageChange = () => {
      const newUserRole = localStorage.getItem("userRole");
      console.log(`🔄 Storage changed - New UserRole: ${newUserRole}`);
    };
    
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/Login");
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <>
      <header className="bg-black shadow-lg fixed top-0 left-0 z-50 w-full">
        <div className="w-full px-2 xs:px-3 sm:px-4 md:px-6 max-w-full">
          <div className="flex items-center justify-between py-2 xs:py-2 sm:py-2.5 gap-2 xs:gap-3">
            {/* Logo / Brand - Fixed Size */}
            <NavLink
              to="/"
              className="flex items-center no-underline flex-shrink-0"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="flex items-center gap-1 xs:gap-1.5">
                <img
                  src={logo}
                  alt="Pedhe Wala Logo"
                  className="h-14 xs:h-15 sm:h-16 w-14 xs:w-15 sm:w-16 object-contain flex-shrink-0 max-h-16 max-w-16"
                />
                <h1
                  className="m-0 font-bold text-yellow-400 text-xs xs:text-sm sm:text-base block whitespace-nowrap flex-shrink-0"
                >
                  Pedhe Wala
                </h1>
              </div>
            </NavLink>

            {/* Hamburger Menu Button (Mobile) */}
            <button
              className="lg:hidden p-1 text-yellow-400 text-2xl bg-transparent border-0"
              onClick={toggleMobileMenu}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1 xl:gap-2 flex-1 ml-4">
              <ul className="flex gap-0 m-0 p-0 list-none">
                <li>
                  <NavLink
                    to="/"
                    className={({ isActive }) =>
                      `flex items-center px-1 xl:px-2 py-1 no-underline text-xs sm:text-sm whitespace-nowrap ${
                        isActive ? "text-yellow-400 font-bold" : "text-white hover:text-yellow-300"
                      }`
                    }
                  >
                    🏠 Home
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/Categories"
                    className={({ isActive }) =>
                      `flex items-center px-1 xl:px-2 py-1 no-underline text-xs sm:text-sm whitespace-nowrap ${
                        isActive ? "text-yellow-400 font-bold" : "text-white hover:text-yellow-300"
                      }`
                    }
                  >
                    📊 Categories
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/Orders"
                    className={({ isActive }) =>
                      `flex items-center px-1 xl:px-2 py-1 no-underline text-xs sm:text-sm whitespace-nowrap ${
                        isActive ? "text-yellow-400 font-bold" : "text-white hover:text-yellow-300"
                      }`
                    }
                  >
                    📋 Orders
                  </NavLink>
                </li>
                {/* Admin Approvals Link */}
                {userRole === "admin" && (
                  <li>
                    <NavLink
                      to="/admin/approvals"
                      className={({ isActive }) =>
                        `flex items-center px-1 xl:px-2 py-1 no-underline text-xs sm:text-sm whitespace-nowrap ${
                          isActive ? "text-yellow-400 font-bold" : "text-white hover:text-yellow-300"
                        }`
                      }
                    >
                      ✅ Approvals
                    </NavLink>
                  </li>
                )}
                <li>
                  <NavLink
                    to="/Products"
                    className={({ isActive }) =>
                      `flex items-center px-1 xl:px-2 py-1 no-underline text-xs sm:text-sm whitespace-nowrap ${
                        isActive ? "text-yellow-400 font-bold" : "text-white hover:text-yellow-300"
                      }`
                    }
                  >
                    🛍️ Products
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/Profile"
                    className={({ isActive }) =>
                      `flex items-center px-1 xl:px-2 py-1 no-underline text-xs sm:text-sm whitespace-nowrap ${
                        isActive ? "text-yellow-400 font-bold" : "text-white hover:text-yellow-300"
                      }`
                    }
                  >
                    👤 Profile
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/Help"
                    className={({ isActive }) =>
                      `flex items-center px-1 xl:px-2 py-1 no-underline text-xs sm:text-sm whitespace-nowrap ${
                        isActive ? "text-yellow-400 font-bold" : "text-white hover:text-yellow-300"
                      }`
                    }
                  >
                    ❓ Help
                  </NavLink>
                </li>
                {/* Sub-Admin Dashboard */}
                {userRole === "subAdmin" && (
                  <li>
                    <NavLink
                      to="/sub-admin/dashboard"
                      className={({ isActive }) =>
                        `flex items-center px-1 xl:px-2 py-1 no-underline text-xs sm:text-sm whitespace-nowrap ${
                          isActive ? "text-yellow-400 font-bold" : "text-white hover:text-yellow-300"
                        }`
                      }
                    >
                      📋 Dashboard
                    </NavLink>
                  </li>
                )}
                {/* Delivery Boy Dashboard */}
                {userRole === "deliveryBoy" && (
                  <li>
                    <NavLink
                      to="/delivery-boy/dashboard"
                      className={({ isActive }) =>
                        `flex items-center px-2.5 xl:px-4 py-1.5 no-underline text-xs sm:text-sm whitespace-nowrap rounded-lg transition-all duration-300 font-medium ${
                          isActive 
                            ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold shadow-lg shadow-green-500/50" 
                            : "text-white hover:bg-green-600/20 hover:text-green-300 border border-green-600/30 hover:border-green-500/60"
                        }`
                      }
                    >
                      <span className="mr-2">🚚</span> Deliveries
                    </NavLink>
                  </li>
                )}
              </ul>
            </div>

            {/* Desktop Buttons */}
            <div className="hidden lg:flex gap-1 xl:gap-2 flex-1 justify-end">
              {!token ? (
                <>
                  <NavLink to="/Login">
                    <button
                      type="button"
                      className="rounded-full px-3 xl:px-6 py-1.5 xl:py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all duration-300 text-xs sm:text-sm"
                    >
                      Login
                    </button>
                  </NavLink>
                  <NavLink to="/SignUp">
                    <button
                      type="button"
                      className="rounded-full px-3 xl:px-6 py-1.5 xl:py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold transition-all duration-300 text-xs sm:text-sm"
                    >
                      Sign Up
                    </button>
                  </NavLink>
                </>
              ) : (
                <button
                  onClick={handleLogout}
                  type="button"
                  className="rounded-full px-3 xl:px-6 py-1.5 xl:py-2 bg-red-600 hover:bg-red-700 text-white font-semibold transition-all duration-300 text-xs sm:text-sm"
                >
                  Logout
                </button>
              )}
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-700 py-2 xs:py-3 mt-2">
              <ul className="flex flex-col gap-1 xs:gap-1.5 m-0 p-0 list-none">
                <li>
                  <NavLink
                    to="/"
                    className={({ isActive }) =>
                      `flex items-center px-0 py-1 no-underline text-sm ${
                        isActive ? "text-yellow-400 font-bold" : "text-white hover:text-yellow-300"
                      }`
                    }
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    🏠 Home
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/Categories"
                    className={({ isActive }) =>
                      `flex items-center px-0 py-1 no-underline text-sm ${
                        isActive ? "text-yellow-400 font-bold" : "text-white hover:text-yellow-300"
                      }`
                    }
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    📊 Categories
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/Orders"
                    className={({ isActive }) =>
                      `flex items-center px-0 py-1 no-underline text-sm ${
                        isActive ? "text-yellow-400 font-bold" : "text-white hover:text-yellow-300"
                      }`
                    }
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    📋 Orders
                  </NavLink>
                </li>
                {/* Mobile Admin Approvals Link */}
                {userRole === "admin" && (
                  <li>
                    <NavLink
                      to="/admin/approvals"
                      className={({ isActive }) =>
                        `flex items-center px-0 py-1 no-underline text-sm ${
                          isActive ? "text-yellow-400 font-bold" : "text-white hover:text-yellow-300"
                        }`
                      }
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      ✅ Approvals
                    </NavLink>
                  </li>
                )}
                <li>
                  <NavLink
                    to="/Products"
                    className={({ isActive }) =>
                      `flex items-center px-0 py-1 no-underline text-sm ${
                        isActive ? "text-yellow-400 font-bold" : "text-white hover:text-yellow-300"
                      }`
                    }
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    🛍️ Products
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/Profile"
                    className={({ isActive }) =>
                      `flex items-center px-0 py-1 no-underline text-sm ${
                        isActive ? "text-yellow-400 font-bold" : "text-white hover:text-yellow-300"
                      }`
                    }
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    👤 Profile
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/Help"
                    className={({ isActive }) =>
                      `flex items-center px-0 py-1 no-underline text-sm ${
                        isActive ? "text-yellow-400 font-bold" : "text-white hover:text-yellow-300"
                      }`
                    }
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    ❓ Help
                  </NavLink>
                </li>
                {/* Sub-Admin Dashboard (Mobile) */}
                {userRole === "subAdmin" && (
                  <li>
                    <NavLink
                      to="/sub-admin/dashboard"
                      className={({ isActive }) =>
                        `flex items-center px-0 py-1 no-underline text-sm ${
                          isActive ? "text-yellow-400 font-bold" : "text-white hover:text-yellow-300"
                        }`
                      }
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      📋 Dashboard
                    </NavLink>
                  </li>
                )}
                {/* Delivery Boy Dashboard (Mobile) */}
                {userRole === "deliveryBoy" && (
                  <li>
                    <NavLink
                      to="/delivery-boy/dashboard"
                      className={({ isActive }) =>
                        `flex items-center px-2 py-2 no-underline text-sm rounded-lg transition-all duration-300 font-medium ${
                          isActive 
                            ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold shadow-lg" 
                            : "text-white hover:bg-green-600/20 hover:text-green-300 border border-green-600/30 hover:border-green-500/60"
                        }`
                      }
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="mr-2">🚚</span> Deliveries
                    </NavLink>
                  </li>
                )}
                {/* Admin Dashboard (Mobile) */}
                {userRole === "admin" && (
                  <li>
                    <NavLink
                      to="/admin/orders"
                      className={({ isActive }) =>
                        `flex items-center px-0 py-1 no-underline text-sm ${
                          isActive ? "text-yellow-400 font-bold" : "text-white hover:text-yellow-300"
                        }`
                      }
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      📊 Orders
                    </NavLink>
                  </li>
                )}
              </ul>

              {/* Mobile Buttons */}
              <div className="flex gap-1.5 mt-2 xs:mt-3">
                {!token ? (
                  <>
                    <NavLink to="/Login" className="flex-1">
                      <button
                        type="button"
                        className="w-full rounded-full px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all duration-300 text-xs sm:text-sm"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Login
                      </button>
                    </NavLink>
                    <NavLink to="/SignUp" className="flex-1">
                      <button
                        type="button"
                        className="w-full rounded-full px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold transition-all duration-300 text-xs sm:text-sm"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign Up
                      </button>
                    </NavLink>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    type="button"
                    className="w-full rounded-full px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold transition-all duration-300 text-xs sm:text-sm"
                  >
                    Logout
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </header>
      <AdminPanel isOpen={isAdminPanelOpen} onClose={() => setIsAdminPanelOpen(false)} />
    </>
  );
};

export default Header;
