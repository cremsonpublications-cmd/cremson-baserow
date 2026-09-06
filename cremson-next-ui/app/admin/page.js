"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getApiBaseUrl } from "../../lib/api/axios";
import api from "../../lib/api/axios";
import {
  Package,
  FileText,
  Layers,
  Clock,
  ArrowRight,
  CheckCircle2,
  Check,
  Plus,
  Bell,
  Send,
  BookOpen,
  ShoppingCart,
  TrendingUp,
  IndianRupee,
} from "lucide-react";
import { toast } from "sonner";

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-gray-100 rounded-xl ${className}`} />;
}

function StatCard({ icon: Icon, iconColor, label, value, loading, linkHref, linkLabel, valueColor = "text-gray-900" }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm font-medium text-gray-500">{label}</span>
      </div>
      {loading ? (
        <Skeleton className="h-9 w-16" />
      ) : (
        <span className={`text-4xl font-black tracking-tight ${valueColor}`}>{value}</span>
      )}
      {linkHref && (
        <Link href={linkHref} className="text-xs font-semibold text-red-600 hover:text-red-800 flex items-center gap-1 mt-auto">
          {linkLabel} <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}

function StatusPill({ status }) {
  const s = (status || "").toLowerCase();
  const map = {
    ready_to_pack: "bg-orange-50 text-orange-700 border-orange-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    pending_review: "bg-amber-50 text-amber-700 border-amber-200",
    confirmed: "bg-blue-50 text-blue-700 border-blue-200",
    shipped: "bg-violet-50 text-violet-700 border-violet-200",
    delivered: "bg-green-50 text-green-700 border-green-200",
    dispatched: "bg-green-50 text-green-700 border-green-200",
  };
  const cls = map[s] || "bg-gray-50 text-gray-600 border-gray-200";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border capitalize ${cls}`}>
      {status?.replace(/_/g, " ") || "—"}
    </span>
  );
}

export default function AdminDashboard() {
  const API = getApiBaseUrl();

  const [statLoading, setStatLoading] = useState(true);
  const [ordersCount, setOrdersCount] = useState("—");
  const [specimensCount, setSpecimensCount] = useState("—");
  const [bulksCount, setBulksCount] = useState("—");
  const [overdueCount, setOverdueCount] = useState("—");
  const [productsCount, setProductsCount] = useState("—");
  const [paidOrdersCount, setPaidOrdersCount] = useState("—");
  const [paidRevenue, setPaidRevenue] = useState("—");

  const [workTab, setWorkTab] = useState("orders");
  const [workOrdersList, setWorkOrdersList] = useState([]);
  const [workSpecimensList, setWorkSpecimensList] = useState([]);
  const [workBulksList, setWorkBulksList] = useState([]);
  const [workLoading, setWorkLoading] = useState(true);

  const [reminders, setReminders] = useState([]);
  const [remindersLoading, setRemindersLoading] = useState(true);
  const [followupTab, setFollowupTab] = useState("overdue");

  const fetchAll = useCallback(async () => {
    setStatLoading(true);
    setWorkLoading(true);
    setRemindersLoading(true);

    try {
      const [ordersRes, specimensRes, bulkRes, remindersRes, productsRes, paidOrdersRes] =
        await Promise.allSettled([
          fetch(`${API}/api/orders/?order_status=READY_TO_PACK&size=50`).then((r) => r.json()),
          fetch(`${API}/api/specimen-requests/?size=200`).then((r) => r.json()),
          fetch(`${API}/api/bulk-orders/?size=200`).then((r) => r.json()),
          api.get("/api/reminders/?status=pending"),
          fetch(`${API}/api/products/?size=1`).then((r) => r.json()),
          fetch(`${API}/api/orders/?size=200`).then((r) => r.json()),
        ]);

      if (ordersRes.status === "fulfilled") {
        const items = ordersRes.value.results || ordersRes.value.items || ordersRes.value || [];
        const list = Array.isArray(items) ? items : [];
        setWorkOrdersList(list);
        setOrdersCount(ordersRes.value.count ?? list.length);
      }

      if (specimensRes.status === "fulfilled") {
        const items = specimensRes.value.results || specimensRes.value.items || specimensRes.value || [];
        const list = Array.isArray(items)
          ? items.filter((req) => {
              const st = (typeof req.DeliveryStatus === "object" ? req.DeliveryStatus?.value : req.DeliveryStatus || "").toLowerCase();
              return Number(req.id) > 363 && st !== "dispatched" && st !== "rto" && st !== "rejected";
            })
          : [];
        setWorkSpecimensList(list);
        setSpecimensCount(list.length);
      }

      if (bulkRes.status === "fulfilled") {
        const items = bulkRes.value.results || bulkRes.value.items || bulkRes.value || [];
        const list = Array.isArray(items)
          ? items.filter((o) => ["pending", "pending_review", "pending_approval", "created"].includes((o.status || "").toLowerCase()))
          : [];
        setWorkBulksList(list);
        setBulksCount(list.length);
      }

      if (remindersRes.status === "fulfilled") {
        const list = Array.isArray(remindersRes.value.data?.reminders) ? remindersRes.value.data.reminders : [];
        setReminders(list);
        setOverdueCount(list.filter((r) => r.is_overdue).length);
      }

      if (productsRes.status === "fulfilled") {
        setProductsCount(productsRes.value.count ?? productsRes.value.total ?? "—");
      }

      if (paidOrdersRes.status === "fulfilled") {
        const items = paidOrdersRes.value.results || paidOrdersRes.value.items || paidOrdersRes.value || [];
        const paid = Array.isArray(items)
          ? items.filter((o) => ["ready_to_pack", "shipped", "delivered", "confirmed", "pickup_requested", "dispatched"].includes((o.order_status || o.status || "").toLowerCase()))
          : [];
        setPaidOrdersCount(paid.length);
        const revenue = paid.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
        setPaidRevenue(revenue > 0 ? `₹${revenue.toLocaleString("en-IN")}` : "₹0");
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setStatLoading(false);
      setWorkLoading(false);
      setRemindersLoading(false);
    }
  }, [API]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleMarkCompleted(id) {
    try {
      await api.patch(`/api/reminders/${id}/complete`);
      toast.success("Reminder marked completed!");
      fetchAll();
    } catch {
      toast.error("Failed to update reminder.");
    }
  }

  const overdueList = reminders.filter((r) => r.is_overdue);
  const todayList = reminders.filter((r) => r.is_today && !r.is_overdue);
  const upcomingList = reminders.filter((r) => !r.is_today && !r.is_overdue);
  const activeFollowups = followupTab === "overdue" ? overdueList : followupTab === "today" ? todayList : upcomingList;

  const workTabs = [
    { id: "orders", label: "Orders", count: statLoading ? "…" : ordersCount },
    { id: "specimens", label: "Specimens", count: statLoading ? "…" : specimensCount },
    { id: "bulk", label: "Bulk", count: statLoading ? "…" : bulksCount },
  ];

  const followupTabs = [
    { id: "overdue", label: "Overdue", count: overdueList.length, color: "text-red-600", borderColor: "border-red-600" },
    { id: "today", label: "Today", count: todayList.length, color: "text-amber-600", borderColor: "border-amber-500" },
    { id: "upcoming", label: "Upcoming", count: upcomingList.length, color: "text-blue-600", borderColor: "border-blue-600" },
  ];

  const quickLinks = [
    { href: "/admin/products", Icon: Plus, label: "Add product", cls: "text-red-600 bg-red-50 border-red-100" },
    { href: "/admin/reminders", Icon: Bell, label: "Create reminder", cls: "text-amber-600 bg-amber-50 border-amber-100" },
    { href: "/admin/blogs", Icon: BookOpen, label: "Manage content", cls: "text-blue-600 bg-blue-50 border-blue-100" },
    { href: "/admin/whatsapp/campaigns", Icon: Send, label: "WhatsApp campaigns", cls: "text-green-600 bg-green-50 border-green-100" },
  ];

  return (
    <div className="p-5 sm:p-7 max-w-7xl mx-auto space-y-6">

      <div>
        <h1 className="text-xl font-bold text-gray-900">Your daily work, in one place</h1>
        <p className="text-xs text-gray-400 mt-0.5">Here&apos;s what needs your attention today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ShoppingCart} iconColor="bg-red-50 text-red-600" label="Ready to pack" value={statLoading ? "—" : ordersCount} loading={statLoading} linkHref="/admin/orders" linkLabel="View orders" />
        <StatCard icon={FileText} iconColor="bg-blue-50 text-blue-600" label="Specimens to review" value={statLoading ? "—" : specimensCount} loading={statLoading} linkHref="/admin/specimen-requests" linkLabel="View requests" />
        <StatCard icon={Layers} iconColor="bg-purple-50 text-purple-600" label="Bulk requests" value={statLoading ? "—" : bulksCount} loading={statLoading} linkHref="/admin/bulk-orders" linkLabel="Review requests" />
        <StatCard icon={Clock} iconColor="bg-amber-50 text-amber-600" label="Overdue follow-ups" value={statLoading ? "—" : overdueCount} loading={statLoading} linkHref="/admin/reminders" linkLabel="Review overdue" valueColor={Number(overdueCount) > 0 ? "text-amber-600" : "text-gray-900"} />
      </div>

      {/* Work + Follow-ups */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Work requiring action */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">Work requiring action</h2>
            <Link href="/admin/orders" className="text-xs font-semibold text-red-600 hover:text-red-800 flex items-center gap-1">View all <ArrowRight className="w-3.5 h-3.5" /></Link>
          </div>
          <div className="flex border-b border-gray-100 px-5">
            {workTabs.map((tab) => (
              <button key={tab.id} onClick={() => setWorkTab(tab.id)}
                className={`py-3 mr-5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${workTab === tab.id ? "border-red-600 text-red-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
          <div className="overflow-x-auto">
            {workLoading ? (
              <div className="p-5 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : workTab === "orders" ? (
              workOrdersList.length === 0 ? (
                <div className="p-8 text-center"><CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" /><p className="text-sm font-semibold text-gray-600">All orders packed!</p><p className="text-xs text-gray-400 mt-0.5">No orders awaiting dispatch.</p></div>
              ) : (
                <>
                  <table className="w-full text-xs">
                    <thead><tr className="bg-gray-50 text-gray-500 font-semibold text-[11px] uppercase tracking-wide"><th className="text-left px-5 py-2.5">Order</th><th className="text-left px-3 py-2.5">Customer</th><th className="text-left px-3 py-2.5">Received</th><th className="text-left px-3 py-2.5">Status</th><th className="text-right px-5 py-2.5">Action</th></tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {workOrdersList.slice(0, 6).map((o) => {
                        const ui = (() => { try { return JSON.parse(o.user_info || "{}"); } catch { return {}; } })();
                        const name = ui.name || o.customer_name || "—";
                        const orderId = o.order_id || `#${o.id}`;
                        const dateStr = o.order_date ? new Date(o.order_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—";
                        return (
                          <tr key={o.id} className="hover:bg-gray-50/60 transition-colors">
                            <td className="px-5 py-3 font-bold text-gray-800">{orderId}</td>
                            <td className="px-3 py-3 text-gray-600">{name}</td>
                            <td className="px-3 py-3 text-gray-500">{dateStr}</td>
                            <td className="px-3 py-3"><StatusPill status={o.order_status || o.status} /></td>
                            <td className="px-5 py-3 text-right"><Link href="/admin/orders" className="text-[11px] font-bold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors">Open →</Link></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <p className="text-[11px] text-gray-400 px-5 py-3 border-t border-gray-50">{ordersCount} paid order{ordersCount !== 1 ? "s" : ""} awaiting dispatch.</p>
                </>
              )
            ) : workTab === "specimens" ? (
              workSpecimensList.length === 0 ? (
                <div className="p-8 text-center"><CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" /><p className="text-sm font-semibold text-gray-600">No pending specimen requests!</p></div>
              ) : (
                <>
                  <table className="w-full text-xs">
                    <thead><tr className="bg-gray-50 text-gray-500 font-semibold text-[11px] uppercase tracking-wide"><th className="text-left px-5 py-2.5">Teacher</th><th className="text-left px-3 py-2.5">School</th><th className="text-left px-3 py-2.5">Status</th><th className="text-right px-5 py-2.5">Action</th></tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {workSpecimensList.slice(0, 6).map((s) => {
                        const name = typeof s["Teacher Name"] === "string" ? s["Teacher Name"] : "—";
                        const school = Array.isArray(s["School Name"]) ? (s["School Name"][0]?.value || s["School Name"][0] || "—") : (s["School Name"] || "—");
                        const st = typeof s.DeliveryStatus === "object" ? s.DeliveryStatus?.value : s.DeliveryStatus;
                        return (
                          <tr key={s.id} className="hover:bg-gray-50/60 transition-colors">
                            <td className="px-5 py-3 font-bold text-gray-800">{name}</td>
                            <td className="px-3 py-3 text-gray-600 max-w-[140px] truncate">{school}</td>
                            <td className="px-3 py-3"><StatusPill status={st || "Pending"} /></td>
                            <td className="px-5 py-3 text-right"><Link href="/admin/specimen-requests" className="text-[11px] font-bold text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">Open →</Link></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <p className="text-[11px] text-gray-400 px-5 py-3 border-t border-gray-50">{specimensCount} specimen request{specimensCount !== 1 ? "s" : ""} pending review.</p>
                </>
              )
            ) : (
              workBulksList.length === 0 ? (
                <div className="p-8 text-center"><CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" /><p className="text-sm font-semibold text-gray-600">No pending bulk orders!</p></div>
              ) : (
                <>
                  <table className="w-full text-xs">
                    <thead><tr className="bg-gray-50 text-gray-500 font-semibold text-[11px] uppercase tracking-wide"><th className="text-left px-5 py-2.5">School</th><th className="text-left px-3 py-2.5">Contact</th><th className="text-left px-3 py-2.5">Status</th><th className="text-right px-5 py-2.5">Action</th></tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {workBulksList.slice(0, 6).map((b) => (
                        <tr key={b.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-5 py-3 font-bold text-gray-800 max-w-[140px] truncate">{b.school_name || "—"}</td>
                          <td className="px-3 py-3 text-gray-600">{b.contact_name || b.full_name || "—"}</td>
                          <td className="px-3 py-3"><StatusPill status={b.status} /></td>
                          <td className="px-5 py-3 text-right"><Link href="/admin/bulk-orders" className="text-[11px] font-bold text-purple-600 border border-purple-200 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors">Open →</Link></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-[11px] text-gray-400 px-5 py-3 border-t border-gray-50">{bulksCount} bulk order{bulksCount !== 1 ? "s" : ""} pending approval.</p>
                </>
              )
            )}
          </div>
        </div>

        {/* Follow-ups */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">Follow-ups</h2>
            <Link href="/admin/reminders" className="text-xs font-semibold text-red-600 hover:text-red-800 flex items-center gap-1">View all <ArrowRight className="w-3.5 h-3.5" /></Link>
          </div>
          <div className="flex border-b border-gray-100 px-5">
            {followupTabs.map((tab) => (
              <button key={tab.id} onClick={() => setFollowupTab(tab.id)}
                className={`py-3 mr-5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${followupTab === tab.id ? `${tab.borderColor} ${tab.color}` : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
          <div className="overflow-y-auto max-h-[380px]">
            {remindersLoading ? (
              <div className="p-5 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
            ) : activeFollowups.length === 0 ? (
              <div className="p-8 text-center"><CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" /><p className="text-sm font-semibold text-gray-600">All caught up!</p><p className="text-xs text-gray-400 mt-0.5">No {followupTab} follow-ups.</p></div>
            ) : (
              <div className="divide-y divide-gray-50">
                {activeFollowups.slice(0, 8).map((item) => (
                  <div key={item.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">
                          {item.teacher_name ? `${item.teacher_name}${item.school_name ? ` — ${item.school_name}` : ""}` : item.title || item.notes || "Reminder"}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5">{item.assigned_to ? `Assigned to ${item.assigned_to}` : ""}{item.notes && item.teacher_name ? ` · ${item.notes}` : ""}</p>
                        <p className="text-[11px] text-gray-400 mt-1">Due: {item.due_date || "—"}</p>
                      </div>
                      {item.is_overdue && (
                        <span className="flex-shrink-0 text-[10px] font-bold bg-red-100 text-red-700 px-2 py-1 rounded-full whitespace-nowrap">{item.overdue_days}d overdue</span>
                      )}
                      {item.is_today && !item.is_overdue && (
                        <span className="flex-shrink-0 text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-full whitespace-nowrap">Due today</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-[11px] font-semibold">
                      <button onClick={() => handleMarkCompleted(item.id)} className="flex items-center gap-1 text-emerald-600 hover:text-emerald-800 transition-colors cursor-pointer">
                        <Check className="w-3.5 h-3.5" /> Complete
                      </button>
                      <Link href="/admin/reminders" className="text-blue-600 hover:text-blue-800 transition-colors">Reschedule</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
        <h2 className="text-sm font-bold text-gray-900 mb-4">Quick links</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickLinks.map(({ href, Icon, label, cls }) => (
            <Link key={href} href={href} className={`flex items-center gap-3 p-4 rounded-xl border font-semibold text-xs hover:opacity-80 transition-opacity ${cls}`}>
              <Icon className="w-5 h-5 flex-shrink-0" />{label}
            </Link>
          ))}
        </div>
      </div>

      {/* Business Snapshot */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold text-gray-900">Business snapshot</h2>
          <span className="text-xs text-gray-400 font-medium">This month</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
          <div className="py-3 sm:py-0 sm:pr-6 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium"><IndianRupee className="w-3.5 h-3.5" /> Paid order value</div>
            {statLoading ? <Skeleton className="h-8 w-28" /> : <span className="text-2xl font-black text-gray-900">{paidRevenue}</span>}
          </div>
          <div className="py-3 sm:py-0 sm:px-6 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium"><ShoppingCart className="w-3.5 h-3.5" /> Paid orders</div>
            {statLoading ? <Skeleton className="h-8 w-16" /> : <span className="text-2xl font-black text-gray-900">{paidOrdersCount}</span>}
          </div>
          <div className="py-3 sm:py-0 sm:pl-6 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium"><TrendingUp className="w-3.5 h-3.5" /> Active products</div>
            {statLoading ? <Skeleton className="h-8 w-16" /> : <span className="text-2xl font-black text-gray-900">{productsCount}</span>}
          </div>
        </div>
      </div>

    </div>
  );
}
