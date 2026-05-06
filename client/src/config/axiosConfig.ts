import axios from "axios";
import { API_BASE_URL } from "../utils/apiConfig";

const LOCAL_API_ORIGIN = "http://localhost:5000";
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

function rewriteLegacyUrl(url?: string) {
  if (!url || !url.startsWith(LOCAL_API_ORIGIN)) return url;
  if (url.startsWith(`${LOCAL_API_ORIGIN}/api`)) {
    return url.replace(`${LOCAL_API_ORIGIN}/api`, API_BASE_URL);
  }
  return url.replace(LOCAL_API_ORIGIN, API_ORIGIN);
}

// Rewrite legacy localhost URLs to env-based backend URL.
axios.interceptors.request.use((config) => {
  config.url = rewriteLegacyUrl(config.url);
  return config;
});

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

      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "token",
          newValue: null,
        })
      );

      // Redirect to login
      window.location.href = "/Login";
    }
    return Promise.reject(error);
  }
);

export default axios;
