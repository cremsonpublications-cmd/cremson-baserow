"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../../lib/api/axios";
import { adminUpdateSpecimenStatus } from "../../../lib/api/admin";

const PAGE_SIZE = 20;
const SPECIMEN_STATUSES = ["Pending", "Approved", "Rejected", "Dispatched"];

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
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    shipped: "bg-blue-100 text-blue-800",
    dispatched: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
  };
  const cls = map[status?.toLowerCase()] || "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${cls}`}>
      {status || "—"}
    </span>
  );
}

function RequestModal({ request, onClose, onStatusUpdated }) {
  if (!request) return null;

  const [selectedStatus, setSelectedStatus] = useState(request.status ?? request.request_status ?? "");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState("");

  async function handleStatusUpdate() {
    if (!selectedStatus) return;
    setUpdatingStatus(true);
    setStatusError("");
    try {
      await adminUpdateSpecimenStatus(request.id, selectedStatus);
      onStatusUpdated(request.id, selectedStatus);
    } catch (err) {
      setStatusError(err?.response?.data?.detail || "Failed to update status.");
    } finally {
      setUpdatingStatus(false);
    }
  }

  function renderValue(val) {
    if (val === null || val === undefined) return "—";
    if (typeof val === "boolean") return val ? "Yes" : "No";
    if (typeof val === "object") return JSON.stringify(val, null, 2);
    return String(val);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Specimen Request</h2>
            <p className="text-sm text-gray-500 font-mono">#{request.id}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Update Status</p>
            <div className="flex items-center gap-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">— Select Status —</option>
                {SPECIMEN_STATUSES.map((s) => (
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

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            {Object.entries(request).map(([key, value]) => (
              <div key={key} className={key === "message" || key === "notes" || key === "address" ? "sm:col-span-2" : ""}>
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">{key.replace(/_/g, " ")}</dt>
                <dd className="text-sm text-gray-900 break-words">
                  {typeof value === "object" && value !== null
                    ? <pre className="bg-gray-50 rounded p-2 text-xs text-gray-700 overflow-x-auto">{JSON.stringify(value, null, 2)}</pre>
                    : renderValue(value)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}

const COLS = ["ID", "Name", "Email", "Institution", "Book/Product", "Status", "Requested At", "Actions"];

export default function AdminSpecimenRequests() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const debouncedSearch = useDebounce(search, 400);
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const params = { page, size: PAGE_SIZE };
  if (debouncedSearch) params.search = debouncedSearch;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-specimen-requests", params],
    queryFn: async () => {
      const { data } = await api.get("/api/specimen-requests/", { params });
      return data;
    },
  });

  const requests = data?.results ?? data?.items ?? [];
  const count = data?.count ?? data?.total ?? 0;
  const totalPages = Math.ceil(count / PAGE_SIZE);

  function formatDate(dateStr) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }

  function handleStatusUpdated(reqId, newStatus) {
    queryClient.invalidateQueries({ queryKey: ["admin-specimen-requests"] });
    setSelected((prev) => prev ? { ...prev, status: newStatus } : null);
  }

  async function handleInlineStatusChange(e, req, newStatus) {
    e.stopPropagation();
    if (!newStatus) return;
    try {
      await adminUpdateSpecimenStatus(req.id, newStatus);
      queryClient.invalidateQueries({ queryKey: ["admin-specimen-requests"] });
    } catch (err) {
      alert(err?.response?.data?.detail || "Failed to update status.");
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Specimen Requests</h1>
        <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-2.5 py-0.5 rounded-full">{count.toLocaleString()}</span>
      </div>

      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <input type="text" placeholder="Search by name, email, institution..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {isLoading ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50"><tr>{COLS.map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-200 animate-pulse">
                {Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    {COLS.map((h) => <td key={h} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded" style={{ width: `${60 + Math.random() * 80}px` }} /></td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <p className="text-lg font-medium">No specimen requests found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50"><tr>{COLS.map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-200">
                {requests.map((req) => (
                  <tr key={req.id} onClick={() => setSelected(req)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">{req.id}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {req.name ?? req.full_name ?? req.first_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-[180px] truncate">
                      {req.email ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[160px] truncate">
                      {req.institution ?? req.school ?? req.college ?? req.organization ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-[180px] truncate">
                      {req.book_name ?? req.product_name ?? req.book ?? req.product ?? "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={req.status ?? req.request_status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(req.created_at ?? req.requested_at ?? req.date)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <select
                        defaultValue=""
                        onChange={(e) => handleInlineStatusChange(e, req, e.target.value)}
                        className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="" disabled>Update</option>
                        {SPECIMEN_STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
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
        <RequestModal
          request={selected}
          onClose={() => setSelected(null)}
          onStatusUpdated={handleStatusUpdated}
        />
      )}
    </div>
  );
}
