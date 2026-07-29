"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../../lib/api/axios";
import {
  adminCreateCoupon,
  adminUpdateCoupon,
  adminDeleteCoupon,
} from "../../../lib/api/admin";
import ConfirmModal from "../components/ConfirmModal";

const PAGE_SIZE = 20;

const EMPTY_FORM = {
  code: "",
  discount_type: "percentage",
  discount_value: "",
  min_order_amount: "",
  max_uses: "",
  expiry_date: "",
  is_active: true,
};

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function ActiveBadge({ active }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function DiscountTypeBadge({ type }) {
  const map = { percentage: "bg-blue-100 text-blue-800", flat: "bg-orange-100 text-orange-800", fixed: "bg-orange-100 text-orange-800" };
  const cls = map[type?.toLowerCase()] || "bg-gray-100 text-gray-600";
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${cls}`}>{type || "—"}</span>;
}

function CouponFormModal({ coupon, onClose, onSaved }) {
  const isEdit = !!coupon;
  const [form, setForm] = useState(
    isEdit
      ? {
          code: coupon.code || "",
          discount_type: coupon.discount_type || "percentage",
          discount_value: coupon.discount_value != null ? String(coupon.discount_value) : "",
          min_order_amount: (coupon.min_order_amount ?? coupon.minimum_order_amount) != null ? String(coupon.min_order_amount ?? coupon.minimum_order_amount) : "",
          max_uses: coupon.max_uses != null ? String(coupon.max_uses) : "",
          expiry_date: coupon.expiry_date ?? coupon.valid_until ?? coupon.expires_at ?? "",
          is_active: coupon.is_active ?? coupon.active ?? true,
        }
      : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = { code: form.code, discount_type: form.discount_type, is_active: form.is_active };
      if (form.discount_value !== "") payload.discount_value = Number(form.discount_value);
      if (form.min_order_amount !== "") payload.min_order_amount = Number(form.min_order_amount);
      if (form.max_uses !== "") payload.max_uses = Number(form.max_uses);
      if (form.expiry_date) payload.expiry_date = form.expiry_date;

      if (isEdit) {
        await adminUpdateCoupon(coupon.id, payload);
      } else {
        await adminCreateCoupon(payload);
      }
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to save coupon.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{isEdit ? "Edit Coupon" : "Add Coupon"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Code *</label>
            <input name="code" value={form.code} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Discount Type</label>
              <select name="discount_type" value={form.discount_type} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Discount Value {form.discount_type === "percentage" ? "(%)" : "(₹)"}
              </label>
              <input name="discount_value" type="number" step="0.01" value={form.discount_value} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Min Order (₹)</label>
              <input name="min_order_amount" type="number" step="0.01" value={form.min_order_amount} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Max Uses</label>
              <input name="max_uses" type="number" value={form.max_uses} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Expiry Date</label>
            <input name="expiry_date" type="date" value={form.expiry_date ? form.expiry_date.split("T")[0] : ""} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" name="is_active" id="coup_is_active" checked={form.is_active} onChange={handleChange} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
            <label htmlFor="coup_is_active" className="text-sm font-medium text-gray-700">Active</label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Coupon"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const COLS = ["ID", "Code", "Discount Type", "Discount Value", "Min Order", "Is Active", "Valid Until", "Used Count", "Actions"];

export default function AdminCoupons() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editCoupon, setEditCoupon] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const params = { page, size: PAGE_SIZE };
  if (debouncedSearch) params.search = debouncedSearch;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-coupons", params],
    queryFn: async () => {
      const { data } = await api.get("/api/coupons/", { params });
      return data;
    },
  });

  const coupons = data?.results ?? data?.items ?? [];
  const count = data?.count ?? data?.total ?? 0;
  const totalPages = Math.ceil(count / PAGE_SIZE);

  function formatDate(dateStr) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }

  function openAdd() {
    setEditCoupon(null);
    setModalOpen(true);
  }

  function openEdit(e, coupon) {
    e.stopPropagation();
    setEditCoupon(coupon);
    setModalOpen(true);
  }

  function handleDelete(e, coupon) {
    e.stopPropagation();
    setDeleteTarget(coupon);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await adminDeleteCoupon(deleteTarget.id);
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      setDeleteTarget(null);
    } catch (err) {
      alert(err?.response?.data?.detail || "Failed to delete coupon.");
    } finally {
      setDeleteLoading(false);
    }
  }

  function handleSaved() {
    setModalOpen(false);
    setEditCoupon(null);
    queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
          <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-2.5 py-0.5 rounded-full">{count.toLocaleString()}</span>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Coupon
        </button>
      </div>

      <div className="bg-white rounded-xl shadow p-4 mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <input type="text" placeholder="Search coupons by code..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        {search && <button onClick={() => setSearch("")} className="text-sm text-gray-500 hover:text-gray-700 underline">Clear</button>}
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {isLoading ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50"><tr>{COLS.map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-200 animate-pulse">
                {Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3"><div className="h-4 w-8 bg-gray-200 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-6 w-24 bg-gray-200 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-24 bg-gray-200 rounded-full" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-16 bg-gray-200 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-20 bg-gray-200 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-16 bg-gray-200 rounded-full" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-24 bg-gray-200 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-10 bg-gray-200 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-20 bg-gray-200 rounded" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : coupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <p className="text-lg font-medium">No coupons found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50"><tr>{COLS.map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-200">
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">{coupon.id}</td>
                    <td className="px-4 py-3"><span className="font-mono font-semibold text-sm text-gray-900 bg-gray-100 px-2 py-0.5 rounded">{coupon.code || "—"}</span></td>
                    <td className="px-4 py-3"><DiscountTypeBadge type={coupon.discount_type} /></td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {coupon.discount_value != null ? coupon.discount_type === "percentage" ? `${coupon.discount_value}%` : `₹${Number(coupon.discount_value).toFixed(2)}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {coupon.min_order_amount != null || coupon.minimum_order_amount != null ? `₹${Number(coupon.min_order_amount ?? coupon.minimum_order_amount).toFixed(2)}` : "—"}
                    </td>
                    <td className="px-4 py-3"><ActiveBadge active={coupon.is_active ?? coupon.active} /></td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(coupon.valid_until ?? coupon.expiry_date ?? coupon.expires_at)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{coupon.used_count ?? coupon.usage_count ?? "0"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => openEdit(e, coupon)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, coupon)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
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

      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-sm text-gray-500">Page <strong>{page}</strong> of <strong>{totalPages}</strong> &mdash; {count.toLocaleString()} results</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors">← Prev</button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors">Next →</button>
          </div>
        </div>
      )}

      {modalOpen && (
        <CouponFormModal
          coupon={editCoupon}
          onClose={() => { setModalOpen(false); setEditCoupon(null); }}
          onSaved={handleSaved}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Coupon"
          message={`Are you sure you want to delete coupon "${deleteTarget.code}"? This cannot be undone.`}
          confirmLabel="Delete"
          loading={deleteLoading}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
