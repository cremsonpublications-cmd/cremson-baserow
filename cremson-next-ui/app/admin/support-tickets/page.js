"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "../../../lib/api/axios";
import {
  MessageSquare,
  Search,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
  User,
  Mail,
  Phone,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  FileText
} from "lucide-react";

export default function AdminSupportTicketsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState(null);

  // Status comment modal states
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [targetTicket, setTargetTicket] = useState(null); // { id, status }
  const [resolutionComment, setResolutionComment] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-support-tickets", statusFilter, searchQuery, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      if (searchQuery) params.append("search", searchQuery);
      params.append("page", page.toString());
      params.append("size", "20");
      const res = await api.get(`/api/crm/support-tickets?${params.toString()}`);
      return res.data;
    },
  });

  const tickets = data?.results || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / 20);

  const handleUpdateStatus = async (ticketId, newStatus, comment = "") => {
    setUpdatingId(ticketId);
    try {
      await api.patch(`/api/crm/support-tickets/${ticketId}`, { 
        status: newStatus,
        notes: comment 
      });
      toast.success(`Ticket ${ticketId} updated to ${newStatus}`);
      queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
      setStatusModalOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to update ticket status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const onStatusClick = (ticketId, newStatus) => {
    if (newStatus === "Pending") {
      handleUpdateStatus(ticketId, newStatus, "");
    } else {
      setTargetTicket({ id: ticketId, status: newStatus });
      setResolutionComment("");
      setStatusModalOpen(true);
    }
  };

  const statusBadge = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "pending") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-500" /> Pending
        </span>
      );
    }
    if (s === "resolved") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle className="w-3 h-3 text-emerald-500" /> Resolved
        </span>
      );
    }
    if (s === "cancelled") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3 h-3 text-rose-500" /> Cancelled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
        {status}
      </span>
    );
  };

  return (
    <div className="p-4 md:p-8 space-y-6 text-left max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Contact Us & Support Messages</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Track customer complaints, enquiries, and update ticket statuses (Pending, Resolved, Cancelled).
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer inline-flex items-center gap-2 self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh List
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {["all", "Pending", "Resolved", "Cancelled"].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all capitalize cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
              }`}
            >
              {st === "all" ? "All Tickets" : st}
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Ticket ID, Name, Phone..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50/50"
          />
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-purple-600" />
            <p className="text-xs font-semibold">Loading support messages...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <HelpCircle className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-800">No Support Tickets Found</p>
            <p className="text-xs text-slate-500">
              {searchQuery ? `No tickets match "${searchQuery}"` : "No support messages match the selected status filter."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="p-5 hover:bg-slate-50/50 transition-colors space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-50 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg border border-purple-100">
                      #{ticket.id}
                    </span>
                    {statusBadge(ticket.status)}
                    <span className="text-xs text-slate-400 font-medium">
                      {ticket.created_at ? new Date(ticket.created_at).toLocaleString("en-IN") : "—"}
                    </span>
                  </div>

                  {/* Actions Dropdown / Buttons */}
                  <div className="flex items-center gap-1.5 self-start md:self-auto">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Status:</span>
                    {["Pending", "Resolved", "Cancelled"].map((st) => (
                      <button
                        key={st}
                        disabled={updatingId === ticket.id || ticket.status === st}
                        onClick={() => onStatusClick(ticket.id, st)}
                        className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                          ticket.status === st
                            ? st === "Pending"
                              ? "bg-amber-600 text-white shadow-xs"
                              : st === "Resolved"
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "bg-rose-600 text-white shadow-xs"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/60 disabled:opacity-40"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Customer Details & Message in One Box */}
                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 space-y-3 text-xs">
                  {/* Top Row: User Contact Details */}
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-slate-200/60 pb-2.5 text-slate-600">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-purple-600" /> {ticket.full_name || "Customer"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> {ticket.phone || "—"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> {ticket.email || "—"}
                    </span>
                  </div>

                  {/* Message Subject & Content */}
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-purple-600" /> Subject: {ticket.subject || "Contact Us Enquiry"}
                    </p>
                    <p className="text-slate-700 whitespace-pre-wrap leading-relaxed mt-1.5 pl-5">
                      {ticket.message || "No message body provided."}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Bar */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
          <p className="text-xs text-slate-500">
            Showing {tickets.length > 0 ? (page - 1) * 20 + 1 : 0} to {Math.min(page * 20, totalCount)} of {totalCount} tickets
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              Previous
            </button>
            <span className="text-xs font-bold text-slate-700">
              Page {page} of {totalPages || 1}
            </span>
            <button
              disabled={page >= totalPages || totalPages === 0}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {statusModalOpen && targetTicket && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900">
              Update Ticket Status to {targetTicket.status}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Please enter a resolution comment or update details for the customer. This comment will be sent to the customer via WhatsApp as a notification.
            </p>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Resolution Comments / Notes
              </label>
              <textarea
                rows={4}
                value={resolutionComment}
                onChange={(e) => setResolutionComment(e.target.value)}
                placeholder="Enter comments here... (Avoid pressing Enter, keep it in a single paragraph to ensure clean delivery)"
                className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50/50"
              />
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setStatusModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus(targetTicket.id, targetTicket.status, resolutionComment)}
                className={`px-4 py-2 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow transition-all cursor-pointer ${
                  targetTicket.status === "Resolved" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                Confirm & Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
