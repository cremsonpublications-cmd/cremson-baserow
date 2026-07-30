"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../../lib/api/axios";
import {
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
} from "../../../lib/api/admin";
import ConfirmModal from "../components/ConfirmModal";
import { 
  Search, 
  Plus, 
  X, 
  Edit3, 
  Trash2, 
  Grid, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  DollarSign
} from "lucide-react";

const PAGE_SIZE = 20;

const EMPTY_FORM = { name: "", description: "", is_active: true };

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

function CategoryFormModal({ category, onClose, onSaved }) {
  const isEdit = !!category;
  const [form, setForm] = useState(
    isEdit
      ? {
          name: category.name || "",
          description: category.description || "",
          is_active: category.is_active ?? category.active ?? true,
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
      const payload = { name: form.name, is_active: form.is_active };
      if (form.description) payload.description = form.description;
      if (isEdit) {
        await adminUpdateCategory(category.id, payload);
      } else {
        await adminCreateCategory(payload);
      }
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to save category.");
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
            <h2 className="text-lg font-bold text-slate-900">{isEdit ? "Edit Category" : "Add Category"}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{isEdit ? `Modifying category row ID: ${category.id}` : "Create a new book genre or category."}</p>
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
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Category Name *</label>
              <input 
                name="name" 
                value={form.name} 
                onChange={handleChange} 
                required 
                placeholder="e.g. Higher Secondary Books"
                className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
              <textarea 
                name="description" 
                value={form.description} 
                onChange={handleChange} 
                rows={3} 
                placeholder="Explain the types of books included in this section..."
                className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>

            <div className="flex items-center gap-2.5 p-1">
              <input 
                type="checkbox" 
                name="is_active" 
                id="cat_is_active" 
                checked={form.is_active} 
                onChange={handleChange} 
                className="w-4 h-4 text-red-650 rounded border-slate-300 focus:ring-red-500" 
              />
              <label htmlFor="cat_is_active" className="text-xs font-bold text-slate-700 cursor-pointer">Category Active</label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={saving} 
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-750 active:bg-blue-800 rounded-xl disabled:opacity-50 transition-colors shadow-sm"
            >
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const COLS = ["ID", "Name", "Offer Type", "Offer % / Amount", "Shipping", "Free threshold", "Active", "Actions"];

export default function AdminCategories() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const params = { page, size: PAGE_SIZE };
  if (debouncedSearch) params.search = debouncedSearch;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-categories", params],
    queryFn: async () => {
      const { data } = await api.get("/api/categories/", { params });
      return data;
    },
  });

  const categories = data?.results ?? data?.items ?? [];
  const count = data?.count ?? data?.total ?? 0;
  const totalPages = Math.ceil(count / PAGE_SIZE);

  function openAdd() {
    setEditCategory(null);
    setModalOpen(true);
  }

  function openEdit(e, cat) {
    e.stopPropagation();
    setEditCategory(cat);
    setModalOpen(true);
  }

  function handleDelete(e, cat) {
    e.stopPropagation();
    setDeleteTarget(cat);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await adminDeleteCategory(deleteTarget.id);
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      setDeleteTarget(null);
    } catch (err) {
      alert(err?.response?.data?.detail || "Failed to delete category.");
    } finally {
      setDeleteLoading(false);
    }
  }

  function handleSaved() {
    setModalOpen(false);
    setEditCategory(null);
    queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-left">
      
      {/* Header Info Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Categories</h1>
            <span className="bg-red-50 text-red-800 text-xs font-black px-2.5 py-0.5 rounded-full border border-red-100">
              {count.toLocaleString()} Genres
            </span>
          </div>
          <p className="text-sm text-slate-550 mt-1">Manage catalog sections, genre categorization, specific discount overrides and thresholds.</p>
        </div>
        <button 
          onClick={openAdd} 
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-650 hover:bg-red-700 active:bg-red-800 text-xs font-bold text-white rounded-xl shadow-lg shadow-red-950/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-[0_4px_20px_rgb(0,0,0,0.015)] flex flex-col sm:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search categories by name..." 
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
                {Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-4"><div className="h-4 w-8 bg-slate-150 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-32 bg-slate-150 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-20 bg-slate-150 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-12 bg-slate-150 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-16 bg-slate-150 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-16 bg-slate-150 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-5 w-16 bg-slate-150 rounded-full" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-16 bg-slate-150 rounded" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white">
            <Grid className="w-12 h-12 text-slate-200 mb-3" />
            <p className="text-sm font-semibold text-slate-500">No categories found matching criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead className="bg-slate-50/75">
                <tr>{COLS.map((h) => <th key={h} className="px-5 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Row ID */}
                    <td className="px-5 py-4 text-xs font-bold text-slate-550 font-mono">
                      #{cat.id}
                    </td>

                    {/* Category Name */}
                    <td className="px-5 py-4 text-xs font-bold text-slate-900">
                      {cat.name || "—"}
                    </td>

                    {/* Offer Type */}
                    <td className="px-5 py-4 text-xs text-slate-600 capitalize">
                      {cat.offer_type || "None"}
                    </td>

                    {/* Offer Value */}
                    <td className="px-5 py-4 text-xs text-slate-700 font-semibold">
                      {cat.offer_percentage != null ? `${cat.offer_percentage}%` : cat.offer_amount != null ? `₹${cat.offer_amount}` : "—"}
                    </td>

                    {/* Shipping Charge */}
                    <td className="px-5 py-4 text-xs text-slate-650">
                      {cat.shipping_charge != null ? `₹${cat.shipping_charge}` : "—"}
                    </td>

                    {/* Free threshold */}
                    <td className="px-5 py-4 text-xs text-slate-650 font-medium">
                      {cat.free_delivery_threshold != null ? `₹${cat.free_delivery_threshold}` : "—"}
                    </td>

                    {/* Active */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <ActiveBadge active={cat.is_active ?? cat.active} />
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => openEdit(e, cat)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Edit Category"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, cat)}
                          className="p-1.5 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete Category"
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
            Page <span className="text-slate-900 font-black">{page}</span> of <span className="text-slate-900 font-black">{totalPages}</span> &mdash; {count.toLocaleString()} categories
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
        <CategoryFormModal
          category={editCategory}
          onClose={() => { setModalOpen(false); setEditCategory(null); }}
          onSaved={handleSaved}
        />
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <ConfirmModal
          title="Delete Category"
          message={`Are you sure you want to delete category "${deleteTarget.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          loading={deleteLoading}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
