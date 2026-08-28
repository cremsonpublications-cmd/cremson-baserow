"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useApp } from "../../context/AppContext";
import { getMyOrders } from "../../lib/api/orders";
import api from "../../lib/api/axios";
import {
  Package,
  Calendar,
  Eye,
  X,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Search,
  ShoppingBag,
  MapPin,
  BookOpen,
  ArrowRight,
  ChevronRight,
  Building2,
  CreditCard,
  Users,
  Copy,
  ExternalLink,
  Loader2,
  Clock,
  AlertCircle,
  FileText,
} from "lucide-react";

// ─── Razorpay Script Loader ───────────────────────────────────────────────────
function useRazorpayScript() {
  useEffect(() => {
    if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) return;
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);
}

// ─── Bulk Order Status Badge ───────────────────────────────────────────────────
function BulkStatusBadge({ status }) {
  const s = (status || "").toLowerCase();
  if (s === "pending_review" || s === "pending")
    return <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full border border-amber-200">⏳ Pending Review</span>;
  if (s === "approved")
    return <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200">✅ Approved — Pay Now</span>;
  if (s === "partially_paid")
    return <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-full border border-blue-200">💳 Partially Paid</span>;
  if (s === "fully_paid")
    return <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-700 rounded-full border border-purple-200">✔ Fully Paid</span>;
  if (s === "shipped")
    return <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-700 rounded-full border border-indigo-200">🚚 Shipped</span>;
  if (s === "delivered")
    return <span className="px-2 py-0.5 text-[10px] font-bold bg-green-100 text-green-700 rounded-full border border-green-200">📦 Delivered</span>;
  if (s === "cancelled")
    return <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-700 rounded-full border border-rose-200">✕ Cancelled</span>;
  return <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-full border border-slate-200">{status}</span>;
}

// ─── Bulk Order Card ───────────────────────────────────────────────────────────
function BulkOrderCard({ order, onRefresh }) {
  const [payLoading, setPayLoading] = useState(false);
  const [splitLoading, setSplitLoading] = useState(false);
  const [splitCount, setSplitCount] = useState(order.split_count > 1 ? order.split_count : 10);
  const [showSplitInput, setShowSplitInput] = useState(false);
  const [copied, setCopied] = useState("");
  const [error, setError] = useState("");

  const status = (order.status || "").toLowerCase();
  const canPay = status === "approved" || status === "partially_paid";
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const payLink = `${origin}/bulk-order/${order.token}`;
  const splitPayLink = order.split_count > 1 ? `${origin}/bulk-order/${order.token}/pay` : null;

  const handlePayFull = async () => {
    setPayLoading(true);
    setError("");
    try {
      const res = await api.post(`/api/bulk-orders/${order.token}/create-payment`);
      const { razorpay_order_id, amount, currency, key_id, contact_name, phone } = res.data;
      const options = {
        key: key_id,
        amount,
        currency,
        name: "Cremson Publications",
        description: `Bulk Order — ${order.school_name}`,
        order_id: razorpay_order_id,
        prefill: { name: contact_name, contact: phone },
        handler: async (response) => {
          try {
            await api.post(`/api/bulk-orders/${order.token}/verify-payment`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            onRefresh();
          } catch {
            alert("Payment verification failed. Please contact support.");
          }
        },
        theme: { color: "#9333ea" },
      };
      new window.Razorpay(options).open();
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to initiate payment.");
    } finally {
      setPayLoading(false);
    }
  };

  const handleSetupSplit = async () => {
    if (!splitCount || splitCount < 2) { setError("Minimum 2 students required."); return; }
    setSplitLoading(true);
    setError("");
    try {
      await api.post(`/api/bulk-orders/${order.token}/split`, { split_count: Number(splitCount) });
      onRefresh();
      setShowSplitInput(false);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to setup split.");
    } finally {
      setSplitLoading(false);
    }
  };

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2500);
  };

  const perStudent = order.split_count > 1 ? Math.ceil((order.final_amount || 0) / order.split_count) : 0;

  return (
    <div className="bg-white border border-purple-100 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-bold text-gray-900">{order.school_name || "School"}</span>
          <span className="text-xs text-gray-400">#{order.order_id}</span>
        </div>
        <BulkStatusBadge status={order.status} />
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Books */}
        <div className="space-y-1.5">
          {(order.items || []).map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs text-gray-600">
              <span className="font-medium line-clamp-1 flex-1 pr-2">{item.title}</span>
              <span className="text-gray-400 whitespace-nowrap">x{item.qty} — ₹{((item.price || 0) * item.qty).toFixed(0)}</span>
            </div>
          ))}
        </div>

        {/* Financials */}
        <div className="flex items-center justify-between text-xs border-t border-gray-100 pt-2">
          <span className="text-gray-500">
            Subtotal: <span className="font-semibold text-gray-700">₹{(order.subtotal || 0).toFixed(0)}</span>
            {order.discount_value > 0 && (
              <span className="text-green-600 ml-1">
                ({order.discount_type === "percentage" ? `-${order.discount_value}%` : `-₹${order.discount_value}`})
              </span>
            )}
          </span>
          <span className="font-bold text-purple-700 text-sm">₹{(order.final_amount || 0).toFixed(0)}</span>
        </div>

        {order.admin_notes && (
          <p className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5">
            💬 Admin: {order.admin_notes}
          </p>
        )}

        {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-1.5">{error}</p>}

        {/* Payment Actions — only for approved/partially_paid */}
        {canPay && (
          <div className="space-y-2 pt-1">

            {/* Split Payment Info Block (if already configured) */}
            {order.split_count > 1 && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 space-y-1.5">
                <p className="text-xs font-bold text-indigo-800">
                  Split across {order.split_count} students — ₹{perStudent}/student
                  <span className="ml-2 text-indigo-500">({order.paid_count}/{order.split_count} paid)</span>
                </p>
                {splitPayLink && (
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={splitPayLink}
                      className="flex-1 text-[10px] bg-white border border-indigo-200 rounded px-2 py-1 text-gray-700 font-mono truncate"
                    />
                    <button
                      onClick={() => copy(splitPayLink, "split")}
                      className="shrink-0 px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded transition-colors cursor-pointer"
                    >
                      {copied === "split" ? "✓" : <Copy className="w-3 h-3" />}
                    </button>
                    <a href={splitPayLink} target="_blank" rel="noreferrer"
                      className="shrink-0 px-2 py-1 bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold rounded transition-colors">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons Row */}
            <div className="flex gap-2 flex-wrap">
              {/* Pay Full — only when not split */}
              {order.split_count <= 1 && (
                <button
                  onClick={handlePayFull}
                  disabled={payLoading}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-sm"
                >
                  {payLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                  Pay ₹{(order.final_amount || 0).toFixed(0)} Full
                </button>
              )}

              {/* Setup / Change Split */}
              {!showSplitInput ? (
                <button
                  onClick={() => setShowSplitInput(true)}
                  className="flex items-center gap-1.5 py-2.5 px-4 bg-white hover:bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  {order.split_count > 1 ? "Change Split" : "Split by Students"}
                </button>
              ) : (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="number"
                    min={2}
                    max={500}
                    value={splitCount}
                    onChange={(e) => setSplitCount(Number(e.target.value))}
                    className="w-16 text-xs border border-purple-200 rounded-lg px-2 py-2 text-center focus:ring-1 focus:ring-purple-400 outline-none"
                    placeholder="No."
                  />
                  <span className="text-xs text-gray-500 whitespace-nowrap">students</span>
                  <button
                    onClick={handleSetupSplit}
                    disabled={splitLoading}
                    className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    {splitLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "✓ Confirm"}
                  </button>
                  <button onClick={() => setShowSplitInput(false)} className="p-2 text-gray-400 hover:text-gray-700 cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer row */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-100">
          <span className="text-[11px] text-gray-400">
            {order.order_date ? new Date(order.order_date).toLocaleDateString("en-IN") : "—"}
          </span>
          <a
            href={payLink}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-purple-600 hover:text-purple-800 font-bold flex items-center gap-1"
          >
            Full Details <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

// Helper to safely extract and format lookup and array values from Baserow response
const getDisplayValue = (val) => {
  if (Array.isArray(val)) {
    if (val.length === 0) return "";
    return val
      .map((item) => (item && typeof item === "object" ? item.value || item.id || "" : String(item)))
      .filter(Boolean)
      .join(", ");
  }
  if (val && typeof val === "object") {
    return val.value || val.id || "";
  }
  return val ? String(val) : "";
};

// ─── Specimen Order Status Badge ───────────────────────────────────────────────
function SpecimenStatusBadge({ status }) {
  const s = String(status || "").toLowerCase().trim();
  if (s === "not dispatched" || s === "pending")
    return <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full border border-amber-200">⏳ Pending Approval</span>;
  if (s === "approved")
    return <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-full border border-blue-200">✅ Approved</span>;
  if (s === "dispatched" || s === "shipped")
    return <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-700 rounded-full border border-indigo-200">🚚 Dispatched</span>;
  if (s === "delivered")
    return <span className="px-2 py-0.5 text-[10px] font-bold bg-green-100 text-green-700 rounded-full border border-green-200">📦 Delivered</span>;
  if (s === "rejected" || s === "cancelled")
    return <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-700 rounded-full border border-rose-200">✕ Rejected</span>;
  return <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-full border border-slate-200">{status}</span>;
}

// ─── Specimen Request Card ─────────────────────────────────────────────────────
function SpecimenRequestCard({ request }) {
  const status = typeof request.DeliveryStatus === "object" && request.DeliveryStatus
    ? request.DeliveryStatus.value
    : request.DeliveryStatus || "Not dispatched";

  const specimenId = getDisplayValue(request.SpecimenID) || getDisplayValue(request.id);
  const booksRequested = getDisplayValue(request.BooksRequested);
  const requestDate = getDisplayValue(request.RequestDate);
  const pincode = getDisplayValue(request.PinCode);
  const address = getDisplayValue(request.Full_Address);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-red-500" />
          <span className="text-sm font-bold text-gray-900">Specimen Copy Request</span>
          <span className="text-xs text-gray-400">#{specimenId}</span>
        </div>
        <SpecimenStatusBadge status={status} />
      </div>

      {/* Body */}
      <div className="p-4 space-y-2 text-left">
        <div>
          <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Books Requested</span>
          <p className="text-xs font-bold text-gray-800 leading-relaxed mt-0.5">{booksRequested || "No books listed"}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-1">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Request Date</span>
            <p className="text-xs text-gray-600 font-medium mt-0.5">{requestDate || "N/A"}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Pincode</span>
            <p className="text-xs text-gray-600 font-medium mt-0.5">{pincode || "N/A"}</p>
          </div>
        </div>

        {address && (
          <div className="pt-1 border-t border-gray-100 mt-2">
            <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Shipping Address</span>
            <p className="text-xs text-gray-600 leading-relaxed mt-0.5">{address}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function MyOrdersPage() {
  const { user } = useApp();
  const [orders, setOrders] = useState([]);
  const [bulkOrders, setBulkOrders] = useState([]);
  const [specimenRequests, setSpecimenRequests] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  useRazorpayScript();

  const loadOrders = () => {
    if (!user?.email) return;
    setIsLoading(true);
    getMyOrders(user.email)
      .then(setOrders)
      .catch((e) => console.error("Error loading orders", e))
      .finally(() => setIsLoading(false));
  };

  const loadBulkOrders = () => {
    const phone = user?.phone;
    if (!phone) return;
    setBulkLoading(true);
    api.get(`/api/bulk-orders/by-phone/${encodeURIComponent(phone)}`)
      .then((res) => setBulkOrders(res.data?.results || []))
      .catch((e) => console.error("Error loading bulk orders", e))
      .finally(() => setBulkLoading(false));
  };

  const loadSpecimenRequests = () => {
    if (!user?.email) return;
    api.get(`/api/auth/teacher-history?email=${encodeURIComponent(user.email)}&phone=${encodeURIComponent(user.phone || "")}`)
      .then((res) => {
        const all = res.data?.specimen_requests || [];
        // Only show PENDING specimen requests (not dispatched yet)
        // Once approved/dispatched, a real SPEC- order is created in orders table
        const pending = all.filter((req) => {
          const s = String(
            (typeof req.DeliveryStatus === "object" && req.DeliveryStatus
              ? req.DeliveryStatus.value
              : req.DeliveryStatus) || ""
          ).toLowerCase().trim();
          return s === "" || s === "not dispatched" || s === "pending";
        });
        setSpecimenRequests(pending);
      })
      .catch((e) => console.error("Error loading specimen requests", e));
  };

  useEffect(() => {
    loadOrders();
    loadBulkOrders();
    loadSpecimenRequests();
  }, [user?.email, user?.phone]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (activeTab !== "all") {
        const status = (order.status || "").toLowerCase();
        if (activeTab === "placed" && status !== "order placed" && status !== "placed" && status !== "processing") return false;
        if (activeTab === "shipped" && status !== "shipped") return false;
        if (activeTab === "delivered" && status !== "delivered") return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesId = (order.id || "").toLowerCase().includes(query);
        const matchesItems = (order.items || []).some((item) => (item.title || "").toLowerCase().includes(query));
        return matchesId || matchesItems;
      }
      return true;
    });
  }, [orders, activeTab, searchQuery]);

  const filteredBulkOrders = useMemo(() => {
    return bulkOrders.filter((bo) => {
      if (activeTab !== "all") {
        const status = (bo.status || "").toLowerCase();
        if (activeTab === "placed") {
          if (status !== "created" && status !== "pending_approval" && status !== "pending_review" && status !== "approved" && status !== "partially_paid") return false;
        }
        if (activeTab === "shipped" && status !== "shipped" && status !== "ready_for_pickup") return false;
        if (activeTab === "delivered" && status !== "fully_paid" && status !== "completed" && status !== "delivered") return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesId = (bo.order_id || "").toLowerCase().includes(query);
        const matchesSchool = (bo.school_name || "").toLowerCase().includes(query);
        const matchesItems = (bo.items || []).some((item) => (item.title || "").toLowerCase().includes(query));
        return matchesId || matchesSchool || matchesItems;
      }
      return true;
    });
  }, [bulkOrders, activeTab, searchQuery]);

  const orderItemsList = useMemo(() => {
    const items = [];

    // Regular orders
    const sortedOrders = [...filteredOrders].sort((a, b) => {
      const dateA = a.rawDate ? new Date(a.rawDate).getTime() : 0;
      const dateB = b.rawDate ? new Date(b.rawDate).getTime() : 0;
      return dateB - dateA;
    });

    sortedOrders.forEach((order) => {
      items.push({
        isOrder: true,
        orderId: order.id,
        orderDate: order.date,
        orderStatus: order.status || "Order Placed",
        expectedDelivery: order.expectedDelivery || "TBD",
        shippingAddress: order.shippingAddress,
        payment_id: order.payment_id,
        totalOrderAmount: order.total,
        trackingUrl: order.trackingUrl || "",
        parentOrder: order,
        isSpecimen: false,
        rawDate: order.rawDate,
        items: order.items || [],
      });
    });

    // Bulk Orders
    filteredBulkOrders.forEach((bo) => {
      items.push({
        isBulkOrder: true,
        orderId: bo.order_id,
        orderDate: bo.order_date,
        orderStatus: bo.status,
        shippingAddress: bo.address,
        payment_id: bo.token,
        totalOrderAmount: bo.final_amount,
        parentOrder: bo,
        isSpecimen: false,
        rawDate: bo.order_date,
        items: bo.items || [],
      });
    });

    // Pending specimen requests only (approved/dispatched ones become real SPEC- orders)
    specimenRequests.forEach((req) => {
      const books = getDisplayValue(req.BooksRequested) || "Specimen Copies";
      const specId = getDisplayValue(req.SpecimenID) || req.id;
      const rDate = getDisplayValue(req.RequestDate);
      const addr = getDisplayValue(req.Full_Address);

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesId = `SR${specId}`.toLowerCase().includes(query);
        const matchesBooks = books.toLowerCase().includes(query);
        if (!matchesId && !matchesBooks) return;
      }

      items.push({
        id: req.id,
        title: books,
        quantity: 1,
        orderId: `SR${specId}`,
        orderDate: rDate,
        orderStatus: "Not dispatched",
        shippingAddress: addr,
        isSpecimen: true,
        parentOrder: req,
        rawDate: rDate,
      });
    });

    // Sort by date descending
    items.sort((a, b) => {
      const dateA = a.rawDate ? new Date(a.rawDate).getTime() : 0;
      const dateB = b.rawDate ? new Date(b.rawDate).getTime() : 0;
      return dateB - dateA;
    });

    return items;
  }, [filteredOrders, specimenRequests, filteredBulkOrders, searchQuery]);

  if (!user) {
    return (
      <main className="pb-20 min-h-screen bg-[#f1f3f6] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg border border-gray-200 p-8 text-center shadow-sm">
          <div className="inline-flex p-3 bg-orange-50 text-orange-500 rounded-full mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6 text-sm">Please sign in to your account to view and manage your orders.</p>
          <Link href="/signin">
            <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded text-sm font-bold transition-all cursor-pointer shadow-sm">
              Sign In
            </button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="pb-20 min-h-screen bg-[#f1f3f6] text-left">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6">

        {/* Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Link href="/" className="hover:text-blue-600">Home</Link>
              <ChevronRight className="w-3 h-3" />
              <Link href="/shop" className="hover:text-blue-600">Shop</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-gray-700 font-medium">My Orders</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">My Orders</h1>
          </div>
          <Link href="/shop">
            <button className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2 rounded text-xs font-bold transition-all shadow-sm cursor-pointer">
              Continue Shopping <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </Link>
        </div>



        {/* ── Regular Orders Search ─────────────────── */}
        <div className="bg-white border border-gray-200 rounded p-4 mb-4 shadow-sm flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md w-full">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your orders here..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-black placeholder-gray-400"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ── Regular Order Items List ────────────────────────── */}
        {isLoading || bulkLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white border border-gray-200 rounded p-4 sm:p-5 shadow-sm animate-pulse grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-6 flex items-start gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                  </div>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
                <div className="md:col-span-4 space-y-2">
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-gray-200" /><div className="h-3.5 bg-gray-200 rounded w-1/3" /></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4 ml-4" />
                  <div className="h-3 bg-gray-200 rounded w-1/4 ml-4" />
                </div>
              </div>
            ))}
          </div>
        ) : orderItemsList.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded p-12 text-center shadow-sm">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-800 mb-1">No Orders Found</h3>
            <p className="text-xs text-gray-500 mb-6 max-w-sm mx-auto">
              {searchQuery ? `No orders match "${searchQuery}".` : "You have not placed any orders yet."}
            </p>
            <Link href="/shop">
              <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded text-xs font-bold transition-all cursor-pointer">
                Start Shopping
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orderItemsList.map((item, idx) => {
              if (item.isSpecimen) {
                const s = String(item.orderStatus || "").toLowerCase().trim();
                let statusColor = "bg-amber-500";
                let statusText = "Pending Approval";
                let statusDesc = "Your specimen request is under review.";
                if (s === "approved") {
                  statusColor = "bg-blue-500";
                  statusText = "Approved";
                  statusDesc = "Your specimen request has been approved.";
                } else if (s === "dispatched" || s === "shipped") {
                  statusColor = "bg-indigo-500";
                  statusText = "Dispatched";
                  statusDesc = "Your books have been dispatched.";
                } else if (s === "delivered") {
                  statusColor = "bg-green-500";
                  statusText = "Delivered";
                  statusDesc = "Your books have been delivered.";
                } else if (s === "rejected" || s === "cancelled") {
                  statusColor = "bg-rose-500";
                  statusText = "Rejected";
                  statusDesc = "Your request was not approved.";
                }

                // Get details from parentOrder
                const req = item.parentOrder;
                const pincode = getDisplayValue(req.PinCode);

                return (
                  <div
                    key={idx}
                    className="bg-white border border-gray-200 rounded p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-start"
                  >
                    <div className="md:col-span-6 flex items-start gap-4">
                      <div className="w-16 h-16 bg-red-50 border border-red-100 rounded flex items-center justify-center text-red-500 shrink-0">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm line-clamp-2">{item.title}</h4>
                        <p className="text-xs text-red-500 font-bold mt-1">Specimen Copy Request #{item.orderId.replace("SR", "")}</p>
                        <p className="text-xs text-gray-400 mt-1">Requested on: {item.orderDate || "N/A"}</p>
                        {item.shippingAddress && (
                          <p className="text-xs text-gray-500 mt-1.5 leading-relaxed bg-gray-50 p-2 rounded border border-gray-100">
                            <span className="font-bold block text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Shipping Address</span>
                            {item.shippingAddress} {pincode && ` - ${pincode}`}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <span className="px-2 py-1 text-[10px] font-bold bg-red-50 text-red-700 rounded border border-red-100 uppercase tracking-wider block text-center">
                        Evaluation Copy
                      </span>
                    </div>

                    <div className="md:col-span-4 flex flex-col md:items-start text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${statusColor}`} />
                        <span className="font-bold text-gray-900">{statusText}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 ml-4 leading-relaxed">{statusDesc}</p>
                      
                      {req.TrackingLink ? (
                        <a href={req.TrackingLink} target="_blank" rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-xs font-bold mt-2 ml-4 flex items-center gap-0.5 cursor-pointer">
                          <Truck className="w-3.5 h-3.5" /> Track Shipment
                        </a>
                      ) : (
                        <div className="text-xs text-gray-400 mt-2 ml-4 italic">No tracking info available yet</div>
                      )}
                  </div>
                );
              }

              if (item.isBulkOrder) {
                return (
                  <div key={idx} className="cursor-default">
                    <BulkOrderCard order={item.parentOrder} onRefresh={loadBulkOrders} />
                  </div>
                );
              }

              if (item.isOrder) {
                let statusColor = "bg-amber-500";
                let statusText = "Ordered";
                let statusDesc = "Your order has been placed.";
                if (item.orderStatus === "Shipped") { statusColor = "bg-blue-500"; statusText = "Shipped"; statusDesc = "Your item is in transit."; }
                else if (item.orderStatus === "Delivered") { statusColor = "bg-green-500"; statusText = "Delivered"; statusDesc = "Your item has been delivered."; }

                const totalQty = item.items.reduce((acc, curr) => acc + (curr.quantity || 1), 0);

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedOrder(item.parentOrder)}
                    className="bg-white border border-gray-200 rounded p-4 sm:p-5 hover:shadow-md transition-all duration-200 cursor-pointer grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
                  >
                    <div className="md:col-span-6 flex items-start gap-4">
                      {item.items.length === 1 ? (
                        item.items[0].image ? (
                          <img src={item.items[0].image} alt={item.items[0].title} className="w-16 h-16 object-contain bg-gray-50 border border-gray-100 rounded p-1 shrink-0" />
                        ) : (
                          <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded flex items-center justify-center text-gray-400 shrink-0">
                            <BookOpen className="w-6 h-6" />
                          </div>
                        )
                      ) : (
                        <div className="relative shrink-0">
                          {item.items[0].image ? (
                            <img src={item.items[0].image} alt={item.items[0].title} className="w-16 h-16 object-contain bg-white border border-gray-200 rounded p-1 shadow-sm" />
                          ) : (
                            <div className="w-16 h-16 bg-gray-50 border border-gray-200 rounded flex items-center justify-center text-gray-400 shadow-sm">
                              <BookOpen className="w-6 h-6" />
                            </div>
                          )}
                          <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-blue-100 border border-blue-200 rounded-full flex items-center justify-center text-blue-700 text-[10px] font-bold shadow-sm">
                            +{item.items.length - 1}
                          </div>
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm hover:text-blue-600 transition-colors line-clamp-2">
                          {item.items.length === 1 
                            ? item.items[0].title 
                            : `${item.items.length} Books: ${item.items.map(i => i.title || i.name).join(", ")}`
                          }
                        </h4>
                        <p className="text-xs text-gray-400 mt-1">
                          Qty: {totalQty} | Order #{item.orderId}
                        </p>
                        <p className="text-xs text-gray-400">Ordered on: {item.orderDate}</p>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <p className="font-bold text-gray-900 text-sm">₹{parseFloat(item.totalOrderAmount || 0).toFixed(2)}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {item.items.length === 1 ? "1 book" : `${item.items.length} books`}
                      </p>
                    </div>

                    <div className="md:col-span-4 flex flex-col md:items-start text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${statusColor}`} />
                        <span className="font-bold text-gray-900">
                          {statusText === "Delivered" ? `Delivered on ${item.expectedDelivery}` : statusText}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 ml-4 leading-relaxed">{statusDesc}</p>
                      {item.trackingUrl ? (
                        <a href={item.trackingUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                          className="text-blue-600 hover:text-blue-800 text-xs font-bold mt-2 ml-4 flex items-center gap-0.5 cursor-pointer">
                          <Truck className="w-3.5 h-3.5" /> Track Shipment
                        </a>
                      ) : (
                        <button className="text-blue-600 hover:text-blue-800 text-xs font-bold mt-2 ml-4 flex items-center gap-0.5 cursor-pointer">
                          <Eye className="w-3.5 h-3.5" /> View Details
                        </button>
                      )}
                    </div>
                  </div>
                );
              }

              let statusColor = "bg-amber-500";
              let statusText = "Ordered";
              let statusDesc = "Your order has been placed.";
              if (item.orderStatus === "Shipped") { statusColor = "bg-blue-500"; statusText = "Shipped"; statusDesc = "Your item is in transit."; }
              else if (item.orderStatus === "Delivered") { statusColor = "bg-green-500"; statusText = "Delivered"; statusDesc = "Your item has been delivered."; }

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedOrder(item.parentOrder)}
                  className="bg-white border border-gray-200 rounded p-4 sm:p-5 hover:shadow-md transition-all duration-200 cursor-pointer grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
                >
                  <div className="md:col-span-6 flex items-start gap-4">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="w-16 h-16 object-contain bg-gray-50 border border-gray-100 rounded p-1" />
                    ) : (
                      <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded flex items-center justify-center text-gray-400">
                        <BookOpen className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm hover:text-blue-650 transition-colors line-clamp-2">{item.title}</h4>
                      <p className="text-xs text-gray-400 mt-1">Qty: {item.quantity} | Order #{item.orderId}</p>
                      <p className="text-xs text-gray-400">Ordered on: {item.orderDate}</p>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <p className="font-bold text-gray-900 text-sm">₹{parseFloat(item.price * item.quantity).toFixed(2)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">(₹{parseFloat(item.price).toFixed(2)} each)</p>
                  </div>

                  <div className="md:col-span-4 flex flex-col md:items-start text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${statusColor}`} />
                      <span className="font-bold text-gray-900">
                        {statusText === "Delivered" ? `Delivered on ${item.expectedDelivery}` : statusText}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 ml-4 leading-relaxed">{statusDesc}</p>
                    {item.trackingUrl ? (
                      <a href={item.trackingUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                        className="text-blue-600 hover:text-blue-800 text-xs font-bold mt-2 ml-4 flex items-center gap-0.5 cursor-pointer">
                        <Truck className="w-3.5 h-3.5" /> Track Shipment
                      </a>
                    ) : (
                      <button className="text-blue-600 hover:text-blue-800 text-xs font-bold mt-2 ml-4 flex items-center gap-0.5 cursor-pointer">
                        <Eye className="w-3.5 h-3.5" /> View Details
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Order Details Drawer ────────────────────────────────── */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex justify-end">
          <div className="absolute inset-0" onClick={() => setSelectedOrder(null)} />
          <div className="relative w-full sm:max-w-lg bg-[#f1f3f6] h-full shadow-2xl flex flex-col z-10 animate-slideLeft">

            <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Order Details</span>
                <h2 className="text-base font-bold text-gray-950 mt-0.5">#{selectedOrder.id}</h2>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="bg-white border border-gray-200 rounded p-4 text-xs shadow-sm">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Delivery Address</h3>
                <p className="font-bold text-gray-900">{user.name || "Recipient"}</p>
                <p className="text-gray-600 mt-1 leading-relaxed">{selectedOrder.shippingAddress}</p>
                <p className="text-gray-600 mt-1">Email: {user.email}</p>
              </div>

              <div className="bg-white border border-gray-200 rounded p-4 text-xs shadow-sm">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Order Status</h3>
                <div className="relative flex items-center justify-between px-2">
                  <div className="absolute left-6 right-6 top-3.5 h-[2px] bg-gray-200 -z-10" />
                  <div className="absolute left-6 top-3.5 h-[2px] bg-green-500 transition-all duration-500 -z-10"
                    style={{ width: selectedOrder.status === "Delivered" ? "100%" : selectedOrder.status === "Shipped" ? "50%" : "0%" }} />
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-gray-700 mt-1.5">Placed</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold border ${selectedOrder.status === "Shipped" || selectedOrder.status === "Delivered" ? "bg-green-500 text-white border-green-500" : "bg-white text-gray-400 border-gray-200"}`}>
                      {selectedOrder.status === "Shipped" || selectedOrder.status === "Delivered" ? <CheckCircle2 className="w-4 h-4" /> : <Truck className="w-3.5 h-3.5" />}
                    </div>
                    <span className={`text-xs font-bold mt-1.5 ${selectedOrder.status === "Shipped" || selectedOrder.status === "Delivered" ? "text-gray-700" : "text-gray-400"}`}>Shipped</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold border ${selectedOrder.status === "Delivered" ? "bg-green-500 text-white border-green-500" : "bg-white text-gray-400 border-gray-200"}`}>
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className={`text-xs font-bold mt-1.5 ${selectedOrder.status === "Delivered" ? "text-gray-700" : "text-gray-400"}`}>Delivered</span>
                  </div>
                </div>
                <div className="mt-5 pt-3 border-t border-gray-100 flex justify-between text-[11px] text-gray-500">
                  <span>Expected Delivery:</span>
                  <span className="font-bold text-gray-800">{selectedOrder.expectedDelivery || "TBD"}</span>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded p-4 text-xs shadow-sm">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Item Details</h3>
                <div className="space-y-3">
                  {(selectedOrder.items || []).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                      <div className="flex items-start gap-2.5 max-w-[75%]">
                        {item.image ? (
                          <img src={item.image} alt={item.title} className="w-10 h-10 object-contain bg-gray-50 border border-gray-100 rounded p-0.5" />
                        ) : (
                          <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded flex items-center justify-center text-gray-400">
                            <BookOpen className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-gray-900 leading-snug line-clamp-2">{item.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">Quantity: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="font-bold text-gray-900">₹{parseFloat(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded p-4 text-xs shadow-sm space-y-2.5">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Price Details</h3>
                <div className="flex justify-between text-gray-600">
                  <span>Price ({selectedOrder.itemsCount} {selectedOrder.itemsCount === 1 ? "item" : "items"})</span>
                  <span>₹{parseFloat(selectedOrder.total || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Charges</span>
                  <span className="text-green-600 font-bold">FREE</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-gray-900 pt-2.5 border-t border-gray-100">
                  <span>Total Amount</span>
                  <span className="text-orange-500">₹{parseFloat(selectedOrder.total || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded p-4 text-xs shadow-sm flex items-start gap-2 text-gray-600">
                <ShieldCheck className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-gray-900">Razorpay Secure Payment</p>
                  <p className="text-xs text-gray-400 mt-0.5">Payment ID: {selectedOrder.payment_id || "N/A"}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-gray-200 space-y-2">
              {(() => {
                let invUrl = selectedOrder.invoice_url || selectedOrder.invoiceUrl;
                if (!invUrl) {
                  try {
                    const del = typeof selectedOrder.delivery === "string" ? JSON.parse(selectedOrder.delivery) : selectedOrder.delivery;
                    invUrl = del?.invoice_url;
                  } catch (e) {}
                }
                if (!invUrl) {
                  try {
                    const pDel = typeof selectedOrder.parentOrder?.delivery === "string" ? JSON.parse(selectedOrder.parentOrder.delivery) : selectedOrder.parentOrder?.delivery;
                    invUrl = pDel?.invoice_url;
                  } catch (e) {}
                }
                if (!invUrl) return null;
                return (
                  <a
                    href={invUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded text-xs transition-all cursor-pointer shadow-xs"
                  >
                    <FileText className="w-4 h-4" /> Download Tax Invoice (PDF)
                  </a>
                );
              })()}
              {selectedOrder.trackingUrl && (
                <a href={selectedOrder.trackingUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded text-xs transition-all cursor-pointer">
                  <Truck className="w-4 h-4" /> Track Order
                </a>
              )}
              <button onClick={() => setSelectedOrder(null)}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded text-xs transition-all cursor-pointer">
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
