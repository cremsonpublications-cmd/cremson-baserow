"use client";

export const dynamic = "force-static";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "../../../lib/api/axios";
import {
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  adminReorderProducts,
} from "../../../lib/api/admin";
import ConfirmModal from "../components/ConfirmModal";
import BlogEditor from "../components/BlogEditor";
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
  Upload,
  Download,
  GripVertical,
  Save,
  RefreshCw,
  ArrowUpDown,
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
  sku: "",
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

function CustomSelect({ options, value, onChange, placeholder = "Select an option", disabled = false }) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`w-full px-4 py-3 border border-gray-300 rounded-lg outline-none transition-colors text-left flex items-center justify-between ${
          disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
        }`}
      >
        <span className={selectedOption ? (disabled ? "text-gray-400 font-medium" : "text-gray-900 font-medium") : "text-gray-400"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {!disabled && open && (
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

function MultiSelectCustomSelect({ options, value = [], onChange, placeholder = "Select sub categories", disabled = false }) {
  const [open, setOpen] = useState(false);
  const selectedValues = Array.isArray(value) ? value : [];

  function toggleOption(val) {
    if (disabled) return;
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
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`w-full px-4 py-3 border border-gray-300 rounded-lg outline-none transition-colors text-left flex items-center justify-between min-h-[46px] ${
          disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
        }`}
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
                  className={`text-xs font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 border ${
                    disabled ? "bg-gray-200 text-gray-500 border-gray-300" : "bg-blue-50 text-blue-700 border-blue-200"
                  }`}
                >
                  {opt ? opt.label : v}
                  {!disabled && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleOption(v);
                      }}
                      className="hover:text-blue-900 cursor-pointer font-bold ml-0.5"
                    >
                      ×
                    </span>
                  )}
                </span>
              );
            })
          )}
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {!disabled && open && (
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
  const [isDraggingMain, setIsDraggingMain] = useState(false);
  const [isDraggingSide, setIsDraggingSide] = useState(false);

  let initialComboProducts = [];
  const rawCombo = product?.combo_product_ids || product?.combo_products;
  if (rawCombo) {
    try {
      initialComboProducts = typeof rawCombo === "string" ? JSON.parse(rawCombo) : rawCombo;
    } catch {
      initialComboProducts = String(rawCombo).split(",").map((s) => s.trim()).filter(Boolean);
    }
  }

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
        sku: product.sku || "",
        edition: product.edition || "",
        weight: product.weight || "",
        dimension: product.dimension || "",
        stock_status: (() => {
          let val = product.stock_status;
          if (val && typeof val === "object") val = val.value;
          if (!val) return "in_stock";
          const s = String(val).toLowerCase().replace(/\s+/g, "_");
          if (s.includes("out") || s === "out_of_stock") return "out_of_stock";
          if (s.includes("backorder") || s === "on_backorders") return "on_backorders";
          return "in_stock";
        })(),
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
        is_combo: product.is_combo ?? (Array.isArray(initialComboProducts) && initialComboProducts.length > 0),
        combo_products: Array.isArray(initialComboProducts) ? initialComboProducts.map(String) : [],
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
        sku: "",
        edition: "",
        weight: "0.5kg",
        dimension: "25cm x 18cm x 2cm",
        stock_status: "in_stock",
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
        is_combo: false,
        combo_products: [],
      }
  );

  function parseDimension(dimStr) {
    if (!dimStr) return { length: "", width: "", height: "" };
    const s = String(dimStr).toLowerCase().trim();
    const parts = s.split(/[,x*\s]+/).filter(Boolean);
    const nums = [];
    for (const part of parts) {
      const match = part.match(/([0-9]+(?:\.[0-9]+)?)/);
      if (match) {
        nums.push(match[1]);
      }
    }
    return {
      length: nums[0] || "",
      width: nums[1] || "",
      height: nums[2] || "",
    };
  }

  const initialDim = parseDimension(isEdit ? (product?.dimension || "") : "25cm x 18cm x 2cm");
  const [dimLength, setDimLength] = useState(initialDim.length);
  const [dimWidth, setDimWidth] = useState(initialDim.width);
  const [dimHeight, setDimHeight] = useState(initialDim.height);

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

    if (!form.name || !form.name.trim()) {
      setError("Product Name is required.");
      return;
    }
    if (!form.class_ || form.class_.length === 0) {
      setError("Please select at least one Class.");
      return;
    }
    if (!form.weight || !form.weight.trim()) {
      setError("Weight is required.");
      return;
    }
    if (!form.is_combo && (!dimLength?.trim() || !dimWidth?.trim() || !dimHeight?.trim())) {
      setError("All three dimensions (Length, Width, Height) are required.");
      return;
    }
    if (!form.mrp || form.mrp === "") {
      setError("MRP is required.");
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

      let productName = form.name?.trim();
      if (form.is_combo && !productName) {
        productName = "Combo Product";
      }

      const formattedDim = (dimLength?.trim() && dimWidth?.trim() && dimHeight?.trim())
        ? `${dimLength.trim()}cm x ${dimWidth.trim()}cm x ${dimHeight.trim()}cm`
        : (form.dimension?.trim() || "25cm x 18cm x 2cm");

      const payload = {
        name: productName,
        author: form.author || null,
        isbn: form.isbn?.trim() ? form.isbn.trim() : null,
        sku: form.sku?.trim() ? form.sku.trim() : null,
        edition: form.edition?.trim() ? form.edition.trim() : null,
        mrp: form.mrp !== "" ? Number(form.mrp) : null,
        category_id: form.category_id !== "" ? Number(form.category_id) : null,
        stock_status: form.stock_status,
        status: form.status,
        weight: form.weight?.trim() || "0.5kg",
        dimension: formattedDim,
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
        class_: Array.isArray(form.class_) && form.class_.length > 0 ? form.class_.join(", ") : (form.is_combo ? "Class 10" : form.class_),
        sub_categories: Array.isArray(form.sub_categories) ? form.sub_categories.join(", ") : form.sub_categories,
        is_combo: form.is_combo,
        combo_product_ids: form.is_combo && form.combo_products.length > 0 ? JSON.stringify(form.combo_products.map(String)) : "[]",
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

          {/* Standard Product Fields */}
          <div className="space-y-6">
            
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Classes {!form.is_combo && <span className="text-red-500">*</span>}
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
                    { value: "in_stock", label: "In Stock" },
                    { value: "out_of_stock", label: "Out of Stock" },
                    { value: "on_sale", label: "On Sale" },
                    { value: "featured", label: "Featured" },
                    { value: "on_backorders", label: "On Backorders" },
                  ]}
                  value={form.stock_status}
                  onChange={(val) => setForm((f) => ({ ...f, stock_status: val }))}
                  placeholder="Select status"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Visibility Status</label>
                <div className="flex items-center mt-3">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                    className={`${
                      form.is_active ? "bg-purple-600" : "bg-gray-200"
                    } relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2`}
                  >
                    <span
                      aria-hidden="true"
                      className={`${
                        form.is_active ? "translate-x-5" : "translate-x-0"
                      } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out`}
                    />
                  </button>
                  <span className="ml-3 text-sm font-semibold text-gray-800">
                    {form.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>

            {/* Images Upload Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Main Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Main Image (Optional)</label>
                <div className="space-y-3">
                  {!form.main_image && (
                    <label
                      onClick={(e) => {
                        if (form.main_image) {
                          e.preventDefault();
                          toast.error("Main image already uploaded. Remove the existing main image first.");
                        }
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (!form.main_image) setIsDraggingMain(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setIsDraggingMain(false);
                      }}
                      onDrop={async (e) => {
                        e.preventDefault();
                        setIsDraggingMain(false);
                        if (form.main_image) {
                          toast.error("Main image already uploaded. Remove the existing main image first.");
                          return;
                        }
                        const file = e.dataTransfer.files?.[0];
                        if (!file) return;
                        if (!file.type.startsWith("image/")) {
                          toast.error("Please upload an image file.");
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
                        }
                      }}
                      className={`w-full px-4 py-8 border-2 border-dashed rounded-lg transition-colors bg-white flex flex-col items-center justify-center cursor-pointer ${
                        isDraggingMain ? "border-purple-500 bg-purple-50/20" : "border-gray-300 hover:border-gray-400"
                      }`}
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
                  )}
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
                  {(form.side_images?.length || 0) < 3 && (
                    <label
                      onClick={(e) => {
                        if ((form.side_images?.length || 0) >= 3) {
                          e.preventDefault();
                          toast.error("Maximum 3 side images allowed. Remove an existing image before uploading more.");
                        }
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if ((form.side_images?.length || 0) < 3) setIsDraggingSide(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setIsDraggingSide(false);
                      }}
                      onDrop={async (e) => {
                        e.preventDefault();
                        setIsDraggingSide(false);
                        const currentCount = form.side_images?.length || 0;
                        const remainingSlots = 3 - currentCount;
                        if (remainingSlots <= 0) {
                          toast.error("Maximum 3 side images allowed. Remove an existing image before uploading more.");
                          return;
                        }
                        const files = Array.from(e.dataTransfer.files || []);
                        const imageFiles = files.filter(f => f.type.startsWith("image/"));
                        if (imageFiles.length === 0) return;
                        if (imageFiles.length > remainingSlots) {
                          toast.error(`You can only select up to ${remainingSlots} side image(s). Please select no more than ${remainingSlots}.`);
                          return;
                        }
                        setUploadingSide(true);
                        try {
                          const urls = await Promise.all(imageFiles.map((file) => uploadToCloudinary(file)));
                          setForm((f) => ({ ...f, side_images: [...(f.side_images || []), ...urls] }));
                          toast.success("Side images uploaded successfully.");
                        } catch (err) {
                          toast.error("Failed to upload side images");
                        } finally {
                          setUploadingSide(false);
                        }
                      }}
                      className={`w-full px-4 py-8 border-2 border-dashed rounded-lg transition-colors bg-white flex flex-col items-center justify-center cursor-pointer ${
                        isDraggingSide ? "border-purple-500 bg-purple-50/20" : "border-gray-300 hover:border-gray-400"
                      }`}
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
                  )}
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

            {/* Author, ISBN, Edition (Disabled for Combo Products) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Author {form.is_combo && <span className="text-xs text-gray-400">(Not applicable)</span>}
                </label>
                <input
                  type="text"
                  name="author"
                  value={form.author}
                  onChange={handleChange}
                  disabled={form.is_combo}
                  placeholder="Enter author name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ISBN {form.is_combo && <span className="text-xs text-gray-400">(Not applicable)</span>}
                </label>
                <input
                  type="text"
                  name="isbn"
                  value={form.isbn}
                  onChange={handleChange}
                  disabled={form.is_combo}
                  placeholder="Enter ISBN"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SKU {form.is_combo && <span className="text-xs text-gray-400">(Not applicable)</span>}
                </label>
                <input
                  type="text"
                  name="sku"
                  value={form.sku || ""}
                  onChange={handleChange}
                  disabled={form.is_combo}
                  placeholder="Enter SKU"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Edition {form.is_combo && <span className="text-xs text-gray-400">(Not applicable)</span>}
                </label>
                <input
                  type="text"
                  name="edition"
                  value={form.edition}
                  onChange={handleChange}
                  disabled={form.is_combo}
                  placeholder="Enter edition"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
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
                required
                placeholder="Enter MRP"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
              />
            </div>

            {/* Weight & Dimension */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight (kg) {!form.is_combo && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  name="weight"
                  value={form.weight}
                  onChange={handleChange}
                  required={!form.is_combo}
                  placeholder="e.g., 0.5 or 0.5kg"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors disabled:bg-gray-100 disabled:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dimensions (L × W × H) (cm) {!form.is_combo && <span className="text-red-500">*</span>}
                </label>
                <div className="grid grid-cols-3 gap-2 items-center">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Length"
                      value={dimLength}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDimLength(val);
                        setForm((f) => ({ ...f, dimension: `${val}cm x ${dimWidth}cm x ${dimHeight}cm` }));
                      }}
                      required={!form.is_combo}
                      className="w-full pl-3 pr-7 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm font-medium"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none">cm</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Width"
                      value={dimWidth}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDimWidth(val);
                        setForm((f) => ({ ...f, dimension: `${dimLength}cm x ${val}cm x ${dimHeight}cm` }));
                      }}
                      required={!form.is_combo}
                      className="w-full pl-3 pr-7 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm font-medium"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none">cm</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Height"
                      value={dimHeight}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDimHeight(val);
                        setForm((f) => ({ ...f, dimension: `${dimLength}cm x ${dimWidth}cm x ${val}cm` }));
                      }}
                      required={!form.is_combo}
                      className="w-full pl-3 pr-7 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm font-medium"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none">cm</span>
                  </div>
                </div>
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors disabled:bg-gray-100 disabled:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Description</label>
                <BlogEditor
                  markdown={form.description}
                  onChange={(val) => setForm((f) => ({ ...f, description: val }))}
                  placeholder="Detailed product description"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors text-xs leading-relaxed disabled:bg-gray-100 disabled:text-gray-400"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors text-xs leading-relaxed disabled:bg-gray-100 disabled:text-gray-400"
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
                        disabled={form.is_combo}
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors disabled:bg-gray-100 disabled:text-gray-400"
              />
            </div>

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

function extractPriceNumber(val) {
  if (val == null || val === "") return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  if (typeof val === "string") {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  }
  if (typeof val === "object") {
    if (val.mrp != null) return extractPriceNumber(val.mrp);
    if (val.price != null) return extractPriceNumber(val.price);
    if (val.value != null) return extractPriceNumber(val.value);
    if (val.amount != null) return extractPriceNumber(val.amount);
  }
  return 0;
}

function extractPriceDisplay(val) {
  const num = extractPriceNumber(val);
  return num > 0 ? String(num) : (typeof val === "string" ? val : "0");
}

function ComboModal({ product, onClose, onSaved }) {
  const isEdit = Boolean(product);
  const [isDraggingMain, setIsDraggingMain] = useState(false);

  let initialComboProducts = parseComboIds(product);

  let initialClass = [];
  if (product?.class_ || product?.class) {
    const rawClass = product.class_ || product.class;
    if (Array.isArray(rawClass)) initialClass = rawClass;
    else if (typeof rawClass === "string") initialClass = rawClass.split(",").map((s) => s.trim()).filter(Boolean);
  }

  const [form, setForm] = useState(
    isEdit
      ? {
          name: typeof product?.name === "object" ? (product.name?.value || product.name?.name || "") : (product?.name || ""),
          mrp: product?.mrp != null ? extractPriceDisplay(product.mrp) : "",
          price: product?.price != null ? extractPriceDisplay(product.price) : "",
          description: typeof product?.description === "object" ? (product.description?.value || "") : (product?.description || ""),
          short_description: typeof product?.short_description === "object" ? (product.short_description?.value || "") : (product?.short_description || ""),
          category_id: product?.category_id != null ? (typeof product.category_id === "object" ? String(product.category_id?.id || product.category_id?.value || "") : String(product.category_id)) : "",
          stock_status: (() => {
            let val = product?.stock_status;
            if (val && typeof val === "object") val = val.value;
            if (!val) return "in_stock";
            const s = String(val).toLowerCase().replace(/\s+/g, "_");
            if (s.includes("out") || s === "out_of_stock") return "out_of_stock";
            if (s.includes("backorder") || s === "on_backorders") return "on_backorders";
            return "in_stock";
          })(),
          status: product?.status || "",
          is_active: product?.is_active ?? true,
          main_image: product?.main_image || "",
          side_images: Array.isArray(product?.side_images) ? product.side_images : [],
          class_: initialClass,
          discount_type: product?.discount_type || (product?.has_own_discount ? "own" : product?.use_category_discount ? "category" : "none"),
          own_discount_type: product?.own_discount_type || "percentage",
          own_discount_val: product?.own_discount_val != null ? extractPriceDisplay(product.own_discount_val) : "",
          combo_products: initialComboProducts,
        }
      : {
          name: "",
          mrp: "",
          price: "",
          description: "",
          short_description: "",
          category_id: "",
          stock_status: "in_stock",
          status: "",
          is_active: true,
          main_image: "",
          side_images: [],
          class_: [],
          discount_type: "none",
          own_discount_type: "percentage",
          own_discount_val: "",
          combo_products: [],
        }
  );

  const [comboFilter, setComboFilter] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [sessionUploadedImages, setSessionUploadedImages] = useState([]);
  const [error, setError] = useState("");

  const { data: selectProductsData, isLoading: loadingProducts } = useQuery({
    queryKey: ["admin-products-combo-modal"],
    queryFn: async () => {
      const { data } = await api.get("/api/products/?size=200");
      return data?.results ?? data?.items ?? data ?? [];
    },
  });

  const availableSelectProducts = Array.isArray(selectProductsData)
    ? selectProductsData.filter((p) => (!isEdit || String(p.id) !== String(product.id)) && !p.is_combo)
    : [];

  const filteredComboProducts = availableSelectProducts.filter((p) => {
    if (!comboFilter.trim()) return true;
    const name = (typeof (p.name || p.title) === "object" ? (p.name?.value || p.name?.name || "") : (p.name || p.title || "")).toLowerCase();
    return name.includes(comboFilter.toLowerCase());
  });

  const totalBooksMrp = availableSelectProducts
    .filter((p) => form.combo_products.map(String).includes(String(p.id)))
    .reduce((sum, p) => {
      const mrp = extractPriceNumber(p.mrp) || extractPriceNumber(p.price);
      return sum + mrp;
    }, 0);

  const { data: categoriesData } = useQuery({
    queryKey: ["admin-categories-select"],
    queryFn: async () => {
      const { data } = await api.get("/api/categories/?size=100");
      return data?.results ?? data?.items ?? [];
    },
  });
  const categories = categoriesData || [];

  async function deleteFromCloudinary(url) {
    if (!url) return;
    setSessionUploadedImages((prev) => prev.filter((u) => u !== url));
    try {
      await api.post("/api/admin/cloudinary/delete", { url });
    } catch (err) {
      console.warn("Could not execute remote Cloudinary deletion:", err);
    }
  }

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

  async function handleCloseWithCleanup() {
    if (sessionUploadedImages.length > 0) {
      await Promise.all(sessionUploadedImages.map((url) => deleteFromCloudinary(url)));
    }
    onClose();
  }

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

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.name.trim()) {
      setError("Combo Name is required.");
      return;
    }
    if (form.combo_products.length === 0) {
      setError("Please select at least one included book for the combo pack.");
      return;
    }
    if (!form.mrp || form.mrp === "") {
      setError("MRP / Combo Price is required.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const mrpVal = Number(form.mrp) || 0;
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

      const payload = {
        name: form.name.trim(),
        author: "Cremson Bundle",
        isbn: null,
        sku: null,
        edition: null,
        mrp: mrpVal,
        category_id: form.category_id !== "" ? Number(form.category_id) : null,
        stock_status: form.stock_status,
        status: form.status,
        weight: "1kg",
        dimension: "30cm x 22cm x 5cm",
        short_description: form.short_description || "",
        description: form.description || "",
        delivery_info: DEFAULT_DELIVERY_INFO,
        returns_info: DEFAULT_RETURNS_INFO,
        enable_bulk_pricing: false,
        bulk_pricing: "[]",
        discount_type: form.discount_type,
        has_own_discount: finalHasOwnDiscount,
        own_discount_type: finalOwnDiscountType,
        own_discount_val: finalOwnDiscountVal,
        own_discount_percentage: finalOwnDiscountPct,
        use_category_discount: finalUseCategoryDiscount,
        tags: `Combo, Bundle, COMBO_IDS:${JSON.stringify(form.combo_products.map(String))}`,
        is_active: form.is_active,
        main_image: form.main_image,
        side_images: form.side_images,
        class_: Array.isArray(form.class_) && form.class_.length > 0 ? form.class_.join(", ") : "Class 10",
        sub_categories: "",
        is_combo: true,
        combo_product_ids: JSON.stringify(form.combo_products.map(String)),
      };

      if (isEdit) {
        await adminUpdateProduct(product.id, payload);
      } else {
        await adminCreateProduct(payload);
      }
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to save combo product.");
    } finally {
      setSaving(false);
    }
  }

  const mrpVal = Number(form.mrp) || 0;
  let finalPrice = mrpVal;
  if (form.discount_type === "own" && mrpVal > 0) {
    const val = Number(form.own_discount_val) || 0;
    if (form.own_discount_type === "percentage") {
      finalPrice = Math.max(0, mrpVal - (mrpVal * val) / 100);
    } else {
      finalPrice = Math.max(0, mrpVal - val);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl border border-purple-200 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-purple-100 bg-purple-50">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-purple-600 text-white rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {isEdit ? "Edit Combo / Bundle" : "Create Combo / Bundle Offer"}
              </h2>
              <p className="text-xs text-purple-700">Select multiple books to create a single discounted offer pack.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCloseWithCleanup}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-5 bg-white text-left">
          {error && (
            <div className="text-red-700 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3 font-medium">
              {error}
            </div>
          )}

          {/* 1. Combo Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              Combo / Bundle Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Class 10 Science & Math Combo Pack"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
              required
            />
          </div>

          {/* 2. Select Included Books */}
          <div className="border border-purple-200 rounded-xl p-4 bg-purple-50/40 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <label className="block text-xs font-bold text-purple-900 uppercase tracking-wider">
                  Select Included Books ({form.combo_products.length} selected) <span className="text-red-500">*</span>
                </label>
                {totalBooksMrp > 0 && (
                  <p className="text-[11px] text-purple-700 mt-0.5">
                    Sum of individual book MRPs: <span className="font-semibold font-mono">₹{totalBooksMrp}</span>
                  </p>
                )}
              </div>
              <input
                type="text"
                placeholder="Search books..."
                value={comboFilter}
                onChange={(e) => setComboFilter(e.target.value)}
                className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-purple-500 w-44 bg-white"
              />
            </div>

            <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 divide-y divide-gray-100 border border-purple-200/80 rounded-lg p-2 bg-white">
              {loadingProducts ? (
                <p className="text-xs text-gray-400 p-3 text-center">Loading available products...</p>
              ) : filteredComboProducts.length === 0 ? (
                <p className="text-xs text-gray-400 p-3 text-center">No matching books found</p>
              ) : (
                filteredComboProducts.map((p) => {
                  const pId = String(p.id);
                  const isSelected = form.combo_products.map(String).includes(pId);
                  const displayMrp = extractPriceDisplay((p.mrp != null && p.mrp !== "") ? p.mrp : p.price);
                  return (
                    <label
                      key={pId}
                      className={`flex items-center justify-between p-2 rounded-md text-xs cursor-pointer transition-colors ${
                        isSelected ? "bg-purple-100/70 text-purple-950 font-semibold" : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 overflow-hidden">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setForm((f) => {
                              const current = f.combo_products.map(String);
                              const updated = checked
                                ? [...current, pId]
                                : current.filter((id) => id !== pId);

                              const newTotalMrp = availableSelectProducts
                                .filter((prod) => updated.includes(String(prod.id)))
                                .reduce((sum, prod) => {
                                  const itemMrp = extractPriceNumber(prod.mrp) || extractPriceNumber(prod.price);
                                  return sum + itemMrp;
                                }, 0);

                              return {
                                ...f,
                                combo_products: updated,
                                mrp: newTotalMrp > 0 ? String(newTotalMrp) : "",
                              };
                            });
                          }}
                          className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                        />
                        <span className="truncate">
                          {typeof (p.name || p.title) === "object" ? (p.name?.value || p.name?.name || "") : (p.name || p.title || "")}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-600 font-mono shrink-0 ml-2">₹{displayMrp}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* 3. Bundle Pricing & Offer Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-semibold text-gray-800">
                  Bundle MRP (Original Price) <span className="text-red-500">*</span>
                </label>
                {totalBooksMrp > 0 && form.mrp !== String(totalBooksMrp) && (
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, mrp: String(totalBooksMrp) }))}
                    className="text-[11px] font-semibold text-purple-600 hover:text-purple-800 underline cursor-pointer"
                  >
                    Set to sum (₹{totalBooksMrp})
                  </button>
                )}
              </div>
              <input
                type="number"
                name="mrp"
                step="0.01"
                min="0"
                value={form.mrp}
                onChange={handleChange}
                placeholder="e.g. 1500"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Classes</label>
              <MultiSelectCustomSelect
                options={CLASS_OPTIONS}
                value={form.class_ || []}
                onChange={(vals) => setForm((f) => ({ ...f, class_: vals }))}
                placeholder="Select classes"
              />
            </div>
          </div>

          {/* Discount Settings */}
          <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/60 space-y-3">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              Combo Offer Discount
            </label>
            <div className="flex items-center space-x-6 text-xs text-gray-700">
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="discount_type"
                  value="none"
                  checked={form.discount_type === "none"}
                  onChange={handleChange}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <span>No Discount (Sell at MRP)</span>
              </label>
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="discount_type"
                  value="own"
                  checked={form.discount_type === "own"}
                  onChange={handleChange}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <span>Custom Combo Discount</span>
              </label>
            </div>

            {form.discount_type === "own" && (
              <div className="flex items-center gap-3 pt-2">
                <select
                  name="own_discount_type"
                  value={form.own_discount_type}
                  onChange={handleChange}
                  className="text-xs px-3 py-2 border border-gray-300 rounded-lg bg-white outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat Amount (₹)</option>
                </select>
                <input
                  type="number"
                  name="own_discount_val"
                  step="0.01"
                  min="0"
                  value={form.own_discount_val}
                  onChange={handleChange}
                  placeholder={form.own_discount_type === "percentage" ? "e.g. 20" : "e.g. 200"}
                  className="text-xs px-3 py-2 border border-gray-300 rounded-lg bg-white outline-none focus:ring-1 focus:ring-purple-500 w-32"
                />
              </div>
            )}

            {/* Calculated Final Selling Price */}
            <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-sm font-medium">
              <span className="text-gray-700 font-semibold">Final Combo Offer Price:</span>
              <span className="text-lg font-bold text-green-700 font-mono">₹{finalPrice.toFixed(0)}</span>
            </div>
          </div>

          {/* 4. Stock Status & Category */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <CustomSelect
                options={[
                  { value: "in_stock", label: "In Stock" },
                  { value: "out_of_stock", label: "Out of Stock" },
                  { value: "on_sale", label: "On Sale" },
                  { value: "featured", label: "Featured" },
                  { value: "on_backorders", label: "On Backorders" },
                ]}
                value={form.stock_status}
                onChange={(val) => setForm((f) => ({ ...f, stock_status: val }))}
                placeholder="Select status"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category (Optional)</label>
              <CustomSelect
                options={[
                  { value: "", label: "Select a category" },
                  ...categories.map((c) => ({
                    value: c.id,
                    label: typeof c.name === "object" ? (c.name?.value || c.name?.name || String(c.id)) : (c.name || c.Name || `Category ${c.id}`),
                  })),
                ]}
                value={form.category_id}
                onChange={(val) => setForm((f) => ({ ...f, category_id: val }))}
                placeholder="Select category"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Visibility Status</label>
              <div className="flex items-center mt-2.5">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                  className={`${
                    form.is_active ? "bg-purple-600" : "bg-gray-200"
                  } relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2`}
                >
                  <span
                    aria-hidden="true"
                    className={`${
                      form.is_active ? "translate-x-5" : "translate-x-0"
                    } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out`}
                  />
                </button>
                <span className="ml-3 text-sm font-semibold text-gray-800">
                  {form.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>

          {/* 5. Main Image (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Combo Cover Image (Optional)</label>
            <div className="flex items-center space-x-4">
              {!form.main_image && (
                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (!uploadingMain) setIsDraggingMain(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDraggingMain(false);
                  }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    setIsDraggingMain(false);
                    if (uploadingMain) return;
                    const file = e.dataTransfer.files?.[0];
                    if (!file) return;
                    if (!file.type.startsWith("image/")) {
                      toast.error("Please upload an image file.");
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
                    }
                  }}
                  className={`px-4 py-2.5 border border-dashed rounded-lg transition-colors flex items-center cursor-pointer text-xs font-medium ${
                    isDraggingMain ? "border-purple-600 bg-purple-100 text-purple-800" : "border-purple-300 bg-purple-50/30 text-purple-700 hover:border-purple-500"
                  }`}
                >
                  <Upload className="w-4 h-4 mr-2 text-purple-600" />
                  {uploadingMain ? "Uploading..." : "Upload Cover Image"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleMainImageUpload}
                    className="hidden"
                  />
                </label>
              )}
              {form.main_image && (
                <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                  <img src={form.main_image} alt="Combo Cover" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      deleteFromCloudinary(form.main_image);
                      setForm((f) => ({ ...f, main_image: "" }));
                    }}
                    className="absolute top-0 right-0 bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 6. Short Description (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea
              name="short_description"
              rows={2}
              value={form.short_description}
              onChange={handleChange}
              placeholder="Brief details about what is included in this bundle..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-xs"
            />
          </div>

          {/* Submit & Cancel Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCloseWithCleanup}
              className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-sm transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-lg font-medium text-sm transition-colors bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {saving ? "Saving..." : "Save Combo Bundle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function parseComboIds(product) {
  if (!product) return [];

  // 1. Direct combo_product_ids property
  if (product.combo_product_ids) {
    try {
      const parsed = typeof product.combo_product_ids === "string"
        ? JSON.parse(product.combo_product_ids)
        : product.combo_product_ids;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(String);
    } catch {}
  }

  // 2. Direct combo_products property
  if (product.combo_products) {
    try {
      const parsed = typeof product.combo_products === "string"
        ? JSON.parse(product.combo_products)
        : product.combo_products;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(String);
    } catch {}
  }

  // 3. Search tags or descriptions for COMBO_IDS:[...]
  const combined = [product.tags, product.short_description, product.description].filter(Boolean).join(" ");
  if (combined.includes("COMBO_IDS:")) {
    try {
      const raw = combined.split("COMBO_IDS:")[1].trim();
      const match = raw.match(/^\[(.*?)\]/);
      if (match) {
        const ids = match[1].split(",").map((s) => s.trim().replace(/['"]/g, "")).filter(Boolean);
        if (ids.length > 0) return ids;
      }
    } catch {}
  }

  return [];
}

function ComboBreakdownModal({ comboProduct, onClose }) {
  const [includedBooks, setIncludedBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchIncludedBooks() {
      if (!comboProduct) return;
      const ids = parseComboIds(comboProduct);

      if (ids.length === 0) {
        setIncludedBooks([]);
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get("/api/products/?size=200");
        const allProds = data?.results ?? data?.items ?? [];
        const matched = allProds.filter((p) => ids.includes(String(p.id)));
        setIncludedBooks(matched);
      } catch (err) {
        console.error("Failed to load included books", err);
      } finally {
        setLoading(false);
      }
    }

    fetchIncludedBooks();
  }, [comboProduct]);

  if (!comboProduct) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-xs">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">{comboProduct.name}</h3>
              <p className="text-xs text-purple-100">Bundle Breakdown &amp; Included Books</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-600" />
              Included Books ({includedBooks.length})
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Combo MRP:</span>
              <span className="text-sm font-bold text-gray-900 bg-purple-50 text-purple-700 px-3 py-1 rounded-full border border-purple-200">
                ₹{comboProduct.mrp || comboProduct.price || 0}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3 py-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : includedBooks.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <BookOpen className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">No individual book details found for this combo.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {includedBooks.map((book) => (
                <div
                  key={book.id}
                  className="flex items-center justify-between p-3.5 bg-gray-50 hover:bg-purple-50/40 rounded-xl border border-gray-200 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    {book.main_image ? (
                      <img
                        src={book.main_image}
                        alt={book.name}
                        className="w-12 h-14 object-cover rounded-lg border bg-white flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-14 bg-gray-200 rounded-lg border flex items-center justify-center text-gray-400 flex-shrink-0">
                        <BookOpen className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <h5 className="text-sm font-semibold text-gray-900 line-clamp-1">{book.name}</h5>
                      {book.author && <p className="text-xs text-gray-500">by {book.author}</p>}
                      <div className="flex items-center gap-2 mt-1.5">
                        {book.class_ && (
                          <span className="text-[10px] bg-green-100 text-green-800 font-semibold px-2 py-0.5 rounded-full">
                            {book.class_}
                          </span>
                        )}
                        {book.isbn && <span className="text-[10px] text-gray-400 font-mono">ISBN: {book.isbn}</span>}
                        {book.sku && <span className="text-[10px] text-gray-400 font-mono">SKU: {book.sku}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold text-gray-900">₹{book.price || book.mrp || 0}</div>
                    {book.mrp && Number(book.mrp) > Number(book.price || 0) && (
                      <div className="text-xs text-gray-400 line-through">₹{book.mrp}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminProducts() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-500">Loading products...</div>}>
      <AdminProductsContent />
    </Suspense>
  );
}

function AdminProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const urlType = searchParams.get("type");
  const typeFilter = ["combo", "normal"].includes(urlType) ? urlType : "all";

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [comboModalOpen, setComboModalOpen] = useState(false);
  const [editComboProduct, setEditComboProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState(null);
  const [breakdownCombo, setBreakdownCombo] = useState(null);

  function handleTypeChange(newType) {
    setPage(1);
    const p = new URLSearchParams(searchParams.toString());
    if (newType && newType !== "all") {
      p.set("type", newType);
    } else {
      p.delete("type");
    }
    const queryString = p.toString();
    router.push(queryString ? `/admin/products?${queryString}` : "/admin/products", { scroll: false });
  }

  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => { setPage(1); }, [debouncedSearch, status, activeFilter, typeFilter]);

  const params = { page, size: PAGE_SIZE, order_by: "-id" };
  if (debouncedSearch) params.search = debouncedSearch;
  if (status) params.status = status;
  if (activeFilter) params.is_active = activeFilter;
  if (typeFilter === "combo") params.is_combo = true;
  if (typeFilter === "normal") params.is_combo = false;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-products", params],
    queryFn: async () => {
      const { data } = await api.get("/api/products/", { params });
      return data;
    },
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["admin-categories-select"],
    queryFn: async () => {
      const { data } = await api.get("/api/categories/?size=100");
      return data.results || [];
    },
  });

  const getCategoryName = (product) => {
    const catId = product.category_id != null ? Number(product.category_id) : (product.category != null ? Number(product.category) : null);
    if (!catId) return "";
    const matchedCat = (categoriesData || []).find((c) => c.id === catId);
    return matchedCat ? matchedCat.name : "";
  };

  const products = data?.results ?? data?.items ?? [];
  const count = data?.count ?? data?.total ?? 0;
  const totalPages = Math.ceil(count / PAGE_SIZE);

  // Drag and drop reordering state (mirrors Home Banner drag & drop behavior)
  const [productList, setProductList] = useState([]);
  const [isOrderModified, setIsOrderModified] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [isDraggable, setIsDraggable] = useState(false);

  const productListRef = useRef(productList);
  const draggedIndexRef = useRef(draggedIndex);

  useEffect(() => {
    productListRef.current = productList;
  }, [productList]);

  useEffect(() => {
    draggedIndexRef.current = draggedIndex;
  }, [draggedIndex]);

  useEffect(() => {
    if (data?.results || data?.items) {
      setProductList(data?.results ?? data?.items ?? []);
      setIsOrderModified(false);
    }
  }, [data]);

  function handleDragStart(e, index) {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  }

  function handleDragOver(e, index) {
    e.preventDefault();
    const currentDraggedIndex = draggedIndexRef.current;
    if (currentDraggedIndex === null || currentDraggedIndex === index) return;

    const currentList = productListRef.current;
    const updated = [...currentList];
    const [draggedItem] = updated.splice(currentDraggedIndex, 1);
    updated.splice(index, 0, draggedItem);

    setProductList(updated);
    setDraggedIndex(index);
    setIsOrderModified(true);
  }

  async function handleDragEnd() {
    setDraggedIndex(null);
    setIsDraggable(false);

    if (!isOrderModified) return;

    const currentList = productListRef.current;
    if (!currentList.length) return;

    setSavingOrder(true);
    const toastId = toast.loading("Saving new product order...", {
      style: {
        background: "#ffffff",
        color: "#000000",
        border: "1px solid #e5e7eb",
      },
    });

    try {
      const startPos = (page - 1) * PAGE_SIZE;
      const orders = currentList.map((prod, index) => ({
        id: prod.id,
        display_order: startPos + index + 1,
      }));
      await adminReorderProducts(orders);
      toast.success("Product order updated successfully", {
        id: toastId,
        style: {
          background: "#ffffff",
          color: "#000000",
          border: "1px solid #e5e7eb",
        },
      });
      setIsOrderModified(false);
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to save product order.", { id: toastId });
    } finally {
      setSavingOrder(false);
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }

  async function handleExportCSV() {
    try {
      const toastId = toast.loading("Preparing CSV export...");
      
      let allExportProducts = [];
      let currentPage = 1;
      let totalFetched = 0;
      let totalCount = 1;
      
      while (totalFetched < totalCount) {
        const exportParams = {
          page: currentPage,
          size: 200,
        };
        if (debouncedSearch) exportParams.search = debouncedSearch;
        if (status) exportParams.status = status;
        if (activeFilter) exportParams.is_active = activeFilter;
        if (typeFilter === "combo") exportParams.is_combo = true;
        if (typeFilter === "normal") exportParams.is_combo = false;
        
        const { data: resData } = await api.get("/api/products/", { params: exportParams });
        const results = resData?.results ?? resData?.items ?? [];
        
        allExportProducts = [...allExportProducts, ...results];
        totalCount = resData?.count ?? resData?.total ?? 0;
        totalFetched += results.length;
        currentPage += 1;
        
        if (results.length === 0) {
          break;
        }
      }
      
      toast.dismiss(toastId);
      
      if (allExportProducts.length === 0) {
        toast.error("No products found to export.");
        return;
      }
      
      const headers = [
        "Product ID",
        "Product Name",
        "Author",
        "MRP (INR)",
        "Price (INR)",
        "Category",
        "Stock Status",
        "ISBN",
        "SKU",
        "Dimension",
        "Weight",
        "Active Status"
      ];
      
      const rows = allExportProducts.map((p) => {
        return [
          p.id,
          p.name || "",
          p.author || "",
          p.mrp || 0,
          p.price || 0,
          p.category_name || p.category || "",
          p.stock_status || "in_stock",
          p.isbn || "",
          p.sku || "",
          p.dimension || "",
          p.weight || "",
          p.is_active ? "Active" : "Inactive"
        ];
      });
      
      const csvContent = [
        headers.join(","),
        ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
      ].join("\n");
      
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `products_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV exported successfully!");
    } catch (error) {
      console.error("CSV Export failed:", error);
      toast.error("Failed to export CSV.");
    }
  }

  function openAdd() {
    setEditProduct(null);
    setModalOpen(true);
  }

  function openAddCombo() {
    setEditComboProduct(null);
    setComboModalOpen(true);
  }

  function openEdit(e, product) {
    e.stopPropagation();
    if (product.is_combo || (product.combo_product_ids && product.combo_product_ids !== "[]")) {
      setEditComboProduct(product);
      setComboModalOpen(true);
    } else {
      setEditProduct(product);
      setModalOpen(true);
    }
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
        sku: product.sku || "",
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
    <div className="p-4 sm:p-6 lg:p-8">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6 mt-0">Products Management</h2>

      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">

          {/* Top Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={openAdd}
                className="inline-flex items-center px-4 py-2.5 rounded-lg font-medium transition-colors duration-200 bg-blue-600 hover:bg-blue-700 text-white text-sm cursor-pointer shadow-sm"
              >
                <Plus className="w-5 h-5 mr-2" aria-hidden="true" />
                Add Product
              </button>
              <button
                onClick={openAddCombo}
                className="inline-flex items-center px-4 py-2.5 rounded-lg font-medium transition-colors duration-200 bg-purple-600 hover:bg-purple-700 text-white text-sm cursor-pointer shadow-sm"
              >
                <Layers className="w-5 h-5 mr-2" aria-hidden="true" />
                Add Combo / Bundle
              </button>
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center px-4 py-2.5 border border-gray-300 rounded-lg font-medium bg-white text-gray-900 hover:bg-gray-50 active:bg-gray-100 text-sm cursor-pointer shadow-sm"
              >
                <Download className="w-5 h-5 mr-2" aria-hidden="true" />
                Export CSV
              </button>
            </div>

            {/* Type Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm">
              <button
                onClick={() => handleTypeChange("all")}
                className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  typeFilter === "all"
                    ? "bg-gray-900 text-white shadow-sm font-semibold"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                All Products
              </button>
              <button
                onClick={() => handleTypeChange("normal")}
                className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  typeFilter === "normal"
                    ? "bg-blue-600 text-white shadow-sm font-semibold"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Normal Products
              </button>
              <button
                onClick={() => handleTypeChange("combo")}
                className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  typeFilter === "combo"
                    ? "bg-purple-600 text-white shadow-sm font-semibold"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Combo Packs
              </button>
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200">
            {/* Card Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    {typeFilter === "combo" ? "📦 Combo / Bundle Packs" : typeFilter === "normal" ? "📖 Normal Products" : "All Products"}
                    <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border">
                      {count} items
                    </span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <GripVertical className="w-3.5 h-3.5 text-gray-400 inline" />
                    Drag any book row up/down to change its display order position on the website.
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap justify-end">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" aria-hidden="true" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-full sm:w-64 text-sm"
                    />
                    {search && (
                      <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {/* Type filter dropdown */}
                  <div className="relative">
                    <select
                      value={typeFilter}
                      onChange={(e) => handleTypeChange(e.target.value)}
                      className="border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-gray-700 cursor-pointer bg-white"
                    >
                      <option value="all">All Types</option>
                      <option value="normal">Normal Products</option>
                      <option value="combo">Combo Packs</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
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
                  {(search || status || activeFilter || typeFilter !== "all") && (
                    <button
                      onClick={() => { setSearch(""); setStatus(""); setActiveFilter(""); handleTypeChange("all"); }}
                      className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-12" title="Drag to change position">
                      Move
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider w-16">Pos</th>
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
                        <td className="px-3 py-4"><div className="h-4 w-4 bg-gray-200 rounded mx-auto" /></td>
                        <td className="px-4 py-4"><div className="h-4 w-6 bg-gray-200 rounded" /></td>
                        <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-12 h-12 bg-gray-200 rounded-lg" /><div className="space-y-1"><div className="h-4 w-40 bg-gray-200 rounded" /><div className="h-3 w-28 bg-gray-100 rounded" /></div></div></td>
                        <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-200 rounded" /></td>
                        <td className="px-6 py-4"><div className="h-5 w-16 bg-gray-200 rounded-full" /></td>
                        <td className="px-6 py-4"><div className="h-4 w-16 bg-gray-200 rounded" /></td>
                        <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-200 rounded" /></td>
                        <td className="px-6 py-4 text-right"><div className="h-5 w-20 bg-gray-200 rounded ml-auto" /></td>
                      </tr>
                    ))
                    : productList.length === 0
                      ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-16 text-center text-gray-400 text-sm">
                            No products found.
                          </td>
                        </tr>
                      )
                      : productList.map((product, index) => {
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

                        const comboIds = parseComboIds(product);
                        const isComboProductRow = Boolean(product.is_combo || comboIds.length > 0 || product.author === "Cremson Bundle");
                        const comboBookCount = comboIds.length;

                        const isDragging = index === draggedIndex;

                        return (
                          <tr
                            key={product.id}
                            draggable={isDraggable}
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            onDrop={(e) => e.preventDefault()}
                            onClick={() => router.push(`/admin/products/${product.id}`)}
                            className={`transition-all duration-200 cursor-pointer ${
                              isDragging
                                ? "opacity-40 border-dashed border-2 border-purple-400 bg-purple-50/30 scale-[0.99] shadow-inner"
                                : "hover:bg-gray-50 bg-white"
                            }`}
                          >
                            {/* Drag Handle */}
                            <td
                              className="px-3 py-4 text-center cursor-grab active:cursor-grabbing text-gray-400 hover:text-purple-600 transition-colors"
                              onMouseDown={() => setIsDraggable(true)}
                              onMouseUp={() => setIsDraggable(false)}
                              onTouchStart={() => setIsDraggable(true)}
                              onTouchEnd={() => setIsDraggable(false)}
                              onClick={(e) => e.stopPropagation()}
                              title="Drag to change book position"
                            >
                              <GripVertical className="w-5 h-5 mx-auto" />
                            </td>

                            {/* Position Number */}
                            <td className="px-4 py-4 text-sm font-semibold text-gray-700">
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                                #{sno}
                              </span>
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
                                   {isComboProductRow && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200 mt-1">
                                        <Layers className="w-3 h-3" />
                                        Combo Pack
                                      </span>
                                    )}
                                   {product.isbn && (
                                     <p className="text-xs text-gray-400">ISBN: {product.isbn}</p>
                                   )}
                                   {product.sku && (
                                     <p className="text-xs text-gray-400">SKU: {product.sku}</p>
                                   )}
                                 </div>
                               </div>
                             </td>

                            {/* Category */}
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-900">
                                {getCategoryName(product) || "—"}
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
                                {isComboProductRow ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setBreakdownCombo(product);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors cursor-pointer shadow-2xs"
                                  >
                                    <BookOpen className="w-3.5 h-3.5" />
                                    {comboBookCount > 0 ? `${comboBookCount} Included Books` : "View Bundle"}
                                  </button>
                                ) : (
                                  <>
                                    {product.edition && <div>Edition: {product.edition}</div>}
                                    {product.weight && <div>Weight: {product.weight}</div>}
                                    {product.sku && <div>SKU: {product.sku}</div>}
                                  </>
                                )}
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

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-100">
              {!isLoading && products.map((product, index) => {
                let subCats = [];
                try {
                  const raw = product.sub_categories;
                  if (Array.isArray(raw)) subCats = raw;
                  else if (typeof raw === "string" && raw) subCats = JSON.parse(raw);
                } catch { }
                const stockIn = (product.stock_status || "in_stock") === "in_stock";
                const offerPct = product.offer_percentage;
                const comboIds = parseComboIds(product);
                const isComboProductRow = Boolean(product.is_combo || comboIds.length > 0 || product.author === "Cremson Bundle");
                const comboBookCount = comboIds.length;
                const sno = (page - 1) * PAGE_SIZE + index + 1;
                return (
                  <div
                    key={product.id}
                    onClick={() => router.push(`/admin/products/${product.id}`)}
                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3 mb-2">
                      {product.main_image ? (
                        <img src={product.main_image} alt={product.name} className="w-12 h-12 object-cover rounded-lg border flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-lg border flex items-center justify-center text-gray-400 flex-shrink-0">
                          <BookOpen className="w-5 h-5" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{product.name || "—"}</p>
                        {product.author && <p className="text-xs text-gray-500">by {product.author}</p>}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {isComboProductRow && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                              <Layers className="w-3 h-3" />Combo Pack
                            </span>
                          )}
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${stockIn ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                            {stockIn ? "In Stock" : "Out of Stock"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold text-gray-900">₹{Number(product.price || 0).toFixed(0)}</p>
                        {offerPct && <p className="text-[10px] text-red-600 font-medium">{offerPct}% OFF</p>}
                        <p className="text-[10px] text-gray-400 mt-0.5">#{sno}</p>
                      </div>
                    </div>
                    {getCategoryName(product) && (
                      <p className="text-xs text-gray-500 mb-2">{getCategoryName(product)}</p>
                    )}
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button onClick={(e) => openEdit(e, product)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" title="Edit product">
                        <Pen className="w-4 h-4" />
                      </button>
                      <button onClick={(e) => handleDuplicate(e, product)} disabled={duplicatingId === product.id} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50" title="Clone product">
                        {duplicatingId === product.id ? <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button onClick={(e) => handleDelete(e, product)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Delete product">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
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

      {/* Combo Form Modal */}
      {comboModalOpen && (
        <ComboModal
          product={editComboProduct}
          onClose={() => { setComboModalOpen(false); setEditComboProduct(null); }}
          onSaved={() => {
            setComboModalOpen(false);
            setEditComboProduct(null);
            queryClient.invalidateQueries({ queryKey: ["admin-products"] });
          }}
        />
      )}

      {/* Combo Breakdown Modal */}
      {breakdownCombo && (
        <ComboBreakdownModal
          comboProduct={breakdownCombo}
          onClose={() => setBreakdownCombo(null)}
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

