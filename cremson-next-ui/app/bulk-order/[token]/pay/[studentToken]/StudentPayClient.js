"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, CreditCard, ShieldCheck, BookOpen, Building2, Loader2, PackageCheck, AlertTriangle } from "lucide-react";
import api from "@/lib/api/axios";

export default function StudentPaymentPage() {
  const { token, studentToken } = useParams();
  const [payLoading, setPayLoading] = useState(false);
  const [error, setError] = useState("");
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [verifyingStep, setVerifyingStep] = useState("");

  const { data: order, isLoading, refetch } = useQuery({
    queryKey: ["bulk-order-student-pay", token, studentToken],
    queryFn: async () => {
      const res = await api.get(`/api/bulk-orders/${token}`);
      return res.data;
    },
    enabled: !!token,
  });

  // Load Razorpay Script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full border border-slate-200">
          <p className="text-red-500 font-semibold mb-2">Link Invalid</p>
          <p className="text-slate-500 text-sm">This payment link is invalid or expired.</p>
        </div>
      </div>
    );
  }

  const students = Array.isArray(order.student_payments) ? order.student_payments : [];
  const student = students.find((s) => s.student_token === studentToken);

  if (!student) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full border border-slate-200">
          <p className="text-red-500 font-semibold mb-2">Student Link Not Found</p>
          <p className="text-slate-500 text-sm">Please ask your teacher for a valid link.</p>
        </div>
      </div>
    );
  }

  const handlePay = async () => {
    setPayLoading(true);
    setError("");
    try {
      const res = await api.post(`/api/bulk-orders/${token}/student-payment/${studentToken}`);
      const { razorpay_order_id, amount, currency, key_id, student_name } = res.data;

      const options = {
        key: key_id,
        amount,
        currency,
        name: "Cremson Publications",
        description: `Book Payment for ${order.school_name}`,
        order_id: razorpay_order_id,
        prefill: {
          name: student_name,
        },
        handler: async function (response) {
          setVerifyingPayment(true);
          setVerifyingStep("Verifying payment signature with bank...");
          try {
            await api.post(`/api/bulk-orders/${token}/verify-payment`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              student_token: studentToken,
            });
            setVerifyingStep("Payment confirmed successfully! Refreshing...");
            setTimeout(() => {
              setVerifyingPayment(false);
              refetch();
            }, 2000);
          } catch (err) {
            setVerifyingPayment(false);
            alert("Payment verification failed. Please contact support.");
          }
        },
        theme: { color: "#9333ea" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to initiate payment.");
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Student Book Payment</h2>
          <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
            <Building2 className="w-3.5 h-3.5" /> {order.school_name}
          </p>
        </div>

        {student.paid ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h3 className="text-lg font-bold text-emerald-900">Payment Completed!</h3>
            <p className="text-xs text-emerald-700">
              Thank you <span className="font-bold">{student.name}</span>. Your payment of ₹{student.amount} has been received.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-medium">
                {error}
              </div>
            )}

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Student Name:</span>
                <span className="font-bold text-slate-900">{student.name}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>School:</span>
                <span className="font-bold text-slate-900">{order.school_name}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-extrabold text-sm pt-2 border-t border-slate-200">
                <span>Payable Amount:</span>
                <span className="font-mono text-purple-700 text-base">₹{student.amount}</span>
              </div>
            </div>

            <button
              onClick={handlePay}
              disabled={payLoading}
              className="w-full py-4 px-6 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              {payLoading ? "Processing..." : `Pay ₹${student.amount} Now`}
            </button>

            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Secure payment processed by Razorpay
            </div>
          </div>
        )}
      </div>

      {/* Non-dismissable Payment Verification Overlay Modal */}
      {verifyingPayment && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-md z-[99999] flex items-center justify-center p-4 select-none"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100 text-center space-y-6 animate-in fade-in zoom-in duration-200 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Animated Status Indicator */}
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-purple-200 animate-ping opacity-25" />
              <div className="w-16 h-16 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/20 transform rotate-3">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-gray-900">
                Verifying Payment
              </h3>
              <div className="flex items-center justify-center gap-2 text-sm font-semibold text-purple-600">
                <PackageCheck className="w-4 h-4 animate-bounce" />
                <span className="animate-pulse">{verifyingStep}</span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-800 flex items-start gap-3 text-left">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="font-medium leading-relaxed">
                <strong className="block text-amber-900 mb-0.5">Do not close or refresh this page</strong>
                We are securely confirming your transaction.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
