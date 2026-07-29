import api from "./axios";

export async function register({ name, email, phone, password }) {
  const { data } = await api.post("/api/auth/register", { name, email, phone, password });
  return data;
}

export async function verifyEmail({ email, otp }) {
  const { data } = await api.post("/api/auth/verify-email", { email, otp });
  return data;
}

export async function resendOTP({ email }) {
  const { data } = await api.post("/api/auth/resend-otp", { email });
  return data;
}

export async function login({ email, password }) {
  const { data } = await api.post("/api/auth/login", { email, password });
  return data;
}

export async function getMe(token) {
  const { data } = await api.get("/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}
