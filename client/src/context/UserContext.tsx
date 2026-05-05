import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../utils/apiConfig";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin" | "deliveryBoy";
}

interface UserContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // Load user from localStorage on mount
  const loadUserFromStorage = useCallback(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName");
    const userEmail = localStorage.getItem("userEmail");
    const userRole = localStorage.getItem("userRole") as "user" | "admin" | "deliveryBoy" | null;

    console.log(`📦 UserContext Loading - Role: ${userRole}, Token: ${!!token}, User: ${userName}`);

    if (token && userId && userName && userRole) {
      setUser({
        id: userId,
        name: userName,
        email: userEmail || "",
        role: userRole,
      });
      console.log(`✅ User loaded from localStorage:`, { id: userId, name: userName, role: userRole });
    } else if (!token) {
      console.log(`❌ No token found, clearing user`);
      setUser(null);
    }
  }, []);

  // Initial load on mount
  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  // Watch for storage changes from OAuth callback
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      console.log(`🔄 Storage event detected - Key: ${e.key}, NewValue: ${e.newValue}`);
      if (e.key === "token" || e.key === "userId" || e.key === "userRole") {
        console.log(`🔄 Auth data changed, reloading user...`);
        loadUserFromStorage();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [loadUserFromStorage]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
    setUser(null);
  };

  const refreshUser = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await axios.get(`${API_BASE_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const userData = res.data;
      setUser({
        id: userData._id,
        name: userData.name,
        email: userData.email,
        role: userData.role || "user",
      });

      // Update localStorage
      localStorage.setItem("userRole", userData.role || "user");
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
        logout,
        refreshUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used within UserProvider");
  }
  return context;
};
