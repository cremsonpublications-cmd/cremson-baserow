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
  DollarSign,
  Ticket,
  Pen,
  BookOpen
} from "lucide-react";

const PAGE_SIZE = 20;

const EMPTY_FORM = {
  code: "",
  discount_type: "percentage",
  discount_value: "",
  min_order_amount: "",
  max_discount_amount: "",
  show_in_ui: true,
  expiry_date: "",
  free_delivery: false,
  delivery_discount_amount: "",
  is_active: true,
  benefit: "",
  apply_to: "all",
  selected_products: [],
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
    percentage: "bg-purple-50 text-purple-700 border-purple-200",
    fixed: "bg-blue-50 text-blue-700 border-blue-200",
    fixed_amount: "bg-blue-50 text-blue-700 border-blue-200",
  };
  const cls = map[type?.toLowerCase()] || "bg-slate-50 text-slate-700 border-slate-200";
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${cls}`}>{type || "—"}</span>;
}

function DatePickerField({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedDate = value ? new Date(value + "T00:00:00") : null;
  const [viewDate, setViewDate] = useState(() => selectedDate || new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const handleSelectDay = (day) => {
    const formattedMonth = String(month + 1).padStart(2, "0");
    const formattedDay = String(day).padStart(2, "0");
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
    onChange(dateStr);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setIsOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    const formattedMonth = String(today.getMonth() + 1).padStart(2, "0");
    const formattedDay = String(today.getDate()).padStart(2, "0");
    const dateStr = `${today.getFullYear()}-${formattedMonth}-${formattedDay}`;
    onChange(dateStr);
    setViewDate(today);
    setIsOpen(false);
  };

  const daysGrid = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    daysGrid.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysGrid.push(d);
  }

  // Format date display (DD/MM/YYYY)
  const displayFormatted = selectedDate
    ? `${String(selectedDate.getDate()).padStart(2, "0")}/${String(selectedDate.getMonth() + 1).padStart(2, "0")}/${selectedDate.getFullYear()}`
    : "";

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">Valid Until</label>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors bg-white flex items-center justify-between cursor-pointer hover:border-purple-400"
      >
        <span className={displayFormatted ? "text-gray-900 font-medium" : "text-gray-400"}>
          {displayFormatted || "dd/mm/yyyy"}
        </span>
        <Calendar className="w-5 h-5 text-gray-500" />
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 top-full mt-2 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-72 animate-in fade-in zoom-in-95 duration-150">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-gray-900 text-sm">
                {monthNames[month]} {year}
              </span>
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
                <span key={idx} className="text-xs font-semibold text-gray-400 py-1">
                  {day}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-sm">
              {daysGrid.map((day, idx) => {
                if (!day) return <div key={idx} className="py-2" />;
                const isSelected =
                  selectedDate &&
                  selectedDate.getDate() === day &&
                  selectedDate.getMonth() === month &&
                  selectedDate.getFullYear() === year;

                const isToday =
                  new Date().getDate() === day &&
                  new Date().getMonth() === month &&
                  new Date().getFullYear() === year;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectDay(day)}
                    className={`py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-purple-600 text-white shadow-sm font-bold"
                        : isToday
                        ? "bg-purple-50 text-purple-700 font-bold border border-purple-200"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Footer Shortcuts */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-3">
              <button
                type="button"
                onClick={handleClear}
                className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleToday}
                className="text-xs font-medium text-purple-600 hover:text-purple-800 transition-colors cursor-pointer"
              >
                Today
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function getScalarVal(val, fallback = "") {
  if (val == null) return fallback;
  if (typeof val === "object") {
    if (Array.isArray(val)) {
      return val.map((v) => getScalarVal(v, "")).filter(Boolean).join(", ") || fallback;
    }
    return val.value ?? val.name ?? val.code ?? val.amount ?? val.discount_value ?? fallback;
  }
  return String(val);
}

function CouponFormModal({ coupon, onClose, onSaved }) {
  const isEdit = !!coupon;

  let initialProducts = [];
  let initialApplyTo = "all";
  const rawApp = coupon?.applicable_products || coupon?.product_ids;
  if (rawApp) {
    try {
      initialProducts = typeof rawApp === "string" ? JSON.parse(rawApp) : rawApp;
    } catch (e) {
      initialProducts = String(rawApp).split(",").map((s) => s.trim()).filter(Boolean);
    }
    if (Array.isArray(initialProducts) && initialProducts.length > 0) {
      initialApplyTo = "specific";
    }
  }

  const [form, setForm] = useState(
    isEdit
      ? {
          code: getScalarVal(coupon.code, ""),
          discount_type: getScalarVal(coupon.discount_type, "percentage"),
          discount_value: getScalarVal(coupon.discount_value ?? coupon.discount_percentage, ""),
          min_order_amount: getScalarVal(coupon.min_order_amount ?? coupon.minimum_order_amount, ""),
          max_discount_amount: getScalarVal(coupon.max_discount_amount, ""),
          show_in_ui: coupon.show_in_ui ?? true,
          expiry_date: getScalarVal(coupon.expiry_date ?? coupon.valid_until ?? coupon.expires_at, ""),
          free_delivery: coupon.free_delivery ?? false,
          delivery_discount_amount: getScalarVal(coupon.delivery_discount_amount, ""),
          is_active: coupon.is_active ?? coupon.active ?? true,
          benefit: getScalarVal(coupon.benefit ?? coupon.benefits, ""),
          apply_to: initialApplyTo,
          selected_products: Array.isArray(initialProducts) ? initialProducts.map(String) : [],
        }
      : EMPTY_FORM
  );
  const [productFilter, setProductFilter] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const { data: productsData } = useQuery({
    queryKey: ["admin-products-for-coupons"],
    queryFn: async () => {
      const { data } = await api.get("/api/products/?size=200");
      return data?.results ?? data?.items ?? data ?? [];
    },
  });

  const allProducts = Array.isArray(productsData) ? productsData : [];
  const filteredProducts = allProducts.filter((p) => {
    if (!productFilter.trim()) return true;
    const title = (p.title || p.name || "").toLowerCase();
    return title.includes(productFilter.toLowerCase());
  });

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    let finalValue = type === "checkbox" ? checked : value;
    
    // Automatically sanitize coupon code: only letters and numbers, uppercase
    if (name === "code") {
      finalValue = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    }

    setForm((f) => ({ ...f, [name]: finalValue }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.code) {
      setError("Coupon Code is required.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = {
        code: form.code,
        discount_type: form.discount_type,
        is_active: form.is_active,
        show_in_ui: form.show_in_ui,
        free_delivery: form.free_delivery,
      };

      if (form.benefit !== "") {
        payload.benefit = form.benefit;
        payload.benefits = form.benefit;
      }
      if (form.apply_to === "specific" && form.selected_products.length > 0) {
        const jsonStr = JSON.stringify(form.selected_products.map(String));
        payload.applicable_products = jsonStr;
        payload.product_ids = jsonStr;
      } else {
        payload.applicable_products = "";
        payload.product_ids = "";
      }
      if (form.discount_value !== "") {
        const valNum = Math.round(Number(form.discount_value));
        payload.discount_value = valNum;
        payload.discount_percentage = form.discount_type === "percentage" ? valNum : null;
      }
      if (form.min_order_amount !== "") payload.min_order_amount = Math.round(Number(form.min_order_amount));
      if (form.max_discount_amount !== "") payload.max_discount_amount = Math.round(Number(form.max_discount_amount));
      if (form.delivery_discount_amount !== "") payload.delivery_discount_amount = Math.round(Number(form.delivery_discount_amount));
      if (form.expiry_date) {
        payload.expiry_date = form.expiry_date;
        payload.valid_until = form.expiry_date;
      }

      if (isEdit) {
        await adminUpdateCoupon(coupon.id, payload);
      } else {
        await adminCreateCoupon(payload);
      }
      onSaved();
    } catch (err) {
      const rawErr = err?.response?.data?.detail || err?.message || "Failed to save coupon.";
      if (typeof rawErr === "object" && rawErr !== null) {
        if (Array.isArray(rawErr)) {
          setError(rawErr.map((e) => (typeof e === "object" ? e?.msg || JSON.stringify(e) : String(e))).join(", "));
        } else {
          const detailStr = Object.entries(rawErr)
            .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
            .join("; ");
          setError(detailStr || "Failed to save coupon.");
        }
      } else {
        setError(String(rawErr));
      }
    } finally {
      setSaving(false);
    }
  }

  const isFormValid = form.code.trim() !== "" && form.discount_value !== "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg border border-gray-200 shadow-lg w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden text-left">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEdit ? "Edit Coupon" : "Create New Coupon"}
          </h2>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden bg-white">
          {/* Scrollable Body */}
          <div className="overflow-y-auto flex-1 p-6 space-y-6">
            {error && (
              <div className="text-red-600 text-sm font-semibold bg-red-50 border border-red-200 rounded-lg p-3">
                {typeof error === "object" ? JSON.stringify(error) : String(error)}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Coupon Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Coupon Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  placeholder="Enter coupon code (e.g., WELCOME10)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Only letters and numbers allowed. Spaces and special characters are automatically removed.
                </p>
              </div>

              {/* Benefit Description (Custom Text written by admin) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Benefits / Benefit Note (Custom Text)
                </label>
                <input
                  type="text"
                  name="benefit"
                  value={form.benefit}
                  onChange={handleChange}
                  placeholder="e.g., ₹40 off on order"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Custom text written by admin (e.g., &quot;₹40 off on order&quot;). If left empty, it will auto-generate.
                </p>
              </div>

              {/* Discount Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="discount_type"
                  value={form.discount_type}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors bg-white cursor-pointer"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>

              {/* Discount Value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {form.discount_type === "percentage" ? "Discount Percentage" : "Discount Amount (₹)"} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="discount_value"
                  step="0.01"
                  value={form.discount_value}
                  onChange={handleChange}
                  placeholder={form.discount_type === "percentage" ? "Enter percentage (e.g., 10)" : "Enter amount (e.g., 100)"}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
                />
              </div>

              {/* Minimum Order Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Order Amount
                </label>
                <input
                  type="number"
                  name="min_order_amount"
                  step="0.01"
                  value={form.min_order_amount}
                  onChange={handleChange}
                  placeholder="Enter minimum amount"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
                />
              </div>

              {/* Maximum Discount Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Discount Amount (₹)
                </label>
                <input
                  type="number"
                  name="max_discount_amount"
                  step="0.01"
                  value={form.max_discount_amount}
                  onChange={handleChange}
                  placeholder="Enter maximum discount cap"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum amount that can be discounted (e.g., 10% of ₹1000 = ₹100, but cap at ₹50)
                </p>
              </div>

              {/* Show in User Interface */}
              <div>
                <label className="flex items-center space-x-3 cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    name="show_in_ui"
                    checked={form.show_in_ui}
                    onChange={handleChange}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Show in User Interface</span>
                    <p className="text-xs text-gray-500">
                      If unchecked, coupon will be hidden from users but can still be applied by typing the code
                    </p>
                  </div>
                </label>
              </div>

              {/* Valid Until */}
              <DatePickerField
                value={form.expiry_date ? form.expiry_date.split("T")[0] : ""}
                onChange={(val) => setForm((f) => ({ ...f, expiry_date: val }))}
              />
            </div>

            {/* Delivery Options (Optional) */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Delivery Options (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="free_delivery"
                      name="free_delivery"
                      checked={form.free_delivery}
                      onChange={handleChange}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="free_delivery" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Free Delivery
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Customer gets free delivery (can combine with coupon discount)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Delivery Discount Amount (₹)
                  </label>
                  <input
                    type="number"
                    name="delivery_discount_amount"
                    min="0"
                    step="0.01"
                    value={form.delivery_discount_amount}
                    onChange={handleChange}
                    placeholder="Enter delivery discount amount"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors bg-white"
                  />
                  <p className="text-xs mt-1 text-gray-500">
                    Discount on delivery charges (can combine with coupon discount)
                  </p>
                </div>
              </div>
            </div>

            {/* Applicable Products Section */}
            <div className="border-t border-gray-200 pt-5 space-y-3">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                Product Assignment
              </h3>
              <p className="text-xs text-gray-500">
                Choose whether this coupon code applies to all store items or specific selected books only.
              </p>

              <div className="flex items-center gap-6 py-2">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="apply_to"
                    value="all"
                    checked={form.apply_to === "all"}
                    onChange={() => setForm((f) => ({ ...f, apply_to: "all", selected_products: [] }))}
                    className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-800 font-medium">All Store Products</span>
                </label>
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="apply_to"
                    value="specific"
                    checked={form.apply_to === "specific"}
                    onChange={() => setForm((f) => ({ ...f, apply_to: "specific" }))}
                    className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-800 font-medium">Selected Products Only</span>
                </label>
              </div>

              {form.apply_to === "specific" && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-slate-700 uppercase">
                      Select Books ({form.selected_products.length} selected)
                    </span>
                    <input
                      type="text"
                      placeholder="Search books..."
                      value={productFilter}
                      onChange={(e) => setProductFilter(e.target.value)}
                      className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-purple-500 bg-white w-48"
                    />
                  </div>

                  <div className="max-h-52 overflow-y-auto space-y-1 pr-1 divide-y divide-slate-100 border border-slate-200 rounded-lg bg-white p-2">
                    {filteredProducts.length === 0 ? (
                      <p className="text-xs text-gray-400 p-2 text-center">No products found</p>
                    ) : (
                      filteredProducts.map((p) => {
                        const pId = String(p.id);
                        const isSelected = form.selected_products.map(String).includes(pId);
                        return (
                          <label
                            key={pId}
                            className={`flex items-center justify-between p-2 rounded-md text-xs cursor-pointer transition-colors ${
                              isSelected ? "bg-purple-50 text-purple-900 font-semibold" : "hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <div className="flex items-center space-x-2.5 overflow-hidden">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setForm((f) => {
                                    const current = f.selected_products.map(String);
                                    const updated = checked
                                      ? [...current, pId]
                                      : current.filter((id) => id !== pId);
                                    return { ...f, selected_products: updated };
                                  });
                                }}
                                className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                              />
                              <span className="truncate">{p.title || p.name}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-2">₹{p.price}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sticky Actions Footer */}
          <div className="p-4 sm:px-6 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row gap-3 sm:justify-end shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !isFormValid}
              className={`px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer ${
                saving || !isFormValid
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-700 text-white shadow-md"
              }`}
            >
              {saving ? "Saving..." : "Save Coupon"}
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
    <div className="p-4 sm:p-6 lg:p-8 text-left">
      <h2 className="text-2xl font-semibold text-gray-900 mb-8 mt-0">Coupons</h2>
      
      <div className="rounded-lg">
        <div className="h-[calc(100vh-120px)] flex flex-col">
          <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col flex-1 min-h-[600px]">
              
              {/* Header & Search */}
              <div className="p-4 md:p-6 border-b border-gray-200 flex-shrink-0 bg-white">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="relative flex-1 sm:flex-initial">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Search coupons..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="pl-8 md:pl-10 pr-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none w-full sm:w-80"
                        />
                      </div>
                      <div className="text-sm text-gray-600">Total: {count} coupons</div>
                    </div>

                    <button
                      onClick={openAdd}
                      className="inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors duration-200 bg-purple-600 hover:bg-purple-700 text-white cursor-pointer shadow-sm text-sm"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add Coupon
                    </button>
                  </div>
                </div>
              </div>

              {/* Scrollable Content Container */}
              <div className="flex-1 overflow-y-auto p-6 min-h-0">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 h-48 bg-gray-100" />
                ))}
              </div>
            ) : coupons.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Tag className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-base font-semibold text-gray-600">No coupons found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coupons.map((coupon) => {
                  const rawDiscVal = coupon.discount_value ?? coupon.discount_percentage;
                  const discVal = getScalarVal(rawDiscVal, null);
                  const rawType = getScalarVal(coupon.discount_type, "percentage");
                  const isPct = String(rawType).toLowerCase() === "percentage";
                  const minOrder = getScalarVal(coupon.min_order_amount ?? coupon.minimum_order_amount, null);
                  const expiry = getScalarVal(coupon.valid_until ?? coupon.expiry_date ?? coupon.expires_at, null);
                  const isFreeDelivery = coupon.free_delivery;
                  const delDisc = getScalarVal(coupon.delivery_discount_amount, null);
                  const benefitText = getScalarVal(coupon.benefit || coupon.benefits, null);

                  return (
                    <div
                      key={coupon.id}
                      className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
                    >
                      {/* Ticket Header & Actions */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <Ticket className="w-5 h-5 text-purple-600" />
                          <h3 className="font-semibold text-gray-900">{getScalarVal(coupon.code, "—")}</h3>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => openEdit(e, coupon)}
                            className="text-blue-600 hover:text-blue-800 transition-colors p-1 cursor-pointer"
                            title="Edit"
                          >
                            <Pen className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, coupon)}
                            className="text-red-600 hover:text-red-800 transition-colors p-1 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Benefits & Details */}
                      <div className="space-y-3">
                        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                          <h4 className="text-xs font-semibold text-gray-700 uppercase">Benefits:</h4>
                          
                          {benefitText ? (
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-bold text-purple-900 bg-purple-100/60 px-2 py-1 rounded border border-purple-200/60">
                                {String(benefitText)}
                              </span>
                            </div>
                          ) : (
                            <>
                              {discVal != null && Number(discVal) > 0 && (
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium text-gray-900">
                                    {isPct ? `${discVal}% off on order` : `₹${discVal} off on order`}
                                  </span>
                                </div>
                              )}

                              {isFreeDelivery && (
                                <div className="flex items-center space-x-2">
                                  <span className="text-green-600 text-lg">🚚</span>
                                  <span className="text-sm font-medium text-gray-900">Free Delivery</span>
                                </div>
                              )}

                              {!isFreeDelivery && delDisc != null && Number(delDisc) > 0 && (
                                <div className="flex items-center space-x-2">
                                  <span className="text-green-600 text-lg">🚚</span>
                                  <span className="text-sm font-medium text-gray-900">₹{delDisc} Delivery Discount</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {(() => {
                          const rawApp = coupon.applicable_products || coupon.product_ids;
                          let prodArr = [];
                          if (rawApp) {
                            try {
                              prodArr = typeof rawApp === "string" ? JSON.parse(rawApp) : rawApp;
                            } catch (e) {
                              prodArr = String(rawApp).split(",").map(s => s.trim()).filter(Boolean);
                            }
                          }
                          if (Array.isArray(prodArr) && prodArr.length > 0) {
                            return (
                              <div className="flex items-center space-x-1.5 text-xs text-amber-800 bg-amber-50 px-2.5 py-1.5 rounded-md border border-amber-200/70 font-medium">
                                <BookOpen className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span>Valid for {prodArr.length} selected book(s)</span>
                              </div>
                            );
                          }
                          return null;
                        })()}

                        {minOrder != null && Number(minOrder) > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs text-gray-600">📌 Min order: ₹{minOrder}</p>
                          </div>
                        )}

                        {expiry && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <p className="text-xs text-gray-500">Valid until: {formatDate(expiry)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

              {/* Pagination */}
              {!isLoading && totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 md:p-6 border-t border-gray-200 bg-white rounded-b-lg flex-shrink-0">
                  <p className="text-xs font-bold text-gray-500">
                    Page <span className="text-gray-900 font-black">{page}</span> of <span className="text-gray-900 font-black">{totalPages}</span> &mdash; {count.toLocaleString()} coupons
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="inline-flex items-center gap-1 px-4 py-2 border border-gray-200 bg-white rounded-lg text-xs font-medium text-gray-700 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-all cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Previous
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="inline-flex items-center gap-1 px-4 py-2 border border-gray-200 bg-white rounded-lg text-xs font-medium text-gray-700 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-all cursor-pointer"
                    >
                      Next <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

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
