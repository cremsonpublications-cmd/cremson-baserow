"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "../../context/AppContext";
import { getEffectiveUnitPrice, getItemTotalPrice } from "../../lib/utils/pricing";
import { useCoupons, useProducts } from "../../lib/api/hooks";
import { ChevronDown, ChevronUp, Minus, Plus, Tag, Check, AlertCircle } from "lucide-react";
import api from "../../lib/api/axios";

function CartSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row space-y-5 lg:space-y-0 lg:space-x-5 items-start animate-pulse">
      {/* Left: cart items skeleton */}
      <div className="w-full p-3.5 md:px-6 flex flex-col space-y-4 md:space-y-6 rounded-[20px] border border-black/10">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            {i > 1 && <hr className="border-t-black/10 mb-4 md:mb-6" />}
            <div className="flex items-start space-x-4">
              <div className="bg-gray-200 rounded-lg w-[100px] min-w-[100px] sm:w-[124px] sm:min-w-[124px] aspect-square" />
              <div className="flex-1 space-y-3 py-1">
                <div className="h-5 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="flex justify-between items-center pt-2">
                  <div className="h-7 bg-gray-200 rounded w-20" />
                  <div className="h-9 bg-gray-200 rounded-full w-28" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Right: summary skeleton */}
      <div className="w-full lg:max-w-[505px] p-5 md:px-6 flex flex-col space-y-5 rounded-[20px] border border-black/10">
        <div className="h-7 bg-gray-200 rounded w-2/5" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex justify-between">
              <div className="h-5 bg-gray-200 rounded w-1/3" />
              <div className="h-5 bg-gray-200 rounded w-1/4" />
            </div>
          ))}
        </div>
        <div className="h-12 bg-gray-200 rounded-full w-full" />
        <div className="h-14 bg-gray-200 rounded-full w-full" />
      </div>
    </div>
  );
}

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, authLoading, user, appliedCoupon, setAppliedCoupon, showToast } = useApp();
  const router = useRouter();
  const [promoInput, setPromoInput] = useState("");
  const [showCoupons, setShowCoupons] = useState(false);
  const [promoError, setPromoError] = useState("");
  const hasOutOfStockItems = useMemo(() => cart.some((item) => item.product?.stockStatus === "out_of_stock"), [cart]);

  // Fetch shipping config from API — no hardcoded values
  const [shippingConfig, setShippingConfig] = useState(null);
  useEffect(() => {
    api.get("/api/shipping-settings/active")
      .then(({ data }) => setShippingConfig(data))
      .catch(() => setShippingConfig({ shipping_charge: 0, free_delivery_threshold: 0 }));
  }, []);

  // Fetch coupons & products from backend API
  const { data: couponsData } = useCoupons();
  const { data: productsData } = useProducts();

  const allProducts = useMemo(() => {
    return Array.isArray(productsData) ? productsData : (productsData?.results ?? productsData?.items ?? []);
  }, [productsData]);

  const getProductTitles = useMemo(() => {
    return (productIds) => {
      if (!Array.isArray(productIds) || productIds.length === 0) return "";
      const titles = productIds.map((id) => {
        const cartItem = cart.find((item) => String(item.product?.id) === String(id));
        if (cartItem?.product?.title) return cartItem.product.title;
        const prodItem = allProducts.find((p) => String(p.id) === String(id));
        return prodItem?.title || prodItem?.name || `Book #${id}`;
      });
      return titles.join(", ");
    };
  }, [cart, allProducts]);

  const availableCoupons = useMemo(() => {
    const apiCoupons = (couponsData?.results ?? couponsData?.items ?? []).map((c) => {
      const rawApp = c.applicable_products || c.product_ids;
      let applicableProducts = [];
      if (rawApp) {
        try {
          applicableProducts = typeof rawApp === "string" ? JSON.parse(rawApp) : rawApp;
        } catch (e) {
          applicableProducts = String(rawApp).split(",").map((s) => s.trim()).filter(Boolean);
        }
      }

      const rawCode = typeof c.code === "object" ? (c.code?.value || c.code?.name || "") : String(c.code || "").trim();
      const rawType = typeof c.discount_type === "object" ? (c.discount_type?.value || c.discount_type?.name || "percentage") : String(c.discount_type || "percentage");
      const valNum = Number(c.discount_value ?? c.discount_percentage ?? 0);
      const benefitText = typeof c.benefit === "string" ? c.benefit : typeof c.benefits === "string" ? c.benefits : "";

      const now = new Date();
      const startDate = (c.start_date || c.valid_from) ? new Date(c.start_date || c.valid_from) : null;
      const endDate = (c.end_date || c.valid_until || c.expiration_date) ? new Date(c.end_date || c.valid_until || c.expiration_date) : null;

      let isExpired = false;
      if (startDate && !isNaN(startDate.getTime()) && now < startDate) isExpired = true;
      if (endDate && !isNaN(endDate.getTime()) && now > endDate) isExpired = true;

      return {
        code: rawCode,
        description: benefitText || (rawType.toLowerCase() === "percentage" ? `${valNum}% off` : `Flat ₹${valNum} off`),
        discountType: rawType,
        value: valNum,
        minOrder: (c.minimum_order_amount ?? c.min_order_amount) ? Number(c.minimum_order_amount ?? c.min_order_amount) : null,
        maxDiscountAmount: (c.max_discount_amount ?? c.max_discount) ? Number(c.max_discount_amount ?? c.max_discount) : null,
        showInUi: c.show_in_ui ?? true,
        freeDelivery: c.free_delivery ?? false,
        firstOrderOnly: Boolean(c.first_order_only),
        isActive: (c.is_active ?? c.active ?? true) && !isExpired,
        applicableProducts: Array.isArray(applicableProducts) ? applicableProducts.map(String) : [],
        endDate: endDate && !isNaN(endDate.getTime()) ? endDate : null,
      };
    }).filter((c) => c.isActive && c.code);

    return apiCoupons;
  }, [couponsData]);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + getItemTotalPrice(item.product, item.quantity), 0);
  }, [cart]);

  const totalQuantity = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const rawDeliveryCharges = useMemo(() => {
    if (subtotal === 0) return 0;
    if (!shippingConfig) return 0; // not loaded yet
    const charge = shippingConfig.shipping_charge ?? 0;
    const threshold = shippingConfig.free_delivery_threshold ?? 0;
    if (threshold > 0 && subtotal >= threshold) return 0;
    return charge;
  }, [subtotal, shippingConfig]);

  const deliveryCharges = useMemo(() => {
    if (!appliedCoupon) return rawDeliveryCharges;
    if (appliedCoupon.freeDelivery) return 0;
    return rawDeliveryCharges;
  }, [rawDeliveryCharges, appliedCoupon]);

  const promoDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;

    let baseAmount = subtotal;
    if (appliedCoupon.applicableProducts && appliedCoupon.applicableProducts.length > 0) {
      const eligibleItems = cart.filter((item) =>
        appliedCoupon.applicableProducts.includes(String(item.product.id))
      );
      baseAmount = eligibleItems.reduce((sum, item) => sum + getItemTotalPrice(item.product, item.quantity), 0);
      if (baseAmount === 0) return 0;
    }

    let disc = 0;
    const typeLower = String(appliedCoupon.discountType || "").toLowerCase();
    if (typeLower === "percentage") {
      disc = (baseAmount * appliedCoupon.value) / 100;
      if (appliedCoupon.maxDiscountAmount && appliedCoupon.maxDiscountAmount > 0) {
        disc = Math.min(disc, appliedCoupon.maxDiscountAmount);
      }
    } else if (typeLower.includes("fixed")) {
      if (appliedCoupon.minOrder && subtotal < appliedCoupon.minOrder) return 0;
      disc = Math.min(appliedCoupon.value, baseAmount);
    }

    return Math.round(disc);
  }, [appliedCoupon, subtotal, cart]);

  React.useEffect(() => {
    if (appliedCoupon) {
      const isStillAvailable = availableCoupons.some(
        (c) => c.code.toUpperCase() === appliedCoupon.code.toUpperCase()
      );
      if (!isStillAvailable) {
        setAppliedCoupon(null);
        return;
      }
      if (appliedCoupon.minOrder && subtotal < appliedCoupon.minOrder) {
        setAppliedCoupon(null);
        return;
      }
      if (appliedCoupon.applicableProducts && appliedCoupon.applicableProducts.length > 0) {
        const hasEligible = cart.some((item) =>
          appliedCoupon.applicableProducts.includes(String(item.product.id))
        );
        if (!hasEligible) {
          setAppliedCoupon(null);
        }
      }
    }
  }, [subtotal, cart, appliedCoupon, setAppliedCoupon, availableCoupons]);

  const finalTotal = useMemo(() => {
    return Math.max(0, subtotal + deliveryCharges - promoDiscount);
  }, [subtotal, deliveryCharges, promoDiscount]);

  async function checkFirstOrderValidity(coupon) {
    if (!coupon.firstOrderOnly) return { valid: true };
    if (user && user.email) {
      try {
        const res = await api.get(`/api/orders/?email=${encodeURIComponent(user.email)}`);
        const orders = res.data?.results ?? res.data?.items ?? (Array.isArray(res.data) ? res.data : []);
        const placedOrders = orders.filter((o) => {
          const status = String(o.order_status || o.status || "").toLowerCase();
          return status !== "cancelled" && status !== "failed";
        });
        if (placedOrders.length > 0) {
          return {
            valid: false,
            reason: "This coupon is valid only for your first order.",
          };
        }
      } catch (err) {
        console.warn("Could not verify order history for coupon:", err);
      }
    }
    return { valid: true };
  }

  const handleApplyPromo = async () => {
    const trimmedCode = promoInput.trim().toUpperCase();
    const coupon = availableCoupons.find((c) => c.code.toUpperCase() === trimmedCode);
    if (!coupon) { setPromoError("Invalid or expired promo code"); return; }
    if (coupon.minOrder && subtotal < coupon.minOrder) {
      setPromoError(`This coupon requires a minimum order of ₹${coupon.minOrder}`);
      return;
    }
    if (coupon.firstOrderOnly) {
      const check = await checkFirstOrderValidity(coupon);
      if (!check.valid) {
        setPromoError(check.reason);
        return;
      }
    }
    if (coupon.applicableProducts && coupon.applicableProducts.length > 0) {
      const hasEligible = cart.some((item) =>
        coupon.applicableProducts.includes(String(item.product.id))
      );
      if (!hasEligible) {
        const bookTitles = getProductTitles(coupon.applicableProducts);
        setPromoError(`This coupon is only valid for: "${bookTitles}". Please add the book to your cart.`);
        return;
      }
    }
    setPromoError("");
    setAppliedCoupon(coupon);
    setPromoInput("");
    showToast(`Coupon ${coupon.code} applied!`, "success");
  };

  const handleRemovePromo = () => { setAppliedCoupon(null); setPromoError(""); };

  const handleCouponSelect = async (coupon) => {
    if (coupon.minOrder && subtotal < coupon.minOrder) {
      setPromoError(`This coupon requires a minimum order of ₹${coupon.minOrder}`);
      showToast(`Requires minimum order of ₹${coupon.minOrder}`, "error");
      return;
    }
    if (coupon.firstOrderOnly) {
      const check = await checkFirstOrderValidity(coupon);
      if (!check.valid) {
        setPromoError(check.reason);
        showToast(check.reason, "error");
        return;
      }
    }
    if (coupon.applicableProducts && coupon.applicableProducts.length > 0) {
      const hasEligible = cart.some((item) =>
        coupon.applicableProducts.includes(String(item.product?.id))
      );
      if (!hasEligible) {
        const bookTitles = getProductTitles(coupon.applicableProducts);
        setPromoError(`This coupon is only valid for: "${bookTitles}". Please add the book to your cart.`);
        showToast(`Please add "${bookTitles}" to your cart to use this coupon`, "error");
        return;
      }
    }
    setPromoError("");
    setAppliedCoupon(coupon);
    setPromoInput("");
    setShowCoupons(false);
    showToast(`Coupon ${coupon.code} applied!`, "success");
  };

  return (
    <main className="pb-20">
      <div className="max-w-7xl mx-auto px-4 md:px-10 xl:px-12 mt-6">
        {/* Breadcrumbs */}
        <nav aria-label="breadcrumb" className="mb-4 sm:mb-6 text-left">
          <ol className="flex flex-wrap items-center gap-1.5 break-words text-sm text-gray-500 sm:gap-2.5">
            <li className="inline-flex items-center gap-1.5">
              <Link className="transition-colors hover:text-black" href="/">Home</Link>
            </li>
            <li role="presentation" aria-hidden="true" className="text-gray-400">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.1584 3.13508C6.35985 2.94621 6.67627 2.95642 6.86514 3.15788L10.6151 7.15788C10.7954 7.3502 10.7954 7.64949 10.6151 7.84182L6.86514 11.8418C6.67627 12.0433 6.35985 12.0535 6.1584 11.8646C5.95694 11.6757 5.94673 11.3593 6.1356 11.1579L9.565 7.49985L6.1356 3.84182C5.94673 3.64036 5.95694 3.32394 6.1584 3.13508Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
              </svg>
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span role="link" aria-disabled="true" aria-current="page" className="font-normal text-black font-semibold">Cart</span>
            </li>
          </ol>
        </nav>

        <h2 className="font-integralCF font-bold text-2xl sm:text-[32px] md:text-[40px] text-black uppercase mb-5 md:mb-6 text-left">
          your cart
        </h2>

        {authLoading ? (
          <CartSkeleton />
        ) : cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-gray-200 rounded-3xl text-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300 mb-4 animate-pulse">
              <circle cx="8" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
            </svg>
            <h3 className="text-xl font-semibold mb-2 text-gray-700">Your cart is empty</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm">
              You haven't added any books to your cart yet. Explore our store to find what you need.
            </p>
            <Link href="/shop">
              <button className="px-6 py-2.5 bg-black text-white rounded-full font-semibold text-sm transition-all hover:bg-black/80 cursor-pointer">
                Shop Books
              </button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row space-y-5 lg:space-y-0 lg:space-x-5 items-start">
            {/* LEFT SIDE: CART ITEMS */}
            <div className="w-full p-3.5 md:px-6 flex flex-col space-y-4 md:space-y-6 rounded-[20px] border border-black/10">
              {cart.map((item, index) => {
                const book = item.product;
                return (
                  <div key={item.rowId ?? book.id}>
                    {index > 0 && <hr className="border-t-black/10 mb-4 md:mb-6" />}
                    <div className="flex items-start space-x-4">
                      <Link
                        className="bg-transparent border border-gray-100 rounded-lg w-full min-w-[100px] max-w-[100px] sm:max-w-[124px] aspect-square overflow-hidden flex items-center justify-center p-2"
                        href={`/shop/product/${book.id}`}
                      >
                        <img
                          src={book.image || null}
                          className="rounded-md max-h-full max-w-full object-contain hover:scale-110 transition-all duration-500"
                          alt={book.title}
                        />
                      </Link>
                      <div className="flex w-full self-stretch flex-col text-left">
                        <div className="flex items-center justify-between">
                          <Link className="text-black font-bold text-base xl:text-xl line-clamp-1" href={`/shop/product/${book.id}`}>
                            {book.title}
                          </Link>
                          <button
                            onClick={() => removeFromCart(book.id, book.title)}
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-red-50 h-8 w-8 md:h-9 md:w-9 cursor-pointer"
                            aria-label="Remove item"
                          >
                            <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 256 256" className="text-xl md:text-2xl text-red-600" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                              <path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM112,168a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm0-120H96V40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8Z" />
                            </svg>
                          </button>
                        </div>
                        <div className="-mt-1">
                          <span className="text-black text-xs md:text-sm mr-1 font-medium">Author:</span>
                          <span className="text-black/60 text-xs md:text-sm">{book.author}</span>
                        </div>
                        <div className="mb-auto -mt-1">
                          <span className="text-black text-xs md:text-sm mr-1 font-medium">Category:</span>
                          <span className="text-black/60 text-xs md:text-sm">{book.category}</span>
                        </div>
                        {book.stockStatus === "out_of_stock" && (
                          <div className="mt-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
                              Out of Stock
                            </span>
                          </div>
                        )}
                        <div className="flex items-center flex-wrap justify-between mt-2">
                          {(() => {
                            const effectivePrice = getEffectiveUnitPrice(book, item.quantity);
                            const isBulkApplied = effectivePrice < book.price;
                            return (
                              <div className="flex flex-col text-left">
                                <div className="flex items-center space-x-[5px] xl:space-x-2.5">
                                  <span className="font-bold text-black text-xl xl:text-2xl">₹{effectivePrice}</span>
                                  {(isBulkApplied || book.originalPrice) && (
                                    <span className="font-bold text-black/40 line-through text-lg xl:text-xl">
                                      ₹{isBulkApplied ? (book.mrp || book.originalPrice || book.price) : book.originalPrice}
                                    </span>
                                  )}
                                </div>
                                {isBulkApplied && (
                                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 w-fit mt-0.5">
                                    Bulk Price Override
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                          <div className="flex items-center justify-between bg-gray-900 text-white rounded-full px-3 h-8 md:h-10 min-w-[105px] max-w-[105px] sm:max-w-32 shadow-md">
                            <button onClick={() => updateQuantity(book.id, -1)} className="hover:bg-white/20 rounded-full p-1 transition-all duration-200 cursor-pointer" aria-label="Decrease quantity">
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-sm font-semibold select-none">{item.quantity}</span>
                            <button onClick={() => updateQuantity(book.id, 1)} className="hover:bg-white/20 rounded-full p-1 transition-all duration-200 cursor-pointer" aria-label="Increase quantity">
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* RIGHT SIDE: CART SUMMARY */}
            <div className="w-full lg:max-w-[505px] p-5 md:px-6 flex flex-col space-y-4 md:space-y-6 rounded-[20px] border border-black/10 text-left">
              <h6 className="text-xl md:text-2xl font-bold text-black">Cart Summary</h6>
              <div className="flex flex-col space-y-5">
                <div className="flex items-center justify-between">
                  <span className="md:text-xl text-black/60">Total Items</span>
                  <span className="md:text-xl font-bold">{cart.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="md:text-xl text-black/60">Total Quantity</span>
                  <span className="md:text-xl font-bold">{totalQuantity}</span>
                </div>
                <hr className="border-t-black/10" />
                <div className="flex items-center justify-between">
                  <span className="md:text-xl text-black/60">Subtotal</span>
                  <span className="text-xl md:text-2xl font-bold">₹{subtotal}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="md:text-xl text-black/60">Delivery Charges</span>
                    {deliveryCharges === 0 && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-semibold">FREE</span>
                    )}
                  </div>
                  <span className="text-xl md:text-2xl font-bold">
                    {deliveryCharges === 0 ? <span className="text-green-600">FREE</span> : `₹${deliveryCharges}`}
                  </span>
                </div>
                {shippingConfig && subtotal > 0 && deliveryCharges > 0 && subtotal < (shippingConfig.free_delivery_threshold ?? 0) && (
                  <div className="text-xs text-gray-600 bg-orange-50 p-2.5 rounded border border-orange-100">
                    💡 Add <b>₹{(shippingConfig.free_delivery_threshold ?? 0) - subtotal}</b> more to get <b>FREE delivery</b>!
                  </div>
                )}
                {shippingConfig && subtotal > 0 && subtotal >= (shippingConfig.free_delivery_threshold ?? 0) && (
                  <div className="text-xs text-green-700 bg-green-50 p-2.5 rounded border border-green-100">
                    🚚 Free delivery applied (order above ₹{shippingConfig.free_delivery_threshold ?? 0})
                  </div>
                )}
                {promoDiscount > 0 && (
                  <div className="flex items-center justify-between text-green-600">
                    <span className="md:text-xl">Discount ({appliedCoupon?.code})</span>
                    <span className="text-xl md:text-2xl font-bold">-₹{promoDiscount}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-black/10">
                  <span className="md:text-xl text-black font-semibold">Final Total</span>
                  <span className="text-xl md:text-2xl font-bold">₹{finalTotal}</span>
                </div>
              </div>

              {/* Promo input */}
              <div className="space-y-4">
                <div className="flex space-x-3">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between w-full bg-green-50 text-green-800 px-4 py-2.5 rounded-2xl border border-green-200">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold flex items-center gap-1.5">
                          <Tag className="w-4 h-4 text-green-600" />
                          {appliedCoupon.code} Applied
                        </span>
                        {appliedCoupon.applicableProducts?.length > 0 && (
                          <span className="text-xs text-green-700 font-medium">
                            Valid on: {getProductTitles(appliedCoupon.applicableProducts)}
                          </span>
                        )}
                      </div>
                      <button onClick={handleRemovePromo} className="text-xs font-bold text-red-600 hover:text-red-800 uppercase cursor-pointer">
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="input-group focus-within:shadow-lg pl-4 transition-all relative flex items-center w-full rounded-full overflow-hidden bg-[#F0F0F0] flex-1">
                        <div className="input-group-text mr-3">
                          <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" className="text-black/40 text-2xl" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                            <path fill="none" d="M0 0h24v24H0V0z" />
                            <path d="m21.41 11.58-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58s1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41s-.23-1.06-.59-1.42zM13 20.01 4 11V4h7v-.01l9 9-7 7.02z" />
                            <circle cx="6.5" cy="6.5" r="1.5" />
                          </svg>
                        </div>
                        <input
                          className="input-control w-full py-3 pr-4 outline-none placeholder:font-normal placeholder:text-sm bg-transparent placeholder:text-black/40 text-black"
                          autoComplete="off" autoCorrect="off" spellCheck="false"
                          type="text" name="code" placeholder="Add promo code"
                          value={promoInput} onChange={(e) => setPromoInput(e.target.value)}
                        />
                      </div>
                      <button
                        onClick={handleApplyPromo}
                        disabled={!promoInput.trim()}
                        className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none text-white shadow hover:bg-black/90 px-4 py-2 bg-black rounded-full w-full max-w-[119px] h-[48px] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        type="button"
                      >
                        Apply
                      </button>
                    </>
                  )}
                </div>
                {promoError && <p className="text-xs text-red-600 mt-1">{promoError}</p>}

                <div className="border-t border-gray-200 pt-4">
                  <button
                    onClick={() => setShowCoupons(!showCoupons)}
                    className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 hover:text-black cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-tag">
                        <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
                        <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
                      </svg>
                      Available Coupons ({availableCoupons.filter((c) => c.showInUi !== false).length})
                    </span>
                    {showCoupons ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {showCoupons && (
                    <div className="mt-3 space-y-2 text-left">
                      {availableCoupons.filter((c) => c.showInUi !== false).map((coupon) => {
                        const hasProductRestriction = coupon.applicableProducts && coupon.applicableProducts.length > 0;
                        const hasEligibleInCart = !hasProductRestriction || cart.some((item) => coupon.applicableProducts.includes(String(item.product.id)));
                        const isMinOrderMet = !coupon.minOrder || subtotal >= coupon.minOrder;
                        const isDisabled = !isMinOrderMet || !hasEligibleInCart;

                        return (
                          <div
                            key={coupon.code}
                            className={`p-3 rounded-lg border text-xs flex flex-col gap-1 transition-all ${isDisabled ? "bg-gray-50/80 border-gray-200 text-gray-400 hover:border-amber-300 cursor-pointer" : "bg-orange-50/30 border-orange-100 hover:border-orange-200 cursor-pointer"}`}
                            onClick={() => handleCouponSelect(coupon)}
                          >
                            <div className="flex items-center justify-between font-bold">
                              <span className={isDisabled ? "text-gray-400 font-mono" : "text-orange-600 font-mono"}>{coupon.code}</span>
                              {!isDisabled && <span className="text-xs text-orange-500 font-medium">Click to apply</span>}
                            </div>
                            <p className={isDisabled ? "text-gray-400" : "text-gray-600"}>{coupon.description}</p>
                            {hasProductRestriction && (
                              <p className={`text-xs font-medium ${!hasEligibleInCart ? "text-amber-600 font-semibold" : "text-amber-700"}`}>
                                📦 Valid only for: <span className="font-bold underline">{getProductTitles(coupon.applicableProducts)}</span>{!hasEligibleInCart ? " (add to cart to apply)" : ""}
                              </p>
                            )}
                            {coupon.minOrder && (
                              <p className="text-xs text-gray-500 italic">* Requires order minimum of ₹{coupon.minOrder}</p>
                            )}
                            {coupon.maxDiscountAmount && coupon.discountType?.toLowerCase() === "percentage" && (
                              <p className="text-xs text-purple-700 italic">* Maximum discount capped at ₹{coupon.maxDiscountAmount}</p>
                            )}
                            {coupon.firstOrderOnly && (
                              <p className="text-xs text-amber-700 font-semibold flex items-center gap-1">
                                ⚡ Valid for 1st order only
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {hasOutOfStockItems && (
                <div className="bg-red-50 text-red-800 text-xs font-medium p-3.5 rounded-2xl border border-red-200">
                  ⚠️ Some items in your cart are currently out of stock. Please remove them to proceed with checkout.
                </div>
              )}

              <button
                type="button"
                disabled={hasOutOfStockItems}
                onClick={() => user ? router.push("/checkout") : router.push("/auth/signin?redirect=/cart")}
                className={`inline-flex items-center justify-center whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-white shadow px-4 text-sm md:text-base font-medium rounded-full w-full py-4 h-[54px] md:h-[60px] group ${hasOutOfStockItems ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600 cursor-pointer"}`}
              >
                Go to Checkout (₹{finalTotal}){" "}
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" className="text-xl ml-2 group-hover:translate-x-1 transition-all" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                  <path d="M438.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.8 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l306.7 0L233.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
