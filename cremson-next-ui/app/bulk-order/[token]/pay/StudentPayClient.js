"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, CreditCard, ShieldCheck, BookOpen, Building2, Users } from "lucide-react";
import api from "@/lib/api/axios";

export default function StudentPaymentPage() {
  const { token } = useParams();
  const [studentName, setStudentName] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [payLoading, setPayLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [justPaidName, setJustPaidName] = useState("");
  const [error, setError] = useState("");

  const { data: order, isLoading, refetch } = useQuery({
    queryKey: ["bulk-order-student-pay", token],
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
  const paidStudents = students.filter((s) => s.paid);
  const splitCount = Number(order.split_count || 2);
  const finalAmount = Number(order.final_amount || 0);
  const perStudentAmount = roundToTwo(finalAmount / splitCount);

  function roundToTwo(num) {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }

  const handlePay = async (e) => {
    e.preventDefault();
    if (!studentName.trim()) {
      alert("Please enter your name.");
      return;
    }
    const cleanPhone = studentPhone.trim().replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }

    setPayLoading(true);
    setError("");
    try {
      const res = await api.post(`/api/bulk-orders/${token}/initiate-student-payment`, {
        student_name: studentName.trim(),
        student_phone: cleanPhone,
      });
      const { razorpay_order_id, amount, currency, key_id, student_token } = res.data;

      const options = {
        key: key_id,
        amount,
        currency,
        name: "Cremson Publications",
        description: `Book Payment for ${order.school_name}`,
        order_id: razorpay_order_id,
        prefill: {
          name: studentName.trim(),
          contact: cleanPhone,
        },
        handler: async function (response) {
          try {
            await api.post(`/api/bulk-orders/${token}/verify-payment`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              student_token: student_token,
            });
            setJustPaidName(studentName.trim());
            setPaymentSuccess(true);
            setStudentName("");
            setStudentPhone("");
            refetch();
          } catch (err) {
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
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-start space-y-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-slate-100 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Student Book Payment</h2>
          <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
            <Building2 className="w-3.5 h-3.5" /> {order.school_name}
          </p>
        </div>

        {paymentSuccess ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h3 className="text-lg font-bold text-emerald-900">Payment Completed!</h3>
            <p className="text-xs text-emerald-700">
              Thank you <span className="font-bold">{justPaidName}</span>. Your payment of ₹{perStudentAmount} has been received.
            </p>
            <button
              onClick={() => setPaymentSuccess(false)}
              className="mt-2 text-xs font-semibold text-purple-600 hover:text-purple-800"
            >
              Pay for another student
            </button>
          </div>
        ) : paidStudents.length >= splitCount ? (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-blue-600 mx-auto" />
            <h3 className="text-lg font-bold text-blue-900">All Shares Paid!</h3>
            <p className="text-xs text-blue-700">
              All {splitCount} student payments for this bulk order have been successfully collected. The order will be shipped shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handlePay} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-medium">
                {error}
              </div>
            )}

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>School Name:</span>
                <span className="font-bold text-slate-900">{order.school_name}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-extrabold text-sm pt-2 border-t border-slate-200">
                <span>Payable Share Amount:</span>
                <span className="font-mono text-purple-700 text-base">₹{perStudentAmount}</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Student Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter Student Name"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Parent Phone Number</label>
                <input
                  type="tel"
                  required
                  minLength={10}
                  maxLength={10}
                  pattern="[0-9]{10}"
                  placeholder="Enter 10-digit Phone Number"
                  value={studentPhone}
                  onChange={(e) => setStudentPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={payLoading}
              className="w-full py-4 px-6 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
            >
              <CreditCard className="w-4 h-4" />
              {payLoading ? "Processing..." : `Pay ₹${perStudentAmount} Now`}
            </button>

            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Secure payment processed by Razorpay
            </div>
          </form>
        )}
      </div>

      {/* List of Paid Students */}
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6 border border-slate-100 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Users className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Received Payments ({paidStudents.length} of {splitCount})
          </h3>
        </div>

        {paidStudents.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-2">No payments received for this split order yet.</p>
        ) : (
          <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto pr-1">
            {paidStudents.map((st, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-900">{st.name}</span>
                  <span className="text-slate-500 ml-1.5 font-mono text-[10px]">({st.phone})</span>
                </div>
                <span className="font-bold text-emerald-600 font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                  ₹{st.amount} ✓
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
