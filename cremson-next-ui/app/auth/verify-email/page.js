"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyEmail, resendOTP } from "../../../lib/api/auth";
import { useApp } from "../../../context/AppContext";
import CPLogo from "../../../components/CPLogo";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const role = searchParams.get("role") || "";
  const name = searchParams.get("name") || "";
  const phone = searchParams.get("phone") || "";
  const { authLogin } = useApp();

  // Read email from sessionStorage (not exposed in URL)
  useEffect(() => {
    const stored = sessionStorage.getItem("verify_email");
    const urlEmail = searchParams.get("email") || "";
    if (stored) {
      setEmail(stored);
    } else if (urlEmail) {
      setEmail(urlEmail);
    }
  }, [searchParams]);

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [countdown, setCountdown] = useState(60);
  const inputs = useRef([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      inputs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const code = otp.join("");
    if (code.length < 6) { setError("Please enter all 6 digits"); return; }

    setLoading(true);
    try {
      const data = await verifyEmail({ email, otp: code });
      sessionStorage.removeItem("verify_email");
      if (role === "teacher") {
        router.push(`/auth/signup?teacherSubmitted=true&name=${encodeURIComponent(name || data.user?.name || "")}`);
      } else {
        authLogin(data.access_token, data.user);
        router.push("/");
      }
    } catch (err) {
      setError(err?.response?.data?.detail || "Verification failed. Check the code and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setResending(true);
    setError("");
    try {
      await resendOTP({ email });
      setSuccess("New OTP sent to your WhatsApp!");
      setCountdown(60);
      setOtp(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/"><CPLogo className="max-w-[120px]" /></Link>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Check WhatsApp</h1>
          <p className="text-sm text-gray-500 mb-1">We sent a 6-digit code to</p>
          <p className="text-sm font-semibold text-gray-800 mb-6 break-all">{phone || email}</p>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 text-left">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (inputs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-12 h-14 text-center text-xl font-bold border-2 rounded-xl focus:outline-none focus:border-red-500 transition-all bg-gray-50 focus:bg-white"
                  style={{ borderColor: digit ? "#dc2626" : "#e5e7eb" }}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm uppercase tracking-wider rounded-xl shadow-md transition-all"
            >
              {loading ? "Verifying…" : "Verify Number"}
            </button>
          </form>

          <div className="mt-5 text-sm text-gray-500">
            Didn't receive the code?{" "}
            <button
              onClick={handleResend}
              disabled={countdown > 0 || resending}
              className={`font-semibold transition-colors ${countdown > 0 ? "text-gray-400 cursor-not-allowed" : "text-red-600 hover:underline"}`}
            >
              {resending ? "Sending…" : countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-4">
            Wrong number or email?{" "}
            <Link href="/auth/signup" className="text-red-600 hover:underline font-medium">Go back</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
