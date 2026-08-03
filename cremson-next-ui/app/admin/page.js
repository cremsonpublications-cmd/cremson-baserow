"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChevronDown } from "lucide-react";
import { getApiBaseUrl } from "../../lib/api/axios";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeParseJSON(val) {
  if (typeof val === "object" && val !== null) return val;
  if (typeof val === "string") {
    try { return JSON.parse(val); } catch { return {}; }
  }
  return {};
}

function parseOrderDate(raw) {
  if (!raw) return null;
  // ISO, YYYY-MM-DD, YYYY-MM-DD HH:mm:ss
  let d = new Date(raw);
  if (!isNaN(d)) return d;
  // DD/MM/YYYY
  const parts = raw.split("/");
  if (parts.length === 3) {
    const attempt = new Date(`${parts[2]}-${parts[1].padStart(2,"0")}-${parts[0].padStart(2,"0")}`);
    if (!isNaN(attempt)) return attempt;
  }
  return null;
}

// Revenue = order_summary.grandTotal (JSON) OR order.total_amount fallback
function getOrderTotal(order) {
  const summary = safeParseJSON(order.order_summary);
  const fromSummary = parseFloat(summary?.grandTotal ?? 0);
  if (fromSummary > 0) return fromSummary;
  const direct = parseFloat(order.total_amount ?? order.grand_total ?? order.total ?? 0);
  return isNaN(direct) ? 0 : direct;
}

// "Paid" = any status that means money was collected (not pending/cancelled)
const PAID_STATUSES = new Set([
  "confirmed", "ready_to_pack", "pickup_requested", "shipped", "delivered",
  "paid", "payment_done", "completed",
]);
function isPaid(order) {
  const status = (order.order_status ?? order.status ?? "").toLowerCase();
  return PAID_STATUSES.has(status);
}

// ─── Custom tooltip for bar chart ─────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-lg text-sm">
        <p className="font-semibold text-gray-700 mb-1">{label}</p>
        <p className="text-purple-600 font-bold">₹{Number(payload[0].value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
      </div>
    );
  }
  return null;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const API = getApiBaseUrl();
  const [counts, setCounts] = useState({});
  const [countsLoading, setCountsLoading] = useState(true);
  const [allOrders, setAllOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [yearDropOpen, setYearDropOpen] = useState(false);
  const yearRef = useRef(null);

  // ── Fetch stat counts ──────────────────────────────────────────────────────
  useEffect(() => {
    const endpoints = {
      categories: "/api/categories/?size=1",
      products: "/api/products/?size=1",
      orders: "/api/orders/?size=1",
    };
    Promise.all(
      Object.entries(endpoints).map(async ([key, path]) => {
        try {
          const res = await fetch(`${API}${path}`);
          const data = await res.json();
          return [key, data.count ?? data.total ?? "—"];
        } catch {
          return [key, "—"];
        }
      })
    ).then((pairs) => {
      setCounts(Object.fromEntries(pairs));
      setCountsLoading(false);
    });
  }, []);

  // ── Fetch ALL orders for revenue analysis ──────────────────────────────────
  useEffect(() => {
    async function fetchAll() {
      setOrdersLoading(true);
      let all = [];
      let page = 1;
      let hasNext = true;
      while (hasNext) {
        try {
          const res = await fetch(`${API}/api/orders/?size=200&page=${page}`);
          const data = await res.json();
          const results = data.results || [];
          all = [...all, ...results];
          hasNext = !!data.next && results.length === 200;
          page++;
        } catch {
          hasNext = false;
        }
      }
      setAllOrders(all);
      setOrdersLoading(false);
    }
    fetchAll();
  }, []);

  // Close year dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (yearRef.current && !yearRef.current.contains(e.target)) setYearDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Revenue computations ───────────────────────────────────────────────────
  const paidOrders = allOrders.filter(isPaid);

  const totalRevenue = paidOrders.reduce((s, o) => s + getOrderTotal(o), 0);

  const monthlyData = MONTHS.map((month, idx) => {
    const revenue = paidOrders
      .filter((o) => {
        const d = parseOrderDate(o.order_date ?? o.created_at ?? o.date);
        return d && d.getFullYear() === selectedYear && d.getMonth() === idx;
      })
      .reduce((s, o) => s + getOrderTotal(o), 0);
    return { month, revenue };
  });

  const yearRevenue = monthlyData.reduce((s, m) => s + m.revenue, 0);

  const now = new Date();
  const todayRevenue = paidOrders
    .filter((o) => {
      const d = parseOrderDate(o.order_date ?? o.created_at ?? o.date);
      return d && d.toDateString() === now.toDateString();
    })
    .reduce((s, o) => s + getOrderTotal(o), 0);

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekRevenue = paidOrders
    .filter((o) => {
      const d = parseOrderDate(o.order_date ?? o.created_at ?? o.date);
      return d && d >= weekStart;
    })
    .reduce((s, o) => s + getOrderTotal(o), 0);

  const availableYears = [...new Set(
    allOrders
      .map((o) => parseOrderDate(o.order_date ?? o.created_at ?? o.date))
      .filter(Boolean)
      .map((d) => d.getFullYear())
  )].sort((a, b) => b - a);

  if (!availableYears.includes(selectedYear)) {
    if (availableYears.length > 0 && availableYears[0] !== selectedYear) {
      // keep selectedYear valid
    }
  }

  const fmt = (n) =>
    `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // ── Stat cards config ──────────────────────────────────────────────────────
  const statCards = [
    {
      key: "categories",
      label: "Total Categories",
      bg: "bg-blue-50",
      iconBg: "bg-blue-100",
      emoji: "📁",
      href: "/admin/categories",
    },
    {
      key: "products",
      label: "Total Products",
      bg: "bg-green-50",
      iconBg: "bg-green-100",
      emoji: "📦",
      href: "/admin/products",
    },
    {
      key: "orders",
      label: "Total Orders",
      bg: "bg-yellow-50",
      iconBg: "bg-yellow-100",
      emoji: "🛒",
      href: "/admin/orders",
    },
    {
      key: "revenue",
      label: "Total Revenue",
      bg: "bg-red-50",
      iconBg: "bg-red-100",
      emoji: "💰",
      value: ordersLoading ? null : fmt(totalRevenue),
      sub: ordersLoading ? null : `${paidOrders.length} paid orders`,
      href: "/admin/orders",
    },
  ];

  return (
    <div className="lg:p-8">
      {/* ── Page Title ── */}
      <h2 className="text-2xl font-semibold text-gray-900 mt-5 lg:mt-0 mb-8">Dashboard</h2>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => (
          <Link
            key={card.key}
            href={card.href}
            className={`${card.bg} rounded-xl p-6 border border-[#F3E8FF] hover:opacity-90 transition-opacity`}
            style={{ boxShadow: "rgba(0,0,0,0.1) 0px 4px 6px -1px, rgba(0,0,0,0.1) 0px 2px 4px -2px" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">{card.label}</p>
                {countsLoading && !card.value ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900">
                    {card.value ?? (counts[card.key] !== undefined ? counts[card.key].toLocaleString() : "—")}
                  </p>
                )}
                {card.sub && !ordersLoading && (
                  <p className="text-xs text-gray-500 mt-1">{card.sub}</p>
                )}
              </div>
              <div className={`${card.iconBg} p-3 rounded-lg`}>
                <span className="text-xl">{card.emoji}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Revenue Analysis Section ── */}
      <div className="bg-gray-50 min-h-screen font-sans">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900 mt-4 lg:mt-0">
            Revenue Analysis <span className="text-base font-normal text-gray-500">(Paid Orders Only)</span>
          </h1>
        </div>

        {/* ── Monthly Bar Chart ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-6 mb-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-purple-600">
              Monthly Revenue ({selectedYear})
            </h2>

            {/* Year selector */}
            <div className="relative" ref={yearRef}>
              <button
                onClick={() => setYearDropOpen((v) => !v)}
                className="flex items-center space-x-2 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-lg border border-gray-200 transition-colors"
              >
                <span className="text-gray-700 font-medium">{selectedYear}</span>
                <ChevronDown
                  size={16}
                  className={`text-gray-500 transition-transform ${yearDropOpen ? "rotate-180" : ""}`}
                />
              </button>
              {yearDropOpen && availableYears.length > 0 && (
                <div className="absolute right-0 mt-1 w-28 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
                  {availableYears.map((y) => (
                    <button
                      key={y}
                      onClick={() => { setSelectedYear(y); setYearDropOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-purple-50 hover:text-purple-700 transition-colors ${y === selectedYear ? "bg-purple-50 text-purple-700 font-bold" : "text-gray-700"}`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="h-64 sm:h-72 md:h-80 lg:h-96">
            {ordersLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-purple-500 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">Loading revenue data…</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: "#6B7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#6B7280" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    width={55}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F5F3FF" }} />
                  <Bar dataKey="revenue" fill="#8B5CF6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── Year Total Banner ── */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-sm p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">{selectedYear} Total Revenue</h3>
              {ordersLoading ? (
                <Skeleton className="h-9 w-40 bg-purple-400" />
              ) : (
                <div className="text-3xl font-bold mb-1">{fmt(yearRevenue)}</div>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm text-purple-200 mb-1">Selected Year</div>
              <div className="text-2xl font-bold">{selectedYear}</div>
            </div>
          </div>
        </div>

        {/* ── Today / This Week / This Month ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-orange-600 mb-2">Today&apos;s Revenue</h3>
            {ordersLoading ? (
              <Skeleton className="h-9 w-32" />
            ) : (
              <div className="text-3xl font-bold text-orange-700 mb-1">{fmt(todayRevenue)}</div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-green-600 mb-2">This Week</h3>
            {ordersLoading ? (
              <Skeleton className="h-9 w-32" />
            ) : (
              <div className="text-3xl font-bold text-green-700 mb-1">{fmt(weekRevenue)}</div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-purple-600 mb-2">This Month</h3>
            {ordersLoading ? (
              <Skeleton className="h-9 w-32" />
            ) : (
              <div className="text-3xl font-bold text-purple-700 mb-1">
                {fmt(monthlyData[now.getMonth()]?.revenue ?? 0)}
              </div>
            )}
          </div>
        </div>

        {/* ── Quick links ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[
            { label: "Orders", href: "/admin/orders", emoji: "🛒", color: "text-yellow-700 bg-yellow-50 border-yellow-200" },
            { label: "Products", href: "/admin/products", emoji: "📦", color: "text-green-700 bg-green-50 border-green-200" },
            { label: "Categories", href: "/admin/categories", emoji: "📁", color: "text-blue-700 bg-blue-50 border-blue-200" },
            { label: "Users", href: "/admin/users", emoji: "👥", color: "text-purple-700 bg-purple-50 border-purple-200" },
            { label: "Coupons", href: "/admin/coupons", emoji: "🏷️", color: "text-pink-700 bg-pink-50 border-pink-200" },
            { label: "Reviews", href: "/admin/reviews", emoji: "⭐", color: "text-orange-700 bg-orange-50 border-orange-200" },
            { label: "Shipping", href: "/admin/shipping-settings", emoji: "🚚", color: "text-teal-700 bg-teal-50 border-teal-200" },
            { label: "Specimens", href: "/admin/specimen-requests", emoji: "📋", color: "text-red-700 bg-red-50 border-red-200" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border font-semibold text-sm transition-all hover:opacity-80 active:scale-95 ${item.color}`}
            >
              <span className="text-xl">{item.emoji}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
