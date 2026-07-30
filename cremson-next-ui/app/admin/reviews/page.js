"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../../lib/api/axios";
import { adminDeleteReview } from "../../../lib/api/admin";
import ConfirmModal from "../components/ConfirmModal";
import { 
  Search, 
  X, 
  Trash2, 
  Star, 
  MessageSquare,
  ChevronLeft, 
  ChevronRight,
  Eye
} from "lucide-react";

const PAGE_SIZE = 20;

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function StarRating({ rating }) {
  const n = Number(rating);
  if (!n) return <span className="text-slate-400">—</span>;
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star 
          key={i} 
          className={`w-3.5 h-3.5 ${i <= n ? "text-amber-450 fill-amber-400 stroke-amber-500" : "text-slate-200 fill-slate-100"}`} 
        />
      ))}
      <span className="text-[10px] font-bold text-slate-500 ml-1.5">{n}</span>
    </span>
  );
}

function ReviewModal({ review, onClose, onDelete }) {
  if (!review) return null;
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
            <h2 className="text-lg font-bold text-slate-900">Review Details</h2>
            <p className="text-xs text-slate-400 mt-0.5">Showing full database row parameters for Review ID: {review.id}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onDelete(review)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete Review
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-650 hover:bg-slate-50 rounded-full transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-5/30 text-left">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            {Object.entries(review).map(([key, value]) => {
              const isLongText = key === "review_text" || key === "comment" || key === "body";
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

const COLS = ["ID", "Product", "User", "Rating", "Comment", "Created At", "Actions"];

export default function AdminReviews() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 400);
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const params = { page, size: PAGE_SIZE };
  if (debouncedSearch) params.search = debouncedSearch;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-reviews", params],
    queryFn: async () => {
      const { data } = await api.get("/api/reviews/", { params });
      return data;
    },
  });

  const reviews = data?.results ?? data?.items ?? [];
  const count = data?.count ?? data?.total ?? 0;
  const totalPages = Math.ceil(count / PAGE_SIZE);

  function formatDate(dateStr) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }

  function handleDelete(review) {
    setDeleteTarget(review);
  }

  function handleDeleteInline(e, review) {
    e.stopPropagation();
    setDeleteTarget(review);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await adminDeleteReview(deleteTarget.id);
      setSelected(null);
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    } catch (err) {
      alert(err?.response?.data?.detail || "Failed to delete review.");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-left">
      
      {/* Header Info Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Reviews</h1>
            <span className="bg-red-50 text-red-800 text-xs font-black px-2.5 py-0.5 rounded-full border border-red-100">
              {count.toLocaleString()} Reviews
            </span>
          </div>
          <p className="text-sm text-slate-550 mt-1">Audit customer ratings, feedback, written test reviews, and remove offensive material.</p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-[0_4px_20px_rgb(0,0,0,0.015)] flex flex-col sm:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search reviews by user name, comments or content..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 bg-slate-50/50 hover:bg-slate-55 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900" 
          />
          {search && (
            <button 
              onClick={() => setSearch("")} 
              className="absolute right-3 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full"
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
                    <td className="px-5 py-4"><div className="h-4 w-40 bg-slate-150 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-28 bg-slate-150 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-20 bg-slate-150 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-48 bg-slate-150 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-20 bg-slate-150 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-8 bg-slate-150 rounded" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white">
            <MessageSquare className="w-12 h-12 text-slate-200 mb-3" />
            <p className="text-sm font-semibold text-slate-500">No review ratings received yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead className="bg-slate-50/75">
                <tr>{COLS.map((h) => <th key={h} className="px-5 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {reviews.map((review) => (
                  <tr 
                    key={review.id} 
                    onClick={() => setSelected(review)} 
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    {/* ID */}
                    <td className="px-5 py-4 text-xs font-bold text-slate-500 font-mono">
                      #{review.id}
                    </td>

                    {/* Product Name */}
                    <td className="px-5 py-4 text-xs font-bold text-slate-900 max-w-[200px] truncate" title={review.product_name ?? review.product}>
                      {review.product_name ?? review.product ?? review.product_id ?? "—"}
                    </td>

                    {/* User */}
                    <td className="px-5 py-4 text-xs font-semibold text-slate-650 max-w-[150px] truncate">
                      {review.user_name ?? review.user_email ?? review.user ?? "—"}
                    </td>

                    {/* Rating stars */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <StarRating rating={review.rating ?? review.stars} />
                    </td>

                    {/* Comment text */}
                    <td className="px-5 py-4 text-xs text-slate-550 max-w-[250px] truncate" title={review.review_text ?? review.comment}>
                      {review.review_text ?? review.comment ?? "—"}
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(review.created_at ?? review.date)}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelected(review)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteInline(e, review)}
                          className="p-1.5 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete Review"
                        >
                          <Trash2 className="w-4 h-4" />
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
            Page <span className="text-slate-900 font-black">{page}</span> of <span className="text-slate-900 font-black">{totalPages}</span> &mdash; {count.toLocaleString()} reviews
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
        <ReviewModal
          review={selected}
          onClose={() => setSelected(null)}
          onDelete={handleDelete}
        />
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <ConfirmModal
          title="Delete Review"
          message="Are you sure you want to delete this rating feedback? This action cannot be undone."
          confirmLabel="Delete"
          loading={deleteLoading}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
