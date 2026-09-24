"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ShoppingBag, User, MapPin, CreditCard, CheckCircle2,
  Loader2, Search, BookOpen, Minus, Plus, RefreshCw, X,
  Upload, FileText, ImageIcon, Lock, Eye, EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../../../lib/api/axios";
import { adminCreateManualOrder } from "../../../../lib/api/admin";

// ── Change this password to whatever you want to give your staff ──
const STAFF_PASSWORD = "cremson@staff";

export default function CreateOrderPage() {
  const router = useRouter();

  // ── Password gate ──────────────────────────────────────────────
  const [unlocked, setUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pwError, setPwError] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("create_order_unlocked");
      if (saved === "1") setUnlocked(true);
    }
  }, []);

  const handleUnlock = (e) => {
    e.preventDefault();
    if (passwordInput === STAFF_PASSWORD) {
      localStorage.setItem("create_order_unlocked", "1");
      setUnlocked(true);
      setPwError(false);
    } else {
      setPwError(true);
      setPasswordInput("");
    }
  };
  // ──────────────────────────────────────────────────────────────

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedProducts, setSelectedProducts] = useState({});   // id -> { qty, customPrice }
  const [bookSearch, setBookSearch] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [pincode, setPincode] = useState("");
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState("");
  const [pincodeResolved, setPincodeResolved] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("PAID");
  const [description, setDescription] = useState("");
  const [screenshotFiles, setScreenshotFiles] = useState([]);   // [{ file, preview, url }]
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  const { data: catalogProducts = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["products-catalog-order"],
    queryFn: async () => {
      const { data } = await api.get("/api/products/", { params: { size: 200 } });
      return data?.results || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const pin = pincode.trim();
    if (pin.length !== 6) { setPincodeResolved(false); setPincodeError(""); return; }
    setPincodeLoading(true); setPincodeError("");
    fetch(`https://api.postalpincode.in/pincode/${pin}`)
      .then((r) => r.json())
      .then((data) => {
        const post = data?.[0];
        if (post?.Status === "Success" && post.PostOffice?.length > 0) {
          const po = post.PostOffice[0];
          let cityVal = po.District || po.Division || po.Name || "";
          cityVal = cityVal.replace(/^(North|South|East|West|Central|New)\s+/i, "").trim() || cityVal;
          setCity(cityVal); setStateVal(po.State || ""); setPincodeResolved(true); setPincodeError("");
        } else { setPincodeResolved(false); setPincodeError("Pincode not found — enter city & state manually."); }
      })
      .catch(() => { setPincodeResolved(false); setPincodeError("Could not fetch pincode details."); })
      .finally(() => setPincodeLoading(false));
  }, [pincode]);

  const toggleBook = (productId, defaultPrice) => {
    setSelectedProducts((prev) => {
      const next = { ...prev };
      if (next[productId]) { delete next[productId]; } else { next[productId] = { qty: 1, customPrice: defaultPrice }; }
      return next;
    });
  };

  const changeQty = (productId, delta) => {
    setSelectedProducts((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], qty: Math.max(1, (prev[productId]?.qty || 1) + delta) }
    }));
  };

  const setQty = (productId, val) => {
    if (val === "") {
      setSelectedProducts((prev) => ({ ...prev, [productId]: { ...prev[productId], qty: "" } }));
      return;
    }
    const qty = parseInt(val, 10);
    if (!isNaN(qty)) setSelectedProducts((prev) => ({ ...prev, [productId]: { ...prev[productId], qty } }));
  };

  const setCustomPrice = (productId, val) => {
    if (val === "") {
      setSelectedProducts((prev) => ({ ...prev, [productId]: { ...prev[productId], customPrice: "" } }));
      return;
    }
    const price = parseFloat(val);
    if (!isNaN(price)) {
      setSelectedProducts((prev) => ({ ...prev, [productId]: { ...prev[productId], customPrice: price } }));
    }
  };

  const calculateTotal = () => {
    let total = 0;
    Object.entries(selectedProducts).forEach(([id, { qty, customPrice }]) => {
      total += (Number(customPrice) || 0) * (Number(qty) || 0);
    });
    return total;
  };

  const handleScreenshotChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const invalid = files.find((f) => !f.type.startsWith("image/"));
    if (invalid) { toast.error("Please select image files only."); return; }
    const oversized = files.find((f) => f.size > 5 * 1024 * 1024);
    if (oversized) { toast.error("Each image must be smaller than 5MB."); return; }
    const newEntries = files.map((file) => ({ file, preview: URL.createObjectURL(file), url: "" }));
    setScreenshotFiles((prev) => [...prev, ...newEntries]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeScreenshot = (index) => {
    setScreenshotFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadAllScreenshots = async () => {
    const pending = screenshotFiles.filter((s) => !s.url);
    if (!pending.length) return screenshotFiles.map((s) => s.url).filter(Boolean);
    setUploadingScreenshot(true);
    try {
      const uploaded = await Promise.all(
        screenshotFiles.map(async (s) => {
          if (s.url) return s;
          const formData = new FormData();
          formData.append("file", s.file);
          const { data } = await api.post("/api/upload/image", formData, { headers: { "Content-Type": "multipart/form-data" } });
          const url = data?.url || data?.file_url || data?.secure_url || "";
          if (!url) throw new Error("Upload endpoint did not return a valid image URL.");
          return { ...s, url };
        })
      );
      setScreenshotFiles(uploaded);
      return uploaded.map((s) => s.url).filter(Boolean);
    } catch (err) {
      console.error("Screenshot upload failed:", err);
      throw err;
    } finally {
      setUploadingScreenshot(false);
    }
  };

  const selectedCount = Object.keys(selectedProducts).length;
  const filteredProducts = catalogProducts.filter((p) => p.name?.toLowerCase().includes(bookSearch.toLowerCase()));

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setResult(null);
    if (!customerName.trim()) { toast.error("Customer Name is required."); setLoading(false); return; }
    const cleanPhone = customerPhone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10) { toast.error("Valid 10-digit Mobile Number is required."); setLoading(false); return; }
    if (selectedCount === 0) { toast.error("Please select at least one book."); setLoading(false); return; }
    if (!street.trim() || !city.trim() || !stateVal.trim() || !pincode.trim()) { toast.error("Complete shipping address is required."); setLoading(false); return; }
    if (pincode.length !== 6) { toast.error("Pincode must be exactly 6 digits."); setLoading(false); return; }

    // Upload screenshots if selected — abort order creation if upload fails
    let finalScreenshotUrl = "";
    if (screenshotFiles.length > 0) {
      try {
        const urls = await uploadAllScreenshots();
        if (!urls.length) {
          toast.error("Image upload failed. Order was not created.");
          setLoading(false);
          return;
        }
        finalScreenshotUrl = urls.length === 1 ? urls[0] : JSON.stringify(urls);
      } catch (uploadErr) {
        const msg = uploadErr?.response?.data?.detail || uploadErr?.message || "Image upload failed";
        toast.error(`Image upload failed (${msg}). Order was not created.`);
        setLoading(false);
        return;
      }
    }

    const productsPayload = Object.entries(selectedProducts).map(([id, { qty }]) => ({
      identifier: String(id),
      qty: Number(qty) || 1,
    }));
    const customPrices = {};
    Object.entries(selectedProducts).forEach(([id, { customPrice }]) => {
      const prod = catalogProducts.find((p) => String(p.id) === String(id));
      const fallbackPrice = prod ? (prod.price || prod.mrp || 0) : 0;
      const finalPrice = customPrice !== "" && !isNaN(Number(customPrice)) ? Number(customPrice) : fallbackPrice;
      customPrices[id] = finalPrice;
    });

    const payload = {
      customer_name: customerName.trim(),
      customer_phone: cleanPhone.slice(-10),
      products: productsPayload,
      address: { street: street.trim(), city: city.trim(), state: stateVal.trim(), pincode: pincode.trim() },
      payment_method: paymentMethod,
      description: description.trim() || undefined,
      custom_prices: customPrices,
      payment_screenshot_url: finalScreenshotUrl || undefined,
    };

    try {
      const response = await adminCreateManualOrder(payload);
      setResult(response); toast.success(response?.message || "Order created successfully!");
    } catch (err) {
      const errorDetail = err?.response?.data?.detail || err?.message || "Order creation failed";
      toast.error(typeof errorDetail === "string" ? errorDetail : "Failed to create order");
    } finally { setLoading(false); }
  };

  // ── Password gate screen ─────────────────────────────────────
  if (!unlocked) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Logo / icon */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Lock className="w-8 h-8 text-purple-700" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Staff Access</h1>
            <p className="text-sm text-slate-500 mt-1">Enter the password to create an order</p>
          </div>

          <form onSubmit={handleUnlock} className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoFocus
                  placeholder="Enter staff password"
                  value={passwordInput}
                  onChange={(e) => { setPasswordInput(e.target.value); setPwError(false); }}
                  className={`w-full px-4 py-3.5 pr-12 bg-slate-50 border rounded-xl text-sm font-semibold outline-none transition-all ${
                    pwError
                      ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-400/20"
                      : "border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:bg-white"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {pwError && (
                <p className="text-xs text-red-500 font-semibold mt-1.5 flex items-center gap-1">
                  ✕ Incorrect password. Please try again.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!passwordInput}
              className="w-full py-3.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              Unlock & Continue
            </button>
          </form>
        </div>
      </div>
    );
  }
  // ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-100 rounded-2xl"><ShoppingBag className="w-6 h-6 text-purple-700" /></div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Create Order</h1>
            <p className="text-sm text-slate-500 mt-0.5">Fill customer details to place an order</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {result ? (
          /* Success */
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Order Created!</h2>
              <p className="text-sm text-slate-500">{result.message}</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
              <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-3">
                <span className="text-slate-500 font-medium">Order ID</span>
                <span className="font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-lg border border-purple-200">{result.order_id}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-3">
                <span className="text-slate-500 font-medium">Total Amount</span>
                <span className="font-bold text-slate-900 text-lg">&#8377;{result.total_amount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Payment</span>
                <span className={`font-bold px-3 py-1 text-xs rounded-full border ${result.payment_method === "PAID" ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-amber-100 text-amber-800 border-amber-200"}`}>
                  {result.payment_method === "PAID" ? "Paid" : "Pay Later"}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setResult(null);
                setCustomerName("");
                setCustomerPhone("");
                setSelectedProducts({});
                setStreet("");
                setPincode("");
                setCity("");
                setStateVal("");
                setDescription("");
                setScreenshotFiles([]);
              }}
              className="w-full py-3.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              + Create Another Order
            </button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 sm:p-8 space-y-8">

              {/* Customer Details */}
              <div className="space-y-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-purple-600" /> Customer Details
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Customer Name <span className="text-red-500">*</span></label>
                    <input type="text" required placeholder="e.g. Arjunan" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:bg-white outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Mobile (10 digits) <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500 border-r border-slate-200 pr-3 select-none">&#127470;&#127475; +91</span>
                      <input type="text" required maxLength={10} placeholder="8310861069" value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        className="w-full pl-[80px] pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:bg-white outline-none transition-all" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Book Selection */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <ShoppingBag className="w-3.5 h-3.5 text-purple-600" /> Select Books <span className="text-red-500">*</span>
                  {selectedCount > 0 && <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-purple-200">{selectedCount} added</span>}
                </p>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Search books by name..." value={bookSearch} onChange={(e) => setBookSearch(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:bg-white outline-none transition-all" />
                  {bookSearch && <button type="button" onClick={() => setBookSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>}
                </div>

                {/* Book picker */}
                <div className="max-h-56 overflow-y-auto bg-slate-50 border border-slate-200 rounded-2xl divide-y divide-slate-100">
                  {loadingProducts ? (
                    <div className="py-8 text-center text-sm text-slate-400 flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin text-purple-600" /> Loading books...</div>
                  ) : filteredProducts.length === 0 ? (
                    <p className="text-center text-sm text-slate-400 py-8">No books match your search.</p>
                  ) : filteredProducts.map((p) => {
                    const isSelected = !!selectedProducts[p.id];
                    const price = p.price || p.mrp || 0;
                    return (
                      <div key={p.id} className={`flex items-center gap-3 p-3.5 transition-all ${isSelected ? "bg-purple-50/60" : "hover:bg-white"}`}>
                        {p.main_image
                          ? <img src={p.main_image} alt={p.name} className="w-10 h-12 object-cover rounded-lg border border-slate-200 flex-shrink-0" />
                          : <div className="w-10 h-12 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-purple-100"><BookOpen className="w-5 h-5 text-purple-400" /></div>
                        }
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{p.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">&#8377;{price}{p.author ? ` • ${p.author}` : ""}</p>
                        </div>
                        {isSelected
                          ? <button type="button" onClick={() => toggleBook(p.id, price)} className="shrink-0 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">✓ Added</button>
                          : <button type="button" onClick={() => toggleBook(p.id, price)} className="shrink-0 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">+ Add</button>
                        }
                      </div>
                    );
                  })}
                </div>

                {/* Order items with qty + editable price */}
                {selectedCount > 0 && (
                  <div className="space-y-2 pt-3 border-t border-slate-200">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Order Items</p>
                    {Object.entries(selectedProducts).map(([id, { qty, customPrice }]) => {
                      const prod = catalogProducts.find((p) => String(p.id) === String(id));
                      if (!prod) return null;
                      return (
                        <div key={id} className="bg-white border border-purple-200 rounded-xl px-4 py-3">
                          <div className="flex items-center gap-3">
                            {prod.main_image
                              ? <img src={prod.main_image} alt={prod.name} className="w-9 h-11 object-cover rounded-lg border border-slate-200 flex-shrink-0" />
                              : <div className="w-9 h-11 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0"><BookOpen className="w-4 h-4 text-purple-400" /></div>
                            }
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-900 truncate">{prod.name}</p>
                              {/* Always-editable price input */}
                              <div className="flex items-center gap-1 mt-1">
                                <span className="text-xs text-slate-400 font-semibold">&#8377;</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={customPrice}
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) => setCustomPrice(id, e.target.value)}
                                  onBlur={(e) => {
                                    if (e.target.value === "" || isNaN(parseFloat(e.target.value))) {
                                      const prod = catalogProducts.find((p) => String(p.id) === String(id));
                                      setCustomPrice(id, String(prod ? (prod.price || prod.mrp || 0) : 0));
                                    }
                                  }}
                                  className="w-24 text-xs font-bold border border-slate-200 hover:border-purple-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-lg px-2 py-1 outline-none transition-all bg-slate-50 focus:bg-white"
                                />
                                <span className="text-[10px] text-slate-400">each</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button type="button" onClick={() => changeQty(id, -1)} className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-purple-100 rounded-lg cursor-pointer"><Minus className="w-3.5 h-3.5" /></button>
                              <input
                                type="number"
                                min="1"
                                value={qty}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => setQty(id, e.target.value)}
                                onBlur={(e) => {
                                  if (e.target.value === "" || parseInt(e.target.value, 10) < 1 || isNaN(parseInt(e.target.value, 10))) {
                                    setQty(id, "1");
                                  }
                                }}
                                className="w-12 text-center text-sm font-bold border border-slate-300 rounded-lg py-1.5 outline-none focus:ring-1 focus:ring-purple-400"
                              />
                              <button type="button" onClick={() => changeQty(id, 1)} className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-purple-100 rounded-lg cursor-pointer"><Plus className="w-3.5 h-3.5" /></button>
                            </div>
                            <span className="text-sm font-bold text-slate-800 w-16 text-right shrink-0">&#8377;{((Number(customPrice) || 0) * (Number(qty) || 0)).toFixed(0)}</span>
                            <button type="button" onClick={() => toggleBook(id, customPrice)} className="p-1.5 text-slate-300 hover:text-red-500 cursor-pointer shrink-0 rounded-md hover:bg-red-50"><X className="w-4 h-4" /></button>
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex justify-end pt-1">
                      <span className="text-sm font-bold text-purple-900 bg-purple-50 border border-purple-200 px-4 py-2 rounded-xl">Grand Total: &#8377;{calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Shipping Address */}
              <div className="space-y-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-purple-600" /> Shipping Address <span className="text-red-500">*</span>
                </p>
                <input type="text" required placeholder="Street / House / Flat / Landmark" value={street} onChange={(e) => setStreet(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:bg-white outline-none transition-all" />
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Pincode <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input type="text" required maxLength={6} placeholder="600001" value={pincode}
                        onChange={(e) => { setPincode(e.target.value.replace(/\D/g, "").slice(0, 6)); setPincodeResolved(false); setCity(""); setStateVal(""); }}
                        className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:border-purple-500 focus:bg-white outline-none pr-8 transition-all" />
                      {pincodeLoading && <RefreshCw className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 animate-spin" />}
                      {pincodeResolved && !pincodeLoading && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-sm">✓</span>}
                    </div>
                    {pincodeError && <p className="text-[10px] text-red-500 mt-1">{pincodeError}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">City {pincodeResolved && <span className="text-emerald-600 text-[10px] font-normal">(auto)</span>} <span className="text-red-500">*</span></label>
                    <input type="text" required placeholder="Chennai" value={city} onChange={(e) => setCity(e.target.value)} readOnly={pincodeResolved}
                      className={`w-full px-3.5 py-3 border rounded-xl text-sm font-semibold outline-none transition-all ${pincodeResolved ? "bg-emerald-50 border-emerald-200 text-emerald-800 cursor-not-allowed" : "bg-slate-50 border-slate-200 focus:border-purple-500 focus:bg-white"}`} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">State {pincodeResolved && <span className="text-emerald-600 text-[10px] font-normal">(auto)</span>} <span className="text-red-500">*</span></label>
                    <input type="text" required placeholder="Tamil Nadu" value={stateVal} onChange={(e) => setStateVal(e.target.value)} readOnly={pincodeResolved}
                      className={`w-full px-3.5 py-3 border rounded-xl text-sm font-semibold outline-none transition-all ${pincodeResolved ? "bg-emerald-50 border-emerald-200 text-emerald-800 cursor-not-allowed" : "bg-slate-50 border-slate-200 focus:border-purple-500 focus:bg-white"}`} />
                  </div>
                </div>
              </div>

              {/* Payment Option */}
              <div className="space-y-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-purple-600" /> Payment Option <span className="text-red-500">*</span>
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {/* Paid */}
                  <label className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === "PAID" ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"}`}>
                    <input type="radio" name="paymentMethod" value="PAID" checked={paymentMethod === "PAID"} onChange={() => setPaymentMethod("PAID")} className="sr-only" />
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl ${paymentMethod === "PAID" ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">Paid</div>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Payment already received. Order confirmed immediately.</p>
                      </div>
                    </div>
                  </label>
                  {/* Pay Later */}
                  <label className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === "PAY_LATER" ? "border-amber-500 bg-amber-50" : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"}`}>
                    <input type="radio" name="paymentMethod" value="PAY_LATER" checked={paymentMethod === "PAY_LATER"} onChange={() => setPaymentMethod("PAY_LATER")} className="sr-only" />
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl ${paymentMethod === "PAY_LATER" ? "bg-amber-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">Pay Later</div>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Payment pending. Order placed as pending until paid.</p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Upload Payment Screenshots */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-purple-600" /> Payment Screenshots <span className="text-slate-400 text-[10px] font-normal normal-case tracking-normal">(optional)</span>
                </p>
                <input type="file" accept="image/*" multiple ref={fileRef} onChange={handleScreenshotChange} className="hidden" />
                {screenshotFiles.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {screenshotFiles.map((s, i) => (
                      <div key={i} className="relative">
                        <img src={s.preview} alt={`Screenshot ${i + 1}`} className="h-28 w-28 object-cover rounded-2xl border border-slate-200 shadow-sm" />
                        <button
                          type="button"
                          onClick={() => removeScreenshot(i)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-sm cursor-pointer transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        {uploadingScreenshot && !s.url && (
                          <div className="absolute inset-0 bg-white/60 rounded-2xl flex items-center justify-center">
                            <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                          </div>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="h-28 w-28 border-2 border-dashed border-slate-200 hover:border-purple-400 rounded-2xl flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-purple-600 transition-all cursor-pointer"
                    >
                      <Plus className="w-5 h-5" />
                      <span className="text-[10px] font-semibold">Add more</span>
                    </button>
                  </div>
                )}
                {screenshotFiles.length === 0 && (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full border-2 border-dashed border-slate-200 hover:border-purple-400 rounded-2xl py-8 flex flex-col items-center gap-2 text-slate-400 hover:text-purple-600 transition-all cursor-pointer group"
                  >
                    <ImageIcon className="w-8 h-8 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-semibold">Click to upload payment screenshots</span>
                    <span className="text-xs">Multiple images allowed · PNG, JPG up to 5MB each</span>
                  </button>
                )}
              </div>

              {/* Description */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-purple-600" /> Description <span className="text-slate-400 text-[10px] font-normal normal-case tracking-normal">(optional)</span>
                </p>
                <textarea
                  rows={3}
                  placeholder="Add any notes about this order, payment reference, special instructions..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium resize-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:bg-white outline-none transition-all"
                />
              </div>

            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 sm:p-8 pt-0 border-t border-slate-100">
              <button type="button" onClick={() => router.push("/admin/orders")} className="flex-1 py-3.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer">Cancel</button>
              <button type="submit" disabled={loading || uploadingScreenshot} className="flex-1 py-3.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all cursor-pointer shadow-md inline-flex items-center justify-center gap-2">
                {loading || uploadingScreenshot ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
                {loading ? "Creating Order..." : uploadingScreenshot ? "Uploading..." : `Place Order — ${paymentMethod === "PAID" ? "Paid" : "Pay Later"}`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
