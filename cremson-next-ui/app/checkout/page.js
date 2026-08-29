"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "../../context/AppContext";
import { Mail, User, CreditCard, Shield, Truck, ChevronDown, Plus, MapPin, PackageCheck, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import api from "../../lib/api/axios";
import { getAddresses, addAddress } from "../../lib/api/addresses";
import { getEffectiveUnitPrice, getItemTotalPrice } from "../../lib/utils/pricing";

// Load Razorpay script once
function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const { cart, setCart, clearCart, showToast, user, authToken, authLoading, appliedCoupon, setAppliedCoupon } = useApp();
  const router = useRouter();

  // Auth guard — redirect to signin if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth/signin?redirect=/checkout");
    }
  }, [authLoading, user, router]);

  // Form states
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [country, setCountry] = useState("India");
  const [streetAddress, setStreetAddress] = useState("");
  const [apartment, setApartment] = useState("");
  const [city, setCity] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [pincode, setPincode] = useState("");
  const [phone, setPhone] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [verifyingStep, setVerifyingStep] = useState("Verifying payment security...");

  // Shipping config from API — no hardcoded fallbacks, values come from admin settings
  const [shippingConfig, setShippingConfig] = useState(null);
  useEffect(() => {
    api.get("/api/shipping-settings/active")
      .then(({ data }) => setShippingConfig(data))
      .catch(() => setShippingConfig({ shipping_charge: 0, free_delivery_threshold: 0 }));
  }, []);

  // Saved Addresses State
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [isAddressesLoading, setIsAddressesLoading] = useState(false);
  const [saveNewAddress, setSaveNewAddress] = useState(true);
  const [newAddressLabel, setNewAddressLabel] = useState("Home");

  // Autofill user email
  useEffect(() => {
    if (user && user.email) {
      setEmail(user.email);
    }
  }, [user]);

  const [isPincodeLoading, setIsPincodeLoading] = useState(false);

  useEffect(() => {
    if (pincode && pincode.length === 6) {
      const fetchPincodeDetails = async () => {
        setIsPincodeLoading(true);
        try {
          const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
          const data = await res.json();
          if (data && data[0] && data[0].Status === "Success") {
            const postOffices = data[0].PostOffice;
            if (postOffices && postOffices.length > 0) {
              const po = postOffices[0];
              const rawCity = po.District || po.Circle || po.Region || "";
              const rawState = po.State || "";

              // Clean city name using the metro mapping
              const p = pincode.replace(/\D/g, "").trim();
              const c = String(rawCity || "").toLowerCase().trim();
              let cleanedCity = rawCity;
              if (p.startsWith("11") || c.includes("delhi")) cleanedCity = "Delhi";
              else if (p.startsWith("400") || c.includes("mumbai")) cleanedCity = "Mumbai";
              else if (p.startsWith("560") || c.includes("bangalore") || c.includes("bengaluru")) cleanedCity = "Bengaluru";
              else if (p.startsWith("600") || c.includes("chennai") || c.includes("madras")) cleanedCity = "Chennai";
              else if (p.startsWith("500") || c.includes("hyderabad") || c.includes("secunderabad")) cleanedCity = "Hyderabad";
              else if (p.startsWith("700") || c.includes("kolkata") || c.includes("calcutta")) cleanedCity = "Kolkata";
              else if (p.startsWith("411") || p.startsWith("412") || c.includes("pune")) cleanedCity = "Pune";
              else if (p.startsWith("380") || c.includes("ahmedabad")) cleanedCity = "Ahmedabad";

              setCity(cleanedCity);

              // Find matching state in statesList
              const matchedState = statesList.find(
                (st) => st.toLowerCase() === rawState.toLowerCase()
              );
              if (matchedState) {
                setSelectedState(matchedState);
              } else if (rawState) {
                setSelectedState(rawState);
              }
            }
          }
        } catch (e) {
          console.error("Failed to look up pincode", e);
        } finally {
          setIsPincodeLoading(false);
        }
      };
      fetchPincodeDetails();
    }
  }, [pincode]);

  // Load user saved addresses
  useEffect(() => {
    if (!authToken) return;
    setIsAddressesLoading(true);
    getAddresses(authToken)
      .then((data) => {
        setSavedAddresses(data);
        const defaultAddr = data.find((addr) => addr.is_default) || data[0];
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
          setFirstName(defaultAddr.first_name || "");
          setLastName(defaultAddr.last_name || "");
          setCompanyName(defaultAddr.company || "");
          setStreetAddress(defaultAddr.street_address || "");
          setApartment(defaultAddr.apartment || "");
          setCity(defaultAddr.city || "");
          setSelectedState(defaultAddr.state || "");
          setPincode(defaultAddr.pin_code || "");
          setPhone(defaultAddr.phone || "");
        } else {
          setSelectedAddressId("new");
        }
      })
      .catch(console.error)
      .finally(() => setIsAddressesLoading(false));
  }, [authToken]);

  const handleAddressSelect = (id) => {
    setSelectedAddressId(id);
    if (id === "new") {
      setFirstName("");
      setLastName("");
      setCompanyName("");
      setStreetAddress("");
      setApartment("");
      setCity("");
      setSelectedState("");
      setPincode("");
      setPhone("");
    } else {
      const addr = savedAddresses.find((a) => a.id === id);
      if (addr) {
        setFirstName(addr.first_name || "");
        setLastName(addr.last_name || "");
        setCompanyName(addr.company || "");
        setStreetAddress(addr.street_address || "");
        setApartment(addr.apartment || "");
        setCity(addr.city || "");
        setSelectedState(addr.state || "");
        setPincode(addr.pin_code || "");
        setPhone(addr.phone || "");
      }
    }
  };

  // States list for India
  const statesList = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Delhi",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
  ];

  // Calculations
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
    } else if (typeLower.includes("fixed")) {
      if (appliedCoupon.minOrder && subtotal < appliedCoupon.minOrder) return 0;
      disc = Math.min(appliedCoupon.value, baseAmount);
    }

    return Math.round(disc);
  }, [appliedCoupon, subtotal, cart]);

  const finalTotal = useMemo(() => {
    return Math.max(0, subtotal + deliveryCharges - promoDiscount);
  }, [subtotal, deliveryCharges, promoDiscount]);

  const handlePay = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!email || !firstName || !lastName || !streetAddress || !city || !selectedState || !pincode || !phone) {
      setFormError("Please fill in all required fields.");
      return;
    }
    if (pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
      setFormError("PIN code must be exactly 6 digits.");
      return;
    }
    if (phone.length !== 10 || !/^\d{10}$/.test(phone)) {
      setFormError("Phone number must be exactly 10 digits.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Load Razorpay SDK
      const loaded = await loadRazorpay();
      if (!loaded) {
        setFormError("Failed to load payment gateway. Please check your connection.");
        setIsLoading(false);
        return;
      }

      // 2. Create order on FastAPI backend
      const { data: order } = await api.post("/api/payment/create-order", {
        amount: finalTotal,
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      });

      // 3. Open Razorpay checkout popup
      const options = {
        key:         order.key_id,
        amount:      order.amount,
        currency:    order.currency,
        name:        "Cremson Publications",
        description: `Order for ${totalQuantity} item${totalQuantity > 1 ? "s" : ""}`,
        order_id:    order.order_id,
        prefill: {
          name:    `${firstName} ${lastName}`,
          email:   email,
          contact: phone,
        },
        theme: { color: "#ef4444" },

        handler: async function (response) {
          setVerifyingPayment(true);
          setVerifyingStep("Verifying payment signature with bank...");

          try {
            setTimeout(() => {
              setVerifyingStep("Processing order & reserving items...");
            }, 800);

            setTimeout(() => {
              setVerifyingStep("Placing shipment & generating invoice...");
            }, 1800);

            const cleanedCity = (() => {
              if (!pincode) return city;
              const p = pincode.replace(/\D/g, "").trim();
              const c = String(city || "").toLowerCase().trim();
              if (p.startsWith("11") || c.includes("delhi")) return "Delhi";
              if (p.startsWith("400") || c.includes("mumbai")) return "Mumbai";
              if (p.startsWith("560") || c.includes("bangalore") || c.includes("bengaluru")) return "Bengaluru";
              if (p.startsWith("600") || c.includes("chennai") || c.includes("madras")) return "Chennai";
              if (p.startsWith("500") || c.includes("hyderabad") || c.includes("secunderabad")) return "Hyderabad";
              if (p.startsWith("700") || c.includes("kolkata") || c.includes("calcutta")) return "Kolkata";
              if (p.startsWith("411") || p.startsWith("412") || c.includes("pune")) return "Pune";
              if (p.startsWith("380") || c.includes("ahmedabad")) return "Ahmedabad";
              return city;
            })();

            const orderDetails = {
              order_status: "Confirmed",
              order_date: new Date().toISOString(),
              user_info: {
                name: `${firstName} ${lastName}`,
                email: email,
                phone: phone,
                userId: user?.id || `user_${Date.now()}`,
                address: {
                  city: cleanedCity,
                  state: selectedState,
                  street: streetAddress,
                  country: country,
                  pincode: pincode,
                  apartment: apartment || "",
                }
              },
              items: cart.map((item) => {
                const effectiveUnitPrice = getEffectiveUnitPrice(item.product, item.quantity);
                return {
                  name: item.product.title,
                  author: item.product.author || "",
                  quantity: item.quantity,
                  productId: item.product.id,
                  totalPrice: getItemTotalPrice(item.product, item.quantity),
                  currentPrice: effectiveUnitPrice,
                  image: item.product.image || "",
                };
              }),
              order_summary: {
                subTotal: subtotal,
                grandTotal: finalTotal,
                discountTotal: promoDiscount,
                couponDiscount: promoDiscount,
                couponCode: appliedCoupon?.code || "",
                deliveryCharge: deliveryCharges,
              },
              delivery: {
                notes: "",
                status: "Confirmed"
              }
            };

            await api.post("/api/payment/verify", {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              ...orderDetails,
            });

            setVerifyingStep("Order placed successfully! Redirecting...");

            // Save address to profile if checkbox selected
            if (authToken && selectedAddressId === "new" && saveNewAddress) {
              try {
                await addAddress(authToken, {
                  label: newAddressLabel || "Other",
                  first_name: firstName,
                  last_name: lastName,
                  company: companyName,
                  street_address: streetAddress,
                  apartment: apartment,
                  city: city,
                  state: selectedState,
                  pin_code: pincode,
                  phone: phone,
                  country: country,
                  is_default: false,
                });
              } catch (e) {
                console.error("Failed to save address to profile", e);
              }
            }

            await new Promise((res) => setTimeout(res, 500));

            showToast("Payment successful! Order placed.", "success");
            clearCart();
            setAppliedCoupon(null);
            router.push("/my-orders");
          } catch {
            showToast("Payment done but verification failed. Contact support.", "error");
          } finally {
            setVerifyingPayment(false);
            setIsLoading(false);
          }
        },

        modal: {
          ondismiss: () => {
            setIsLoading(false);
            showToast("Payment cancelled.", "info");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", async function (response) {
        setIsLoading(false);
        showToast("Payment failed. Please try again.", "error");
        try {
          await api.post("/api/payment/failed", {
            phone: phone,
            name: `${firstName} ${lastName}`,
            amount: finalTotal,
            order_id: response.error?.metadata?.order_id || "DRAFT"
          });
        } catch (err) {
          console.error("Failed to log payment failure", err);
        }
      });
      rzp.open();

    } catch {
      setIsLoading(false);
      // API error toast shown automatically by axios interceptor
    }
  };

  return (
    <main className="pb-20">
      <div className="max-w-[1240px] mx-auto px-6 md:px-10 xl:px-12 py-8 text-left">
        {/* Breadcrumbs */}
        <nav aria-label="breadcrumb" className="mb-8">
          <ol className="flex flex-wrap items-center gap-1.5 break-words text-sm text-gray-500 sm:gap-2.5">
            <li className="inline-flex items-center gap-1.5">
              <Link className="transition-colors hover:text-black" href="/cart">
                Cart
              </Link>
            </li>
            <li role="presentation" aria-hidden="true" className="text-gray-400">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M6.1584 3.13508C6.35985 2.94621 6.67627 2.95642 6.86514 3.15788L10.6151 7.15788C10.7954 7.3502 10.7954 7.64949 10.6151 7.84182L6.86514 11.8418C6.67627 12.0433 6.35985 12.0535 6.1584 11.8646C5.95694 11.6757 5.94673 11.3593 6.1356 11.1579L9.565 7.49985L6.1356 3.84182C5.94673 3.64036 5.95694 3.32394 6.1584 3.13508Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                />
              </svg>
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span role="link" aria-disabled="true" aria-current="page" className="font-normal text-black font-semibold">
                Information
              </span>
            </li>
            <li role="presentation" aria-hidden="true" className="text-gray-400">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M6.1584 3.13508C6.35985 2.94621 6.67627 2.95642 6.86514 3.15788L10.6151 7.15788C10.7954 7.3502 10.7954 7.64949 10.6151 7.84182L6.86514 11.8418C6.67627 12.0433 6.35985 12.0535 6.1584 11.8646C5.95694 11.6757 5.94673 11.3593 6.1356 11.1579L9.565 7.49985L6.1356 3.84182C5.94673 3.64036 5.95694 3.32394 6.1584 3.13508Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                />
              </svg>
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span className="transition-colors text-gray-400 cursor-not-allowed select-none">
                Shipping
              </span>
            </li>
            <li role="presentation" aria-hidden="true" className="text-gray-400">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M6.1584 3.13508C6.35985 2.94621 6.67627 2.95642 6.86514 3.15788L10.6151 7.15788C10.7954 7.3502 10.7954 7.64949 10.6151 7.84182L6.86514 11.8418C6.67627 12.0433 6.35985 12.0535 6.1584 11.8646C5.95694 11.6757 5.94673 11.3593 6.1356 11.1579L9.565 7.49985L6.1356 3.84182C5.94673 3.64036 5.95694 3.32394 6.1584 3.13508Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                />
              </svg>
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span className="transition-colors text-gray-400 cursor-not-allowed select-none">
                Payment
              </span>
            </li>
          </ol>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-gray-200 rounded-3xl text-center bg-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-gray-300 mb-4"
            >
              <circle cx="8" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
            </svg>
            <h3 className="text-xl font-semibold mb-2 text-gray-700">No items to checkout</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm">
              Please add books to your shopping cart before proceeding to checkout.
            </p>
            <Link href="/shop">
              <button className="px-6 py-2.5 bg-black text-white rounded-full font-semibold text-sm transition-all hover:bg-black/80 cursor-pointer">
                Browse Books
              </button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handlePay} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Contact Information */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-gray-700" />
                  Contact Information
                </h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email address *</label>
                  <input
                    type="email"
                    name="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black/20 text-black bg-white"
                    required
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Billing Details */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-700" />
                  Billing Details
                </h2>

                {/* Saved Address Cards Selector */}
                {authToken && savedAddresses.length > 0 && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <h3 className="text-xs font-bold text-gray-550 uppercase tracking-wider mb-3 flex items-center gap-1.5 text-left">
                      <MapPin className="w-4 h-4 text-orange-500" /> Ship to a Saved Address
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      {savedAddresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id;
                        return (
                          <div
                            key={addr.id}
                            type="button"
                            onClick={() => handleAddressSelect(addr.id)}
                            className={`p-4 rounded-xl border-2 text-left cursor-pointer transition-all ${
                              isSelected
                                ? "border-orange-500 bg-orange-50/20 shadow-sm"
                                : "border-gray-200 bg-white hover:border-gray-300"
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <input
                                type="radio"
                                name="saved_address_id"
                                checked={isSelected}
                                readOnly
                                className="mt-1 accent-orange-500"
                              />
                              <div className="text-left text-xs">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className="font-extrabold uppercase bg-gray-100 px-1.5 py-0.5 rounded text-[9px] text-gray-600">
                                    {addr.label}
                                  </span>
                                  {addr.is_default && (
                                    <span className="text-[10px] text-orange-500 font-bold">Default</span>
                                  )}
                                </div>
                                <p className="font-bold text-gray-900 text-sm">
                                  {addr.first_name} {addr.last_name}
                                </p>
                                <p className="text-gray-600 mt-0.5">
                                  {addr.street_address}{addr.apartment ? `, ${addr.apartment}` : ""}
                                </p>
                                <p className="text-gray-600">
                                  {addr.city}, {addr.state} — {addr.pin_code}
                                </p>
                                <p className="text-gray-550 mt-1 font-semibold">Ph: {addr.phone}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Add new address card */}
                      <div
                        type="button"
                        onClick={() => handleAddressSelect("new")}
                        className={`p-4 rounded-xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center min-h-[110px] transition-all ${
                          selectedAddressId === "new"
                            ? "border-orange-500 bg-orange-50/20 shadow-sm"
                            : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                        }`}
                      >
                        <Plus className="w-5 h-5 text-gray-400 mb-1" />
                        <span className="text-sm font-bold text-gray-605">Use a new address</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedAddressId !== "new" && savedAddresses.length > 0 ? (
                  /* Address Summary Mode */
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/60 text-left text-sm flex items-start justify-between">
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase mb-2">Selected Billing & Shipping Address</p>
                      <p className="font-bold text-gray-900 text-base">
                        {firstName} {lastName}
                      </p>
                      {companyName && <p className="text-gray-650">{companyName}</p>}
                      <p className="text-gray-700 mt-1">
                        {streetAddress}{apartment ? `, ${apartment}` : ""}
                      </p>
                      <p className="text-gray-700">
                        {city}, {selectedState} — {pincode}
                      </p>
                      <p className="text-gray-900 font-semibold mt-2">Phone: {phone}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddressSelect("new")}
                      className="text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-all"
                    >
                      Use a different address
                    </button>
                  </div>
                ) : (
                  /* Form Fields Mode */
                  <div className="space-y-4 text-left">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">First name *</label>
                        <input
                          type="text"
                          name="firstName"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black/20 text-black bg-white"
                          required
                          placeholder="First name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last name *</label>
                        <input
                          type="text"
                          name="lastName"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black/20 text-black bg-white"
                          required
                          placeholder="Last name"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company name (optional)</label>
                      <input
                        type="text"
                        name="companyName"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black/20 text-black bg-white"
                        placeholder="Company name"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country/Region *</label>
                      <div className="relative">
                        <select
                          name="country"
                          required
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black/20 bg-white text-gray-900 appearance-none cursor-pointer"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                        >
                          <option value="India">India</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Street address *</label>
                      <input
                        type="text"
                        name="streetAddress"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black/20 text-black bg-white"
                        required
                        placeholder="House number and street name"
                        value={streetAddress}
                        onChange={(e) => setStreetAddress(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Flat, suite, unit, etc. (optional)</label>
                      <input
                        type="text"
                        name="apartment"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black/20 text-black bg-white"
                        placeholder="Apartment, suite, unit, etc. (optional)"
                        value={apartment}
                        onChange={(e) => setApartment(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Town / City *</label>
                        <input
                          type="text"
                          name="city"
                          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black/20 text-black ${
                            pincode && pincode.length === 6 && city !== ""
                              ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                              : "bg-white"
                          }`}
                          required
                          placeholder="Town / City"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          readOnly={pincode && pincode.length === 6 && city !== ""}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                        <div className="relative">
                          <select
                            name="state"
                            required
                            className={`w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black/20 text-gray-900 appearance-none ${
                              pincode && pincode.length === 6 && selectedState !== ""
                                ? "bg-gray-100 text-gray-500 cursor-not-allowed pointer-events-none"
                                : "bg-white cursor-pointer"
                            }`}
                            value={selectedState}
                            onChange={(e) => setSelectedState(e.target.value)}
                            disabled={pincode && pincode.length === 6 && selectedState !== ""}
                          >
                            <option value="">Select an option…</option>
                            {statesList.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code *</label>
                        <div className="relative">
                          <input
                            type="text"
                            name="pincode"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black/20 text-black bg-white pr-8"
                            required
                            placeholder="6-digit PIN Code"
                            maxLength={6}
                            value={pincode}
                            onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          />
                          {isPincodeLoading && (
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-gray-500 text-xs font-semibold pointer-events-none border-r border-gray-200 pr-2">
                          <span>🇮🇳</span>
                          <span>+91</span>
                        </div>
                        <input
                          type="tel"
                          name="phone"
                          className="w-full pl-[70px] pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black/20 text-black bg-white text-sm"
                          required
                          placeholder="10-digit mobile number"
                          maxLength={10}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        />
                      </div>
                    </div>

                    {authToken && (
                      <div className="space-y-3 pt-2 text-left">
                        <label className="flex items-center gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={saveNewAddress}
                            onChange={(e) => setSaveNewAddress(e.target.checked)}
                            className="w-4 h-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded accent-orange-500 cursor-pointer"
                          />
                          <span className="text-sm font-medium text-gray-700">Save this address to my profile</span>
                        </label>

                        {saveNewAddress && (
                          <div className="w-48 text-left">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                              Address Label
                            </label>
                            <div className="relative">
                              <select
                                value={newAddressLabel}
                                onChange={(e) => setNewAddressLabel(e.target.value)}
                                className="w-full text-xs font-semibold appearance-none border border-gray-300 rounded-lg px-2.5 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white cursor-pointer"
                              >
                                <option value="Home">Home</option>
                                <option value="Work">Work</option>
                                <option value="Other">Other</option>
                              </select>
                              <ChevronDown className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ORDER SUMMARY & PAYMENT */}
            <div className="space-y-6">
              {/* Summary details */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
                <div className="space-y-4 mb-6">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex items-center space-x-3 text-left">
                      {item.product.image ? (
                        <img
                          src={item.product.image}
                          alt={item.product.title}
                          className="w-12 h-12 object-contain rounded-md bg-gray-50 p-1 border border-gray-100"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-md bg-gray-100 border border-gray-100 flex items-center justify-center text-gray-300">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m3 15 5-5 4 4 3-3 6 6"/></svg>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {item.product.title}
                        </h4>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        ₹{getItemTotalPrice(item.product, item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-4 space-y-2 text-left">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal ({totalQuantity} {totalQuantity === 1 ? "item" : "items"})</span>
                    <span className="text-gray-900 font-semibold">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery Charges</span>
                    <span className="text-green-600 font-semibold uppercase">
                      {deliveryCharges === 0 ? "FREE" : `₹${deliveryCharges.toFixed(2)}`}
                    </span>
                  </div>
                  {promoDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600 font-semibold">
                      <span>Coupon Discount ({appliedCoupon?.code})</span>
                      <span>-₹{promoDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2 flex justify-between text-lg font-bold">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">₹{finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment details */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 text-left">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-gray-700" />
                  Payment Information
                </h2>

                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Order Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal ({totalQuantity} {totalQuantity === 1 ? "item" : "items"})</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Charges</span>
                      <span className={deliveryCharges === 0 ? "text-green-600 font-bold" : ""}>
                        {deliveryCharges === 0 ? "FREE" : `₹${deliveryCharges.toFixed(2)}`}
                      </span>
                    </div>
                    {promoDiscount > 0 && (
                      <div className="flex justify-between text-green-600 font-semibold">
                        <span>Coupon Discount ({appliedCoupon?.code})</span>
                        <span>-₹{promoDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-300 pt-2 flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>₹{finalTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Payment Method</h3>
                  <div className="space-y-3">
                    <div className="flex items-center p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <input
                        type="radio"
                        id="razorpay"
                        name="paymentMethod"
                        readOnly
                        className="h-4 w-4 text-black focus:ring-black border-gray-300 cursor-pointer"
                        value="razorpay"
                        checked
                      />
                      <label htmlFor="razorpay" className="ml-3 flex items-center gap-2 cursor-pointer">
                        <span className="text-sm font-medium text-gray-900">
                          Razorpay (UPI, Cards, Net Banking)
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Secure Shield message */}
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900">Secure Payment</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Your payment information is encrypted and secure. We use Razorpay's PCI DSS compliant payment gateway.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {formError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                      {formError}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-black text-white px-6 py-4 rounded-md hover:bg-gray-800 transition-colors text-lg font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Processing..." : `Pay ₹${finalTotal.toFixed(2)}`}
                  </button>
                  <p className="text-xs text-gray-500 text-center">
                    By completing your purchase, you agree to our{" "}
                    <Link href="/terms-conditions" className="underline hover:text-black">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy-policy" className="underline hover:text-black">
                      Privacy Policy
                    </Link>
                  </p>
                </div>

                {/* Fast Delivery message */}
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Truck className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-green-900">Fast Delivery</h4>
                      <p className="text-sm text-green-700 mt-1">
                        Orders are typically delivered within 3-5 business days. You'll receive tracking information via email.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Non-dismissable Payment & Order Verification Overlay Modal */}
      {verifyingPayment && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-md z-[99999] flex items-center justify-center p-4 select-none"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100 text-center space-y-6 animate-in fade-in zoom-in duration-200 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Animated Status Indicator */}
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-orange-200 animate-ping opacity-25" />
              <div className="w-16 h-16 bg-gradient-to-tr from-orange-500 to-amber-500 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/20 transform rotate-3">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-gray-900">
                Verifying Payment & Placing Order
              </h3>
              <div className="flex items-center justify-center gap-2 text-sm font-semibold text-orange-600">
                <PackageCheck className="w-4 h-4 animate-bounce" />
                <span className="animate-pulse">{verifyingStep}</span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-800 flex items-start gap-3 text-left">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="font-medium leading-relaxed">
                <strong className="block text-amber-900 mb-0.5">Do not close or refresh this page</strong>
                We are securely confirming your transaction and communicating with shipping providers.
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
