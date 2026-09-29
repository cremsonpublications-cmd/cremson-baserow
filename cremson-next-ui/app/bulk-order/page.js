"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Package, Plus, Trash2, CheckCircle2, ArrowRight, BookOpen, Building2, MapPin, User, Phone } from "lucide-react";
import api from "@/lib/api/axios";

export default function PublicBulkOrderPage() {
  const [items, setItems] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedQty, setSelectedQty] = useState(10);

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

  const handleAddItem = () => {
    if (!selectedProductId) return;
    const prod = products.find((p) => String(p.id) === String(selectedProductId));
    if (!prod) return;

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
          qty: Number(selectedQty),
          price: Number(prod.price || prod.mrp || 0),
        },
      ]);
    }
    setSelectedProductId("");
    setSelectedQty(10);
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
            Order books directly for your school or class. No login required. Select books, submit details, and receive custom discounted pricing!
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
                <p className="text-xs text-slate-500">Choose books to include in this bulk order</p>
              </div>
            </div>

            {/* Selector Row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
              <div className="sm:col-span-7">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Book</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                >
                  <option value="">-- Choose a book --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title || p.name} (₹{p.price || p.mrp || 0})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={selectedQty}
                  onChange={(e) => setSelectedQty(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-colors inline-flex items-center justify-center cursor-pointer shadow-sm"
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
                <p className="text-xs text-slate-400">Select a book above and click Add.</p>
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
                    <div className="col-span-6 font-medium text-slate-900 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-red-400 hover:text-red-600 transition-colors p-1"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <span className="truncate">{item.title}</span>
                    </div>
                    <div className="col-span-2 text-center text-slate-600 font-mono">₹{item.price}</div>
                    <div className="col-span-2 text-center">
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => handleQtyChange(idx, e.target.value)}
                        className="w-16 text-center py-1 border border-slate-300 rounded-lg text-xs font-semibold"
                      />
                    </div>
                    <div className="col-span-2 text-right font-bold text-slate-900 font-mono">
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
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="e.g. 9876543210"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
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
            className="w-full py-4 px-8 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold rounded-2xl transition-all shadow-lg text-base cursor-pointer flex items-center justify-center gap-2"
          >
            {submitting ? "Submitting Request..." : "Submit Bulk Order Request"}
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
