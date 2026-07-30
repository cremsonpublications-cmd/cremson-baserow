"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../../lib/api/axios";
import { adminUpdateOrderStatus, adminMarkReadyForPickup } from "../../../lib/api/admin";
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
  ChevronDown
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

function OrderModal({ order, onClose, onStatusUpdated }) {
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
                        {delivery.tracking_url && (
                          <a 
                            href={delivery.tracking_url} 
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
              </div>

              {/* Status Update Card */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.01)] space-y-4 text-left">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-bold text-slate-800">Manage Status</h3>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Update Order Status</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full border border-slate-200 bg-white rounded-xl pl-3 pr-8 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none text-slate-700"
                      >
                        <option value="">— Select Status —</option>
                        {UPDATE_STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    </div>
                    <button
                      onClick={handleStatusUpdate}
                      disabled={!selectedStatus || updatingStatus}
                      className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 rounded-xl disabled:opacity-50 transition-all cursor-pointer shadow-md shadow-orange-500/10"
                    >
                      {updatingStatus ? "Updating..." : "Update"}
                    </button>
                  </div>
                  {statusError && <p className="text-red-600 text-[10px] font-bold mt-1">{statusError}</p>}
                </div>
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
  const [selected, setSelected] = useState(null);

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
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 text-left">
      
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Order Management</h1>
          <p className="text-xs text-slate-400 mt-1">Manage and track your customer orders, logistics and shipments.</p>
        </div>
        <button 
          onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-orders"] })}
          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer active:scale-95 duration-100"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Dashboard
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
        
        {/* Total Orders Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_4px_20px_rgb(0,0,0,0.006)] flex items-center gap-4 hover:shadow-[0_6px_25px_rgb(0,0,0,0.015)] transition-all">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Orders</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">{count.toLocaleString()}</h3>
          </div>
        </div>

        {/* Ready to Pack Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_4px_20px_rgb(0,0,0,0.006)] flex items-center gap-4 hover:shadow-[0_6px_25px_rgb(0,0,0,0.015)] transition-all">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ready to Pack</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">{stats.ready} <span className="text-[10px] text-slate-400 font-normal">on page</span></h3>
          </div>
        </div>

        {/* Scheduled Pickups Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_4px_20px_rgb(0,0,0,0.006)] flex items-center gap-4 hover:shadow-[0_6px_25px_rgb(0,0,0,0.015)] transition-all">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pickup Requested</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">{stats.pickup} <span className="text-[10px] text-slate-400 font-normal">on page</span></h3>
          </div>
        </div>

        {/* Pending Customer Payment Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_4px_20px_rgb(0,0,0,0.006)] flex items-center gap-4 hover:shadow-[0_6px_25px_rgb(0,0,0,0.015)] transition-all">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Orders</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">{stats.pending} <span className="text-[10px] text-slate-400 font-normal">on page</span></h3>
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-[0_4px_20px_rgb(0,0,0,0.006)] flex flex-col sm:flex-row gap-4 items-center justify-between">
        
        {/* Search Input */}
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by Order ID, customer name, phone..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2 border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-slate-800 placeholder-slate-400" 
          />
          {search && (
            <button 
              onClick={() => setSearch("")} 
              className="absolute right-3 top-2.5 p-0.5 text-slate-400 hover:text-slate-655 hover:bg-slate-200 rounded-full"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Status Dropdown and Clear Filter */}
        <div className="flex w-full sm:w-auto items-center justify-end gap-3 flex-wrap">
          <div className="relative min-w-[160px] w-full sm:w-auto">
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)} 
              className="w-full border border-slate-200 bg-white rounded-xl pl-3 pr-8 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none text-slate-600 cursor-pointer"
            >
              {ORDER_STATUSES.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
          
          {(search || statusFilter) && (
            <button 
              onClick={() => { setSearch(""); setStatusFilter(""); }} 
              className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-55/60 px-3 py-2 rounded-xl transition-all cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>

      </div>

      {/* Orders Table Area */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-[0_4px_25px_rgb(0,0,0,0.006)] overflow-hidden">
        {isLoading ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Order ID</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Order Date</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Amount</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Logistics</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 animate-pulse bg-white">
                {Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="bg-white">
                    <td className="px-5 py-4"><div className="h-4 w-24 bg-slate-100 rounded-lg" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-36 bg-slate-100 rounded-lg mb-2" /><div className="h-3 w-24 bg-slate-50/50 rounded-lg" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-20 bg-slate-100 rounded-lg" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-16 bg-slate-100 rounded-lg" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-24 bg-slate-100 rounded-lg" /></td>
                    <td className="px-5 py-4"><div className="h-6 w-20 bg-slate-100 rounded-full" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-450 bg-white">
            <Package className="w-12 h-12 text-slate-200 mb-3" />
            <p className="text-sm font-semibold text-slate-500">No orders matching criteria found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white">
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Order Date</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Amount</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Logistics</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {orders.map((order) => {
                  const uInfo = safeParseJSON(order.user_info) || {};
                  const deliv = safeParseJSON(order.delivery) || {};
                  const priceInfo = safeParseJSON(order.order_summary) || {};
                  const amount = priceInfo.grandTotal || order.total_amount || 0;

                  return (
                    <tr 
                      key={order.id} 
                      onClick={() => setSelected(order)} 
                      className="hover:bg-slate-50/60 cursor-pointer transition-all active:bg-slate-100/50 group"
                    >
                      {/* Order ID */}
                      <td className="px-6 py-4 text-xs font-bold text-slate-905 font-mono group-hover:text-orange-600 transition-colors">
                        {order.order_id || `Row #${order.id}`}
                      </td>
                      
                      {/* Customer Details */}
                      <td className="px-6 py-4 text-xs">
                        <div className="font-bold text-slate-800">{uInfo.name || "Guest Customer"}</div>
                        <div className="text-slate-400 mt-0.5">{uInfo.phone || uInfo.email || "No contact info"}</div>
                      </td>
                      
                      {/* Order Date */}
                      <td className="px-6 py-4 text-xs text-slate-500 font-medium whitespace-nowrap">
                        {formatDate(order.order_date || order.created_at)}
                      </td>
                      
                      {/* Total Amount */}
                      <td className="px-6 py-4 text-xs font-extrabold text-slate-950 whitespace-nowrap">
                        ₹{Number(amount).toFixed(2)}
                      </td>
                      
                      {/* Logistics Info (AWB) */}
                      <td className="px-6 py-4 text-xs whitespace-nowrap">
                        {deliv.awb ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg text-[10px] font-bold self-start">
                              {deliv.awb}
                            </span>
                            <span className="text-[10px] text-slate-400">{deliv.courier || "Courier"}</span>
                          </div>
                        ) : (
                          <span className="text-slate-405 italic">Unassigned</span>
                        )}
                      </td>
                      
                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={order.order_status ?? order.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Area */}
      {!isLoading && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-1 py-2 text-left">
          <p className="text-xs font-bold text-slate-405">
            Page <span className="text-slate-900 font-black">{page}</span> of <span className="text-slate-900 font-black">{totalPages}</span> &mdash; {count.toLocaleString()} orders
          </p>
          <div className="flex gap-2">
            <button 
              onClick={() => setPage((p) => Math.max(1, p - 1))} 
              disabled={page === 1} 
              className="inline-flex items-center gap-1 px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-700 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-all cursor-pointer active:scale-95 duration-100"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <button 
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))} 
              disabled={page === totalPages} 
              className="inline-flex items-center gap-1 px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-700 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-all cursor-pointer active:scale-95 duration-100"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Details Dialog overlay */}
      {selected && (
        <OrderModal
          order={selected}
          onClose={() => setSelected(null)}
          onStatusUpdated={handleStatusUpdated}
        />
      )}
    </div>
  );
}
