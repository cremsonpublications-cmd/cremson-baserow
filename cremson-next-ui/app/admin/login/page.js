"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../../../lib/api/axios";
import { Shield, Lock, Mail, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Already logged in → go to dashboard
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
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black flex items-center justify-center px-4 relative overflow-hidden">
      
      {/* Dynamic ambient background blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-red-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        
        {/* Logo / Header */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex p-3 bg-red-950/40 border border-red-500/20 rounded-2xl mb-2 text-red-500 shadow-inner">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">Cremson Publications</h1>
          <p className="text-slate-400 text-xs font-semibold tracking-wider uppercase">Administrative Portal Access</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] text-left animate-in fade-in zoom-in-95 duration-350">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="admin@cremson.com"
                  className="w-full border border-slate-800 bg-slate-950/50 hover:bg-slate-950 focus:bg-slate-950 text-white rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-600/50 transition-all placeholder-slate-600"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full border border-slate-800 bg-slate-950/50 hover:bg-slate-950 focus:bg-slate-950 text-white rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-600/50 transition-all placeholder-slate-600"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-950/30 border border-red-500/30 text-red-400 text-xs font-bold rounded-xl px-4 py-2.5 leading-relaxed">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 active:from-red-700 active:to-red-800 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-60 shadow-lg shadow-red-950/35 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>
        
        {/* Footer */}
        <p className="text-center text-[10px] text-slate-600 mt-8 font-semibold tracking-wider">
          SECURE AREA &bull; UNAUTHORIZED ACCESS PROHIBITED
        </p>
      </div>
    </div>
  );
}
