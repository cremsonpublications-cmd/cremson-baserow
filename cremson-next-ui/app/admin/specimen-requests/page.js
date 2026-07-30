"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../../lib/api/axios";
import { adminUpdateSpecimenStatus } from "../../../lib/api/admin";
import { 
  Search, 
  X, 
  ChevronLeft, 
  ChevronRight,
  BookOpen,
  Filter,
  Eye,
  ChevronDown,
  Layers
} from "lucide-react";

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
    pending: "bg-yellow-50 text-yellow-755 border-yellow-100",
    approved: "bg-emerald-50 text-emerald-755 border-emerald-100",
    rejected: "bg-rose-50 text-rose-755 border-rose-100",
    shipped: "bg-blue-50 text-blue-755 border-blue-100",
    dispatched: "bg-blue-50 text-blue-755 border-blue-100",
    completed: "bg-emerald-50 text-emerald-755 border-emerald-100",
  };
  const cls = map[status?.toLowerCase()] || "bg-slate-50 text-slate-700 border-slate-200";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize ${cls}`}>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-sans">Specimen Request Details</h2>
            <p className="text-xs text-slate-400 mt-0.5">Showing school/institution dispatch parameters for ID: #{request.id}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-650 hover:bg-slate-50 rounded-full transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-5/30 space-y-6 text-left">
          
          {/* Status Box */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
            <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-2.5">Update Dispatch Status</p>
            <div className="flex items-center gap-3">
              <div className="relative min-w-[150px]">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none cursor-pointer text-slate-800"
                >
                  <option value="">— Select Status —</option>
                  {SPECIMEN_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
              <button
                onClick={handleStatusUpdate}
                disabled={!selectedStatus || updatingStatus}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-605 hover:bg-blue-700 active:bg-blue-800 rounded-xl disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
              >
                {updatingStatus ? "Updating..." : "Update Status"}
              </button>
            </div>
            {statusError && <p className="text-red-750 text-xs mt-2.5 font-bold">{statusError}</p>}
          </div>

          {/* Key-Value Details */}
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            {Object.entries(request).map(([key, value]) => {
              const isLongText = key === "message" || key === "notes" || key === "address";
              return (
                <div key={key} className={isLongText ? "sm:col-span-2 bg-slate-50/50 p-4 rounded-xl border border-slate-100" : ""}>
                  <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{key.replace(/_/g, " ")}</dt>
                  <dd className="text-xs font-semibold text-slate-800 break-words leading-relaxed">
                    {typeof value === "object" && value !== null ? (
                      <pre className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-[11px] font-mono text-slate-700 overflow-x-auto">
                        {JSON.stringify(value, null, 2)}
                      </pre>
                    ) : (
                      renderValue(value)
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      </div>
    </div>
  );
}

const COLS = ["ID", "Name", "Email", "Institution", "Book Title", "Status", "Requested At", "Actions"];

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
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-left">
      
      {/* Header Info Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Specimen Requests</h1>
            <span className="bg-red-50 text-red-800 text-xs font-black px-2.5 py-0.5 rounded-full border border-red-100">
              {count.toLocaleString()} Requests
            </span>
          </div>
          <p className="text-sm text-slate-550 mt-1">Review school and teacher textbook sample copy requests, update approvals and shipping status.</p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-[0_4px_20px_rgb(0,0,0,0.015)] flex flex-col sm:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search specimen requests by teacher, school, email..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 bg-slate-50/50 hover:bg-slate-55 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900" 
          />
          {search && (
            <button 
              onClick={() => setSearch("")} 
              className="absolute right-3 top-2.5 p-0.5 text-slate-400 hover:text-slate-650 hover:bg-slate-200 rounded-full"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {search && (
          <button 
            onClick={() => setSearch("")} 
            className="text-xs font-bold text-red-500 hover:text-red-750 hover:bg-red-50 px-3 py-2 rounded-xl transition-all cursor-pointer"
          >
            Clear Filters
          </button>
        )}

      </div>

      {/* Grid List Table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-[0_4px_25px_rgb(0,0,0,0.015)] overflow-hidden">
        {isLoading ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead className="bg-slate-50/75">
                <tr>{COLS.map((h) => <th key={h} className="px-5 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100 animate-pulse bg-white">
                {Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-4"><div className="h-4 w-8 bg-slate-150 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-28 bg-slate-150 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-32 bg-slate-150 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-36 bg-slate-150 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-40 bg-slate-150 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-5 w-16 bg-slate-150 rounded-full" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-20 bg-slate-150 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-16 bg-slate-150 rounded" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white">
            <Layers className="w-12 h-12 text-slate-200 mb-3" />
            <p className="text-sm font-semibold text-slate-500">No specimen textbook requests found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead className="bg-slate-50/75">
                <tr>{COLS.map((h) => <th key={h} className="px-5 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {requests.map((req) => (
                  <tr 
                    key={req.id} 
                    onClick={() => setSelected(req)} 
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors active:bg-slate-150/40"
                  >
                    {/* ID */}
                    <td className="px-5 py-4 text-xs font-bold text-slate-500 font-mono">
                      #{req.id}
                    </td>

                    {/* Name */}
                    <td className="px-5 py-4 text-xs font-bold text-slate-900 whitespace-nowrap">
                      {req.name ?? req.full_name ?? "—"}
                    </td>

                    {/* Email */}
                    <td className="px-5 py-4 text-xs text-slate-650 max-w-[150px] truncate">
                      {req.email ?? "—"}
                    </td>

                    {/* Institution */}
                    <td className="px-5 py-4 text-xs text-slate-550 max-w-[150px] truncate" title={req.institution ?? req.school}>
                      {req.institution ?? req.school ?? "—"}
                    </td>

                    {/* Book Title */}
                    <td className="px-5 py-4 text-xs font-semibold text-slate-700 max-w-[160px] truncate" title={req.book_name ?? req.product_name}>
                      {req.book_name ?? req.product_name ?? "—"}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <StatusBadge status={req.status ?? req.request_status} />
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(req.created_at ?? req.requested_at)}
                    </td>

                    {/* Inline Status Dropdown */}
                    <td className="px-5 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <select
                            defaultValue=""
                            onChange={(e) => handleInlineStatusChange(e, req, e.target.value)}
                            className="border border-slate-200 rounded-xl px-2.5 py-1 text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-750 cursor-pointer appearance-none pr-6"
                          >
                            <option value="" disabled>Update</option>
                            {SPECIMEN_STATUSES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2 top-1.5 w-3 h-3 text-slate-400 pointer-events-none" />
                        </div>
                        <button
                          onClick={() => setSelected(req)}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                          title="View Request Detail"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-1 py-2">
          <p className="text-xs font-bold text-slate-550">
            Page <span className="text-slate-900 font-black">{page}</span> of <span className="text-slate-900 font-black">{totalPages}</span> &mdash; {count.toLocaleString()} specimen requests
          </p>
          <div className="flex gap-2">
            <button 
              onClick={() => setPage((p) => Math.max(1, p - 1))} 
              disabled={page === 1} 
              className="inline-flex items-center gap-1 px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-700 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <button 
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))} 
              disabled={page === totalPages} 
              className="inline-flex items-center gap-1 px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-700 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-all cursor-pointer"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
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
