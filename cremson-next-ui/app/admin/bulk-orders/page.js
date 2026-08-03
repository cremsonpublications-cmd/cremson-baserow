"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, Search, Clock, CheckCircle2, Truck, Eye, ArrowRight, X, Percent, DollarSign, ShieldCheck, Users, ExternalLink } from "lucide-react";
import api from "@/lib/api/axios";

export default function AdminBulkOrdersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState(10);
  const [adminNotes, setAdminNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-bulk-orders", page, search],
    queryFn: async () => {
      const res = await api.get("/api/bulk-orders/", {
        params: { page, size: 50, search: search || undefined },
      });
      return res.data;
    },
  });

  const rawOrders = Array.isArray(data?.results) ? data.results : Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
  const orders = [...rawOrders].sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === "all") return true;
    return o.status === statusFilter;
  });

  const handleOpenApprove = (order) => {
    setSelectedOrder(order);
    setDiscountType(order.discount_type || "percentage");
    setDiscountValue(Number(order.discount_value || 10));
    setAdminNotes(order.admin_notes || "");
    setApproveModalOpen(true);
  };

  const handleOpenDetail = (order) => {
    setSelectedOrder(order);
    setDetailModalOpen(true);
  };

  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setActionLoading(true);
    try {
      await api.patch(`/api/bulk-orders/${selectedOrder.id}/approve`, {
        discount_type: discountType,
        discount_value: Number(discountValue),
        admin_notes: adminNotes,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-bulk-orders"] });
      setApproveModalOpen(false);
      setSelectedOrder(null);
    } catch (err) {
      alert(err?.response?.data?.detail || "Failed to approve bulk order.");
    } fontFinally: {
      setActionLoading(false);
    }
  };

  const handleShipNow = async (order) => {
    if (!confirm(`Are you sure you want to create a Shipway shipment for ${order.school_name}?`)) return;

    setActionLoading(true);
    try {
      const res = await api.post(`/api/bulk-orders/${order.id}/ship`);
      alert(`Shipment created successfully! AWB: ${res.data.awb}`);
      queryClient.invalidateQueries({ queryKey: ["admin-bulk-orders"] });
    } catch (err) {
      alert(err?.response?.data?.detail || "Failed to initiate shipment.");
    } finally {
      setActionLoading(false);
    }
  };

  const calcFinal = (subtotal) => {
    const sub = Number(subtotal || 0);
    const disc = Number(discountValue || 0);
    if (discountType === "percentage") {
      return Math.max(0, Math.round(sub - (sub * disc) / 100));
    }
    return Math.max(0, Math.round(sub - disc));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-purple-600" /> Bulk Orders Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">Review school bulk order requests, approve discounts, track student split payments & initiate shipping</p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {[
              { id: "all", label: "All" },
              { id: "pending_review", label: "Pending Review" },
              { id: "approved", label: "Approved" },
              { id: "partially_paid", label: "Partially Paid" },
              { id: "fully_paid", label: "Ready to Ship" },
              { id: "shipped", label: "Shipped" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  statusFilter === tab.id
                    ? "bg-purple-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search school, name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Loading bulk orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">No bulk orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Order ID / Date</th>
                  <th className="px-4 py-3">School & Contact</th>
                  <th className="px-4 py-3">Subtotal</th>
                  <th className="px-4 py-3">Discount / Final</th>
                  <th className="px-4 py-3">Payment Status</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredOrders.map((o) => {
                  const items = typeof o.items === "string" ? JSON.parse(o.items || "[]") : o.items || [];
                  const students = typeof o.student_payments === "string" ? JSON.parse(o.student_payments || "[]") : o.student_payments || [];
                  const isPending = o.status === "pending_review";
                  const isApproved = o.status === "approved";
                  const isPartially = o.status === "partially_paid";
                  const isFullyPaid = o.status === "fully_paid";
                  const isShipped = o.status === "shipped";

                  return (
                    <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900">#BULK-{o.id}</span>
                        <div className="text-[11px] text-slate-400">
                          {o.order_date ? new Date(o.order_date).toLocaleDateString() : "—"}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{o.school_name}</div>
                        <div className="text-slate-500 text-[11px]">
                          {o.contact_name} • {o.phone}
                        </div>
                      </td>

                      <td className="px-4 py-3 font-mono">₹{Number(o.subtotal || 0).toLocaleString()}</td>

                      <td className="px-4 py-3 font-mono">
                        <div className="font-bold text-purple-700">₹{Number(o.final_amount || o.subtotal || 0).toLocaleString()}</div>
                        {Number(o.discount_value || 0) > 0 && (
                          <div className="text-[10px] text-emerald-600 font-semibold">
                            {o.discount_type === "percentage" ? `${o.discount_value}% OFF` : `₹${o.discount_value} OFF`}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {students.length > 0 ? (
                          <div className="space-y-1">
                            <span className="text-[11px] font-bold text-slate-700">
                              {o.paid_count || 0} / {o.split_count || students.length} Students Paid
                            </span>
                          </div>
                        ) : isFullyPaid || isShipped ? (
                          <span className="text-emerald-600 font-bold text-[11px]">Paid Full ✓</span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Unpaid</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {isPending && (
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold rounded-full text-[10px]">
                            Pending Review
                          </span>
                        )}
                        {isApproved && (
                          <span className="px-2.5 py-1 bg-purple-100 text-purple-800 font-bold rounded-full text-[10px]">
                            Approved
                          </span>
                        )}
                        {isPartially && (
                          <span className="px-2.5 py-1 bg-blue-100 text-blue-800 font-bold rounded-full text-[10px]">
                            Partially Paid
                          </span>
                        )}
                        {isFullyPaid && (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px]">
                            Ready to Ship
                          </span>
                        )}
                        {isShipped && (
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold rounded-full text-[10px]">
                            Shipped ({o.shipway_awb})
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => handleOpenDetail(o)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs transition-colors cursor-pointer"
                        >
                          View Details
                        </button>

                        {isPending && (
                          <button
                            onClick={() => handleOpenApprove(o)}
                            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded text-xs transition-colors cursor-pointer"
                          >
                            Approve & Offer
                          </button>
                        )}

                        {isFullyPaid && (
                          <button
                            onClick={() => handleShipNow(o)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded text-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <Truck className="w-3.5 h-3.5" /> Ship Now
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approve & Offer Modal */}
      {approveModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Approve & Apply Offer</h3>
              <button onClick={() => setApproveModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApproveSubmit} className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
                <div className="font-bold text-slate-900">{selectedOrder.school_name}</div>
                <div className="text-slate-600">Pre-Discount Subtotal: <span className="font-mono font-bold">₹{Number(selectedOrder.subtotal).toLocaleString()}</span></div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Discount Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDiscountType("percentage")}
                    className={`py-2 text-xs font-bold rounded-lg border cursor-pointer ${
                      discountType === "percentage" ? "bg-purple-50 border-purple-500 text-purple-700" : "bg-white border-slate-200 text-slate-600"
                    }`}
                  >
                    Percentage (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType("fixed")}
                    className={`py-2 text-xs font-bold rounded-lg border cursor-pointer ${
                      discountType === "fixed" ? "bg-purple-50 border-purple-500 text-purple-700" : "bg-white border-slate-200 text-slate-600"
                    }`}
                  >
                    Fixed Amount (₹)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Discount Value</label>
                <input
                  type="number"
                  min="0"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm font-semibold outline-none"
                />
              </div>

              <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-xs flex justify-between items-center font-bold">
                <span className="text-purple-900">Final Payable Amount:</span>
                <span className="text-purple-700 font-mono text-base">₹{calcFinal(selectedOrder.subtotal).toLocaleString()}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Admin Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Internal note or message..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl text-xs outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow transition-all cursor-pointer"
              >
                {actionLoading ? "Saving..." : "Approve & Send WhatsApp Notification"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {detailModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Bulk Order #{selectedOrder.id}</h3>
                <p className="text-xs text-slate-500">{selectedOrder.school_name}</p>
              </div>
              <button onClick={() => setDetailModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Address */}
            <div className="bg-slate-50 p-4 rounded-xl text-xs space-y-1.5 border border-slate-200">
              <p className="font-bold text-slate-900">Delivery Address:</p>
              <p>{selectedOrder.address}, {selectedOrder.city}, {selectedOrder.state} - {selectedOrder.pincode}</p>
              <p className="text-slate-500 font-semibold">Contact: {selectedOrder.contact_name} ({selectedOrder.phone})</p>
            </div>

            {/* Shareable Link */}
            <div className="bg-purple-50 p-3 rounded-xl text-xs space-y-1 border border-purple-100">
              <p className="font-bold text-purple-900">Public Customer Link:</p>
              <a
                href={`${window.location.origin}/bulk-order/${selectedOrder.token}`}
                target="_blank"
                rel="noreferrer"
                className="text-purple-700 font-mono underline break-all flex items-center gap-1"
              >
                {window.location.origin}/bulk-order/{selectedOrder.token} <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Items List */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700 uppercase">Ordered Books:</p>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                {(typeof selectedOrder.items === "string" ? JSON.parse(selectedOrder.items || "[]") : selectedOrder.items || []).map((item, idx) => (
                  <div key={idx} className="p-3 flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-slate-900">{item.title}</span>
                      <span className="text-slate-500 ml-2">x {item.qty}</span>
                    </div>
                    <span className="font-mono font-bold">₹{item.price * item.qty}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
