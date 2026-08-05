"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../../../lib/api/axios";
import { Lock, Mail, Loader2, Eye, EyeOff, BookOpen } from "lucide-react";

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
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        fontFamily: "'Satoshi', 'Inter', sans-serif",
        background: "linear-gradient(145deg, #0d0d14 0%, #0f0a12 60%, #0a0008 100%)",
      }}
    >
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#c41e3a 1px, transparent 1px), linear-gradient(90deg, #c41e3a 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Ambient glows */}
      <div
        className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(196,30,58,0.14) 0%, transparent 70%)",
          transform: "translate(-40%, -40%)",
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(196,30,58,0.1) 0%, transparent 70%)",
          transform: "translate(40%, 40%)",
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(196,30,58,0.07) 0%, transparent 70%)" }}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm px-6">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(196,30,58,0.15)", border: "1px solid rgba(196,30,58,0.3)" }}
          >
            <BookOpen className="w-5 h-5" style={{ color: "#c41e3a" }} />
          </div>
          <span className="text-white font-black text-xl tracking-widest uppercase">Cremson Publications</span>
        </div>

        {/* Heading */}
        <div className="mb-8 text-center">
          <h1 className="text-white font-black text-3xl leading-tight">Welcome Back</h1>
          <p className="text-sm mt-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
            Sign in to your admin account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Email */}
          <div>
            <label
              className="block text-[10px] font-bold uppercase tracking-widest mb-1.5"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              Email Address
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                style={{ color: "rgba(255,255,255,0.3)" }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="admin@cremson.com"
                className="w-full pl-10 pr-4 py-3 text-sm font-medium text-white placeholder-transparent rounded-xl outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  caretColor: "#c41e3a",
                }}
                onFocus={(e) => {
                  e.target.style.border = "1px solid rgba(196,30,58,0.6)";
                  e.target.style.background = "rgba(255,255,255,0.07)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(196,30,58,0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.border = "1px solid rgba(255,255,255,0.1)";
                  e.target.style.background = "rgba(255,255,255,0.05)";
                  e.target.style.boxShadow = "none";
                }}
              />
              {!email && (
                <span
                  className="absolute left-10 top-1/2 -translate-y-1/2 text-sm pointer-events-none select-none"
                  style={{ color: "rgba(255,255,255,0.25)" }}
                >
                  admin@cremson.com
                </span>
              )}
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              className="block text-[10px] font-bold uppercase tracking-widest mb-1.5"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                style={{ color: "rgba(255,255,255,0.3)" }}
              />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full pl-10 pr-12 py-3 text-sm font-medium text-white rounded-xl outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  caretColor: "#c41e3a",
                }}
                onFocus={(e) => {
                  e.target.style.border = "1px solid rgba(196,30,58,0.6)";
                  e.target.style.background = "rgba(255,255,255,0.07)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(196,30,58,0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.border = "1px solid rgba(255,255,255,0.1)";
                  e.target.style.background = "rgba(255,255,255,0.05)";
                  e.target.style.boxShadow = "none";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors cursor-pointer"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-xs font-semibold leading-relaxed"
              style={{ background: "rgba(196,30,58,0.1)", border: "1px solid rgba(196,30,58,0.25)", color: "#f87171" }}
            >
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
              boxShadow: loading ? "none" : "0 4px 24px rgba(196,30,58,0.35)",
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.boxShadow = "0 4px 32px rgba(196,30,58,0.55)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 4px 24px rgba(196,30,58,0.35)"; }}
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
        <p
          className="text-center text-[10px] font-semibold uppercase tracking-widest mt-10"
          style={{ color: "rgba(255,255,255,0.18)" }}
        >
          © {new Date().getFullYear()} Cremson Publications · Secured Portal
        </p>
      </div>
    </div>
  );
}
