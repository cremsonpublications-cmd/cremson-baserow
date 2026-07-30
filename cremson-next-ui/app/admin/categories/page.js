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
  Pen,
  Trash2,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  Percent,
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

// ─── Offer badge ──────────────────────────────────────────────────────────────
function OfferBadge({ cat }) {
  const offerType = cat.offer_type || (cat.offer_percentage ? "percentage" : cat.offer_amount ? "flat" : "none");
  const val = cat.discount_value ?? cat.offer_percentage ?? cat.offer_amount;

  if (offerType === "percentage" && val) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200/60 shadow-xs">
        {val}% OFF
      </span>
    );
  }
  if (offerType === "flat" && val) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-xs">
        ₹{val} OFF
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200/60">
      No Offer
    </span>
  );
}

// ─── Active badge ─────────────────────────────────────────────────────────────
function ActiveBadge({ active }) {
  return active ? (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
      Active
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
      Inactive
    </span>
  );
}

// ─── Category Form Modal ──────────────────────────────────────────────────────
function CategoryFormModal({ category, existingCategories = [], onClose, onSaved }) {
  const isEdit = !!category;

  const initialOfferType = category?.offer_type || (category?.offer_percentage ? "percentage" : category?.offer_amount ? "flat" : "none");
  const initialDiscount = category?.discount_value ?? category?.offer_percentage ?? category?.offer_amount ?? "";

  const [form, setForm] = useState(
    isEdit
      ? {
          name: category.name || category.Name || "",
          sub_categories: category.sub_categories || category.Notes || "",
          offer_type: initialOfferType,
          discount_value: initialDiscount,
        }
      : {
          name: "",
          sub_categories: "",
          offer_type: "none",
          discount_value: "",
        }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      setError("Category name is required.");
      return;
    }

    // Check for duplicate category name (case-insensitive)
    const isDuplicate = existingCategories.some((cat) => {
      const catName = (cat.name || cat.Name || "").trim().toLowerCase();
      if (isEdit && String(cat.id) === String(category.id)) return false;
      return catName === trimmedName.toLowerCase();
    });

    if (isDuplicate) {
      setError(`Category name "${trimmedName}" already exists. Please enter a different name.`);
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = {
        name: trimmedName,
        sub_categories: form.sub_categories,
        offer_type: form.offer_type,
        discount_value: form.discount_value !== "" ? parseFloat(form.discount_value) : null,
      };
      
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? "Edit Category" : "Add Category"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-left">
          {error && (
            <div className="text-red-700 text-xs font-semibold bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Category Name <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Enter category name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Offer Type</label>
              <select
                name="offer_type"
                value={form.offer_type}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer"
              >
                <option value="none">No Offer</option>
                <option value="flat">Flat Amount Off</option>
                <option value="percentage">Percentage Off</option>
              </select>
            </div>
          </div>

          {form.offer_type === "flat" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Discount Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="discount_value"
                value={form.discount_value}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="Enter fixed (e.g., 50)"
                className="w-full md:w-1/2 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {form.offer_type === "percentage" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Discount Percentage (%) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="discount_value"
                value={form.discount_value}
                onChange={handleChange}
                required
                min="0"
                max="100"
                step="0.01"
                placeholder="Enter percentage (e.g., 15)"
                className="w-full md:w-1/2 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition-colors cursor-pointer"
            >
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Save Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Sub Category Form Modal ──────────────────────────────────────────────────
function SubCategoryFormModal({ subCategory, categories, onClose, onSaved }) {
  const isEdit = !!subCategory;
  const [form, setForm] = useState(
    isEdit
      ? {
          name: subCategory.name || "",
          parentCategoryId: subCategory.parentCategoryId || (categories[0]?.id || ""),
        }
      : {
          name: "",
          parentCategoryId: categories[0]?.id || "",
        }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      setError("Sub category name is required");
      return;
    }

    // Check for duplicate subcategory name across categories (case-insensitive)
    let allSubNames = [];
    categories.forEach((cat) => {
      const subs = (cat.sub_categories || cat.Notes || "").split(",").map((s) => s.trim()).filter(Boolean);
      subs.forEach((s) => {
        if (!isEdit || s.toLowerCase() !== subCategory?.name?.toLowerCase()) {
          allSubNames.push(s.toLowerCase());
        }
      });
    });

    if (allSubNames.includes(trimmedName.toLowerCase())) {
      setError(`Sub category name "${trimmedName}" already exists. Please enter a different name.`);
      return;
    }

    setSaving(true);
    setError("");
    try {
      const targetCategory = categories.find((c) => String(c.id) === String(form.parentCategoryId)) || categories[0];
      if (!targetCategory) throw new Error("No category found");

      let currentSubCats = (targetCategory.sub_categories || targetCategory.Notes || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      if (isEdit && subCategory.name) {
        currentSubCats = currentSubCats.filter((s) => s.toLowerCase() !== subCategory.name.toLowerCase());
      }
      if (!currentSubCats.map(s => s.toLowerCase()).includes(trimmedName.toLowerCase())) {
        currentSubCats.push(trimmedName);
      }

      await adminUpdateCategory(targetCategory.id, {
        sub_categories: currentSubCats.join(", "),
      });
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || "Failed to save sub category.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? "Edit Sub Category" : "Add Sub Category"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-left">
          {error && (
            <div className="text-red-700 text-xs font-semibold bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Sub Category Name <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Enter sub category name (e.g., Exemplar Problems)"
              className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition-colors cursor-pointer"
            >
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Save Sub Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminCategories() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Sub categories state
  const [subSearch, setSubSearch] = useState("");
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [editSubCategory, setEditSubCategory] = useState(null);

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

  const categories = (data?.results ?? data?.items ?? []).filter(
    (cat) => cat.name !== "SYSTEM_GLOBAL_SETTINGS" && cat.Name !== "SYSTEM_GLOBAL_SETTINGS"
  );

  // Derive flat sub-categories list
  const subCategoriesList = [];
  categories.forEach((cat) => {
    const subsStr = cat.sub_categories || cat.Notes || "";
    if (subsStr) {
      subsStr.split(",").forEach((subName, i) => {
        const trimmed = subName.trim();
        if (trimmed) {
          subCategoriesList.push({
            id: `${cat.id}-${i}`,
            name: trimmed,
            parentCategoryId: cat.id,
            parentCategoryName: cat.name || cat.Name,
            is_active: cat.is_active ?? true,
          });
        }
      });
    }
  });

  const filteredSubCategories = subSearch
    ? subCategoriesList.filter((sub) => sub.name.toLowerCase().includes(subSearch.toLowerCase()))
    : subCategoriesList;

  const count = data?.count ?? data?.total ?? 0;
  const totalPages = Math.ceil(count / PAGE_SIZE);

  const SYSTEM_CATEGORY = "SYSTEM_GLOBAL_SETTINGS";

  function openAdd() { setEditCategory(null); setModalOpen(true); }
  function openEdit(e, cat) { e.stopPropagation(); setEditCategory(cat); setModalOpen(true); }
  function handleDelete(e, cat) { e.stopPropagation(); setDeleteTarget(cat); }

  function openAddSubCategory() { setEditSubCategory(null); setSubModalOpen(true); }
  function openEditSubCategory(sub) { setEditSubCategory(sub); setSubModalOpen(true); }

  async function handleDeleteSubCategory(sub) {
    const parent = categories.find((c) => String(c.id) === String(sub.parentCategoryId));
    if (!parent) return;
    const remaining = (parent.sub_categories || parent.Notes || "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s && s !== sub.name);

    try {
      await adminUpdateCategory(parent.id, { sub_categories: remaining.join(", ") });
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    } catch (err) {
      alert("Failed to delete subcategory.");
    }
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
    setSubModalOpen(false);
    setEditSubCategory(null);
    queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
  }

  return (
    <div className="lg:p-8">
      <h2 className="text-2xl font-semibold text-gray-900 mb-8 mt-[20px] sm:mt-0">Categories</h2>

      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">

          {/* Add Button */}
          <button
            onClick={openAdd}
            className="inline-flex items-center px-4 py-2 rounded-lg font-medium mb-6 transition-colors duration-200 bg-blue-600 hover:bg-blue-700 text-white text-sm cursor-pointer"
          >
            <Plus className="w-5 h-5 mr-2" aria-hidden="true" />
            Add Category
          </button>

          {/* Table Card */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200">
            {/* Card Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-xl font-semibold text-gray-900">All Categories</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" aria-hidden="true" />
                  <input
                    type="text"
                    placeholder="Search categories..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-full sm:w-80 text-sm"
                  />
                  {search && (
                    <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Category Name</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Offer</th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="px-6 py-4"><div className="h-4 w-40 bg-gray-200 rounded" /></td>
                          <td className="px-6 py-4"><div className="h-5 w-20 bg-gray-200 rounded-full" /></td>
                          <td className="px-6 py-4 text-right"><div className="h-5 w-16 bg-gray-200 rounded ml-auto" /></td>
                        </tr>
                      ))
                    : categories.length === 0
                    ? (
                        <tr>
                          <td colSpan={3} className="px-6 py-16 text-center text-gray-400 text-sm">
                            No categories found.
                          </td>
                        </tr>
                      )
                    : categories.map((cat) => {
                        const isSystem = cat.name === SYSTEM_CATEGORY;
                        return (
                          <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                            {/* Name */}
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <FolderOpen className="w-4 h-4 text-blue-600" aria-hidden="true" />
                                <h3 className="text-sm font-medium text-gray-900">
                                  {cat.name || cat.Name || cat.main_category_name || "—"}
                                </h3>
                              </div>
                            </td>

                            {/* Offer */}
                            <td className="px-6 py-4">
                              <OfferBadge cat={cat} />
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4 text-right">
                              {isSystem ? (
                                <span className="text-xs text-gray-500 italic">System Setting</span>
                              ) : (
                                <div className="flex justify-end space-x-2">
                                  <button
                                    onClick={(e) => openEdit(e, cat)}
                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                    title="Edit category"
                                  >
                                    <Pen className="w-4 h-4" aria-hidden="true" />
                                  </button>
                                  <button
                                    onClick={(e) => handleDelete(e, cat)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                    title="Delete category"
                                  >
                                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sub Categories Section */}
          <div className="mt-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Sub Categories</h2>

            {/* Add Sub Category Button */}
            <button
              onClick={() => openAddSubCategory()}
              className="inline-flex items-center px-4 py-2 rounded-lg font-medium mb-6 transition-colors duration-200 bg-blue-600 hover:bg-blue-700 text-white text-sm cursor-pointer"
            >
              <Plus className="w-5 h-5 mr-2" aria-hidden="true" />
              Add Sub Category
            </button>

            {/* Sub Categories Table Card */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h2 className="text-xl font-semibold text-gray-900">All Sub Categories</h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" aria-hidden="true" />
                    <input
                      type="text"
                      placeholder="Search sub categories..."
                      value={subSearch}
                      onChange={(e) => setSubSearch(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-full sm:w-80 text-sm"
                    />
                    {subSearch && (
                      <button onClick={() => setSubSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

          {/* Sub Categories Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Sub Category Name</th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSubCategories.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-6 py-16 text-center text-gray-400 text-sm">
                          No sub categories found.
                        </td>
                      </tr>
                    ) : (
                      filteredSubCategories.map((sub, idx) => (
                        <tr key={sub.id || idx} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <FolderOpen className="w-4 h-4 text-blue-600" aria-hidden="true" />
                              <h3 className="text-sm font-medium text-gray-900">{sub.name}</h3>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => openEditSubCategory(sub)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit sub category"
                              >
                                <Pen className="w-4 h-4" aria-hidden="true" />
                              </button>
                              <button
                                onClick={() => handleDeleteSubCategory(sub)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete sub category"
                              >
                                <Trash2 className="w-4 h-4" aria-hidden="true" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Category Modal */}
      {modalOpen && (
        <CategoryFormModal
          category={editCategory}
          existingCategories={categories}
          onClose={() => { setModalOpen(false); setEditCategory(null); }}
          onSaved={handleSaved}
        />
      )}

      {/* Sub Category Form Modal */}
      {subModalOpen && (
        <SubCategoryFormModal
          subCategory={editSubCategory}
          categories={categories}
          onClose={() => { setSubModalOpen(false); setEditSubCategory(null); }}
          onSaved={handleSaved}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Category"
          message={`Are you sure you want to delete "${deleteTarget.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          loading={deleteLoading}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
