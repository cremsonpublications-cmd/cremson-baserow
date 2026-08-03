import axios from "axios";
import { toast } from "sonner";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("cremson_token") : null;
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => {
    // Auto-show success toast when API returns a message on mutations
    const method = response.config?.method?.toLowerCase();
    if (["post", "put", "patch", "delete"].includes(method)) {
      const msg = response.data?.message;
      if (msg) toast.success(msg);
    }
    return response;
  },
  (error) => {
    if (error.code === "ECONNABORTED") {
      const msg = "Request timed out. Please try again.";
      error.response = { data: { detail: msg } };
      toast.error(msg);
    } else if (!error.response) {
      const msg = "Cannot connect to server. Please check your connection.";
      error.response = { data: { detail: msg } };
      toast.error(msg);
    } else {
      const raw = error.response.data?.detail;
      let msg;
      if (!raw) {
        msg = "Something went wrong. Please try again.";
      } else if (typeof raw === "string") {
        msg = raw;
      } else if (Array.isArray(raw)) {
        // Pydantic v2 validation errors: [{loc, msg, type, ...}]
        msg = raw.map(e => `${e.loc?.slice(-1)[0] || "field"}: ${e.msg}`).join("; ");
      } else {
        msg = JSON.stringify(raw);
      }
      toast.error(msg);
    }
    return Promise.reject(error);
  }
);

export default api;
