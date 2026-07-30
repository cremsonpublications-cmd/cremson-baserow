"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
  Copy,
  Pen,
  Upload
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
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${active
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

const DEFAULT_DELIVERY_INFO = `We aim to deliver your order safely and on time. All orders are usually delivered within 4–5 working days from the date of dispatch.
Delivery timelines may vary slightly depending on your location, courier service availability, and order size.

Delivery Charges:
Applicable as per your delivery address and order value. The exact delivery charge (if any) will be displayed at checkout before you make the payment.

Once your order has been shipped, you will receive an email or WhatsApp notification with your tracking details so you can monitor your delivery status in real time.`;

const DEFAULT_RETURNS_INFO = `We take utmost care in packaging and dispatching your order. However, if you happen to receive a damaged, defective, or incorrect product, we will be happy to offer an exchange.

Please note the following terms:
• Exchange is applicable only in cases where the product received is damaged, misprinted, or incorrect.
• We do not offer returns or refunds for any other reasons (such as change of mind or wrong selection).
• Customers must notify us within 14 days of delivery to be eligible for an exchange.
• We do not arrange return pickups. You will need to ship the product back to our address (as provided in the exchange confirmation email).
• Once we receive and verify the returned product, a replacement copy will be dispatched to you at no additional cost.
• The exchanged product will be the same title and edition as originally ordered (unless otherwise agreed upon in writing).

—

How to Raise an Exchange Request

To initiate an exchange or report a damaged/incorrect product:
1. Email us at info@cremsonpublications.com within 14 days of receiving your order.
2. Mention your Order ID, the issue faced, and attach clear photographs of the product and packaging.
3. Our team will review your request and respond with the return shipping details and next steps.`;

function CustomSelect({ options, value, onChange, placeholder = "Select an option" }) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors bg-white text-left flex items-center justify-between cursor-pointer"
      >
        <span className={selectedOption ? "text-gray-900 font-medium" : "text-gray-400"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-30 max-h-48 overflow-y-auto py-1 animate-in fade-in zoom-in-95 duration-100 scrollbar-thin scrollbar-thumb-gray-300">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between cursor-pointer hover:bg-blue-50 hover:text-blue-600 ${
                  String(opt.value) === String(value) ? "bg-blue-50 text-blue-600 font-semibold" : "text-gray-700"
                }`}
              >
                <span className="truncate pr-2">{opt.label}</span>
                {String(opt.value) === String(value) && <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const CLASS_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: `Class ${i + 1}`,
  label: `Class ${i + 1}`,
}));

// Helper to parse array from comma string or array
function parseArrayValue(val) {
  if (Array.isArray(val)) return val;
  if (typeof val === "string" && val.trim()) {
    return val.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function MultiSelectCustomSelect({ options, value = [], onChange, placeholder = "Select sub categories" }) {
  const [open, setOpen] = useState(false);
  const selectedValues = Array.isArray(value) ? value : [];

  function toggleOption(val) {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter((v) => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors bg-white text-left flex items-center justify-between cursor-pointer min-h-[46px]"
      >
        <div className="flex flex-wrap gap-1 items-center max-w-[90%]">
          {selectedValues.length === 0 ? (
            <span className="text-gray-400">{placeholder}</span>
          ) : (
            selectedValues.map((v) => {
              const opt = options.find((o) => String(o.value) === String(v));
              return (
                <span
                  key={v}
                  className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 border border-blue-200"
                >
                  {opt ? opt.label : v}
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleOption(v);
                    }}
                    className="hover:text-blue-900 cursor-pointer font-bold ml-0.5"
                  >
                    ×
                  </span>
                </span>
              );
            })
          )}
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-30 max-h-48 overflow-y-auto py-1 animate-in fade-in zoom-in-95 duration-100 scrollbar-thin scrollbar-thumb-gray-300">
            {options.map((opt) => {
              const isSelected = selectedValues.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleOption(opt.value)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between cursor-pointer hover:bg-blue-50 hover:text-blue-600 ${
                    isSelected ? "bg-blue-50 text-blue-600 font-semibold" : "text-gray-700"
                  }`}
                >
                  <span className="truncate pr-2">{opt.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </>
      )}
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
        short_description: product.short_description || "",
        category_id: product.category_id != null ? String(product.category_id) : (product.category != null ? String(product.category) : ""),
        isbn: product.isbn || "",
        edition: product.edition || "",
        weight: product.weight || "",
        dimension: product.dimension || "",
        stock_status: product.stock_status || "In Stock",
        status: product.status || "",
        is_active: product.is_active ?? true,
        main_image: product.main_image || "",
        side_images: product.side_images ? (Array.isArray(product.side_images) ? product.side_images : [product.side_images]) : [],
        class_: parseArrayValue(product.class_ || product.class),
        sub_categories: parseArrayValue(product.sub_categories),
        delivery_info: product.delivery_info || DEFAULT_DELIVERY_INFO,
        returns_info: product.returns_info || DEFAULT_RETURNS_INFO,
        enable_bulk_pricing: product.enable_bulk_pricing ?? false,
        bulk_pricing: (() => {
          if (!product.bulk_pricing) return [];
          if (Array.isArray(product.bulk_pricing)) return product.bulk_pricing;
          try {
            const parsed = JSON.parse(product.bulk_pricing);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })(),
        discount_type: product.discount_type || (product.has_own_discount ? "own" : (product.use_category_discount ? "category" : "none")),
        own_discount_type: product.own_discount_type || "percentage",
        own_discount_val: product.own_discount_val != null ? String(product.own_discount_val) : (product.own_discount_percentage ? String(product.own_discount_percentage) : ""),
        tags: product.tags || "",
      }
      : {
        name: "",
        author: "",
        mrp: "",
        price: "",
        description: "",
        short_description: "",
        category_id: "",
        isbn: "",
        edition: "",
        weight: "500g",
        dimension: "25cm x 18cm x 2cm",
        stock_status: "In Stock",
        status: "",
        is_active: true,
        main_image: "",
        side_images: [],
        class_: [],
        sub_categories: [],
        delivery_info: DEFAULT_DELIVERY_INFO,
        returns_info: DEFAULT_RETURNS_INFO,
        enable_bulk_pricing: false,
        bulk_pricing: [],
        discount_type: "none",
        own_discount_type: "percentage",
        own_discount_val: "",
        tags: "",
      }
  );

  const [saving, setSaving] = useState(false);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingSide, setUploadingSide] = useState(false);
  const [sessionUploadedImages, setSessionUploadedImages] = useState([]);
  const [error, setError] = useState("");

  async function handleCloseWithCleanup() {
    if (sessionUploadedImages.length > 0) {
      await Promise.all(sessionUploadedImages.map((url) => deleteFromCloudinary(url)));
    }
    onClose();
  }

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ["admin-categories-select"],
    queryFn: async () => {
      const { data } = await api.get("/api/categories/?size=100");
      return data?.results ?? data?.items ?? [];
    },
  });
  const categories = categoriesData || [];

  // Parse all subcategories across categories dynamically
  const subCategorySet = new Set();
  categories.forEach((cat) => {
    const raw = cat.sub_categories || cat.Notes || "";
    raw.split(",").map((s) => s.trim()).filter(Boolean).forEach((s) => subCategorySet.add(s));
  });
  const dynamicSubCategoryOptions = Array.from(subCategorySet).map((s) => ({ value: s, label: s }));

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    let finalVal = type === "checkbox" ? checked : value;

    if (name === "own_discount_val" && form.own_discount_type === "percentage" && finalVal !== "") {
      const num = parseFloat(finalVal);
      if (num > 100) {
        finalVal = "100";
      }
    }

    setForm((f) => ({ ...f, [name]: finalVal }));
  }

  // Cloudinary delete helper using backend API
  async function deleteFromCloudinary(url) {
    if (!url) return;
    setSessionUploadedImages((prev) => prev.filter((u) => u !== url));
    try {
      await api.post("/api/admin/cloudinary/delete", { url });
    } catch (err) {
      console.warn("Could not execute remote Cloudinary deletion:", err);
    }
  }

  // Cloudinary direct upload function
  async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "unsigned_preset");
    formData.append("folder", "review-images");

    const res = await fetch("https://api.cloudinary.com/v1_1/dkxxa3xt0/image/upload", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Image upload failed");
    const data = await res.json();
    const uploadedUrl = data.secure_url;
    setSessionUploadedImages((prev) => [...prev, uploadedUrl]);
    return uploadedUrl;
  }

  async function handleMainImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (form.main_image) {
      toast.error("Main image already uploaded. Remove the existing main image first.");
      e.target.value = "";
      return;
    }

    setUploadingMain(true);
    try {
      const url = await uploadToCloudinary(file);
      setForm((f) => ({ ...f, main_image: url }));
      toast.success("Main image uploaded successfully.");
    } catch (err) {
      toast.error("Failed to upload main image");
    } finally {
      setUploadingMain(false);
      e.target.value = "";
    }
  }

  async function handleSideImagesUpload(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const currentCount = form.side_images?.length || 0;
    const remainingSlots = 3 - currentCount;

    if (remainingSlots <= 0) {
      toast.error("Maximum 3 side images allowed. Remove an existing image before uploading more.");
      e.target.value = "";
      return;
    }

    if (files.length > remainingSlots) {
      toast.error(`You can only select up to ${remainingSlots} side image(s). Please select no more than ${remainingSlots}.`);
      e.target.value = "";
      return;
    }

    const filesToUpload = files;
    setUploadingSide(true);
    try {
      const urls = await Promise.all(filesToUpload.map((file) => uploadToCloudinary(file)));
      setForm((f) => ({ ...f, side_images: [...(f.side_images || []), ...urls] }));
      toast.success("Side images uploaded successfully.");
    } catch (err) {
      toast.error("Failed to upload side images");
    } finally {
      setUploadingSide(false);
      e.target.value = "";
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.class_ || form.class_.length === 0) {
      setError("Please select at least one Class.");
      return;
    }
    if (!form.weight || !form.weight.trim()) {
      setError("Weight is required.");
      return;
    }
    if (!form.dimension || !form.dimension.trim()) {
      setError("Dimension is required.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const mrpVal = form.mrp !== "" ? Number(form.mrp) : 0;
      let finalHasOwnDiscount = false;
      let finalOwnDiscountType = form.own_discount_type;
      let finalOwnDiscountVal = form.own_discount_val !== "" ? Number(form.own_discount_val) : 0;
      let finalOwnDiscountPct = 0;
      let finalUseCategoryDiscount = false;

      if (form.discount_type === "category") {
        finalUseCategoryDiscount = true;
      } else if (form.discount_type === "own") {
        finalHasOwnDiscount = true;
        if (form.own_discount_type === "percentage") {
          finalOwnDiscountPct = Math.round(finalOwnDiscountVal);
        } else if (mrpVal > 0) {
          finalOwnDiscountPct = Math.min(100, Math.round((finalOwnDiscountVal / mrpVal) * 100));
        }
      }

      // Clean up bulk pricing array
      const validBulkTiers = (form.bulk_pricing || [])
        .filter((t) => t.min_qty && t.price && !isNaN(t.min_qty) && !isNaN(t.price))
        .map((t) => ({ min_qty: Number(t.min_qty), price: Number(t.price) }));

      const payload = {
        name: form.name,
        author: form.author,
        isbn: form.isbn,
        edition: form.edition,
        mrp: form.mrp !== "" ? Number(form.mrp) : null,
        category_id: form.category_id !== "" ? Number(form.category_id) : null,
        stock_status: form.stock_status,
        status: form.status,
        weight: form.weight?.trim() || "500g",
        dimension: form.dimension?.trim() || "25cm x 18cm x 2cm",
        short_description: form.short_description,
        description: form.description,
        delivery_info: form.delivery_info,
        returns_info: form.returns_info,
        enable_bulk_pricing: form.enable_bulk_pricing,
        bulk_pricing: form.enable_bulk_pricing ? JSON.stringify(validBulkTiers) : "[]",
        discount_type: form.discount_type,
        has_own_discount: finalHasOwnDiscount,
        own_discount_type: finalOwnDiscountType,
        own_discount_val: finalOwnDiscountVal,
        own_discount_percentage: finalOwnDiscountPct,
        use_category_discount: finalUseCategoryDiscount,
        tags: form.tags,
        is_active: form.is_active,
        main_image: form.main_image,
        side_images: form.side_images,
        class_: Array.isArray(form.class_) ? form.class_.join(", ") : form.class_,
        sub_categories: Array.isArray(form.sub_categories) ? form.sub_categories.join(", ") : form.sub_categories,
      };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg border border-gray-200 shadow-lg w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEdit ? "Edit Product" : "Create New Product"}
          </h2>
          <button
            type="button"
            onClick={handleCloseWithCleanup}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-6 bg-white text-left">
          {error && (
            <div className="text-red-700 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3 font-medium">
              {error}
            </div>
          )}

          {/* Product Name & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Enter product name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category (Optional)</label>
              <CustomSelect
                options={[
                  { value: "", label: "Select a category" },
                  ...categories.map((c) => ({
                    value: c.id,
                    label: c.name || c.Name || `Category ${c.id}`,
                  })),
                ]}
                value={form.category_id}
                onChange={(val) => setForm((f) => ({ ...f, category_id: val }))}
                placeholder="Select a category"
              />
            </div>
          </div>

          {/* Sub Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sub Categories 
            </label>
            <MultiSelectCustomSelect
              options={dynamicSubCategoryOptions}
              value={form.sub_categories || []}
              onChange={(vals) => setForm((f) => ({ ...f, sub_categories: vals }))}
              placeholder="Select sub categories"
            />
          </div>

          {/* Target Classes & Stock Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Classes <span className="text-red-500">*</span>
              </label>
              <MultiSelectCustomSelect
                options={CLASS_OPTIONS}
                value={form.class_ || []}
                onChange={(vals) => setForm((f) => ({ ...f, class_: vals }))}
                placeholder="Select classes (e.g., Class 10, Class 12)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <CustomSelect
                options={[
                  { value: "In Stock", label: "In Stock" },
                  { value: "Out of Stock", label: "Out of Stock" },
                  { value: "On Sale", label: "On Sale" },
                  { value: "Featured", label: "Featured" },
                  { value: "On Backorders", label: "On Backorders" },
                ]}
                value={form.stock_status}
                onChange={(val) => setForm((f) => ({ ...f, stock_status: val }))}
                placeholder="Select status"
              />
            </div>
          </div>

          {/* Images Upload Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Main Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Main Image (Optional)</label>
              <div className="space-y-3">
                <label
                  onClick={(e) => {
                    if (form.main_image) {
                      e.preventDefault();
                      toast.error("Main image already uploaded. Remove the existing main image first.");
                    }
                  }}
                  className="w-full px-4 py-8 border-2 border-dashed rounded-lg transition-all cursor-pointer border-gray-300 hover:border-gray-400 bg-white flex flex-col items-center justify-center"
                >
                  <Upload className="w-8 h-8 mb-2 text-gray-400" aria-hidden="true" />
                  <span className="text-sm font-medium text-gray-600">
                    {uploadingMain ? "Uploading image..." : "Drag & drop or click to upload"}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">Main product image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleMainImageUpload}
                    className="hidden"
                  />
                </label>
                {form.main_image && (
                  <div className="relative group w-24 h-24 rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
                    <img
                      src={form.main_image}
                      alt="Main Product Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        deleteFromCloudinary(form.main_image);
                        const updatedImage = "";
                        setForm((f) => ({ ...f, main_image: updatedImage }));
                        if (isEdit && product?.id) {
                          try {
                            await adminUpdateProduct(product.id, { main_image: updatedImage });
                            toast.success("Main image removed from database.");
                          } catch {
                            toast.error("Failed to update database.");
                          }
                        }
                      }}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold hover:bg-red-600 shadow-md transition-colors cursor-pointer"
                      title="Remove image"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Side Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Side Images (up to 3)</label>
              <div className="space-y-3">
                <label
                  onClick={(e) => {
                    if ((form.side_images?.length || 0) >= 3) {
                      e.preventDefault();
                      toast.error("Maximum 3 side images allowed. Remove an existing image before uploading more.");
                    }
                  }}
                  className="w-full px-4 py-8 border-2 border-dashed rounded-lg transition-all cursor-pointer border-gray-300 hover:border-gray-400 bg-white flex flex-col items-center justify-center"
                >
                  <Upload className="w-8 h-8 mb-2 text-gray-400" aria-hidden="true" />
                  <span className="text-sm font-medium text-gray-600">
                    {uploadingSide ? "Uploading images..." : "Drag & drop or click to upload"}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">Up to 3 additional images</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleSideImagesUpload}
                    className="hidden"
                  />
                </label>
                {form.side_images?.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {form.side_images.map((img, idx) => (
                      <div key={idx} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
                        <img
                          src={img}
                          alt={`Side Image ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            deleteFromCloudinary(img);
                            const updatedSideImages = form.side_images.filter((_, i) => i !== idx);
                            setForm((f) => ({ ...f, side_images: updatedSideImages }));
                            if (isEdit && product?.id) {
                              try {
                                await adminUpdateProduct(product.id, { side_images: updatedSideImages });
                                toast.success("Side image removed from database.");
                              } catch {
                                toast.error("Failed to update database.");
                              }
                            }
                          }}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold hover:bg-red-600 shadow-md transition-colors cursor-pointer"
                          title="Remove image"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Author, ISBN, Edition */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Author</label>
              <input
                type="text"
                name="author"
                value={form.author}
                onChange={handleChange}
                placeholder="Enter author name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ISBN</label>
              <input
                type="text"
                name="isbn"
                value={form.isbn}
                onChange={handleChange}
                placeholder="Enter ISBN"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Edition</label>
              <input
                type="text"
                name="edition"
                value={form.edition}
                onChange={handleChange}
                placeholder="Enter edition"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
              />
            </div>
          </div>

          {/* MRP */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              MRP <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="mrp"
              step="0.01"
              min="0"
              value={form.mrp}
              onChange={handleChange}
              placeholder="Enter MRP"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
            />
          </div>

          {/* Weight & Dimension */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="weight"
                value={form.weight}
                onChange={handleChange}
                required
                placeholder="e.g., 500g, 1.2kg"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dimension <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="dimension"
                value={form.dimension}
                onChange={handleChange}
                required
                placeholder="e.g., 25cm x 18cm x 2cm"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
              />
            </div>
          </div>

          {/* Descriptions & Global Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Short Description</label>
              <textarea
                name="short_description"
                value={form.short_description}
                onChange={handleChange}
                rows={2}
                placeholder="Brief product description (1-2 lines)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                placeholder="Detailed product description"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Information</label>
              <textarea
                name="delivery_info"
                value={form.delivery_info}
                onChange={handleChange}
                rows={4}
                placeholder="Delivery terms, estimated time, etc."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors text-xs leading-relaxed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Returns Information</label>
              <textarea
                name="returns_info"
                value={form.returns_info}
                onChange={handleChange}
                rows={5}
                placeholder="Return policy, conditions, etc."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors text-xs leading-relaxed"
              />
            </div>
          </div>

          {/* Bulk Pricing */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="enable_bulk_pricing"
                id="enable_bulk_pricing"
                checked={form.enable_bulk_pricing}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="enable_bulk_pricing" className="text-sm font-semibold text-gray-800 cursor-pointer">
                Enable Bulk Pricing
              </label>
            </div>

            {form.enable_bulk_pricing && (
              <div className="space-y-3 pt-2">
                <p className="text-xs text-gray-500">
                  Set volume price tiers (min quantity and bulk unit price). When a customer orders at or above the tier quantity, this price overrides any product/category discount.
                </p>
                <div className="space-y-2">
                  {(form.bulk_pricing || []).map((tier, idx) => (
                    <div key={idx} className="flex items-center space-x-3">
                      <div className="w-1/2">
                        <input
                          type="number"
                          min="1"
                          placeholder="Min Quantity (e.g. 5)"
                          value={tier.min_qty}
                          onChange={(e) => {
                            const val = e.target.value;
                            setForm((f) => {
                              const updated = [...(f.bulk_pricing || [])];
                              updated[idx] = { ...updated[idx], min_qty: val };
                              return { ...f, bulk_pricing: updated };
                            });
                          }}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                      </div>
                      <div className="w-1/2">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="Bulk Unit Price (₹)"
                          value={tier.price}
                          onChange={(e) => {
                            const val = e.target.value;
                            setForm((f) => {
                              const updated = [...(f.bulk_pricing || [])];
                              updated[idx] = { ...updated[idx], price: val };
                              return { ...f, bulk_pricing: updated };
                            });
                          }}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setForm((f) => ({
                            ...f,
                            bulk_pricing: (f.bulk_pricing || []).filter((_, i) => i !== idx),
                          }));
                        }}
                        className="text-red-500 hover:text-red-700 text-lg font-bold px-2 py-1"
                        title="Remove Tier"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setForm((f) => ({
                      ...f,
                      bulk_pricing: [...(f.bulk_pricing || []), { min_qty: "", price: "" }],
                    }));
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-1"
                >
                  + Add Bulk Pricing Tier
                </button>
              </div>
            )}
          </div>

          {/* Discount Settings */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800">Discount Settings</h3>
            
            <div className="space-y-3">
              {/* Option 1: No Discount */}
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="no_discount"
                  name="discount_type"
                  value="none"
                  checked={form.discount_type === "none"}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="no_discount" className="text-sm font-medium text-gray-700 cursor-pointer">
                  No Discount
                </label>
              </div>

              {/* Option 2: Use Category Discount */}
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="use_category_discount"
                  name="discount_type"
                  value="category"
                  checked={form.discount_type === "category"}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="use_category_discount" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Use Category Discount (if available)
                </label>
              </div>

              {/* Option 3: Product Has Own Discount */}
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="has_own_discount"
                  name="discount_type"
                  value="own"
                  checked={form.discount_type === "own"}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="has_own_discount" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Product Has Own Discount
                </label>
              </div>
            </div>

            {/* Sub-UI for Product Has Own Discount */}
            {form.discount_type === "own" && (
              <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200 space-y-3 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Discount Type</label>
                    <CustomSelect
                      options={[
                        { value: "percentage", label: "Percentage (%)" },
                        { value: "flat", label: "Flat Amount (₹)" },
                      ]}
                      value={form.own_discount_type}
                      onChange={(val) =>
                        setForm((f) => {
                          let nextVal = f.own_discount_val;
                          if (val === "percentage" && nextVal !== "" && parseFloat(nextVal) > 100) {
                            nextVal = "100";
                          }
                          return { ...f, own_discount_type: val, own_discount_val: nextVal };
                        })
                      }
                      placeholder="Select discount type"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {form.own_discount_type === "percentage" ? "Percentage Value (%)" : "Flat Amount Value (₹)"}
                    </label>
                    <input
                      type="number"
                      name="own_discount_val"
                      min="0"
                      max={form.own_discount_type === "percentage" ? "100" : undefined}
                      step="any"
                      value={form.own_discount_val}
                      onChange={handleChange}
                      placeholder={form.own_discount_type === "percentage" ? "e.g. 15" : "e.g. 50"}
                      className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Price Preview Box */}
            {(() => {
              const mrpNum = parseFloat(form.mrp) || 0;
              let computedDiscount = 0;
              let discountText = "";

              if (mrpNum > 0) {
                if (form.discount_type === "category") {
                  const selCat = (categoriesData || []).find((c) => String(c.id) === String(form.category_id));
                  if (selCat) {
                    const offerType = selCat.offer_type || "none";
                    if (offerType === "percentage" && selCat.offer_percentage > 0) {
                      computedDiscount = Math.round((mrpNum * selCat.offer_percentage) / 100);
                      discountText = `Category Discount (${selCat.name}: ${selCat.offer_percentage}%)`;
                    } else if (offerType === "flat" && selCat.offer_amount > 0) {
                      computedDiscount = Math.min(selCat.offer_amount, mrpNum);
                      discountText = `Category Flat Discount (${selCat.name}: ₹${selCat.offer_amount})`;
                    } else {
                      discountText = `Category "${selCat.name}" has no active offer`;
                    }
                  } else {
                    discountText = "Select a Category above to see its offer";
                  }
                } else if (form.discount_type === "own") {
                  const valNum = parseFloat(form.own_discount_val) || 0;
                  if (valNum > 0) {
                    if (form.own_discount_type === "percentage") {
                      computedDiscount = Math.round((mrpNum * valNum) / 100);
                      discountText = `Own Discount (${valNum}%)`;
                    } else {
                      computedDiscount = Math.min(valNum, mrpNum);
                      discountText = `Own Flat Discount (₹${valNum})`;
                    }
                  }
                }
              }

              const finalPrice = Math.max(0, mrpNum - computedDiscount);

              return (
                <div className="pt-3 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between text-sm gap-2">
                  <div className="text-gray-600">
                    {discountText ? (
                      <span className="font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded">
                        Applied: {discountText} (-₹{computedDiscount})
                      </span>
                    ) : (
                      <span className="text-gray-500">No discount applied</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600 font-medium">Final Selling Price:</span>
                    <span className="text-lg font-bold text-green-700">₹{finalPrice.toFixed(0)}</span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
            <input
              type="text"
              name="tags"
              value={form.tags}
              onChange={handleChange}
              placeholder="e.g. CBSE, 12th, Science"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCloseWithCleanup}
              className="px-6 py-3 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-lg font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Saving..." : "Save Product"}
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

  const params = { page, size: PAGE_SIZE, order_by: "-id" };
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
        name: product.name ? `${product.name} (clone)` : "(clone)",
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
    <div className="lg:p-8">
      <h2 className="text-2xl font-semibold text-gray-900 mb-8 mt-[20px] sm:mt-0">Products</h2>

      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">

          {/* Top Actions */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={openAdd}
              className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors duration-200 bg-blue-600 hover:bg-blue-700 text-white text-sm cursor-pointer"
            >
              <Plus className="w-5 h-5 mr-2" aria-hidden="true" />
              Add Product
            </button>
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200">
            {/* Card Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-xl font-semibold text-gray-900">All Products</h2>
                <div className="flex items-center gap-3 flex-wrap justify-end">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" aria-hidden="true" />
                    <input
                      type="text"
                      placeholder="Search products..."
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
                  {/* Status filters */}
                  <div className="relative">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-gray-700 cursor-pointer bg-white"
                    >
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  {(search || status || activeFilter) && (
                    <button
                      onClick={() => { setSearch(""); setStatus(""); setActiveFilter(""); }}
                      className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                    >
                      Clear
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
                    <th className="px-4 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider w-16">S.No</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Product Details</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Sub-Category &amp; Classes</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Price &amp; Status</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Details</th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading
                    ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-4 py-4"><div className="h-4 w-6 bg-gray-200 rounded" /></td>
                        <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-12 h-12 bg-gray-200 rounded-lg" /><div className="space-y-1"><div className="h-4 w-40 bg-gray-200 rounded" /><div className="h-3 w-28 bg-gray-100 rounded" /></div></div></td>
                        <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-200 rounded" /></td>
                        <td className="px-6 py-4"><div className="h-5 w-16 bg-gray-200 rounded-full" /></td>
                        <td className="px-6 py-4"><div className="h-4 w-16 bg-gray-200 rounded" /></td>
                        <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-200 rounded" /></td>
                        <td className="px-6 py-4 text-right"><div className="h-5 w-20 bg-gray-200 rounded ml-auto" /></td>
                      </tr>
                    ))
                    : products.length === 0
                      ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-16 text-center text-gray-400 text-sm">
                            No products found.
                          </td>
                        </tr>
                      )
                      : products.map((product, index) => {
                        // Parse sub_categories JSON
                        let subCats = [];
                        try {
                          const raw = product.sub_categories;
                          if (Array.isArray(raw)) subCats = raw;
                          else if (typeof raw === "string" && raw) subCats = JSON.parse(raw);
                        } catch { }

                        const classLabel = product.class_ || product.class || "";
                        const offerPct = product.offer_percentage;
                        const stockIn = (product.stock_status || "in_stock") === "in_stock";
                        const sno = (page - 1) * PAGE_SIZE + index + 1;

                        return (
                          <tr
                            key={product.id}
                            onClick={() => router.push(`/admin/products/${product.id}`)}
                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            {/* Serial Number */}
                            <td className="px-4 py-4 text-sm font-medium text-gray-500">
                              {sno}
                            </td>

                            {/* Product Details */}
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                {product.main_image ? (
                                  <img
                                    src={product.main_image}
                                    alt={product.name}
                                    className="w-12 h-12 object-cover rounded-lg border"
                                  />
                                ) : (
                                  <div className="w-12 h-12 bg-gray-100 rounded-lg border flex items-center justify-center text-gray-400">
                                    <BookOpen className="w-5 h-5" />
                                  </div>
                                )}
                                 <div>
                                   <div className="relative group/title max-w-[200px]">
                                     <h3
                                       className="text-sm font-medium text-gray-900 truncate cursor-pointer"
                                       title={product.name}
                                     >
                                       {product.name || "—"}
                                     </h3>
                                     {product.name && product.name.length > 25 && (
                                       <div className="absolute left-0 bottom-full mb-1 hidden group-hover/title:block z-30 bg-gray-900 text-white text-xs rounded-md py-1 px-2.5 shadow-lg whitespace-normal max-w-xs pointer-events-none transition-opacity duration-150">
                                         {product.name}
                                       </div>
                                     )}
                                   </div>
                                   {product.author && (
                                     <p className="text-sm text-gray-500">by {product.author}</p>
                                   )}
                                   {product.isbn && (
                                     <p className="text-xs text-gray-400">ISBN: {product.isbn}</p>
                                   )}
                                 </div>
                               </div>
                             </td>

                            {/* Category */}
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-900">
                                {product.category_name || product.category || "—"}
                              </span>
                            </td>

                            {/* Sub-Category & Classes */}
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                {subCats.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {subCats.slice(0, 2).map((sc, idx) => (
                                      <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {typeof sc === "object" ? (sc.name || sc.label || JSON.stringify(sc)) : sc}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {classLabel && (
                                  <div className="flex flex-wrap gap-1">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      {classLabel}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Price & Status */}
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-1">
                                  <span className="text-sm font-medium text-gray-900">
                                    ₹ {Number(product.price || 0).toFixed(0)}
                                  </span>
                                </div>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stockIn ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                  }`}>
                                  {stockIn ? "In Stock" : "Out of Stock"}
                                </span>
                                {offerPct && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600">
                                    {offerPct}% OFF
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Details */}
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-500 space-y-1">
                                {product.edition && <div>Edition: {product.edition}</div>}
                                {product.weight && <div>Weight: {product.weight}</div>}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={(e) => openEdit(e, product)}
                                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                  title="Edit product"
                                >
                                  <Pen className="w-4 h-4" aria-hidden="true" />
                                </button>
                                <button
                                  onClick={(e) => handleDuplicate(e, product)}
                                  disabled={duplicatingId === product.id}
                                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                  title="Clone product"
                                >
                                  {duplicatingId === product.id ? (
                                    <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Copy className="w-4 h-4" aria-hidden="true" />
                                  )}
                                </button>
                                <button
                                  onClick={(e) => handleDelete(e, product)}
                                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                  title="Delete product"
                                >
                                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-500">
                Page <span className="font-semibold text-gray-900">{page}</span> of{" "}
                <span className="font-semibold text-gray-900">{totalPages}</span> &mdash; {count.toLocaleString()} products
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="inline-flex items-center gap-1 px-4 py-2 border border-gray-300 bg-white rounded-lg text-sm font-medium text-gray-700 disabled:opacity-40 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="inline-flex items-center gap-1 px-4 py-2 border border-gray-300 bg-white rounded-lg text-sm font-medium text-gray-700 disabled:opacity-40 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

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
          message={`Are you sure you want to delete "${deleteTarget.name}"? This catalog entry will be permanently removed.`}
          confirmLabel="Delete"
          loading={deleteLoading}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

