"use client";

export const dynamic = "force-static";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Package, Clock, CheckCircle2, Copy, Share2, Users, CreditCard, Truck, ExternalLink, ShieldCheck } from "lucide-react";
import api from "@/lib/api/axios";

export default function BulkOrderDetailPage() {
  const { token } = useParams();

  const [splitCount, setSplitCount] = useState(10);
  const [splitLoading, setSplitLoading] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState("");
  const [error, setError] = useState("");

  const { data: order, isLoading, refetch } = useQuery({
    queryKey: ["bulk-order-detail", token],
    queryFn: async () => {
      const res = await api.get(`/api/bulk-orders/${token}`);
      return res.data;
    },
    enabled: !!token,
    refetchInterval: 5000, // Poll every 5s for student payment updates
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

  const handleTeacherPayFull = async () => {
    setPayLoading(true);
    setError("");
    try {
      const res = await api.post(`/api/bulk-orders/${token}/create-payment`);
      const { razorpay_order_id, amount, currency, key_id, contact_name, phone } = res.data;

      const options = {
        key: key_id,
        amount,
        currency,
        name: "Cremson Publications",
        description: `Bulk Order Payment (${order.school_name})`,
        order_id: razorpay_order_id,
        prefill: {
          name: contact_name,
          contact: phone,
        },
        handler: async function (response) {
          try {
            await api.post(`/api/bulk-orders/${token}/verify-payment`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
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

  const handleCreateSplit = async () => {
    if (!splitCount || splitCount < 2) {
      alert("Please enter a valid number of students (minimum 2).");
      return;
    }
    setSplitLoading(true);
    setError("");
    try {
      await api.post(`/api/bulk-orders/${token}/split`, {
        split_count: Number(splitCount),
      });
      refetch();
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to create split links.");
    } finally {
      setSplitLoading(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(label);
    setTimeout(() => setCopiedLink(""), 2500);
  };

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
          <p className="text-red-500 font-semibold mb-2">Order Not Found</p>
          <p className="text-slate-500 text-sm">This bulk order link is invalid or expired.</p>
        </div>
      </div>
    );
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const students = Array.isArray(order.student_payments) ? order.student_payments : [];
  const isApproved = order.status === "approved";
  const isPartiallyPaid = order.status === "partially_paid";
  const isFullyPaid = order.status === "fully_paid";
  const isShipped = order.status === "shipped";
  const isPending = order.status === "pending_review";

  const totalStudents = Number(order.split_count || students.length || 0);
  const paidStudents = Number(order.paid_count || students.filter((s) => s.paid).length || 0);
  const progressPct = totalStudents > 0 ? Math.round((paidStudents / totalStudents) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Top Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Bulk Order Tracker</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{order.school_name}</h1>
              <p className="text-xs text-slate-500 mt-0.5">Contact: {order.contact_name} ({order.phone})</p>
            </div>

            {/* Status Badge */}
            <div>
              {isPending && (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold">
                  <Clock className="w-4 h-4" /> Pending Admin Approval
                </span>
              )}
              {isApproved && (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-bold">
                  <ShieldCheck className="w-4 h-4" /> Approved — Ready to Pay
                </span>
              )}
              {isPartiallyPaid && (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold">
                  <Users className="w-4 h-4" /> Collecting Student Payments ({paidStudents}/{totalStudents})
                </span>
              )}
              {(isFullyPaid || isShipped) && (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" /> Fully Paid
                </span>
              )}
            </div>
          </div>

          {/* Pending Banner */}
          {isPending && (
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 space-y-1">
              <p className="font-bold text-sm">⏳ Order Under Review by Admin</p>
              <p>Our team is reviewing your bulk request and applying special discounted pricing. You will receive a WhatsApp message once approved with the updated link.</p>
            </div>
          )}

          {/* Fully Paid & Shipping Status Banner */}
          {(isFullyPaid || isShipped) && (
            <div className="mt-6 bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-sm">
                    {isShipped ? <Truck className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-emerald-950">
                      {isShipped ? "Order Dispatched & On The Way! 🚚" : "Payment Confirmed! ✅"}
                    </h3>
                    <p className="text-xs text-emerald-700 font-medium">
                      Full payment of <span className="font-extrabold font-mono">₹{Number(order.final_amount).toLocaleString()}</span> received for <span className="font-bold">{order.school_name}</span>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur border border-emerald-200/80 rounded-xl p-4 space-y-3 text-xs sm:text-sm">
                <div className="flex items-center justify-between border-b border-emerald-100 pb-2.5">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-emerald-600" /> Shipment Status
                  </span>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-extrabold rounded-full text-xs">
                    {isShipped ? "Dispatched" : "Preparing Shipment"}
                  </span>
                </div>

                {isShipped ? (
                  <div className="space-y-3 pt-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="text-slate-500">AWB Tracking Number:</span>{" "}
                        <span className="font-mono font-extrabold text-slate-900 text-sm ml-1">{order.shipway_awb}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Carrier:</span>{" "}
                        <span className="font-bold text-slate-800 ml-1">Shipway Courier</span>
                      </div>
                    </div>

                    <a
                      href={`https://shipway.in/track/${order.shipway_awb}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full py-3 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow text-xs sm:text-sm cursor-pointer"
                    >
                      Track Shipment Live on Shipway <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                ) : (
                  <div className="text-slate-600 leading-relaxed text-xs pt-1">
                    📦 Our warehouse team is preparing your books for dispatch. Automatic shipment generation with Shipway is in progress. You will receive live tracking updates via WhatsApp as soon as tracking is active!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pricing & Books Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Order Summary</h3>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs sm:text-sm">
            {items.map((i, idx) => (
              <div key={idx} className="px-4 py-3 flex justify-between items-center">
                <div>
                  <span className="font-semibold text-slate-900">{i.title}</span>
                  <span className="text-slate-500 ml-2">({i.qty} copies)</span>
                </div>
                <span className="font-mono font-bold text-slate-900">₹{(i.price * i.qty).toLocaleString()}</span>
              </div>
            ))}

            <div className="bg-slate-50 px-4 py-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono">₹{Number(order.subtotal || 0).toLocaleString()}</span>
              </div>

              {Number(order.discount_value || 0) > 0 && (
                <div className="flex justify-between text-purple-700 font-semibold">
                  <span>
                    Bulk Discount ({order.discount_type === "percentage" ? `${order.discount_value}%` : `₹${order.discount_value}`}):
                  </span>
                  <span className="font-mono">- ₹{(Number(order.subtotal) - Number(order.final_amount)).toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-900 font-extrabold text-sm sm:text-base pt-2 border-t border-slate-200">
                <span>Total Payable Amount:</span>
                <span className="font-mono text-purple-700">₹{Number(order.final_amount || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Action Section (If Approved or Partially Paid) */}
        {(isApproved || isPartiallyPaid) && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Choose Payment Method</h3>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-medium">
                {error}
              </div>
            )}

            {/* Option A: Teacher Pays Full */}
            <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-600 text-white rounded-xl flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">Option 1: Teacher / School Pays Full Amount</h4>
                    <p className="text-xs text-slate-500">Pay single lump sum of ₹{Number(order.final_amount).toLocaleString()} via UPI, Card, or Netbanking</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleTeacherPayFull}
                disabled={payLoading}
                className="w-full py-3.5 px-6 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded-xl transition-all shadow cursor-pointer disabled:opacity-50"
              >
                {payLoading ? "Processing..." : `Pay Full ₹${Number(order.final_amount).toLocaleString()} Now`}
              </button>
            </div>

            {/* Option B: Student Split Payment */}
            <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">Option 2: Split Amount Among Students</h4>
                  <p className="text-xs text-slate-500">Generate individual payment links for students to pay from home</p>
                </div>
              </div>

              {students.length === 0 ? (
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Number of Students</label>
                    <input
                      type="number"
                      min="2"
                      max="200"
                      value={splitCount}
                      onChange={(e) => setSplitCount(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm font-semibold"
                    />
                  </div>
                  <div className="flex-1 text-xs text-slate-600">
                    Per Student Share: <span className="font-bold text-slate-900 font-mono">₹{splitCount > 0 ? (Number(order.final_amount) / Number(splitCount)).toFixed(2) : 0}</span>
                  </div>
                  <button
                    onClick={handleCreateSplit}
                    disabled={splitLoading}
                    className="w-full sm:w-auto py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer whitespace-nowrap"
                  >
                    {splitLoading ? "Generating..." : "Generate Student Links"}
                  </button>
                </div>
              ) : (
                /* Split Progress & Links List */
                <div className="space-y-6 bg-white p-6 rounded-xl border border-slate-200">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>Student Payment Progress ({paidStudents} of {totalStudents} Paid)</span>
                      <span className="text-blue-600 font-mono">{progressPct}%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Student Links Grid */}
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-700 uppercase">Share links with your students:</p>
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                      {students.map((st, i) => {
                        const link = `${window.location.origin}/bulk-order/${token}/pay/${st.student_token}`;
                        return (
                          <div key={i} className="p-3 flex items-center justify-between text-xs gap-3">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 bg-slate-100 text-slate-700 font-bold rounded-full flex items-center justify-center text-[10px]">
                                {i + 1}
                              </span>
                              <span className="font-medium text-slate-900">{st.name}</span>
                              <span className="font-mono text-slate-500">(₹{st.amount})</span>
                            </div>

                            <div className="flex items-center gap-2">
                              {st.paid ? (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-bold rounded text-[10px]">
                                  PAID ✓
                                </span>
                              ) : (
                                <>
                                  <button
                                    onClick={() => copyToClipboard(link, `link_${i}`)}
                                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded flex items-center gap-1 cursor-pointer"
                                  >
                                    <Copy className="w-3 h-3" /> {copiedLink === `link_${i}` ? "Copied!" : "Copy Link"}
                                  </button>
                                  <a
                                    href={`https://wa.me/?text=${encodeURIComponent(`Hi! Here is your payment link for books (₹${st.amount}):\n${link}`)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded flex items-center gap-1 cursor-pointer"
                                  >
                                    <Share2 className="w-3 h-3" /> WhatsApp
                                  </a>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
