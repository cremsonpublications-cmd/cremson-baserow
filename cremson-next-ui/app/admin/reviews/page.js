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
  Eye,
} from "lucide-react";

const PAGE_SIZE = 20;

const RATING_OPTIONS = [
  { value: "", label: "All Ratings" },
  { value: "5", label: "⭐⭐⭐⭐⭐  5 Stars" },
  { value: "4", label: "⭐⭐⭐⭐  4 Stars" },
  { value: "3", label: "⭐⭐⭐  3 Stars" },
  { value: "2", label: "⭐⭐  2 Stars" },
  { value: "1", label: "⭐  1 Star" },
];

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
  if (!n) return <span className="text-gray-400">—</span>;
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i <= n ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-100"}`}
        />
      ))}
      <span className="text-xs font-semibold text-gray-500 ml-1">{n}</span>
    </span>
  );
}

function ReviewModal({ review, onClose, onDelete }) {
  if (!review) return null;

  const fields = [
    { label: "Review ID", key: "id" },
    { label: "Product", key: "product_name", alt: "product" },
    { label: "User", key: "user_name", alt: "user_email" },
    { label: "Rating", key: "rating", alt: "stars" },
    { label: "Comment", key: "review_text", alt: "comment" },
    { label: "Created At", key: "created_at", alt: "date" },
  ];

  function renderVal(key, altKey) {
    const val = review[key] ?? review[altKey];
    if (val === null || val === undefined) return "—";
    if (key === "rating" || key === "stars") return <StarRating rating={val} />;
    if (typeof val === "boolean") return val ? "Yes" : "No";
    return String(val);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-950/60 backdrop-blur-md transition-all duration-300">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white sticky top-0 z-10 text-left">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Review Details</h2>
            <p className="text-xs text-slate-400 font-mono mt-1">ID: {review.id}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDelete(review)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50 text-left space-y-3">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map(({ label, key, alt }) => (
              <div key={key} className={`bg-white border border-slate-100 rounded-xl p-4 ${key === "review_text" ? "sm:col-span-2" : ""}`}>
                <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</dt>
                <dd className="text-xs font-semibold text-slate-800 break-words leading-relaxed">{renderVal(key, alt)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}

export default function AdminReviews() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 400);
  useEffect(() => { setPage(1); }, [debouncedSearch, ratingFilter]);

  const params = { page, size: PAGE_SIZE };
  if (debouncedSearch) params.search = debouncedSearch;
  if (ratingFilter) params.rating = ratingFilter;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-reviews", params],
    queryFn: async () => {
      const { data } = await api.get("/api/reviews/", { params });
      return data;
    },
  });

  const reviews = data?.results ?? data?.items ?? [];
  const count = data?.count ?? data?.total ?? 0;
  const totalPages = Math.ceil(count / PAGE_SIZE) || 1;

  function formatDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
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

  const hasClear = search || ratingFilter;

  return (
    <div className="lg:p-8 text-left">
      <h2 className="text-2xl font-semibold text-gray-900 mb-8 mt-[20px] sm:mt-0">Reviews</h2>

      <div className="rounded-lg">
        <div className="h-[calc(100vh-120px)] flex flex-col">
          <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col flex-1 min-h-[600px]">

              {/* Header & Filter Controls */}
              <div className="p-4 md:p-6 border-b border-gray-200 flex-shrink-0 bg-white">
                <div className="space-y-4">

                  {/* Top Bar: Search + Count */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
                      <input
                        type="text"
                        placeholder="Search reviews..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8 md:pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none w-full sm:w-80"
                      />
                    </div>
                    <div className="text-sm text-gray-600">Total: {count} reviews</div>
                  </div>

                  {/* Bottom Bar: Rating Filter + Clear */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600 font-medium">Rating:</label>
                      <select
                        value={ratingFilter}
                        onChange={(e) => setRatingFilter(e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white text-gray-700 appearance-none pl-3 pr-8 cursor-pointer"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                          backgroundPosition: "right 0.5rem center",
                          backgroundRepeat: "no-repeat",
                          backgroundSize: "1.25rem 1.25rem",
                        }}
                      >
                        {RATING_OPTIONS.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </div>
                    {hasClear && (
                      <button
                        onClick={() => { setSearch(""); setRatingFilter(""); }}
                        className="text-xs font-semibold text-purple-600 hover:text-purple-800 transition-colors ml-auto cursor-pointer"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>

                </div>
              </div>

              {/* Table Container */}
              <div className="flex-1 overflow-auto min-h-0">
                {isLoading ? (
                  <div className="p-6 animate-pulse space-y-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="h-12 bg-gray-100 rounded-lg w-full" />
                    ))}
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <MessageSquare className="w-12 h-12 text-gray-300 mb-3" />
                    <p className="text-base font-semibold text-gray-600">No reviews found.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rating</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Comment</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reviews.map((review) => (
                        <tr key={review.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-xs font-semibold text-gray-900">
                            #{review.id}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs font-semibold text-gray-900 max-w-[180px] truncate" title={review.product_name ?? review.product}>
                              {review.product_name ?? review.product ?? review.product_id ?? "—"}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs text-gray-600 max-w-[140px] truncate">
                              {review.user_name ?? review.user_email ?? review.user ?? "—"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StarRating rating={review.rating ?? review.stars} />
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs text-gray-600 max-w-[240px] truncate" title={review.review_text ?? review.comment}>
                              {review.review_text ?? review.comment ?? "—"}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-600 whitespace-nowrap">
                            {formatDate(review.created_at ?? review.date)}
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end space-x-2 text-purple-600">
                              <button
                                onClick={() => setSelected(review)}
                                className="p-1 hover:bg-purple-50 rounded transition-colors cursor-pointer"
                                title="View Review"
                              >
                                <Eye className="w-4 h-4 text-gray-400 hover:text-purple-600" />
                              </button>
                              <button
                                onClick={(e) => handleDeleteInline(e, review)}
                                className="p-1 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                title="Delete Review"
                              >
                                <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination Bar */}
              <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white flex-shrink-0">
                <div className="text-sm text-gray-600">
                  Showing {reviews.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0} to {Math.min(page * PAGE_SIZE, count)} of {count} reviews
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
                          page === pNum
                            ? "bg-purple-600 text-white font-semibold"
                            : "border border-gray-300 text-gray-700 hover:bg-gray-50"
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
          message="Are you sure you want to delete this review? This action cannot be undone."
          confirmLabel="Delete"
          loading={deleteLoading}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
