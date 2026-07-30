"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../../lib/api/axios";
import {
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
} from "../../../lib/api/admin";
import ConfirmModal from "../components/ConfirmModal";
import { 
  Search, 
  Plus, 
  X, 
  Edit3, 
  Trash2, 
  BookOpen, 
  Check, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  DollarSign,
  Briefcase,
  Layers,
  ChevronDown,
  Copy
} from "lucide-react";

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "on_sale", label: "On Sale" },
  { value: "featured", label: "Featured" },
  { value: "in_stock", label: "In Stock" },
  { value: "out_of_stock", label: "Out of Stock" },
  { value: "on_backorders", label: "On Backorders" },
];

const ACTIVE_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "true", label: "Active Only" },
  { value: "false", label: "Inactive Only" },
];

const STOCK_STATUS_OPTIONS = ["in_stock", "out_of_stock", "on_backorders"];

const EMPTY_FORM = {
  name: "",
  author: "",
  mrp: "",
  price: "",
  description: "",
  category_id: "",
  isbn: "",
  stock_status: "in_stock",
  status: "",
  is_active: true,
  main_image: "",
  class_: "",
};

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function StockBadge({ stockStatus }) {
  const s = stockStatus || "";
  let colors = "bg-gray-55 text-gray-700 border-gray-200";
  if (s === "in_stock") {
    colors = "bg-emerald-50 text-emerald-700 border-emerald-100";
  } else if (s === "out_of_stock") {
    colors = "bg-rose-50 text-rose-700 border-rose-100";
  } else if (s === "on_backorders") {
    colors = "bg-amber-50 text-amber-700 border-amber-100";
  }
  const label = stockStatus ? stockStatus.replace(/_/g, " ") : "—";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${colors}`}>
      {label}
    </span>
  );
}

function ActiveBadge({ active }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
      active 
        ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
        : "bg-red-50 text-red-700 border-red-100"
    }`}>
      {active ? "Active" : "Inactive"}
    </span>
  );
}

const COLS = ["ID", "Book Info", "MRP & Sale", "Tag/Status", "Category", "Stock", "Active", "ISBN", "Actions"];

function SkeletonTable() {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-100 text-left">
        <thead className="bg-slate-50/70">
          <tr>{COLS.map((h) => <th key={h} className="px-5 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100 animate-pulse bg-white">
          {Array.from({ length: 8 }).map((_, i) => (
            <tr key={i}>
              <td className="px-5 py-4"><div className="h-4 w-8 bg-slate-150 rounded" /></td>
              <td className="px-5 py-4"><div className="h-4 w-48 bg-slate-150 rounded mb-2" /><div className="h-3 w-32 bg-slate-50 rounded" /></td>
              <td className="px-5 py-4"><div className="h-4 w-20 bg-slate-150 rounded" /></td>
              <td className="px-5 py-4"><div className="h-5 w-20 bg-slate-150 rounded-full" /></td>
              <td className="px-5 py-4"><div className="h-4 w-10 bg-slate-150 rounded" /></td>
              <td className="px-5 py-4"><div className="h-5 w-16 bg-slate-150 rounded-full" /></td>
              <td className="px-5 py-4"><div className="h-5 w-16 bg-slate-150 rounded-full" /></td>
              <td className="px-5 py-4"><div className="h-4 w-28 bg-slate-150 rounded" /></td>
              <td className="px-5 py-4"><div className="h-4 w-16 bg-slate-150 rounded" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProductModal({ product, onClose, onSaved }) {
  const isEdit = !!product;
  const [form, setForm] = useState(
    isEdit
      ? {
          name: product.name || "",
          author: product.author || "",
          mrp: product.mrp != null ? String(product.mrp) : "",
          price: product.price != null ? String(product.price) : "",
          description: product.description || "",
          category_id: product.category_id != null ? String(product.category_id) : "",
          isbn: product.isbn || "",
          stock_status: product.stock_status || "in_stock",
          status: product.status || "",
          is_active: product.is_active ?? true,
          main_image: product.main_image || "",
          class_: product.class_ || product.class || "",
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
      const payload = {};
      if (form.name) payload.name = form.name;
      if (form.author) payload.author = form.author;
      if (form.mrp !== "") payload.mrp = Number(form.mrp);
      if (form.price !== "") payload.price = Number(form.price);
      if (form.description) payload.description = form.description;
      if (form.category_id !== "") payload.category_id = Number(form.category_id);
      if (form.isbn) payload.isbn = form.isbn;
      if (form.stock_status) payload.stock_status = form.stock_status;
      if (form.status) payload.status = form.status;
      payload.is_active = form.is_active;
      if (form.main_image) payload.main_image = form.main_image;
      if (form.class_) payload.class_ = form.class_;

      if (isEdit) {
        await adminUpdateProduct(product.id, payload);
      } else {
        await adminCreateProduct(payload);
      }
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to save product.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{isEdit ? "Edit Product" : "Add New Product"}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{isEdit ? `Modifying resource row ID: ${product.id}` : "Publish a new book catalog entry."}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-4 bg-slate-50/30 text-left">
          {error && (
            <div className="text-red-750 text-xs font-bold bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Book Title *</label>
              <input 
                name="name" 
                value={form.name} 
                onChange={handleChange} 
                required 
                placeholder="e.g. Science Lab Manual Class VIII"
                className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Author</label>
              <input 
                name="author" 
                value={form.author} 
                onChange={handleChange} 
                placeholder="e.g. Dr. R. K. Sharma"
                className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">ISBN Number</label>
              <input 
                name="isbn" 
                value={form.isbn} 
                onChange={handleChange} 
                placeholder="e.g. 978-3-16-148410-0"
                className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">MRP Price (₹)</label>
              <input 
                name="mrp" 
                type="number" 
                step="0.01" 
                value={form.mrp} 
                onChange={handleChange} 
                placeholder="0.00"
                className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Sale Price (₹)</label>
              <input 
                name="price" 
                type="number" 
                step="0.01" 
                value={form.price} 
                onChange={handleChange} 
                placeholder="0.00"
                className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Category ID</label>
              <input 
                name="category_id" 
                type="number" 
                value={form.category_id} 
                onChange={handleChange} 
                placeholder="e.g. 1"
                className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Stock Status</label>
              <div className="relative">
                <select 
                  name="stock_status" 
                  value={form.stock_status} 
                  onChange={handleChange} 
                  className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                >
                  {STOCK_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Feature Tag / Status</label>
              <div className="relative">
                <select 
                  name="status" 
                  value={form.status} 
                  onChange={handleChange} 
                  className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                >
                  <option value="">— None —</option>
                  {["on_sale", "featured", "in_stock", "out_of_stock", "on_backorders"].map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Target Class</label>
              <input 
                name="class_" 
                value={form.class_} 
                onChange={handleChange} 
                placeholder="e.g. VIII"
                className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Main Catalog Image URL</label>
              <input 
                name="main_image" 
                value={form.main_image} 
                onChange={handleChange} 
                placeholder="https://example.com/books/science.jpg"
                className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description Summary</label>
              <textarea 
                name="description" 
                value={form.description} 
                onChange={handleChange} 
                rows={3} 
                placeholder="Write summary description about the syllabus..."
                className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>

            <div className="flex items-center gap-2.5 p-1">
              <input 
                type="checkbox" 
                name="is_active" 
                id="prod_is_active" 
                checked={form.is_active} 
                onChange={handleChange} 
                className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500" 
              />
              <label htmlFor="prod_is_active" className="text-xs font-bold text-slate-700 cursor-pointer">Catalog Status Active</label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6 bg-white sticky bottom-0">
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
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminProducts() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState(null);

  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => { setPage(1); }, [debouncedSearch, status, activeFilter]);

  const params = { page, size: PAGE_SIZE };
  if (debouncedSearch) params.search = debouncedSearch;
  if (status) params.status = status;
  if (activeFilter) params.is_active = activeFilter;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-products", params],
    queryFn: async () => {
      const { data } = await api.get("/api/products/", { params });
      return data;
    },
  });

  const products = data?.results ?? data?.items ?? [];
  const count = data?.count ?? data?.total ?? 0;
  const totalPages = Math.ceil(count / PAGE_SIZE);

  function formatDate(dateStr) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }

  function openAdd() {
    setEditProduct(null);
    setModalOpen(true);
  }

  function openEdit(e, product) {
    e.stopPropagation();
    setEditProduct(product);
    setModalOpen(true);
  }

  async function handleDuplicate(e, product) {
    e.stopPropagation();
    setDuplicatingId(product.id);
    try {
      const payload = {
        name: product.name || "",
        author: product.author || "",
        mrp: product.mrp != null ? Number(product.mrp) : null,
        price: product.price != null ? Number(product.price) : null,
        description: product.description || "",
        category_id: product.category_id != null ? Number(product.category_id) : (product.category != null ? Number(product.category) : null),
        isbn: product.isbn || "",
        stock_status: product.stock_status || "in_stock",
        status: product.status || "",
        is_active: product.is_active ?? true,
        main_image: product.main_image || "",
        class_: product.class_ || product.class || "",
      };
      await adminCreateProduct(payload);
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    } catch (err) {
      alert(err?.response?.data?.detail || "Failed to duplicate product.");
    } finally {
      setDuplicatingId(null);
    }
  }

  function handleDelete(e, product) {
    e.stopPropagation();
    setDeleteTarget(product);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await adminDeleteProduct(deleteTarget.id);
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setDeleteTarget(null);
    } catch (err) {
      alert(err?.response?.data?.detail || "Failed to delete product.");
    } finally {
      setDeleteLoading(false);
    }
  }

  function handleSaved() {
    setModalOpen(false);
    setEditProduct(null);
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-left">
      
      {/* Header Info Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Products Manager</h1>
            <span className="bg-red-50 text-red-800 text-xs font-black px-2.5 py-0.5 rounded-full border border-red-100">
              {count.toLocaleString()} Books
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">Publish reference material, textbooks, view inventory status and manage discounts.</p>
        </div>
        <button 
          onClick={openAdd} 
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-xs font-bold text-white rounded-xl shadow-lg shadow-red-950/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-[0_4px_20px_rgb(0,0,0,0.01)] flex flex-col sm:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by book title or authors..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900" 
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

        {/* Status Dropdowns */}
        <div className="flex w-full sm:w-auto items-center justify-end gap-3 flex-wrap">
          <div className="relative min-w-[130px] w-full sm:w-auto">
            <select 
              value={status} 
              onChange={(e) => setStatus(e.target.value)} 
              className="w-full border border-slate-200 bg-white rounded-xl pl-3 pr-8 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-slate-700 cursor-pointer"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative min-w-[130px] w-full sm:w-auto">
            <select 
              value={activeFilter} 
              onChange={(e) => setActiveFilter(e.target.value)} 
              className="w-full border border-slate-200 bg-white rounded-xl pl-3 pr-8 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-slate-700 cursor-pointer"
            >
              {ACTIVE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
          
          {(search || status || activeFilter) && (
            <button 
              onClick={() => { setSearch(""); setStatus(""); setActiveFilter(""); }} 
              className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50/80 px-3 py-2 rounded-xl transition-all cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>

      </div>

      {/* Grid List Table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-[0_4px_25px_rgb(0,0,0,0.01)] overflow-hidden">
        {isLoading ? (
          <SkeletonTable />
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-450 bg-white">
            <BookOpen className="w-12 h-12 text-slate-200 mb-3" />
            <p className="text-sm font-semibold text-slate-500">No active books matching parameters found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead className="bg-slate-50/75">
                <tr>{COLS.map((h) => <th key={h} className="px-5 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {products.map((product) => (
                  <tr 
                    key={product.id} 
                    onClick={() => router.push(`/admin/products/${product.id}`)} 
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors active:bg-slate-150/40"
                  >
                    {/* Row ID */}
                    <td className="px-5 py-4 text-xs font-bold text-slate-500 font-mono">
                      #{product.id}
                    </td>

                    {/* Book Info */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {product.main_image ? (
                          <img src={product.main_image} alt={product.name} className="w-9 h-9 object-contain bg-slate-50 rounded border border-slate-100 p-0.5" />
                        ) : (
                          <div className="w-9 h-9 bg-slate-100 rounded flex items-center justify-center text-slate-400 border border-slate-200">
                            <BookOpen className="w-4 h-4" />
                          </div>
                        )}
                        <div className="text-left">
                          <div className="text-xs font-bold text-slate-900 max-w-[220px] truncate" title={product.name}>
                            {product.name || "—"}
                          </div>
                          {product.author && <p className="text-[10px] text-slate-550">By {product.author}</p>}
                        </div>
                      </div>
                    </td>

                    {/* Pricing */}
                    <td className="px-5 py-4 text-xs">
                      <div className="font-bold text-slate-900">₹{Number(product.price || 0).toFixed(2)}</div>
                      {product.mrp && <p className="text-[10px] text-slate-400 line-through">MRP: ₹{Number(product.mrp).toFixed(2)}</p>}
                    </td>

                    {/* Tag Status */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      {product.status ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 capitalize">
                          {product.status.replace(/_/g, " ")}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>

                    {/* Category ID */}
                    <td className="px-5 py-4 text-xs font-medium text-slate-600">
                      ID: {product.category ?? product.category_id ?? "—"}
                    </td>

                    {/* Stock status */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <StockBadge stockStatus={product.stock_status} />
                    </td>

                    {/* Active */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <ActiveBadge active={product.is_active} />
                    </td>

                    {/* ISBN */}
                    <td className="px-5 py-4 text-xs text-slate-500 font-mono">
                      {product.isbn || "—"}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => handleDuplicate(e, product)}
                          disabled={duplicatingId === product.id}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all disabled:opacity-50"
                          title="Copy/Duplicate Product"
                        >
                          {duplicatingId === product.id ? (
                            <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={(e) => openEdit(e, product)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Edit Product"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, product)}
                          className="p-1.5 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete Product"
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
          <p className="text-xs font-bold text-slate-500">
            Page <span className="text-slate-900 font-black">{page}</span> of <span className="text-slate-900 font-black">{totalPages}</span> &mdash; {count.toLocaleString()} products
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

      {/* Product Form Modal */}
      {modalOpen && (
        <ProductModal
          product={editProduct}
          onClose={() => { setModalOpen(false); setEditProduct(null); }}
          onSaved={handleSaved}
        />
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <ConfirmModal
          title="Delete Product"
          message={`Are you sure you want to delete "${deleteTarget.name}"? This catalog entry will be permanently removed from Baserow.`}
          confirmLabel="Delete"
          loading={deleteLoading}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
