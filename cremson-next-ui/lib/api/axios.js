import axios from "axios";
import { toast } from "sonner";

export const getApiBaseUrl = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    // Always use HTTPS API for any non-localhost hostname
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      return "https://api.cremsonpublications.com";
    }
  }
  // Fallback: prefer env var, default to localhost for local dev
  const envUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  // Safety: if env var is http but not localhost, force https
  if (envUrl.startsWith("http://") && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
    return envUrl.replace("http://", "https://");
  }
  return envUrl;
};

const api = axios.create({
  headers: { "Content-Type": "application/json" },
});

// Set baseURL dynamically on every request so it always reflects current hostname
api.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  return config;
});

api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("cremson_token") : null;
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => {
    // Auto-show success toast when API returns a message on mutations (client side only)
    if (typeof window !== "undefined") {
      const method = response.config?.method?.toLowerCase();
      if (["post", "put", "patch", "delete"].includes(method)) {
        const msg = response.data?.message;
        if (msg) toast.success(msg);
      }
    }
    return response;
  },
  (error) => {
    let msg = "Something went wrong. Please try again.";
    if (error.code === "ECONNABORTED") {
      msg = "Request timed out. Please try again.";
      error.response = { data: { detail: msg } };
    } else if (!error.response) {
      msg = "Cannot connect to server. Please check your connection.";
      error.response = { data: { detail: msg } };
    } else {
      const raw = error.response.data?.detail;
      if (typeof raw === "string") {
        msg = raw;
      } else if (Array.isArray(raw)) {
        msg = raw.map(e => `${e.loc?.slice(-1)[0] || "field"}: ${e.msg}`).join("; ");
      } else if (raw) {
        msg = JSON.stringify(raw);
      }
    }

    if (typeof window !== "undefined") {
      toast.error(msg);
    }

    return Promise.reject(error);
  }
);

export default api;
