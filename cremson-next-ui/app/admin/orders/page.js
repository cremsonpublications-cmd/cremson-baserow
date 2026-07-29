"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../../lib/api/axios";
import { adminUpdateOrderStatus } from "../../../lib/api/admin";

const PAGE_SIZE = 20;

const ORDER_STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

const UPDATE_STATUSES = ["Confirmed", "Shipped", "Delivered", "Cancelled"];

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function StatusBadge({ status }) {
  const map = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    processing: "bg-blue-100 text-blue-800",
    shipped: "bg-indigo-100 text-indigo-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    refunded: "bg-gray-100 text-gray-800",
  };
  const cls = map[status?.toLowerCase()] || "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${cls}`}>
      {status || "—"}
    </span>
  );
}

function safeParseJSON(val) {
  if (typeof val === "object" && val !== null) return val;
  if (typeof val === "string") { try { return JSON.parse(val); } catch { return val; } }
  return val;
}

function OrderModal({ order, onClose, onStatusUpdated }) {
  if (!order) return null;
  const userInfo = safeParseJSON(order.user_info);
  const items = safeParseJSON(order.items);
  const orderSummary = safeParseJSON(order.order_summary);
  const payment = safeParseJSON(order.payment);
  const delivery = safeParseJSON(order.delivery);

  const [selectedStatus, setSelectedStatus] = useState(order.order_status ?? order.status ?? "");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState("");

  function formatDate(dateStr) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
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

  function renderJSON(val, title) {
    if (!val) return null;
    return (
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</h3>
        {Array.isArray(val) ? (
          <div className="space-y-2">
            {val.map((item, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                {typeof item === "object"
                  ? Object.entries(item).map(([k, v]) => (
                      <div key={k} className="flex gap-2 text-sm">
                        <span className="font-medium text-gray-600 min-w-[120px]">{k.replace(/_/g, " ")}:</span>
                        <span className="text-gray-900">{String(v ?? "—")}</span>
                      </div>
                    ))
                  : <span className="text-sm text-gray-900">{String(item)}</span>}
              </div>
            ))}
          </div>
        ) : typeof val === "object" ? (
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 space-y-1">
            {Object.entries(val).map(([k, v]) => (
              <div key={k} className="flex gap-2 text-sm">
                <span className="font-medium text-gray-600 min-w-[120px]">{k.replace(/_/g, " ")}:</span>
                <span className="text-gray-900">{String(v ?? "—")}</span>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-gray-900">{String(val)}</p>}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Order Details</h2>
            <p className="text-sm text-gray-500 font-mono">{order.order_id || order.id}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</p><StatusBadge status={order.order_status ?? order.status} /></div>
            <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Order Date</p><p className="text-sm text-gray-900">{formatDate(order.order_date ?? order.created_at)}</p></div>
            <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">DB ID</p><p className="text-sm font-mono text-gray-900">{order.id}</p></div>
            <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Order ID</p><p className="text-sm font-mono text-gray-900">{order.order_id || "—"}</p></div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Update Order Status</p>
            <div className="flex items-center gap-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">— Select Status —</option>
                {UPDATE_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button
                onClick={handleStatusUpdate}
                disabled={!selectedStatus || updatingStatus}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {updatingStatus ? "Updating..." : "Update"}
              </button>
            </div>
            {statusError && <p className="text-red-600 text-xs mt-2">{statusError}</p>}
          </div>

          {renderJSON(userInfo, "Customer Info")}
          {renderJSON(items, "Order Items")}
          {renderJSON(orderSummary, "Order Summary")}
          {renderJSON(payment, "Payment")}
          {renderJSON(delivery, "Delivery")}
        </div>
      </div>
    </div>
  );
}

const COLS = ["ID", "Order ID", "Status", "Order Date", "Created At"];

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState(null);

  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter]);

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
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }

  function handleStatusUpdated(orderId, newStatus) {
    queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    setSelected((prev) => prev ? { ...prev, order_status: newStatus } : null);
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-2.5 py-0.5 rounded-full">{count.toLocaleString()}</span>
      </div>

      <div className="bg-white rounded-xl shadow p-4 mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <input type="text" placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {ORDER_STATUSES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {(search || statusFilter) && (
          <button onClick={() => { setSearch(""); setStatusFilter(""); }} className="text-sm text-gray-500 hover:text-gray-700 underline">Clear filters</button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {isLoading ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50"><tr>{COLS.map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-200 animate-pulse">
                {Array.from({ length: 12 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3"><div className="h-4 w-8 bg-gray-200 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-36 bg-gray-200 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-24 bg-gray-200 rounded-full" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-24 bg-gray-200 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-24 bg-gray-200 rounded" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <p className="text-lg font-medium">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50"><tr>{COLS.map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} onClick={() => setSelected(order)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">{order.id}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 font-mono">{order.order_id || "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={order.order_status ?? order.status} /></td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{formatDate(order.order_date)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(order.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-sm text-gray-500">Page <strong>{page}</strong> of <strong>{totalPages}</strong> &mdash; {count.toLocaleString()} results</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors">← Prev</button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors">Next →</button>
          </div>
        </div>
      )}

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
