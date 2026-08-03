"use client";

import React, { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Package, Plus, Trash2, CheckCircle2, ArrowRight, BookOpen, Building2, MapPin, User, Phone, Search, ChevronDown, Check, Loader2 } from "lucide-react";
import api from "@/lib/api/axios";

export default function PublicBulkOrderPage() {
  const [items, setItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedQty, setSelectedQty] = useState(10);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  const [form, setForm] = useState({
    contact_name: "",
    school_name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [error, setError] = useState("");

  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ["public-products-bulk"],
    queryFn: async () => {
      const res = await api.get("/api/products/?size=200");
      return res.data?.results ?? res.data?.items ?? res.data ?? [];
    },
  });

  const products = Array.isArray(productsData) ? productsData : [];

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredProducts = products.filter((p) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const title = (p.title || p.name || "").toLowerCase();
    const isbn = (p.isbn || "").toLowerCase();
    const author = (p.author || "").toLowerCase();
    const classes = (p.classes || "").toLowerCase();
    return title.includes(term) || isbn.includes(term) || author.includes(term) || classes.includes(term);
  });

  const handleAddItem = () => {
    if (!selectedProduct) return;
    const prod = selectedProduct;

    const existingIndex = items.findIndex((i) => String(i.product_id) === String(prod.id));
    if (existingIndex > -1) {
      const updated = [...items];
      updated[existingIndex].qty += Number(selectedQty);
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          product_id: prod.id,
          title: prod.title || prod.name || "Book",
          classes: prod.classes || "",
          isbn: prod.isbn || "",
          main_image: prod.main_image || "",
          qty: Number(selectedQty),
          price: Number(prod.price || prod.mrp || 0),
        },
      ]);
    }
    setSelectedProduct(null);
    setSelectedQty(10);
    setSearchTerm("");
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleQtyChange = (index, qty) => {
    const updated = [...items];
    updated[index].qty = Math.max(1, Number(qty));
    setItems(updated);
  };

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (items.length === 0) {
      setError("Please select at least one book for your bulk order.");
      return;
    }
    if (!form.contact_name || !form.school_name || !form.phone || !form.address || !form.pincode) {
      setError("Please fill in all required contact details.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        items,
      };
      const res = await api.post("/api/bulk-orders/", payload);
      setSubmittedData(res.data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to submit bulk order request.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedData) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900">Bulk Order Submitted!</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Thank you <span className="font-semibold text-slate-900">{form.contact_name}</span>. Your bulk order request for <span className="font-semibold text-slate-900">{form.school_name}</span> has been received.
          </p>

          <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-left space-y-2">
            <p className="text-xs font-semibold text-purple-900 uppercase tracking-wider">Your Order Tracking Link:</p>
            <a
              href={submittedData.order_link}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-purple-700 font-mono underline break-all block hover:text-purple-900"
            >
              {submittedData.order_link}
            </a>
          </div>

          <p className="text-xs text-slate-500">
            📲 We have sent a WhatsApp notification to your number. Our admin team will review your order and apply a special discount shortly.
          </p>

          <a
            href={submittedData.order_link}
            className="inline-flex items-center justify-center w-full py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors shadow-md text-sm"
          >
            View Order Status <ArrowRight className="w-4 h-4 ml-2" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold uppercase tracking-wider">
            <Package className="w-4 h-4" /> School & Institutional Bulk Orders
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Place a Bulk Order Request
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto">
            Order books directly for your school or class. No login required. Search books, submit details, and receive custom discounted pricing!
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Book Selection */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-9 h-9 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Select Books & Quantities</h3>
                <p className="text-xs text-slate-500">Search and choose books to include in this bulk order</p>
              </div>
            </div>

            {/* Selector Row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
              {/* Custom Searchable Select */}
              <div className="sm:col-span-7 relative" ref={dropdownRef}>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Book *</label>

                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-full h-11 px-4 border border-slate-300 rounded-xl text-sm bg-white hover:border-purple-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none flex items-center justify-between shadow-sm cursor-pointer"
                >
                  {selectedProduct ? (
                    <div className="flex items-center gap-3 text-left overflow-hidden">
                      {selectedProduct.main_image ? (
                        <img
                          src={selectedProduct.main_image}
                          alt=""
                          className="w-6 h-8 object-cover rounded shadow-sm flex-shrink-0"
                        />
                      ) : (
                        <div className="w-6 h-8 bg-purple-100 text-purple-600 rounded flex items-center justify-center text-xs font-bold flex-shrink-0">
                          📖
                        </div>
                      )}
                      <div className="truncate leading-tight">
                        <p className="font-semibold text-slate-900 text-xs sm:text-sm truncate">
                          {selectedProduct.name || selectedProduct.title}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">₹{selectedProduct.price || selectedProduct.mrp}</p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-xs sm:text-sm flex items-center gap-2">
                      <Search className="w-4 h-4 text-slate-400" /> Search & Select a book...
                    </span>
                  )}
                  <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2" />
                </button>

                {/* Dropdown Menu Popover */}
                {dropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden space-y-2 p-2 max-h-80 flex flex-col">
                    {/* Search Input Box */}
                    <div className="relative sticky top-0 bg-white z-10 pb-2">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="Search book by name, class, ISBN, author..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 outline-none bg-slate-50"
                      />
                    </div>

                    {/* Products List */}
                    <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
                      {loadingProducts ? (
                        <div className="py-8 text-center text-xs text-slate-400">Loading catalog books...</div>
                      ) : filteredProducts.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400">No books found matching search.</div>
                      ) : (
                        filteredProducts.map((p) => {
                          const isSelected = selectedProduct?.id === p.id;
                          return (
                            <div
                              key={p.id}
                              onClick={() => {
                                setSelectedProduct(p);
                                setDropdownOpen(false);
                              }}
                              className={`p-2.5 rounded-xl transition-colors flex items-center justify-between cursor-pointer ${
                                isSelected ? "bg-purple-50 border border-purple-200" : "hover:bg-slate-50"
                              }`}
                            >
                              <div className="flex items-center gap-3 overflow-hidden">
                                {p.main_image ? (
                                  <img src={p.main_image} alt="" className="w-9 h-12 object-cover rounded shadow-sm flex-shrink-0" />
                                ) : (
                                  <div className="w-9 h-12 bg-purple-100 text-purple-600 rounded flex items-center justify-center font-bold text-xs flex-shrink-0">
                                    📖
                                  </div>
                                )}

                                <div className="space-y-0.5 min-w-0">
                                  <p className="text-xs font-bold text-slate-900 line-clamp-1">{p.name || p.title}</p>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-500 flex-wrap">
                                    {p.classes && (
                                      <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-semibold">
                                        Class {p.classes}
                                      </span>
                                    )}
                                    {p.isbn && <span>ISBN: {p.isbn}</span>}
                                    {p.author && <span className="truncate">By {p.author}</span>}
                                  </div>
                                </div>
                              </div>

                              <div className="text-right flex-shrink-0 ml-3">
                                <span className="font-mono font-bold text-xs text-slate-900">₹{p.price || p.mrp || 0}</span>
                                {isSelected && <Check className="w-4 h-4 text-purple-600 ml-auto mt-1" />}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Quantity Field */}
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={selectedQty}
                  onChange={(e) => setSelectedQty(e.target.value)}
                  className="w-full h-11 px-4 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none font-semibold"
                />
              </div>

              {/* Add Button */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-transparent uppercase mb-1 select-none hidden sm:block">Action</label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={!selectedProduct}
                  className="w-full h-11 px-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors inline-flex items-center justify-center cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add
                </button>
              </div>
            </div>

            {/* Selected Items Table */}
            {items.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-500">No books added yet.</p>
                <p className="text-xs text-slate-400">Search and select a book above, then click Add.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-2.5 grid grid-cols-12 text-xs font-bold text-slate-500 uppercase">
                  <div className="col-span-6">Book</div>
                  <div className="col-span-2 text-center">Unit Price</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>
                {items.map((item, idx) => (
                  <div key={idx} className="px-4 py-3 grid grid-cols-12 items-center text-sm">
                    <div className="col-span-6 font-medium text-slate-900 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-red-400 hover:text-red-600 transition-colors p-1 flex-shrink-0"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {item.main_image ? (
                        <img src={item.main_image} alt="" className="w-8 h-10 object-cover rounded shadow-sm flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-10 bg-purple-100 text-purple-600 rounded flex items-center justify-center font-bold text-xs flex-shrink-0">
                          📖
                        </div>
                      )}

                      <div className="truncate">
                        <p className="truncate text-xs sm:text-sm font-bold text-slate-900">{item.title}</p>
                        {item.classes && <p className="text-[10px] text-slate-500">Class {item.classes}</p>}
                      </div>
                    </div>
                    <div className="col-span-2 text-center text-slate-600 font-mono text-xs sm:text-sm">₹{item.price}</div>
                    <div className="col-span-2 text-center">
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => handleQtyChange(idx, e.target.value)}
                        className="w-16 text-center py-1 border border-slate-300 rounded-lg text-xs font-semibold"
                      />
                    </div>
                    <div className="col-span-2 text-right font-bold text-slate-900 font-mono text-xs sm:text-sm">
                      ₹{(item.price * item.qty).toLocaleString()}
                    </div>
                  </div>
                ))}
                <div className="bg-slate-50 px-4 py-3 flex justify-between items-center font-bold text-slate-900">
                  <span>Estimated Subtotal (Pre-Discount):</span>
                  <span className="text-lg font-mono text-purple-700">₹{subtotal.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Delivery & Contact Details */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-9 h-9 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">School & Delivery Information</h3>
                <p className="text-xs text-slate-500">All books will be delivered to this single school address</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Contact Person Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.contact_name}
                  onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                  placeholder="e.g. Arjunan (Teacher / Coordinator)"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" /> School Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.school_name}
                  onChange={(e) => setForm({ ...form, school_name: e.target.value })}
                  placeholder="e.g. St. Xavier Senior Secondary School"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> WhatsApp Phone Number *
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs font-bold text-slate-600 flex items-center gap-1 select-none border-r border-slate-200 pr-2.5">
                    🇮🇳 +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })}
                    placeholder="9876543210"
                    className="w-full pl-20 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> Pincode *
                </label>
                <input
                  type="text"
                  required
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                  placeholder="e.g. 110001"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Delivery Address *</label>
                <textarea
                  rows={3}
                  required
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Complete street address, building/gate number, landmark..."
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="City"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">State</label>
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  placeholder="State"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 px-8 bg-purple-600 hover:bg-purple-700 disabled:opacity-75 text-white font-bold rounded-2xl transition-all shadow-lg text-base cursor-pointer flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Submitting Request...
              </>
            ) : (
              <>
                Submit Bulk Order Request <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
