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
import { 
  Search, 
  Plus, 
  X, 
  Edit3, 
  Trash2, 
  Tag, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  Calendar,
  DollarSign
} from "lucide-react";

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
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
      active 
        ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
        : "bg-red-50 text-red-700 border-red-100"
    }`}>
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function DiscountTypeBadge({ type }) {
  const map = { 
    percentage: "bg-blue-50 text-blue-755 border-blue-100", 
    flat: "bg-orange-50 text-orange-755 border-orange-100", 
    fixed: "bg-orange-50 text-orange-755 border-orange-100" 
  };
  const cls = map[type?.toLowerCase()] || "bg-slate-50 text-slate-700 border-slate-200";
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${cls}`}>{type || "—"}</span>;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{isEdit ? "Edit Coupon" : "Add Coupon"}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{isEdit ? `Modifying coupon row ID: ${coupon.id}` : "Configure a new promotional code discount."}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-650 hover:bg-slate-55 rounded-full transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-left">
          {error && (
            <div className="text-red-750 text-xs font-bold bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
              {error}
            </div>
          )}

          <div className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Coupon Code *</label>
              <input 
                name="code" 
                value={form.code} 
                onChange={handleChange} 
                required 
                placeholder="e.g. CREMSON20"
                className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Discount Type</label>
                <div className="relative">
                  <select 
                    name="discount_type" 
                    value={form.discount_type} 
                    onChange={handleChange} 
                    className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Flat (₹)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Discount Value {form.discount_type === "percentage" ? "(%)" : "(₹)"}
                </label>
                <input 
                  name="discount_value" 
                  type="number" 
                  step="0.01" 
                  value={form.discount_value} 
                  onChange={handleChange} 
                  placeholder="0.00"
                  className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Min Order (₹)</label>
                <input 
                  name="min_order_amount" 
                  type="number" 
                  step="0.01" 
                  value={form.min_order_amount} 
                  onChange={handleChange} 
                  placeholder="0.00"
                  className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Max Uses</label>
                <input 
                  name="max_uses" 
                  type="number" 
                  value={form.max_uses} 
                  onChange={handleChange} 
                  placeholder="e.g. 50"
                  className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Expiry Date</label>
              <input 
                name="expiry_date" 
                type="date" 
                value={form.expiry_date ? form.expiry_date.split("T")[0] : ""} 
                onChange={handleChange} 
                className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>

            <div className="flex items-center gap-2.5 p-1">
              <input 
                type="checkbox" 
                name="is_active" 
                id="coup_is_active" 
                checked={form.is_active} 
                onChange={handleChange} 
                className="w-4 h-4 text-red-655 rounded border-slate-300 focus:ring-red-500" 
              />
              <label htmlFor="coup_is_active" className="text-xs font-bold text-slate-700 cursor-pointer">Coupon Active</label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-55 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={saving} 
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-750 active:bg-blue-800 rounded-xl disabled:opacity-50 transition-colors shadow-sm"
            >
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
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-left">
      
      {/* Header Info Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Coupons</h1>
            <span className="bg-red-50 text-red-800 text-xs font-black px-2.5 py-0.5 rounded-full border border-red-100">
              {count.toLocaleString()} Codes
            </span>
          </div>
          <p className="text-sm text-slate-550 mt-1">Configure active checkout coupons, discounts percentage, minimum basket threshold parameters.</p>
        </div>
        <button 
          onClick={openAdd} 
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-650 hover:bg-red-700 active:bg-red-800 text-xs font-bold text-white rounded-xl shadow-lg shadow-red-950/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Coupon
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-[0_4px_20px_rgb(0,0,0,0.015)] flex flex-col sm:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search coupon codes..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900" 
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
                    <td className="px-5 py-4"><div className="h-4.5 w-24 bg-slate-150 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-5 w-16 bg-slate-150 rounded-full" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-12 bg-slate-150 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-16 bg-slate-150 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-5 w-14 bg-slate-150 rounded-full" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-24 bg-slate-150 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-8 bg-slate-150 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-16 bg-slate-150 rounded" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : coupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white">
            <Tag className="w-12 h-12 text-slate-200 mb-3" />
            <p className="text-sm font-semibold text-slate-500">No coupons active in Baserow.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead className="bg-slate-50/75">
                <tr>{COLS.map((h) => <th key={h} className="px-5 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* ID */}
                    <td className="px-5 py-4 text-xs font-bold text-slate-500 font-mono">
                      #{coupon.id}
                    </td>

                    {/* Code */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                        {coupon.code || "—"}
                      </span>
                    </td>

                    {/* Type */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <DiscountTypeBadge type={coupon.discount_type} />
                    </td>

                    {/* Value */}
                    <td className="px-5 py-4 text-xs font-black text-slate-900">
                      {coupon.discount_value != null ? coupon.discount_type === "percentage" ? `${coupon.discount_value}%` : `₹${Number(coupon.discount_value).toFixed(2)}` : "—"}
                    </td>

                    {/* Minimum Order */}
                    <td className="px-5 py-4 text-xs text-slate-650 font-medium">
                      {coupon.min_order_amount != null || coupon.minimum_order_amount != null ? `₹${Number(coupon.min_order_amount ?? coupon.minimum_order_amount).toFixed(2)}` : "—"}
                    </td>

                    {/* Active */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <ActiveBadge active={coupon.is_active ?? coupon.active} />
                    </td>

                    {/* Valid Until */}
                    <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(coupon.valid_until ?? coupon.expiry_date ?? coupon.expires_at)}
                    </td>

                    {/* Used count */}
                    <td className="px-5 py-4 text-xs text-slate-600 font-bold">
                      {coupon.used_count ?? coupon.usage_count ?? "0"}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => openEdit(e, coupon)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Edit Coupon"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, coupon)}
                          className="p-1.5 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete Coupon"
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
            Page <span className="text-slate-900 font-black">{page}</span> of <span className="text-slate-900 font-black">{totalPages}</span> &mdash; {count.toLocaleString()} coupons
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

      {/* Form Modal */}
      {modalOpen && (
        <CouponFormModal
          coupon={editCoupon}
          onClose={() => { setModalOpen(false); setEditCoupon(null); }}
          onSaved={handleSaved}
        />
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <ConfirmModal
          title="Delete Coupon"
          message={`Are you sure you want to delete coupon "${deleteTarget.code}"? This coupon code will immediately stop working at checkout.`}
          confirmLabel="Delete"
          loading={deleteLoading}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
