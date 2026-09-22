"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  X, 
  ShoppingBag, 
  User, 
  MapPin, 
  CreditCard, 
  CheckCircle2, 
  Copy, 
  Check, 
  Loader2, 
  Sparkles,
  ExternalLink,
  Search,
  BookOpen,
  Minus,
  Plus,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import api from "../../../lib/api/axios";
import { adminCreateManualOrder } from "../../../lib/api/admin";

export default function CreateAdminOrderModal({ isOpen, onClose, onSuccess }) {
  // Form State
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // Product selection — map of productId → qty
  const [selectedProducts, setSelectedProducts] = useState({});
  const [bookSearch, setBookSearch] = useState("");

  // Pincode auto-resolve
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [pincode, setPincode] = useState("");
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState("");
  const [pincodeResolved, setPincodeResolved] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Fetch all active products
  const { data: catalogProducts = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["products-catalog-order"],
    queryFn: async () => {
      const { data } = await api.get("/api/products/", { params: { size: 200 } });
      return data?.results || [];
    },
    staleTime: 5 * 60 * 1000,
    enabled: isOpen,
  });

  // Auto-fetch city/state from pincode
  useEffect(() => {
    const pin = pincode.trim();
    if (pin.length !== 6) {
      setPincodeResolved(false);
      setPincodeError("");
      return;
    }
    setPincodeLoading(true);
    setPincodeError("");
    fetch(`https://api.postalpincode.in/pincode/${pin}`)
      .then((r) => r.json())
      .then((data) => {
        const post = data?.[0];
        if (post?.Status === "Success" && post.PostOffice?.length > 0) {
          const po = post.PostOffice[0];
          let cityVal = po.District || po.Division || po.Name || "";
          cityVal = cityVal.replace(/^(North|South|East|West|Central|New)\s+/i, "").trim() || cityVal;
          const stateVal = po.State || "";
          setCity(cityVal);
          setStateVal(stateVal);
          setPincodeResolved(true);
          setPincodeError("");
        } else {
          setPincodeResolved(false);
          setPincodeError("Pincode not found — enter city & state manually.");
        }
      })
      .catch(() => {
        setPincodeResolved(false);
        setPincodeError("Could not fetch pincode details.");
      })
      .finally(() => setPincodeLoading(false));
  }, [pincode]);

  // Reset all state on close
  useEffect(() => {
    if (!isOpen) {
      setResult(null);
      setCopiedLink(false);
      setCustomerName("");
      setCustomerPhone("");
      setSelectedProducts({});
      setBookSearch("");
      setStreet("");
      setCity("");
      setStateVal("");
      setPincode("");
      setPincodeResolved(false);
      setPincodeError("");
      setPaymentMethod("COD");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Toggle a book on/off
  const toggleBook = (productId) => {
    setSelectedProducts((prev) => {
      const next = { ...prev };
      if (next[productId]) {
        delete next[productId];
      } else {
        next[productId] = 1;
      }
      return next;
    });
  };

  const changeQty = (productId, delta) => {
    setSelectedProducts((prev) => {
      const current = prev[productId] || 1;
      const newQty = Math.max(1, current + delta);
      return { ...prev, [productId]: newQty };
    });
  };

  const setQty = (productId, val) => {
    const qty = parseInt(val, 10);
    if (!isNaN(qty) && qty >= 1) {
      setSelectedProducts((prev) => ({ ...prev, [productId]: qty }));
    }
  };

  // Calculate total
  const calculateTotal = () => {
    let total = 0;
    Object.entries(selectedProducts).forEach(([id, qty]) => {
      const prod = catalogProducts.find((p) => String(p.id) === String(id));
      const price = prod ? (prod.price || prod.mrp || 0) : 0;
      total += price * qty;
    });
    return total;
  };

  const selectedCount = Object.keys(selectedProducts).length;

  const filteredProducts = catalogProducts.filter((p) =>
    p.name?.toLowerCase().includes(bookSearch.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    if (!customerName.trim()) {
      toast.error("Customer Name is required.");
      setLoading(false);
      return;
    }
    const cleanPhone = customerPhone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error("Valid 10-digit Mobile Number is required.");
      setLoading(false);
      return;
    }
    if (selectedCount === 0) {
      toast.error("Please select at least one book.");
      setLoading(false);
      return;
    }
    if (!street.trim() || !city.trim() || !stateVal.trim() || !pincode.trim()) {
      toast.error("Complete shipping address (street, city, state, pincode) is required.");
      setLoading(false);
      return;
    }
    if (pincode.length !== 6) {
      toast.error("Pincode must be exactly 6 digits.");
      setLoading(false);
      return;
    }

    const productsPayload = Object.entries(selectedProducts).map(([id, qty]) => ({
      identifier: String(id),
      qty,
    }));

    const payload = {
      customer_name: customerName.trim(),
      customer_phone: cleanPhone.slice(-10),
      products: productsPayload,
      address: {
        street: street.trim(),
        city: city.trim(),
        state: stateVal.trim(),
        pincode: pincode.trim(),
      },
      payment_method: paymentMethod,
    };

    try {
      const response = await adminCreateManualOrder(payload);
      setResult(response);
      toast.success(response?.message || "Order created successfully!");
      if (onSuccess) onSuccess();
    } catch (err) {
      const errorDetail = err?.response?.data?.detail || err?.message || "Order creation failed";
      toast.error(typeof errorDetail === "string" ? errorDetail : "Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    toast.success("Payment link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-xl">
              <ShoppingBag className="w-5 h-5 text-purple-700" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Create Order</h2>
              <p className="text-xs text-slate-500 mt-0.5">Fill customer details to place a COD or Online order</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {result ? (
          /* ─── Success View ─────────────────────────────────── */
          <div className="p-6 space-y-5 overflow-y-auto">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Order Created!</h3>
              <p className="text-sm text-slate-500">{result.message}</p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
              <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-2.5">
                <span className="text-slate-500 font-medium">Order ID</span>
                <span className="font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-lg border border-purple-200 text-xs">
                  {result.order_id}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-2.5">
                <span className="text-slate-500 font-medium">Total Amount</span>
                <span className="font-bold text-slate-900 text-base">₹{result.total_amount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Payment Mode</span>
                <span className={`font-bold px-2.5 py-0.5 text-xs rounded-full border ${
                  result.payment_method === "COD"
                    ? "bg-amber-100 text-amber-800 border-amber-200"
                    : "bg-blue-100 text-blue-800 border-blue-200"
                }`}>
                  {result.payment_method}
                </span>
              </div>
            </div>

            {result.payment_link ? (
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    Razorpay Payment Link (Sent to Customer via WhatsApp)
                  </span>
                  <a href={result.payment_link} target="_blank" rel="noreferrer"
                    className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1 hover:underline">
                    Open <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <input type="text" readOnly value={result.payment_link}
                    className="flex-1 px-3 py-2 text-xs font-mono bg-white border border-purple-300 rounded-xl focus:outline-none truncate" />
                  <button onClick={() => handleCopyLink(result.payment_link)}
                    className="px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0">
                    {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedLink ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="text-[11px] text-purple-700">
                  Order stays <strong>Pending</strong> until the customer pays. Once paid, automatically updates to Confirmed.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>COD Order placed as <strong>Confirmed</strong>. Shipway courier shipment auto-created.</span>
              </div>
            )}

            <button onClick={onClose}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer">
              Close & View Orders
            </button>
          </div>
        ) : (
          /* ─── Order Form ───────────────────────────────────── */
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">

            {/* ── Customer Details ── */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-purple-600" /> Customer Details
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Arjunan"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Mobile Phone (10 digits) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 border-r border-slate-200 pr-2 select-none">
                      🇮🇳 +91
                    </span>
                    <input
                      type="text"
                      required
                      maxLength={10}
                      placeholder="8310861069"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className="w-full pl-[68px] pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold placeholder:text-slate-400 placeholder:font-normal focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Product Selection ── */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-purple-600" />
                  Select Books <span className="text-red-500">*</span>
                  {selectedCount > 0 && (
                    <span className="ml-1 bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-200">
                      {selectedCount} added
                    </span>
                  )}
                </span>
              </label>

              {/* Book search input */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search books by name..."
                  value={bookSearch}
                  onChange={(e) => setBookSearch(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                />
                {bookSearch && (
                  <button type="button" onClick={() => setBookSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Scrollable book picker list — only shows "+ Add" / "✓ Added" */}
              <div className="max-h-44 overflow-y-auto bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
                {loadingProducts ? (
                  <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                    Loading books...
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-6">No books match your search.</p>
                ) : (
                  filteredProducts.map((p) => {
                    const isSelected = !!selectedProducts[p.id];
                    const price = p.price || p.mrp || 0;
                    return (
                      <div key={p.id}
                        className={`flex items-center gap-3 p-3 transition-all ${
                          isSelected ? "bg-purple-50/60" : "hover:bg-slate-50"
                        }`}
                      >
                        {/* Thumbnail */}
                        {p.main_image ? (
                          <img src={p.main_image} alt={p.name}
                            className="w-9 h-11 object-cover rounded-lg border border-slate-200 shadow-xs flex-shrink-0" />
                        ) : (
                          <div className="w-9 h-11 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-purple-100">
                            <BookOpen className="w-5 h-5 text-purple-400" />
                          </div>
                        )}

                        {/* Book info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{p.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            ₹{price}{p.author ? ` • ${p.author}` : ""}
                          </p>
                        </div>

                        {/* Add / Added toggle */}
                        {isSelected ? (
                          <button type="button"
                            onClick={() => toggleBook(p.id)}
                            className="shrink-0 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer">
                            ✓ Added
                          </button>
                        ) : (
                          <button type="button"
                            onClick={() => toggleBook(p.id)}
                            className="shrink-0 text-[10px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer">
                            + Add
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* ── Selected books appear BELOW the list with qty controls ── */}
              {selectedCount > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pt-1">Order Items</p>

                  {Object.entries(selectedProducts).map(([id, qty]) => {
                    const prod = catalogProducts.find((p) => String(p.id) === String(id));
                    if (!prod) return null;
                    const price = prod.price || prod.mrp || 0;
                    return (
                      <div key={id} className="flex items-center gap-3 bg-white border border-purple-200 rounded-xl px-3 py-2.5 shadow-xs">
                        {/* Thumbnail */}
                        {prod.main_image ? (
                          <img src={prod.main_image} alt={prod.name}
                            className="w-8 h-10 object-cover rounded-lg border border-slate-200 flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-purple-100">
                            <BookOpen className="w-4 h-4 text-purple-400" />
                          </div>
                        )}

                        {/* Name + unit price */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{prod.name}</p>
                          <p className="text-[10px] text-slate-500">₹{price} each</p>
                        </div>

                        {/* − qty + */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button type="button"
                            onClick={() => changeQty(id, -1)}
                            className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-800 rounded-lg transition-colors cursor-pointer">
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={qty}
                            onChange={(e) => setQty(id, e.target.value)}
                            className="w-10 text-center text-xs font-bold border border-slate-300 rounded-lg py-1 focus:outline-none focus:ring-1 focus:ring-purple-400"
                          />
                          <button type="button"
                            onClick={() => changeQty(id, 1)}
                            className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-800 rounded-lg transition-colors cursor-pointer">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Subtotal */}
                        <span className="text-xs font-bold text-slate-800 w-14 text-right shrink-0">
                          ₹{(price * qty).toFixed(0)}
                        </span>

                        {/* Remove (×) */}
                        <button type="button"
                          onClick={() => toggleBook(id)}
                          title="Remove book"
                          className="p-1 text-slate-300 hover:text-red-500 transition-colors cursor-pointer shrink-0 rounded-md hover:bg-red-50">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}

                  {/* Grand Total row */}
                  <div className="flex justify-end pt-0.5">
                    <span className="text-xs font-bold text-purple-900 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl">
                      Grand Total: ₹{calculateTotal().toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* ── Shipping Address ── */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-purple-600" /> Shipping Address <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                required
                placeholder="Street / House / Flat / Landmark"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
              />

              <div className="grid grid-cols-3 gap-2.5">
                {/* Pincode — auto-resolves city */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Pincode <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="600001"
                      value={pincode}
                      onChange={(e) => {
                        setPincode(e.target.value.replace(/\D/g, "").slice(0, 6));
                        setPincodeResolved(false);
                        setCity("");
                        setStateVal("");
                      }}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-purple-500 outline-none pr-7 transition-all"
                    />
                    {pincodeLoading && (
                      <RefreshCw className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 animate-spin" />
                    )}
                    {pincodeResolved && !pincodeLoading && (
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-500 text-xs">✓</span>
                    )}
                  </div>
                  {pincodeError && (
                    <p className="text-[10px] text-red-500 mt-1">{pincodeError}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    City {pincodeResolved && <span className="text-emerald-600 text-[10px] font-normal">(auto)</span>}
                    <span className="text-red-500"> *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Chennai"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    readOnly={pincodeResolved}
                    className={`w-full px-3 py-2.5 border rounded-xl text-xs font-semibold outline-none transition-all ${
                      pincodeResolved
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800 cursor-not-allowed"
                        : "bg-white border-slate-200 focus:border-purple-500"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    State {pincodeResolved && <span className="text-emerald-600 text-[10px] font-normal">(auto)</span>}
                    <span className="text-red-500"> *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Tamil Nadu"
                    value={stateVal}
                    onChange={(e) => setStateVal(e.target.value)}
                    readOnly={pincodeResolved}
                    className={`w-full px-3 py-2.5 border rounded-xl text-xs font-semibold outline-none transition-all ${
                      pincodeResolved
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800 cursor-not-allowed"
                        : "bg-white border-slate-200 focus:border-purple-500"
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* ── Payment Method ── */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-purple-600" /> Payment Option <span className="text-red-500">*</span>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className={`relative p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                  paymentMethod === "COD"
                    ? "border-amber-500 bg-amber-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}>
                  <input type="radio" name="paymentMethod" value="COD"
                    checked={paymentMethod === "COD"} onChange={() => setPaymentMethod("COD")}
                    className="sr-only" />
                  <div className="flex items-start gap-2.5">
                    <div className={`p-1.5 rounded-lg ${paymentMethod === "COD" ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">COD</div>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                        Order confirmed immediately. Courier shipment auto-created & WhatsApp notification sent.
                      </p>
                    </div>
                  </div>
                </label>

                <label className={`relative p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                  paymentMethod === "ONLINE"
                    ? "border-purple-600 bg-purple-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}>
                  <input type="radio" name="paymentMethod" value="ONLINE"
                    checked={paymentMethod === "ONLINE"} onChange={() => setPaymentMethod("ONLINE")}
                    className="sr-only" />
                  <div className="flex items-start gap-2.5">
                    <div className={`p-1.5 rounded-lg ${paymentMethod === "ONLINE" ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">ONLINE</div>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                        Razorpay payment link sent to customer via WhatsApp. Order confirmed after payment.
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* ── Actions ── */}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 py-3 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md inline-flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
                {loading ? "Creating Order..." : `Create ${paymentMethod} Order`}
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
}
