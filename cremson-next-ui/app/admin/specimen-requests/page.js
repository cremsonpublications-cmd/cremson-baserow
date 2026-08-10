"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "../../../lib/api/axios";
import { adminApproveSpecimen, adminRejectSpecimen, adminDeleteSpecimenRequest } from "../../../lib/api/admin";
import ConfirmModal from "../components/ConfirmModal";
import CreateSpecimenModal from "../components/CreateSpecimenModal";
import {
  Search,
  X,
  Eye,
  Package,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  Trash2,
  BookOpen,
  Plus,
  UserCheck,
  Send,
} from "lucide-react";

const PAGE_SIZE = 20;

const DELIVERY_STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "In Transit", label: "In Transit" },
  { value: "Delivered", label: "Delivered" },
  { value: "RTO", label: "RTO" },
  { value: "Dispatched", label: "Dispatched" },
  { value: "Not dispatched", label: "Not Dispatched" },
  { value: "HandDelivered", label: "Hand Delivered" },
];

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function getStatusRaw(status) {
  if (!status) return "";
  if (typeof status === "object" && status !== null) return status.value || "";
  return String(status);
}

function DeliveryStatusBadge({ status }) {
  const raw = getStatusRaw(status);
  const s = raw.toLowerCase();
  let colors = "bg-slate-100 text-slate-700";
  if (s === "delivered" || s === "handdelivered") colors = "bg-emerald-100 text-emerald-800";
  else if (s === "dispatched" || s === "in transit") colors = "bg-blue-100 text-blue-800";
  else if (s === "rto") colors = "bg-rose-100 text-rose-800";
  else if (s === "not dispatched") colors = "bg-amber-100 text-amber-800";
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${colors}`}>
      {raw || "—"}
    </span>
  );
}



function DetailModal({ request, onClose, onAction }) {
  if (!request) return null;

  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const { data: catalogProducts = [] } = useQuery({
    queryKey: ["products-catalog"],
    queryFn: async () => {
      const { data } = await api.get("/api/products/", { params: { size: 200 } });
      return data?.results || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const statusRaw = getStatusRaw(request["DeliveryStatus"]).toLowerCase();
  const isOldData = Number(request.id) <= 363;
  const isDispatched = statusRaw === "dispatched";
  const isRTO = statusRaw === "rto";
  const isPending = !isOldData && !isDispatched && !isRTO;

  async function handleApprove() {
    setApproving(true);
    try {
      await adminApproveSpecimen(request.id);
      toast.success("Specimen request approved — marked as Dispatched.");
      onAction(request.id, "Dispatched");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to approve request.");
    } finally {
      setApproving(false);
    }
  }

  async function handleReject() {
    setRejecting(true);
    try {
      await adminRejectSpecimen(request.id);
      toast.success("Specimen request rejected — marked as RTO.");
      onAction(request.id, "RTO");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to reject request.");
    } finally {
      setRejecting(false);
    }
  }

  const fields = [
    { label: "Teacher Name", key: "Teacheer Name" },
    { label: "School Name", key: "School Name" },
    { label: "Request Date", key: "RequestDate" },
    { label: "Dispatch Method", key: "DispatchMethod" },
    { label: "Dispatch Date", key: "DispatchDate" },
    { label: "AWB Number", key: "AWB_Number" },
    { label: "Courier Partner", key: "Courier_Partner" },
    { label: "Tracking Link", key: "TrackingLink" },
    { label: "Books Requested", key: "BooksRequested" },
    { label: "Follow-Up Stage", key: "FollowUpStage" },
    { label: "Delivery Confirmed", key: "DeliveryConfirmed" },
    { label: "Converted", key: "Converted" },
    { label: "Conversion Status", key: "ConversionStatus" },
    { label: "Feedback / Notes", key: "Feedback/Notes" },
    { label: "Full Address", key: "Full_Address" },
  ];

  function renderVal(val) {
    if (val === null || val === undefined || val === "") return "—";
    if (typeof val === "boolean") return val ? "Yes" : "No";
    if (Array.isArray(val)) return val.map(v => typeof v === "object" ? (v.value || v.name || JSON.stringify(v)) : v).join(", ") || "—";
    if (typeof val === "object") return val.value || val.name || JSON.stringify(val);
    return String(val);
  }

  const rawBooksStr = renderVal(request["BooksRequested"]);
  const booksList = rawBooksStr !== "—" ? rawBooksStr.split(",").map(s => s.trim()).filter(Boolean) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-950/60 backdrop-blur-md transition-all duration-300">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white sticky top-0 z-10 text-left">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900">Specimen Request</h2>
              <DeliveryStatusBadge status={request["DeliveryStatus"]} />
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">ID: {request.id}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50 space-y-4 text-left">

          {/* ── Old Data Banner ── */}
          {isOldData && (
            <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-slate-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-slate-700">Old Data Record</p>
                <p className="text-xs text-slate-500 mt-0.5">This specimen request is from a previous record batch prior to the automated order integration.</p>
              </div>
            </div>
          )}

          {/* ── Approve / Reject Action Panel ── */}
          {isPending && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-amber-800">Action Required</p>
                  <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                    Review this specimen request and either approve (dispatch) or reject it.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleApprove}
                  disabled={approving || rejecting}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl disabled:opacity-50 transition-all cursor-pointer shadow-sm"
                >
                  {approving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {approving ? "Approving..." : "Approve & Dispatch"}
                </button>
                <button
                  onClick={handleReject}
                  disabled={approving || rejecting}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl disabled:opacity-50 transition-all cursor-pointer shadow-sm"
                >
                  {rejecting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  {rejecting ? "Rejecting..." : "Reject Request"}
                </button>
              </div>
            </div>
          )}

          {isDispatched && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-emerald-800">Approved & Dispatched</p>
                <p className="text-xs text-emerald-700 mt-0.5">This request has been approved and the specimen has been dispatched.</p>
              </div>
            </div>
          )}

          {isRTO && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3">
              <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-rose-800">Rejected (RTO)</p>
                <p className="text-xs text-rose-700 mt-0.5">This request was rejected and marked as returned.</p>
              </div>
            </div>
          )}

          {/* Details Grid */}
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map(({ label, key }) => {
              const val = request[key];

              if (key === "BooksRequested") {
                return (
                  <div key={key} className="bg-white border border-slate-100 rounded-2xl p-4 sm:col-span-2 shadow-xs">
                    <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-red-500" />
                      Requested Books ({booksList.length})
                    </dt>
                    <dd className="space-y-2.5 mt-1">
                      {booksList.length > 0 ? (
                        booksList.map((bName, idx) => {
                          const cleanBName = bName.replace(/\(.*?\)/g, "").trim().toLowerCase();
                          const matchedProduct = catalogProducts.find(p => {
                            const pName = (p.name || "").toLowerCase();
                            return pName === cleanBName || pName.includes(cleanBName) || cleanBName.includes(pName);
                          });
                          const finalTitle = matchedProduct?.name || bName.replace(/\(.*?\)/g, "").trim() || bName;
                          return (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-xl hover:border-red-200 transition-all">
                              {matchedProduct?.main_image ? (
                                <img src={matchedProduct.main_image} alt={finalTitle} className="w-12 h-14 object-cover rounded-lg border border-slate-200 shadow-xs flex-shrink-0" />
                              ) : (
                                <div className="w-12 h-14 bg-red-50 border border-red-100 rounded-lg flex items-center justify-center text-red-500 flex-shrink-0">
                                  <BookOpen className="w-6 h-6" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-xs font-bold text-slate-900 truncate">{finalTitle}</p>
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                    <CheckCircle className="w-3 h-3" /> Website Catalog
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-1">
                                  {matchedProduct?.author || "Cremson Publications"} {matchedProduct?.weight ? `• Weight: ${matchedProduct.weight}` : ""}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-slate-400 italic">No books specified</p>
                      )}
                    </dd>
                  </div>
                );
              }

              const isLong = key === "Feedback/Notes" || key === "Full_Address";
              return (
                <div key={key} className={`bg-white border border-slate-100 rounded-xl p-4 ${isLong ? "sm:col-span-2" : ""}`}>
                  <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</dt>
                  <dd className="text-xs font-semibold text-slate-800 break-words leading-relaxed">{renderVal(val)}</dd>
                </div>
              );
            })}
          </dl>
        </div>
      </div>
    </div>
  );
}

export default function AdminSpecimenRequests() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [confirmBulkAction, setConfirmBulkAction] = useState(null);

  const debouncedSearch = useDebounce(search, 400);
  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter]);

  const params = { page, size: PAGE_SIZE };
  if (debouncedSearch) params.search = debouncedSearch;
  if (statusFilter) params["DeliveryStatus"] = statusFilter;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-specimen-requests", params],
    queryFn: async () => {
      const { data } = await api.get("/api/specimen-requests/", { params });
      return data;
    },
  });

  const requests = data?.results ?? data?.items ?? [];
  const count = data?.count ?? data?.total ?? 0;
  const totalPages = Math.ceil(count / PAGE_SIZE) || 1;

  // Filter pending requests on current list
  const pendingRequests = requests.filter((req) => {
    const statusRaw = getStatusRaw(req["DeliveryStatus"]).toLowerCase();
    const isOldData = Number(req.id) <= 363;
    return !isOldData && statusRaw !== "dispatched" && statusRaw !== "rto";
  });
  const pendingCount = pendingRequests.length;

  async function executeBulkAction(actionType) {
    if (pendingRequests.length === 0) return;
    setBulkActionLoading(true);
    setConfirmBulkAction(null);

    let successCount = 0;
    let failCount = 0;

    for (const req of pendingRequests) {
      try {
        if (actionType === "approve") {
          await adminApproveSpecimen(req.id);
        } else {
          await adminRejectSpecimen(req.id);
        }
        successCount++;
      } catch (err) {
        failCount++;
        console.error(`Failed to ${actionType} specimen #${req.id}:`, err);
      }
    }

    if (actionType === "approve") {
      if (successCount > 0) toast.success(`Approved & dispatched ${successCount} specimen request(s).`);
    } else {
      if (successCount > 0) toast.error(`Rejected ${successCount} specimen request(s).`);
    }
    if (failCount > 0) {
      toast.error(`Failed to ${actionType} ${failCount} request(s).`);
    }

    setBulkActionLoading(false);
    queryClient.invalidateQueries({ queryKey: ["admin-specimen-requests"] });
  }

  function formatDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }

  function getTeacherName(req) {
    const arr = req["Teacheer Name"];
    if (Array.isArray(arr) && arr.length > 0) {
      return arr.map(t => t.value || `#${t.id}`).filter(Boolean).join(", ") || "—";
    }
    const linked = req["TeacherID"];
    if (Array.isArray(linked) && linked.length > 0) {
      return linked.map(t => t.value || `#${t.id}`).join(", ");
    }
    return "—";
  }

  function getSchoolName(req) {
    const arr = req["School Name"];
    if (Array.isArray(arr) && arr.length > 0) {
      const name = arr.map(s => s.value).filter(v => v && isNaN(Number(v))).join(", ");
      if (name) return name;
      return arr.map(s => s.value || "—").join(", ");
    }
    return "—";
  }

  async function handleInlineAction(e, req, action) {
    e.stopPropagation();
    const key = `${req.id}-${action}`;
    setActionLoading(prev => ({ ...prev, [key]: true }));
    try {
      if (action === "approve") {
        await adminApproveSpecimen(req.id);
        toast.success(`Specimen #${req.id} approved & dispatched.`);
      } else {
        await adminRejectSpecimen(req.id);
        toast.error(`Specimen #${req.id} rejected (RTO).`);
      }
      queryClient.invalidateQueries({ queryKey: ["admin-specimen-requests"] });
    } catch (err) {
      toast.error(err?.response?.data?.detail || `Failed to ${action} request.`);
    } finally {
      setActionLoading(prev => ({ ...prev, [key]: false }));
    }
  }

  function handleModalAction(reqId, newStatus) {
    queryClient.invalidateQueries({ queryKey: ["admin-specimen-requests"] });
    setSelected(prev => prev ? { ...prev, DeliveryStatus: newStatus } : null);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await adminDeleteSpecimenRequest(deleteTarget.id);
      toast.success(`Specimen request #${deleteTarget.id} deleted.`);
      setDeleteTarget(null);
      setSelected(null);
      queryClient.invalidateQueries({ queryKey: ["admin-specimen-requests"] });
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to delete request.");
    } finally {
      setDeleteLoading(false);
    }
  }

  const hasClear = search || statusFilter;

  return (
    <div className="p-4 sm:p-6 lg:p-8 text-left">
      <h2 className="text-2xl font-semibold text-gray-900 mb-8 mt-0">Specimen Requests</h2>

      <div className="rounded-lg">
        <div className="h-[calc(100vh-120px)] flex flex-col">
          <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col flex-1 min-h-[600px]">

              {/* Header & Filter Controls Bar */}
              <div className="p-4 md:p-6 border-b border-gray-200 flex-shrink-0 bg-white">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
                      <input
                        type="text"
                        placeholder="Search specimen requests..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8 md:pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none w-full sm:w-80"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      {pendingCount > 0 && (
                        <>
                          <button
                            onClick={() => setConfirmBulkAction({ type: "approve" })}
                            disabled={bulkActionLoading}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                            title="Approve all pending specimen requests"
                          >
                            {bulkActionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                            Approve All Pending ({pendingCount})
                          </button>

                          <button
                            onClick={() => setConfirmBulkAction({ type: "reject" })}
                            disabled={bulkActionLoading}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-800 bg-rose-100 hover:bg-rose-200 border border-rose-300 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                            title="Reject all pending specimen requests"
                          >
                            {bulkActionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                            Reject All Pending ({pendingCount})
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        Create Specimen Request
                      </button>
                      <div className="text-sm text-gray-600 font-medium">Total: {count}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    {/* Delivery Status filter */}
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600 font-medium">Delivery Status:</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white text-gray-700 appearance-none pl-3 pr-8 cursor-pointer"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                          backgroundPosition: "right 0.5rem center",
                          backgroundRepeat: "no-repeat",
                          backgroundSize: "1.25rem 1.25rem",
                        }}
                      >
                        {DELIVERY_STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>

                    {hasClear && (
                      <button
                        onClick={() => { setSearch(""); setStatusFilter(""); }}
                        className="text-xs font-semibold text-purple-600 hover:text-purple-800 transition-colors ml-auto cursor-pointer"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="flex-1 overflow-auto min-h-0">
                {isLoading ? (
                  <div className="p-6 animate-pulse space-y-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="h-12 bg-gray-100 rounded-lg w-full" />
                    ))}
                  </div>
                ) : requests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <Package className="w-12 h-12 text-gray-300 mb-3" />
                    <p className="text-base font-semibold text-gray-600">No specimen requests found.</p>
                  </div>
                ) : (
                  <>
                  <table className="hidden md:table w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Teacher</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">School</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Request Date</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Delivery Status</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Converted</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {requests.map((req) => {
                        const statusRaw = getStatusRaw(req["DeliveryStatus"]).toLowerCase();
                        const isOldData = Number(req.id) <= 363;
                        const isPending = !isOldData && statusRaw !== "dispatched" && statusRaw !== "rto";
                        const approvingKey = `${req.id}-approve`;
                        const rejectingKey = `${req.id}-reject`;

                        return (
                          <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 text-xs font-semibold text-gray-900">#{req.id}</td>
                            <td className="px-6 py-4">
                              <div className="text-xs font-semibold text-gray-900">{getTeacherName(req)}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-xs text-gray-600 max-w-[160px] truncate" title={getSchoolName(req)}>
                                {getSchoolName(req)}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs text-gray-600 whitespace-nowrap">
                              {formatDate(req["RequestDate"])}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <DeliveryStatusBadge status={req["DeliveryStatus"]} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {(() => {
                                const cv = req["Converted"];
                                const cvStr = typeof cv === "object" && cv !== null ? cv.value : cv;
                                return cvStr ? (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{cvStr}</span>
                                ) : "—";
                              })()}
                            </td>
                            <td className="px-6 py-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                {isOldData ? (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">
                                    Old Data
                                  </span>
                                ) : isPending ? (
                                  <>
                                    {/* Approve button — only when pending */}
                                    <button
                                      onClick={(e) => handleInlineAction(e, req, "approve")}
                                      disabled={actionLoading[approvingKey] || actionLoading[rejectingKey]}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 disabled:opacity-50 transition-all cursor-pointer"
                                      title="Approve & Dispatch"
                                    >
                                      {actionLoading[approvingKey]
                                        ? <RefreshCw className="w-3 h-3 animate-spin" />
                                        : <CheckCircle className="w-3 h-3" />}
                                      Approve
                                    </button>
                                    {/* Reject button — only when pending */}
                                    <button
                                      onClick={(e) => handleInlineAction(e, req, "reject")}
                                      disabled={actionLoading[approvingKey] || actionLoading[rejectingKey]}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 disabled:opacity-50 transition-all cursor-pointer"
                                      title="Reject Request"
                                    >
                                      {actionLoading[rejectingKey]
                                        ? <RefreshCw className="w-3 h-3 animate-spin" />
                                        : <XCircle className="w-3 h-3" />}
                                      Reject
                                    </button>
                                  </>
                                ) : null}
                                {/* View details */}
                                <button
                                  onClick={() => setSelected(req)}
                                  className="p-1 hover:bg-purple-50 rounded transition-colors cursor-pointer"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4 text-gray-400 hover:text-purple-600" />
                                </button>
                                {/* Delete */}
                                <button
                                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(req); }}
                                  className="p-1 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                  title="Delete Request"
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

                  {/* Mobile Card View */}
                  <div className="md:hidden divide-y divide-gray-100">
                    {requests.map((req) => {
                      const statusRaw = getStatusRaw(req["DeliveryStatus"]).toLowerCase();
                      const isOldData = Number(req.id) <= 363;
                      const isPending = !isOldData && statusRaw !== "dispatched" && statusRaw !== "rto";
                      const approvingKey = `${req.id}-approve`;
                      const rejectingKey = `${req.id}-reject`;
                      return (
                        <div key={req.id} className={`p-4 hover:bg-gray-50 transition-colors ${selectedIds.includes(req.id) ? "bg-purple-50/60" : ""}`}>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-start gap-2.5 flex-1 min-w-0 pr-2">
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(req.id)}
                                onChange={() => toggleSelectRow(req.id)}
                                className="w-4 h-4 mt-0.5 text-purple-600 rounded border-gray-300 focus:ring-purple-500 cursor-pointer"
                              />
                              <div>
                                <p className="text-xs font-bold text-gray-900">#{req.id} · {getTeacherName(req)}</p>
                                <p className="text-xs text-gray-500 truncate">{getSchoolName(req)}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{formatDate(req["RequestDate"])}</p>
                              </div>
                            </div>
                            <DeliveryStatusBadge status={req["DeliveryStatus"]} />
                          </div>
                          {(() => {
                            const cv = req["Converted"];
                            const cvStr = typeof cv === "object" && cv !== null ? cv.value : cv;
                            return cvStr ? <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 mb-2">{cvStr}</span> : null;
                          })()}
                          <div className="flex items-center gap-2 flex-wrap mt-1">
                            {isOldData ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">
                                Old Data
                              </span>
                            ) : isPending ? (
                              <>
                                <button
                                  onClick={(e) => handleInlineAction(e, req, "approve")}
                                  disabled={actionLoading[approvingKey] || actionLoading[rejectingKey]}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 disabled:opacity-50 transition-all cursor-pointer"
                                >
                                  {actionLoading[approvingKey] ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                  Approve
                                </button>
                                <button
                                  onClick={(e) => handleInlineAction(e, req, "reject")}
                                  disabled={actionLoading[approvingKey] || actionLoading[rejectingKey]}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 disabled:opacity-50 transition-all cursor-pointer"
                                >
                                  {actionLoading[rejectingKey] ? <RefreshCw className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                                  Reject
                                </button>
                              </>
                            ) : null}
                            <button onClick={() => setSelected(req)} className="p-1.5 hover:bg-purple-50 rounded transition-colors cursor-pointer" title="View Details">
                              <Eye className="w-4 h-4 text-gray-400 hover:text-purple-600" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(req); }} className="p-1.5 hover:bg-red-50 rounded transition-colors cursor-pointer" title="Delete">
                              <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  </>
                )}
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white flex-shrink-0">
                <div className="text-sm text-gray-600">
                  Showing {requests.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0} to {Math.min(page * PAGE_SIZE, count)} of {count} requests
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg font-medium text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                    const pNum = idx + 1;
                    return (
                      <button
                        key={pNum}
                        onClick={() => setPage(pNum)}
                        className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors cursor-pointer ${
                          page === pNum ? "bg-purple-600 text-white font-semibold" : "border border-gray-300 text-gray-700 hover:bg-gray-50"
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

      {/* Detail Modal */}
      {selected && (
        <DetailModal
          request={selected}
          onClose={() => setSelected(null)}
          onAction={handleModalAction}
        />
      )}

      {/* Create Specimen Modal */}
      {showCreateModal && (
        <CreateSpecimenModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["admin-specimen-requests"] })}
        />
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <ConfirmModal
          title="Delete Specimen Request"
          message={`Are you sure you want to delete specimen request #${deleteTarget.id}? This action cannot be undone.`}
          confirmLabel="Delete"
          loading={deleteLoading}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Bulk Action Confirmation */}
      {confirmBulkAction && (
        <ConfirmModal
          title={confirmBulkAction.type === "approve" ? "Approve All Pending Requests?" : "Reject All Pending Requests?"}
          message={
            confirmBulkAction.type === "approve"
              ? `Are you sure you want to approve & dispatch all ${pendingCount} pending specimen request(s)?`
              : `Are you sure you want to reject all ${pendingCount} pending specimen request(s)?`
          }
          confirmLabel={confirmBulkAction.type === "approve" ? "Yes, Approve All" : "Yes, Reject All"}
          loading={bulkActionLoading}
          onConfirm={() => executeBulkAction(confirmBulkAction.type)}
          onCancel={() => setConfirmBulkAction(null)}
        />
      )}
    </div>
  );
}
