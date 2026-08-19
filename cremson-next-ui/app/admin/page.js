"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getApiBaseUrl } from "../../lib/api/axios";
import api from "../../lib/api/axios";
import { Bell, AlertCircle, Clock, Check, Calendar, ArrowRight, CheckCircle2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

// Skeleton component
function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

export default function AdminDashboard() {
  const API = getApiBaseUrl();
  const [counts, setCounts] = useState({});
  const [countsLoading, setCountsLoading] = useState(true);

  // Reminders state
  const [reminders, setReminders] = useState([]);
  const [remindersLoading, setRemindersLoading] = useState(true);

  // Filters state
  const [dashboardFilter, setDashboardFilter] = useState("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Actionable sections state
  const [ordersCount, setOrdersCount] = useState("—");
  const [specimensCount, setSpecimensCount] = useState("—");
  const [bulksCount, setBulksCount] = useState("—");
  const [sectionLoading, setSectionLoading] = useState(true);

  // Fetch stat counts
  useEffect(() => {
    const endpoints = {
      categories: "/api/categories/?size=1",
      products: "/api/products/?size=1",
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
  }, [API]);

  // Fetch Reminders
  const fetchReminders = async () => {
    try {
      const res = await api.get("/api/reminders/?status=pending");
      const list = Array.isArray(res.data?.reminders) ? res.data.reminders : [];
      setReminders(list);
    } catch (err) {
      console.error("Failed to fetch reminders:", err);
    } finally {
      setRemindersLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  // Fetch dashboard counts
  useEffect(() => {
    const fetchSectionsData = async () => {
      setSectionLoading(true);
      try {
        const [ordersRes, specimensRes, bulksRes] = await Promise.all([
          fetch(`${API}/api/orders/?order_status=READY_TO_PACK&size=1`).then((r) => r.json()),
          fetch(`${API}/api/specimen-requests/?size=200`).then((r) => r.json()),
          fetch(`${API}/api/bulk-orders/?size=100`).then((r) => r.json()),
        ]);
        
        const pendingSpecimens = (specimensRes.results || specimensRes.items || []).filter((req) => {
          const statusRaw = (typeof req.DeliveryStatus === "object" ? req.DeliveryStatus?.value : req.DeliveryStatus || "").toLowerCase();
          const isOldData = Number(req.id) <= 363;
          return !isOldData && statusRaw !== "dispatched" && statusRaw !== "rto" && statusRaw !== "rejected";
        }).length;

        const pendingBulks = (bulksRes.results || bulksRes.items || []).filter(
          (o) => o.status === "pending_review"
        ).length;

        setOrdersCount(ordersRes.count ?? ordersRes.total ?? 0);
        setSpecimensCount(pendingSpecimens);
        setBulksCount(pendingBulks);
      } catch (err) {
        console.error("Failed to fetch dashboard section counts:", err);
      } finally {
        setSectionLoading(false);
      }
    };
    fetchSectionsData();
  }, [API]);

  const handleMarkCompleted = async (id) => {
    try {
      await api.patch(`/api/reminders/${id}/complete`);
      toast.success("Reminder marked completed!");
      fetchReminders();
    } catch (err) {
      toast.error("Failed to update reminder.");
    }
  };

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
  ];

  // Filtering reminders by date range first
  const dateFilteredReminders = reminders.filter((r) => {
    if (!r.due_date) return true;
    if (startDate && r.due_date < startDate) return false;
    if (endDate && r.due_date > endDate) return false;
    return true;
  });

  // Filtering reminders for tabs
  const todayRemindersCount = dateFilteredReminders.filter((r) => r.is_today).length;
  const overdueRemindersCount = dateFilteredReminders.filter((r) => r.is_overdue).length;
  const upcomingRemindersCount = dateFilteredReminders.filter((r) => !r.is_today && !r.is_overdue).length;

  const filteredReminders = dateFilteredReminders.filter((r) => {
    // Tab Filter
    if (dashboardFilter === "today" && !r.is_today) return false;
    if (dashboardFilter === "overdue" && !r.is_overdue) return false;
    if (dashboardFilter === "upcoming" && (r.is_today || r.is_overdue)) return false;

    return true; // "all"
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* ── Page Title ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
        <Link
          href="/admin/reminders"
          className="flex items-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold px-4 py-2 rounded-xl border border-purple-200 transition-colors"
        >
          <Bell className="w-4 h-4 text-purple-600" />
          Manage Reminders ({reminders.length})
        </Link>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {statCards.map((card) => (
          <Link
            key={card.key}
            href={card.href}
            className={`${card.bg} rounded-2xl p-6 border border-[#F3E8FF] hover:opacity-90 transition-opacity`}
            style={{ boxShadow: "rgba(0,0,0,0.06) 0px 4px 6px -1px" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">{card.label}</p>
                {countsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-3xl font-extrabold text-gray-900">
                    {counts[card.key] !== undefined ? counts[card.key].toLocaleString() : "—"}
                  </p>
                )}
              </div>
              <div className={`${card.iconBg} p-3.5 rounded-xl`}>
                <span className="text-2xl">{card.emoji}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Orders, Specimen Requests & Bulk Orders Dashboard Section ── */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Orders & Requests Overview</h3>
            <p className="text-xs text-gray-500">Quick links to view and manage pending items</p>
          </div>
        </div>

        {sectionLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Orders */}
            <Link
              href="/admin/orders"
              className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl hover:bg-blue-50 transition-colors flex items-center justify-between group cursor-pointer"
            >
              <div>
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">New Orders (Ready to Pack)</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{ordersCount}</p>
              </div>
              <span className="text-xs font-semibold text-blue-600 group-hover:text-blue-800 flex items-center gap-1">
                View All <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>

            {/* Specimen Requests */}
            <Link
              href="/admin/specimen-requests"
              className="p-4 bg-green-50/50 border border-green-100 rounded-2xl hover:bg-green-50 transition-colors flex items-center justify-between group cursor-pointer"
            >
              <div>
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">Pending Specimen Requests</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{specimensCount}</p>
              </div>
              <span className="text-xs font-semibold text-green-600 group-hover:text-green-800 flex items-center gap-1">
                View All <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>

            {/* Bulk Orders */}
            <Link
              href="/admin/bulk-orders"
              className="p-4 bg-purple-50/50 border border-purple-100 rounded-2xl hover:bg-purple-50 transition-colors flex items-center justify-between group cursor-pointer"
            >
              <div>
                <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Pending Bulk Orders</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{bulksCount}</p>
              </div>
              <span className="text-xs font-semibold text-purple-600 group-hover:text-purple-800 flex items-center gap-1">
                View All <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </div>
        )}
      </div>

      {/* ── Reminders & Follow-ups Dashboard Section ── */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Follow-up Alerts & Reminders</h3>
              <p className="text-xs text-gray-500">Track pending calls and overdue task notifications</p>
            </div>
          </div>

          <Link
            href="/admin/reminders"
            className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1 self-start md:self-center"
          >
            View All ({reminders.length}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Dashboard Filter Tabs & Date Range Picker */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: "today", label: `Due Today (${todayRemindersCount})` },
              { id: "all", label: `All (${dateFilteredReminders.length})` },
              { id: "upcoming", label: `Upcoming (${upcomingRemindersCount})` },
              { id: "overdue", label: `Overdue (${overdueRemindersCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setDashboardFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${dashboardFilter === tab.id
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 font-semibold">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                onClick={(e) => e.target.showPicker()}
                className="px-2.5 py-1.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-gray-50/50 text-gray-700 cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 font-semibold">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                onClick={(e) => e.target.showPicker()}
                className="px-2.5 py-1.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-gray-50/50 text-gray-700 cursor-pointer"
              />
            </div>
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold rounded-xl transition-all cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Reminders Content */}
        {remindersLoading ? (
          <div className="p-8 text-center text-gray-400 text-xs font-medium">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading follow-up reminders...
          </div>
        ) : filteredReminders.length === 0 ? (
          <div className="p-8 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-700">All caught up!</p>
            <p className="text-xs text-gray-400 mt-1">No pending follow-ups or overdue reminders matching this filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReminders.slice(0, 10).map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${item.is_overdue
                    ? "bg-red-50/40 border-red-200"
                    : item.is_today
                      ? "bg-amber-50/40 border-amber-200"
                      : "bg-gray-50/60 border-gray-200"
                  }`}
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-xs text-gray-800 leading-relaxed max-w-xl">
                      {item.teacher_name
                        ? `Follow-up: ${item.teacher_name}${item.school_name ? ` (${item.school_name})` : ""}`
                        : (item.title || item.notes)}
                    </span>

                    {item.is_overdue && (
                      <span className="bg-red-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <AlertCircle className="w-3 h-3" />
                        Overdue by {item.overdue_days} {item.overdue_days === 1 ? "day" : "days"}
                      </span>
                    )}

                    {item.is_today && (
                      <span className="bg-amber-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        Due Today
                      </span>
                    )}
                  </div>

                  {item.teacher_name && item.notes && (
                    <p className="text-xs text-gray-500 font-medium">Notes: {item.notes}</p>
                  )}

                  <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                    <span>Due: <strong>{item.due_date}</strong></span>
                  </div>
                </div>

                <button
                  onClick={() => handleMarkCompleted(item.id)}
                  className="self-start sm:self-center flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  <Check className="w-4 h-4" />
                  Mark Completed
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
