"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "../../../lib/api/axios";
import { adminUpdateOrderStatus, adminMarkReadyForPickup, adminReturnOrder } from "../../../lib/api/admin";
import { 
  Search, 
  X, 
  Download, 
  Truck, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  CreditCard, 
  Package, 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink,
  RefreshCw,
  CheckCircle,
  Clock,
  DollarSign,
  AlertCircle,
  Info,
  Layers,
  ChevronDown,
  Eye,
  Edit3,
  Trash2,
  RotateCcw
} from "lucide-react";

const PAGE_SIZE = 20;

const ORDER_STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "ready_to_pack", label: "Ready to Pack" },
  { value: "pickup_requested", label: "Pickup Requested" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

const UPDATE_STATUSES = ["Confirmed", "Ready_to_pack", "Shipped", "Delivered", "Cancelled"];

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function StatusBadge({ status }) {
  const s = status?.toLowerCase() || "";
  let colors = "bg-slate-100 text-slate-700 border-slate-200/60";
  
  if (s === "pending") {
    colors = "bg-amber-50 text-amber-700 border-amber-200/50";
  } else if (s === "confirmed") {
    colors = "bg-blue-50 text-blue-700 border-blue-200/50";
  } else if (s === "ready_to_pack") {
    colors = "bg-orange-50 text-orange-700 border-orange-200/50";
  } else if (s === "pickup_requested") {
    colors = "bg-indigo-50 text-indigo-700 border-indigo-200/50";
  } else if (s === "shipped") {
    colors = "bg-violet-50 text-violet-700 border-violet-200/50";
  } else if (s === "delivered") {
    colors = "bg-emerald-50 text-emerald-700 border-emerald-200/50";
  } else if (s === "cancelled") {
    colors = "bg-rose-50 text-rose-700 border-rose-200/50";
  } else if (s === "refunded") {
    colors = "bg-slate-100 text-slate-600 border-slate-200/60";
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize tracking-wider ${colors}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
      {status || "—"}
    </span>
  );
}

function safeParseJSON(val) {
  if (typeof val === "object" && val !== null) return val;
  if (typeof val === "string") { 
    try { 
      return JSON.parse(val); 
    } catch { 
      return val; 
    } 
  }
  return val;
}

function ReturnModal({ order, onClose, onReturnSuccess }) {
  if (!order) return null;
  const orderSummary = safeParseJSON(order.order_summary) || {};
  const totalAmount = Number(orderSummary.grandTotal || order.total_amount || 0);

  const [reason, setReason] = useState("Damaged / Defective Item");
  const [notes, setNotes] = useState("");
  const [refundAmount, setRefundAmount] = useState(totalAmount || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const REASON_OPTIONS = [
    "Damaged / Defective Item",
    "Wrong Item Sent",
    "Printing / Binding Defects",
    "Customer Cancellation / Change of Mind",
    "Delayed Delivery",
    "Other Reason"
  ];

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const orderId = order.order_id || order.id;
      const res = await adminReturnOrder(orderId, {
        return_reason: reason,
        return_notes: notes,
        refund_amount: parseFloat(refundAmount) || totalAmount,
      });

      if (res.success) {
        toast.success(`Return & Instant Refund Processed for #${orderId}!`, {
          description: `Refund ID: ${res.refund?.refund_id || "N/A"} | Reverse AWB: ${res.reverse_shipment?.reverse_awb || "N/A"}`
        });
        onReturnSuccess(orderId, res);
        onClose();
      } else {
        setError(res.error || "Failed to process return.");
      }
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || "Failed to initiate return.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden text-left">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-500/20 rounded-xl border border-rose-500/30 text-rose-400">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Initiate Return & Refund</h3>
              <p className="text-xs text-slate-400">Order #{order.order_id || order.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-full transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Reason Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Return Purpose / Reason *</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white outline-none"
              required
            >
              {REASON_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Admin Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Admin Return Notes / Remarks</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Customer provided photo of torn cover page..."
              rows={3}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white outline-none"
            />
          </div>

          {/* Refund Amount */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Refund Amount (₹ INR) *</label>
            <input
              type="number"
              step="0.01"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              className="w-full text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white outline-none"
              required
            />
            <p className="text-[10px] text-slate-400">Defaulted to total order amount (₹{totalAmount.toFixed(2)}).</p>
          </div>

          {/* Summary Box */}
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs text-rose-800 space-y-1">
            <p className="font-bold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Actions performed upon confirmation:
            </p>
            <ul className="list-disc list-inside text-[11px] text-rose-700 space-y-0.5 pl-1">
              <li>Immediate Razorpay API refund (₹{Number(refundAmount || 0).toFixed(2)})</li>
              <li>Schedule Shipway Reverse Pickup from customer address</li>
              <li>Update Order status to <span className="font-mono font-bold">RETURN_INITIATED</span></li>
            </ul>
          </div>

          {error && (
            <p className="text-xs font-bold text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200 text-center">{error}</p>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-md shadow-rose-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5" /> Confirm Return & Refund
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

function OrderModal({ order, onClose, onStatusUpdated, onOpenReturnModal }) {
  if (!order) return null;
  const userInfo = safeParseJSON(order.user_info) || {};
  const items = safeParseJSON(order.items) || [];
  const orderSummary = safeParseJSON(order.order_summary) || {};
  const payment = safeParseJSON(order.payment) || {};
  const delivery = safeParseJSON(order.delivery) || {};

  const [selectedStatus, setSelectedStatus] = useState(order.order_status ?? order.status ?? "");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState("");

  const [readyingPickup, setReadyingPickup] = useState(false);
  const [pickupError, setPickupError] = useState("");

  function formatDate(dateStr) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("en-IN", { 
      day: "2-digit", 
      month: "short", 
      year: "numeric", 
      hour: "2-digit", 
      minute: "2-digit",
      hour12: true
    });
  }

  async function handleStatusUpdate() {
    if (!selectedStatus) return;
    setUpdatingStatus(true);
    setStatusError("");
    try {
      await adminUpdateOrderStatus(order.id, selectedStatus);
      onStatusUpdated(order.id, selectedStatus);
    } catch (err) {
      setStatusError(err?.response?.data?.detail || "Failed to update status.");
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleReadyForPickup() {
    const orderId = order.order_id || order.id;
    if (!orderId) return;
    setReadyingPickup(true);
    setPickupError("");
    try {
      await adminMarkReadyForPickup(orderId);
      onStatusUpdated(order.id, "PICKUP_REQUESTED");
    } catch (err) {
      setPickupError(err?.response?.data?.detail || "Failed to request pickup from Shipway.");
    } finally {
      setReadyingPickup(false);
    }
  }

  // Generate stepper steps based on status
  const currentStatusLower = (order.order_status ?? order.status ?? "").toLowerCase();
  
  const steps = [
    { key: "pending", label: "Pending" },
    { key: "confirmed", label: "Confirmed" },
    { key: "ready_to_pack", label: "Ready to Pack" },
    { key: "pickup_requested", label: "Pickup Requested" },
    { key: "shipped", label: "Shipped" },
    { key: "delivered", label: "Delivered" },
  ];

  let currentStepIndex = steps.findIndex(s => s.key === currentStatusLower);
  if (currentStepIndex === -1) {
    if (currentStatusLower === "cancelled" || currentStatusLower === "refunded") {
      currentStepIndex = -1;
    } else {
      currentStepIndex = 0;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-950/60 backdrop-blur-md transition-all duration-300">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white sticky top-0 z-10 text-left">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900">Order Details</h2>
              <StatusBadge status={order.order_status ?? order.status} />
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">ID: {order.order_id || order.id} &bull; Row ID: {order.id}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-650 hover:bg-slate-50 rounded-full transition-all cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50 space-y-6">
          
          {/* Stepper Timeline */}
          {currentStepIndex !== -1 && (
            <div className="bg-white border border-slate-100/80 shadow-[0_2px_12px_rgba(0,0,0,0.01)] rounded-2xl p-6 text-left">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Order Progress Timeline
              </h3>
              <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-2">
                {/* Horizontal line */}
                <div className="absolute left-[15px] top-[15px] bottom-[15px] md:bottom-auto md:left-6 md:right-6 md:top-4 h-[calc(100%-30px)] md:h-1 bg-slate-100 -z-0 w-1 md:w-[calc(100%-48px)]" />
                <div 
                  className="absolute left-[15px] top-[15px] md:left-6 md:top-4 h-0 md:h-1 bg-gradient-to-r from-red-500 to-orange-500 -z-0 transition-all duration-500 w-1 md:w-0"
                  style={{
                    height: typeof window !== "undefined" && window.innerWidth < 768 
                      ? `${(currentStepIndex / (steps.length - 1)) * 100}%` 
                      : "4px",
                    width: typeof window !== "undefined" && window.innerWidth >= 768 
                      ? `${(currentStepIndex / (steps.length - 1)) * 100}%` 
                      : "4px"
                  }}
                />

                {steps.map((step, idx) => {
                  const isDone = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;
                  return (
                    <div key={step.key} className="flex md:flex-col items-center gap-3 md:gap-1.5 z-10 text-left md:text-center w-full md:w-auto">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                        isDone 
                          ? "bg-gradient-to-br from-red-500 to-orange-500 border-transparent text-white shadow-md shadow-orange-500/20" 
                          : "bg-white border-slate-200 text-slate-400"
                      } ${isCurrent ? "ring-4 ring-orange-100" : ""}`}>
                        {isDone ? <CheckCircle className="w-4 h-4" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                      </div>
                      <div className="flex flex-col md:items-center">
                        <span className={`text-[11px] font-bold ${isDone ? "text-slate-800" : "text-slate-400"}`}>
                          {step.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column (Customer Details, Ordered Items) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Customer Card */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.01)] space-y-4 text-left">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                  <User className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-bold text-slate-800">Customer & Shipping Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Details</p>
                    <div className="space-y-1.5 text-left">
                      <p className="text-sm font-semibold text-slate-900">{userInfo.name || "Guest User"}</p>
                      <p className="text-xs text-slate-600 flex items-center gap-1.5 justify-start">
                        <Mail className="w-3.5 h-3.5 text-slate-400" /> {userInfo.email || "—"}
                      </p>
                      <p className="text-xs text-slate-600 flex items-center gap-1.5 justify-start">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> {userInfo.phone || "—"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-left">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Shipping Address</p>
                    {userInfo.address ? (
                      <div className="text-xs text-slate-600 flex items-start gap-1.5 text-left">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p>{userInfo.address.street || ""}</p>
                          {userInfo.address.apartment && <p>{userInfo.address.apartment}</p>}
                          <p>{userInfo.address.city}, {userInfo.address.state} &mdash; {userInfo.address.pincode}</p>
                          <p className="font-semibold text-slate-700 mt-0.5">{userInfo.address.country || "India"}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No address provided</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Items Card */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.01)] space-y-4 text-left">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                  <Package className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-bold text-slate-800">Ordered Items ({items.length})</h3>
                </div>
                <div className="divide-y divide-slate-50">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex gap-4 py-3.5 first:pt-0 last:pb-0 text-left">
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-12 h-12 object-contain bg-slate-55/30 border border-slate-100 rounded-xl p-1"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                          <Package className="w-5 h-5" />
                        </div>
                      )}
                      <div className="flex-1 text-left">
                        <h4 className="text-xs font-bold text-slate-900 leading-snug">{item.name || item.title}</h4>
                        {item.author && <p className="text-[10px] text-slate-400 mt-0.5">By {item.author}</p>}
                        <p className="text-[10px] text-slate-500 mt-1 font-semibold">₹{Number(item.currentPrice || item.price || 0).toFixed(2)} &bull; Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-900">₹{Number(item.totalPrice || (item.price * item.quantity) || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column (Actions, Shipment & Pricing Summary) */}
            <div className="space-y-6 text-left">
              
              {/* Shipway Details Card */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.01)] space-y-4 text-left">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                  <Truck className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-bold text-slate-800">Shipway Logistics</h3>
                </div>
                
                {delivery.label_url ? (
                  <div className="space-y-4 text-left">
                    <div className="bg-emerald-50 border border-emerald-100/50 rounded-2xl p-4">
                      <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest">Shipment Registered</p>
                      <div className="mt-2.5 text-xs text-emerald-700 space-y-2">
                        <p className="flex justify-between items-center"><span className="font-semibold text-emerald-900">AWB No:</span> <span className="font-mono bg-emerald-100 text-emerald-850 px-2 py-0.5 rounded-lg text-[10px] font-bold">{delivery.awb || "—"}</span></p>
                        <p className="flex justify-between items-center"><span className="font-semibold text-emerald-900">Courier:</span> <span className="font-semibold">{delivery.courier || "—"}</span></p>
                        {(delivery.tracking_url || delivery.awb) && (
                          <a 
                            href={
                              delivery.tracking_url && delivery.tracking_url.includes("app-v1.shipway.com/tracking/forward/")
                                ? delivery.tracking_url
                                : `https://app-v1.shipway.com/tracking/forward/${delivery.awb}/`
                            } 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1 mt-1 text-emerald-800 hover:text-emerald-950 font-bold underline"
                          >
                            Track Package <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                    <a
                      href={delivery.label_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-md shadow-emerald-600/10 hover:shadow-lg transition-all"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Shipping Label
                    </a>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
                    <p className="text-xs font-semibold text-slate-400">No active shipping label generated yet.</p>
                  </div>
                )}

                {/* Mark Packed and Request Pickup Action */}
                {["ready_to_pack", "confirmed"].includes(currentStatusLower) && (
                  <div className="bg-amber-50/60 border border-amber-100/50 rounded-2xl p-4 space-y-3 text-left">
                    <div className="flex gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0 animate-pulse" />
                      <div>
                        <p className="text-xs font-bold text-amber-800">Ready for pickup?</p>
                        <p className="text-[10px] text-amber-600/90 mt-0.5 leading-relaxed">
                          Click below to auto-register/retry the Shipway shipment (if missing), request courier pickup, and notify the customer on WhatsApp.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleReadyForPickup}
                      disabled={readyingPickup}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl shadow-md shadow-amber-500/10 disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {readyingPickup ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Requesting Pickup...
                        </>
                      ) : (
                        <>
                          Packed & Request Pickup
                        </>
                      )}
                    </button>
                    {pickupError && <p className="text-red-650 text-[10px] font-bold mt-1 text-center">{pickupError}</p>}
                  </div>
                )}

                {/* Initiate Return & Refund Action / Details */}
                {currentStatusLower === "return_initiated" || delivery.status === "RETURN_INITIATED" ? (
                  <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 space-y-2 text-left">
                    <p className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                      <RotateCcw className="w-4 h-4 text-rose-600" /> Return & Refund Initiated
                    </p>
                    <div className="text-[11px] text-rose-700 space-y-1 pt-1">
                      {delivery.return_reason && <p><span className="font-bold">Reason:</span> {delivery.return_reason}</p>}
                      {delivery.return_notes && <p><span className="font-bold">Notes:</span> {delivery.return_notes}</p>}
                      {delivery.refund_id && <p><span className="font-bold">Razorpay Refund ID:</span> <span className="font-mono bg-rose-100 px-1.5 py-0.5 rounded text-rose-900">{delivery.refund_id}</span></p>}
                      {delivery.reverse_awb && <p><span className="font-bold">Reverse Courier AWB:</span> <span className="font-mono bg-rose-100 px-1.5 py-0.5 rounded text-rose-900">{delivery.reverse_awb}</span></p>}
                      {delivery.refund_amount && <p><span className="font-bold">Amount Refunded:</span> ₹{Number(delivery.refund_amount).toFixed(2)}</p>}
                    </div>
                  </div>
                ) : ["delivered", "shipped"].includes(currentStatusLower) ? (
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2 text-left">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold text-slate-800">Return & Instant Refund</p>
                        <p className="text-[10px] text-slate-500">Order delivered. Initiate reverse pickup & refund.</p>
                      </div>
                      <button
                        onClick={() => onOpenReturnModal(order)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-xl transition-all cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Return Order
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>



              {/* Order Summary & Payment */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.01)] space-y-4 text-left">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-bold text-slate-800">Order Summary</h3>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-900">₹{Number(orderSummary.subTotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Delivery Charge</span>
                    <span>
                      {Number(orderSummary.deliveryCharge || 0) === 0 ? (
                        <span className="text-emerald-600 font-bold">FREE</span>
                      ) : (
                        `₹${Number(orderSummary.deliveryCharge || 0).toFixed(2)}`
                      )}
                    </span>
                  </div>
                  <div className="border-t border-slate-100 pt-2.5 flex justify-between font-bold text-slate-900 text-sm">
                    <span>Total Amount</span>
                    <span className="text-slate-900 font-black">₹{Number(orderSummary.grandTotal || order.total_amount || 0).toFixed(2)}</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] text-slate-500 space-y-1.5 text-left">
                  <p className="font-bold text-slate-700 uppercase tracking-wider">Razorpay Payment Metadata</p>
                  <p><span className="font-semibold text-slate-650">Payment ID:</span> <span className="font-mono">{payment.razorpay_payment_id || "—"}</span></p>
                  <p><span className="font-semibold text-slate-655">Order ID:</span> <span className="font-mono">{payment.razorpay_order_id || "—"}</span></p>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selected, setSelected] = useState(null);
  const [returnModalOrder, setReturnModalOrder] = useState(null);

  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => { 
    setPage(1); 
  }, [debouncedSearch, statusFilter]);

  const params = { page, size: PAGE_SIZE };
  if (debouncedSearch) params.search = debouncedSearch;
  if (statusFilter) params.order_status = statusFilter;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", params],
    queryFn: async () => {
      const { data } = await api.get("/api/orders/", { params });
      return data;
    },
  });

  const orders = data?.results ?? data?.items ?? [];
  const count = data?.count ?? data?.total ?? 0;
  const totalPages = Math.ceil(count / PAGE_SIZE);

  function formatDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const hasTime = dateStr.includes(":") || dateStr.includes("T") || dateStr.includes(" ");
    if (hasTime) {
      return d.toLocaleString("en-IN", { 
        day: "2-digit", 
        month: "short", 
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    }
    return d.toLocaleDateString("en-IN", { 
      day: "2-digit", 
      month: "short", 
      year: "numeric" 
    });
  }

  function handleStatusUpdated(orderId, newStatus) {
    queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    setSelected((prev) => prev ? { ...prev, order_status: newStatus } : null);
  }

  // Calculate local statistics based on fetched results (just for visual dashboard polish)
  const stats = {
    total: count,
    pending: orders.filter(o => (o.order_status ?? o.status ?? "").toLowerCase() === "pending").length,
    ready: orders.filter(o => ["ready_to_pack", "confirmed"].includes((o.order_status ?? o.status ?? "").toLowerCase())).length,
    pickup: orders.filter(o => (o.order_status ?? o.status ?? "").toLowerCase() === "pickup_requested").length,
  };

  return (
    <div className="lg:p-8 text-left">
      <h2 className="text-2xl font-semibold text-gray-900 mb-8 mt-[20px] sm:mt-0">Orders</h2>
      
      <div className="rounded-lg">
        <div className="h-[calc(100vh-120px)] flex flex-col">
          <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col flex-1 min-h-[600px]">
              
              {/* Header & Filter Controls Bar */}
              <div className="p-4 md:p-6 border-b border-gray-200 flex-shrink-0 bg-white">
                <div className="space-y-4">
                  
                  {/* Top Bar: Search Input & Total Count */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
                      <input
                        type="text"
                        placeholder="Search orders..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8 md:pl-10 pr-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none w-full sm:w-80"
                      />
                    </div>
                    <div className="text-sm text-gray-600">Total: {count} orders</div>
                  </div>

                  {/* Bottom Bar: Date Range Pickers */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600 font-medium">From:</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white text-gray-700"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600 font-medium">To:</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white text-gray-700"
                      />
                    </div>
                    {(startDate || endDate || search) && (
                      <button
                        onClick={() => { setStartDate(""); setEndDate(""); setSearch(""); }}
                        className="text-xs font-semibold text-purple-600 hover:text-purple-800 transition-colors ml-auto cursor-pointer"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>

                </div>
              </div>

              {/* Table Container */}
              <div className="flex-1 overflow-auto min-h-0">
                {isLoading ? (
                  <div className="p-6 animate-pulse space-y-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="h-12 bg-gray-100 rounded-lg w-full" />
                    ))}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <Package className="w-12 h-12 text-gray-300 mb-3" />
                    <p className="text-base font-semibold text-gray-600">No orders found.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ORDER ID</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">CUSTOMER</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">DATE</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">DELIVERY STATUS</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">PAYMENT STATUS</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">TOTAL</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.map((order) => {
                        const uInfo = safeParseJSON(order.user_info) || {};
                        const priceInfo = safeParseJSON(order.order_summary) || {};
                        const amount = priceInfo.grandTotal || order.total_amount || 0;
                        const dateFormatted = (order.order_date || order.created_at || "").slice(0, 10);
                        const deliveryStatusRaw = (order.order_status ?? order.status ?? "shipped").toLowerCase();
                        const paymentStatus = order.payment_status || "Paid";

                        let delivColorClass = "bg-blue-100 text-blue-800";
                        if (deliveryStatusRaw === "pending") {
                          delivColorClass = "bg-amber-100 text-amber-800";
                        } else if (deliveryStatusRaw === "confirmed") {
                          delivColorClass = "bg-purple-100 text-purple-800";
                        } else if (deliveryStatusRaw === "ready_to_pack" || deliveryStatusRaw === "ready to pack") {
                          delivColorClass = "bg-indigo-100 text-indigo-800";
                        } else if (deliveryStatusRaw === "pickup_requested" || deliveryStatusRaw === "pickup requested") {
                          delivColorClass = "bg-orange-100 text-orange-800";
                        } else if (deliveryStatusRaw === "shipped") {
                          delivColorClass = "bg-blue-100 text-blue-800";
                        } else if (deliveryStatusRaw === "delivered") {
                          delivColorClass = "bg-emerald-100 text-emerald-800";
                        } else if (deliveryStatusRaw === "cancelled" || deliveryStatusRaw === "refunded") {
                          delivColorClass = "bg-rose-100 text-rose-800";
                        }

                        const deliveryStatusDisplay = deliveryStatusRaw.replace(/_/g, " ");

                        return (
                          <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 text-xs font-semibold text-gray-900">
                              #{order.order_id || `BOOK${order.id}`}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-xs font-semibold text-gray-900">{uInfo.name || "Alex Bsbu"}</div>
                              <div className="text-xs text-gray-500 mt-0.5">{uInfo.email || uInfo.phone || "customer@gmail.com"}</div>
                            </td>
                            <td className="px-6 py-4 text-xs text-gray-600 whitespace-nowrap">
                              {dateFormatted || "2026-07-28"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${delivColorClass}`}>
                                {deliveryStatusDisplay}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs font-semibold text-gray-900 whitespace-nowrap">
                              ₹{Math.round(amount)}
                            </td>
                            <td className="px-6 py-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end space-x-2 text-purple-600">
                                <button 
                                  onClick={() => setSelected(order)}
                                  className="p-1 hover:bg-purple-50 rounded transition-colors cursor-pointer"
                                  title="View Order"
                                >
                                  <Eye className="w-4 h-4 text-gray-400 hover:text-purple-600" />
                                </button>
                                <button 
                                  onClick={() => {
                                    const deliv = safeParseJSON(order.delivery) || {};
                                    if (deliv.label_url) {
                                      window.open(deliv.label_url, "_blank");
                                    } else {
                                      toast.error(`Shipping label not available for Order #${order.order_id || order.id}`);
                                    }
                                  }}
                                  className="p-1 hover:bg-purple-50 rounded transition-colors cursor-pointer"
                                  title="Download Shipping Label"
                                >
                                  <Download className="w-4 h-4 text-gray-400 hover:text-green-600" />
                                </button>
                                 {["delivered", "shipped"].includes(deliveryStatusRaw) && (
                                  <button 
                                    onClick={() => setReturnModalOrder(order)}
                                    className="p-1 hover:bg-rose-50 rounded transition-colors cursor-pointer text-rose-600"
                                    title="Initiate Return & Instant Refund"
                                  >
                                    <RotateCcw className="w-4 h-4 text-gray-400 hover:text-rose-600" />
                                  </button>
                                )}
                                <button 
                                  onClick={() => setSelected(order)}
                                  className="p-1 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                  title="Cancel/Delete"
                                >
                                  <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination Bar */}
              <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white flex-shrink-0">
                <div className="text-sm text-gray-600">
                  Showing {orders.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0} to {Math.min(page * PAGE_SIZE, count)} of {count} orders
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg font-medium text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, totalPages || 1) }).map((_, idx) => {
                    const pNum = idx + 1;
                    return (
                      <button
                        key={pNum}
                        onClick={() => setPage(pNum)}
                        className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors cursor-pointer ${
                          page === pNum
                            ? "bg-purple-600 text-white font-semibold"
                            : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {pNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || totalPages === 0}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg font-medium text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Details Dialog overlay */}
      {selected && (
        <OrderModal
          order={selected}
          onClose={() => setSelected(null)}
          onStatusUpdated={handleStatusUpdated}
          onOpenReturnModal={(ord) => setReturnModalOrder(ord)}
        />
      )}

      {/* Return & Refund Modal */}
      {returnModalOrder && (
        <ReturnModal
          order={returnModalOrder}
          onClose={() => setReturnModalOrder(null)}
          onReturnSuccess={(orderId, res) => {
            queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
            if (selected) {
              setSelected((prev) => prev ? { ...prev, order_status: "RETURN_INITIATED" } : null);
            }
          }}
        />
      )}
    </div>
  );
}
