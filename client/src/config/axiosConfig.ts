import axios from "axios";

// Setup axios interceptor for error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("❌ 401 Unauthorized Error:", {
        message: error.response.data?.msg || error.response.data?.message || "Unauthorized",
        code: error.response.data?.code,
        endpoint: error.config?.url,
        headers: {
          authorization: error.config?.headers?.Authorization ? "Present" : "Missing"
        }
      });

      // Clear authentication data on 401
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("userName");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userRole");

      // Redirect to login
      window.location.href = "/Login";
    }
    return Promise.reject(error);
  }
);

export default axios;
