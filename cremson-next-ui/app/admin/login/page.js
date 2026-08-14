"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../../../lib/api/axios";
import { Lock, Mail, Loader2, Eye, EyeOff } from "lucide-react";
import CPLogo from "../../../components/CPLogo";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("cremson_admin_token")) {
      router.replace("/admin");
    }
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/api/admin/login", { email, password });
      localStorage.setItem("cremson_admin_token", data.access_token);
      router.replace("/admin");
    } catch (err) {
      setError(err?.response?.data?.detail || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gray-50"
      style={{ fontFamily: "'Satoshi', 'Inter', sans-serif" }}
    >
      {/* Card */}
      <div className="w-full max-w-sm px-8 py-10 bg-white rounded-2xl shadow-lg border border-gray-100">

        {/* Logo centered */}
        <div className="flex justify-center mb-8">
          <CPLogo className="h-14 w-auto" />
        </div>

        {/* Heading */}
        <div className="mb-8 text-center">
          <h1 className="text-gray-900 font-black text-2xl leading-tight">Welcome Back</h1>
          <p className="text-sm mt-1.5 text-gray-500">
            Sign in to your admin account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Email */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 text-gray-500">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="admin@cremson.com"
                className="w-full pl-10 pr-4 py-3 text-sm font-medium text-gray-800 rounded-xl outline-none transition-all bg-gray-50 border border-gray-200 placeholder-gray-400"
                onFocus={(e) => {
                  e.target.style.border = "1px solid #c41e3a";
                  e.target.style.boxShadow = "0 0 0 3px rgba(196,30,58,0.08)";
                }}
                onBlur={(e) => {
                  e.target.style.border = "1px solid #e5e7eb";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 text-gray-500">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full pl-10 pr-12 py-3 text-sm font-medium text-gray-800 rounded-xl outline-none transition-all bg-gray-50 border border-gray-200 placeholder-gray-400"
                onFocus={(e) => {
                  e.target.style.border = "1px solid #c41e3a";
                  e.target.style.boxShadow = "0 0 0 3px rgba(196,30,58,0.08)";
                }}
                onBlur={(e) => {
                  e.target.style.border = "1px solid #e5e7eb";
                  e.target.style.boxShadow = "none";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors cursor-pointer text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-xs font-semibold leading-relaxed bg-red-50 border border-red-200 text-red-600">
              <span className="mt-0.5 shrink-0">⚠</span>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-sm text-white transition-all cursor-pointer disabled:opacity-60 mt-2"
            style={{
              background: loading
                ? "rgba(196,30,58,0.6)"
                : "linear-gradient(135deg, #c41e3a 0%, #9a1530 100%)",
              boxShadow: loading ? "none" : "0 4px 20px rgba(196,30,58,0.25)",
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.boxShadow = "0 4px 28px rgba(196,30,58,0.4)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(196,30,58,0.25)"; }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Authenticating…
              </>
            ) : (
              "Sign In to Dashboard"
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-[10px] font-semibold uppercase tracking-widest mt-8 text-gray-300">
          © {new Date().getFullYear()} Cremson Publications · Secured Portal
        </p>
      </div>
    </div>
  );
}
