/**
 * API Service for Dashboard Operations
 * Handles all API calls for Admin, SubAdmin, and Orders management
 * 
 * Location: client/src/utils/dashboardApi.ts
 */

import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ============= ADMIN MANAGEMENT =============

export const adminApi = {
  // SubAdmin Management
  createSubAdmin: (data: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
  }) => axios.post(`${API_BASE}/admin/create-subadmin`, data),

  getSubAdmins: () => axios.get(`${API_BASE}/admin/subadmins`),

  removeSubAdmin: (subadminId: string) =>
    axios.delete(`${API_BASE}/admin/remove-subadmin/${subadminId}`),

  // DeliveryBoy Management
  addDeliveryBoy: (userId: string) =>
    axios.post(`${API_BASE}/admin/add-deliveryboy/${userId}`),

  getDeliveryBoys: () => axios.get(`${API_BASE}/admin/deliveryboys`),

  removeDeliveryBoy: (deliveryboyId: string) =>
    axios.delete(`${API_BASE}/admin/remove-deliveryboy/${deliveryboyId}`),

  // User Management
  getUsers: (filter?: { role?: string; status?: string }) =>
    axios.get(`${API_BASE}/admin/users`, { params: filter }),

  blockUser: (userId: string, isBlocked: boolean) =>
    axios.put(`${API_BASE}/admin/block-user/${userId}`, { isBlocked }),

  // Dashboard Stats
  getDashboardStats: () => axios.get(`${API_BASE}/admin/stats`),
};

// ============= SUBADMIN MANAGEMENT =============

export const subadminApi = {
  // Order Management
  getOrders: (params?: {
    status?: string;
    limit?: number;
    page?: number;
  }) => axios.get(`${API_BASE}/subadmin/orders`, { params }),

  getOrderDetails: (orderId: string) =>
    axios.get(`${API_BASE}/subadmin/orders/${orderId}`),

  updateOrderStatus: (
    orderId: string,
    data: { status: string; notes?: string }
  ) => axios.put(`${API_BASE}/subadmin/orders/${orderId}/status`, data),

  // DeliveryBoy Assignment
  assignDeliveryBoy: (data: { orderId: string; deliveryBoyId: string }) =>
    axios.post(`${API_BASE}/subadmin/assign-delivery-boy`, data),

  getUnassignedOrders: () =>
    axios.get(`${API_BASE}/subadmin/unassigned-orders`),

  getAvailableDeliveryBoys: () =>
    axios.get(`${API_BASE}/subadmin/available-delivery-boys`),

  // Customer Queries
  getCustomerQueries: (params?: { status?: string; limit?: number; page?: number }) =>
    axios.get(`${API_BASE}/subadmin/customer-queries`, { params }),

  // Reports
  getReports: (period: "day" | "week" | "month" = "week") =>
    axios.get(`${API_BASE}/subadmin/reports`, { params: { period } }),

  getDashboardSummary: () =>
    axios.get(`${API_BASE}/subadmin/dashboard-summary`),
};

// ============= ORDERS MANAGEMENT =============

export const ordersApi = {
  // User Operations
  getMyOrders: (params?: { limit?: number; page?: number }) =>
    axios.get(`${API_BASE}/orders/my-orders`, { params }),

  getOrderDetails: (orderId: string) =>
    axios.get(`${API_BASE}/orders/${orderId}`),

  createOrder: (data: {
    items: Array<{ productId: string; quantity: number; price: number }>;
    deliveryAddress: string;
    notes?: string;
  }) => axios.post(`${API_BASE}/orders/create`, data),

  cancelOrder: (orderId: string) =>
    axios.put(`${API_BASE}/orders/${orderId}/cancel`, {}),

  // DeliveryBoy Operations
  getAssignedOrders: () =>
    axios.get(`${API_BASE}/orders/delivery-boy/assigned`),

  updateDeliveryStatus: (
    orderId: string,
    data: { status: "in-transit" | "delivered" | "failed"; notes?: string }
  ) => axios.put(`${API_BASE}/orders/${orderId}/delivery-status`, data),

  // Admin/SubAdmin Operations
  getAllOrders: (params?: {
    status?: string;
    limit?: number;
    page?: number;
  }) => axios.get(`${API_BASE}/orders/all`, { params }),

  getOrderStats: () => axios.get(`${API_BASE}/orders/stats/summary`),
};

// ============= ERROR HANDLING HELPER =============

export const handleApiError = (error: any): string => {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 403) {
      return "❌ Access Denied: You don't have permission for this action";
    }
    if (error.response?.status === 404) {
      return "❌ Not Found: Resource doesn't exist";
    }
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
  }
  return "❌ An error occurred. Please try again.";
};

// ============= INTERCEPTORS & SETUP =============

// Add auth token to all requests
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses (expired token)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default {
  adminApi,
  subadminApi,
  ordersApi,
  handleApiError,
};
