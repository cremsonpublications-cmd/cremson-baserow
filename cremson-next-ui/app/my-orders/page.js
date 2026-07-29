"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useApp } from "../../context/AppContext";
import { getMyOrders } from "../../lib/api/orders";
import {
  Package,
  Calendar,
  Eye,
  X,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Search,
  ShoppingBag,
  FileText,
  MapPin,
  BookOpen,
  ArrowRight,
  ChevronRight
} from "lucide-react";

export default function MyOrdersPage() {
  const { user } = useApp();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user?.email) return;
    setIsLoading(true);
    getMyOrders(user.email)
      .then(setOrders)
      .catch((e) => console.error("Error loading orders", e))
      .finally(() => setIsLoading(false));
  }, [user?.email]);

  // Filter Orders first
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Tab filtering
      if (activeTab !== "all") {
        const status = (order.status || "").toLowerCase();
        if (activeTab === "placed" && status !== "order placed" && status !== "placed" && status !== "processing") {
          return false;
        }
        if (activeTab === "shipped" && status !== "shipped") {
          return false;
        }
        if (activeTab === "delivered" && status !== "delivered") {
          return false;
        }
      }

      // 2. Search query matching
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesId = (order.id || "").toLowerCase().includes(query);
        const matchesItems = (order.items || []).some((item) =>
          (item.title || "").toLowerCase().includes(query)
        );
        return matchesId || matchesItems;
      }

      return true;
    });
  }, [orders, activeTab, searchQuery]);

  // Flatten orders to items list for a Flipkart-style view
  const orderItemsList = useMemo(() => {
    const items = [];
    filteredOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        items.push({
          ...item,
          orderId: order.id,
          orderDate: order.date,
          orderStatus: order.status || "Order Placed",
          expectedDelivery: order.expectedDelivery || "TBD",
          shippingAddress: order.shippingAddress,
          payment_id: order.payment_id,
          totalOrderAmount: order.total,
          parentOrder: order,
        });
      });
    });
    // Sort items by orderDate desc (since orderId has timestamp, we can sort by orderId desc as a proxy if date is simple string)
    return items.reverse();
  }, [filteredOrders]);

  if (!user) {
    return (
      <main className="pb-20 min-h-screen bg-[#f1f3f6] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg border border-gray-200 p-8 text-center shadow-sm">
          <div className="inline-flex p-3 bg-orange-50 text-orange-500 rounded-full mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6 text-sm">
            Please sign in to your account to view and manage your orders.
          </p>
          <Link href="/signin">
            <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded text-sm font-bold transition-all cursor-pointer shadow-sm">
              Sign In
            </button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="pb-20 min-h-screen bg-[#f1f3f6] text-left">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6">

        {/* Breadcrumb / Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Link href="/" className="hover:text-blue-600">Home</Link>
              <ChevronRight className="w-3 h-3" />
              <Link href="/shop" className="hover:text-blue-600">Shop</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-gray-700 font-medium">My Orders</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">My Orders</h1>
          </div>

          {/* Shop button */}
          <Link href="/shop">
            <button className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2 rounded text-xs font-bold transition-all shadow-sm cursor-pointer">
              Continue Shopping
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </Link>
        </div>

        {/* Filter and Search Container (Flipkart Style Header) */}
        <div className="bg-white border border-gray-200 rounded p-4 mb-4 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          {/* Tab Filter buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: "all", label: "All Orders" },
              { id: "placed", label: "Placed" },
              { id: "shipped", label: "Shipped" },
              { id: "delivered", label: "Delivered" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap cursor-pointer ${activeTab === tab.id
                    ? "bg-blue-50 text-blue-600 border-blue-200"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative flex-1 max-w-md w-full">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your orders here..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-black placeholder-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Orders list */}
        {isLoading ? (
          <div className="bg-white border border-gray-200 rounded p-12 text-center shadow-sm">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xs text-gray-500">Loading your orders...</p>
          </div>
        ) : orderItemsList.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded p-12 text-center shadow-sm">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-800 mb-1">No Orders Found</h3>
            <p className="text-xs text-gray-500 mb-6 max-w-sm mx-auto">
              {searchQuery
                ? `No orders match your search query "${searchQuery}".`
                : "You have not placed any orders yet."}
            </p>
            <Link href="/shop">
              <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded text-xs font-bold transition-all cursor-pointer">
                Start Shopping
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orderItemsList.map((item, idx) => {
              // Status dot and text logic
              let statusColor = "bg-amber-500";
              let statusText = "Ordered";
              let statusDesc = "Your order has been placed.";

              if (item.orderStatus === "Shipped") {
                statusColor = "bg-blue-500";
                statusText = "Shipped";
                statusDesc = "Your item is in transit.";
              } else if (item.orderStatus === "Delivered") {
                statusColor = "bg-green-500";
                statusText = "Delivered";
                statusDesc = "Your item has been delivered.";
              }

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedOrder(item.parentOrder)}
                  className="bg-white border border-gray-200 rounded p-4 sm:p-5 hover:shadow-md transition-all duration-200 cursor-pointer grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
                >
                  {/* Left Column: Image, Title, and details (col-span-5) */}
                  <div className="md:col-span-6 flex items-start gap-4">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-16 h-16 object-contain bg-gray-50 border border-gray-100 rounded p-1"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded flex items-center justify-center text-gray-400">
                        <BookOpen className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm hover:text-blue-600 transition-colors line-clamp-2">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-gray-400 mt-1">
                        Qty: {item.quantity} | Order #{item.orderId}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        Ordered on: {item.orderDate}
                      </p>
                    </div>
                  </div>

                  {/* Middle Column: Price (col-span-2) */}
                  <div className="md:col-span-2">
                    <p className="font-bold text-gray-900 text-sm">
                      ₹{parseFloat(item.price * item.quantity).toFixed(2)}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      (₹{parseFloat(item.price).toFixed(2)} each)
                    </p>
                  </div>

                  {/* Right Column: Status with bullet dot (col-span-4) */}
                  <div className="md:col-span-4 flex flex-col md:items-start text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${statusColor}`} />
                      <span className="font-bold text-gray-900">
                        {statusText === "Delivered" ? `Delivered on ${item.expectedDelivery}` : statusText}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1 ml-4 leading-relaxed">
                      {statusDesc}
                    </p>
                    <button className="text-blue-600 hover:text-blue-800 text-[11px] font-bold mt-2 ml-4 flex items-center gap-0.5 cursor-pointer">
                      <Eye className="w-3.5 h-3.5" />
                      Track Order & Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order Details Drawer Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          {/* Overlay click to close */}
          <div className="absolute inset-0" onClick={() => setSelectedOrder(null)} />

          <div className="relative w-full max-w-lg bg-[#f1f3f6] h-full shadow-2xl flex flex-col z-10 animate-slideLeft">

            {/* Drawer Header */}
            <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Order Details</span>
                <h2 className="text-base font-bold text-gray-950 mt-0.5">#{selectedOrder.id}</h2>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">

              {/* Delivery Address & Status Box */}
              <div className="bg-white border border-gray-200 rounded p-4 text-xs shadow-sm">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Delivery Address</h3>
                <p className="font-bold text-gray-900">{user.name || "Recipient"}</p>
                <p className="text-gray-600 mt-1 leading-relaxed">{selectedOrder.shippingAddress}</p>
                <p className="text-gray-600 mt-1">Email: {user.email}</p>
              </div>

              {/* Order Status Stepper */}
              <div className="bg-white border border-gray-200 rounded p-4 text-xs shadow-sm">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Order Status</h3>

                <div className="relative flex items-center justify-between px-2">
                  <div className="absolute left-6 right-6 top-3.5 h-[2px] bg-gray-200 -z-10" />
                  <div
                    className="absolute left-6 top-3.5 h-[2px] bg-green-500 transition-all duration-500 -z-10"
                    style={{
                      width: selectedOrder.status === "Delivered"
                        ? "100%"
                        : selectedOrder.status === "Shipped"
                          ? "50%"
                          : "0%"
                    }}
                  />

                  {/* Step 1: Placed */}
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-700 mt-1.5">Placed</span>
                  </div>

                  {/* Step 2: Shipped */}
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold border ${selectedOrder.status === "Shipped" || selectedOrder.status === "Delivered"
                        ? "bg-green-500 text-white border-green-500"
                        : "bg-white text-gray-400 border-gray-200"
                      }`}>
                      {selectedOrder.status === "Shipped" || selectedOrder.status === "Delivered" ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Truck className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <span className={`text-[10px] font-bold mt-1.5 ${selectedOrder.status === "Shipped" || selectedOrder.status === "Delivered" ? "text-gray-700" : "text-gray-400"
                      }`}>Shipped</span>
                  </div>

                  {/* Step 3: Delivered */}
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold border ${selectedOrder.status === "Delivered"
                        ? "bg-green-500 text-white border-green-500"
                        : "bg-white text-gray-400 border-gray-200"
                      }`}>
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className={`text-[10px] font-bold mt-1.5 ${selectedOrder.status === "Delivered" ? "text-gray-700" : "text-gray-400"
                      }`}>Delivered</span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-gray-100 flex justify-between text-[11px] text-gray-500">
                  <span>Expected Delivery:</span>
                  <span className="font-bold text-gray-800">{selectedOrder.expectedDelivery || "TBD"}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="bg-white border border-gray-200 rounded p-4 text-xs shadow-sm">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Item Details</h3>
                <div className="space-y-3">
                  {(selectedOrder.items || []).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                      <div className="flex items-start gap-2.5 max-w-[75%]">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-10 h-10 object-contain bg-gray-50 border border-gray-100 rounded p-0.5"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded flex items-center justify-center text-gray-400">
                            <BookOpen className="w-4.5 h-4.5" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-gray-900 leading-snug line-clamp-2">{item.title}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">Quantity: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="font-bold text-gray-900">
                        ₹{parseFloat(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Details */}
              <div className="bg-white border border-gray-200 rounded p-4 text-xs shadow-sm space-y-2.5">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Price Details</h3>
                <div className="flex justify-between text-gray-600">
                  <span>Price ({selectedOrder.itemsCount} {selectedOrder.itemsCount === 1 ? "item" : "items"})</span>
                  <span>₹{parseFloat(selectedOrder.total || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Charges</span>
                  <span className="text-green-600 font-bold">FREE</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-gray-900 pt-2.5 border-t border-gray-100">
                  <span>Total Amount</span>
                  <span className="text-orange-500">₹{parseFloat(selectedOrder.total || 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-white border border-gray-200 rounded p-4 text-xs shadow-sm flex items-start gap-2 text-gray-600">
                <ShieldCheck className="w-4.5 h-4.5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-gray-900">Razorpay Secure Payment</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Payment ID: {selectedOrder.payment_id || "N/A"}</p>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center justify-center gap-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-2 rounded text-xs transition-all cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  Print Invoice
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded text-xs transition-all cursor-pointer"
                >
                  Close Details
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </main>
  );
}
