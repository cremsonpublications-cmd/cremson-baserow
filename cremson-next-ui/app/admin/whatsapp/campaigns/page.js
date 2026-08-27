"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  Send,
  Plus,
  Search,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Eye,
  FileText,
  TrendingUp,
  RefreshCw,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { getCampaigns, cancelCampaign, deleteCampaign } from "@/lib/api/whatsappCampaigns";
import { toast } from "sonner";

export default function AdminWhatsAppCampaignsPage() {
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Delete Campaign Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["whatsapp-campaigns"],
    queryFn: getCampaigns,
    refetchInterval: 5000, // Auto refresh live campaigns every 5s
  });

  const campaigns = Array.isArray(data?.campaigns) ? data.campaigns : [];

  // Aggregate Metrics
  const totalCampaigns = campaigns.length;
  const totalSent = campaigns.reduce((acc, c) => acc + (c.sent_count || 0), 0);
  const totalDelivered = campaigns.reduce((acc, c) => acc + (c.delivered_count || 0), 0);
  const totalRead = campaigns.reduce((acc, c) => acc + (c.read_count || 0), 0);
  const totalFailed = campaigns.reduce((acc, c) => acc + (c.failed_count || 0), 0);

  const deliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0;
  const readRate = totalDelivered > 0 ? Math.round((totalRead / totalDelivered) * 100) : 0;

  const filteredCampaigns = campaigns.filter((c) => {
    if (activeFilter !== "all" && c.status !== activeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = (c.campaign_name || "").toLowerCase().includes(q);
      const matchTemplate = (c.template_name || "").toLowerCase().includes(q);
      const matchAudience = (c.audience_type || "").toLowerCase().includes(q);
      return matchName || matchTemplate || matchAudience;
    }
    return true;
  });

  const handleCancel = async (id, name) => {
    if (!confirm(`Are you sure you want to cancel campaign "${name}"?`)) return;
    try {
      await cancelCampaign(id);
      toast.success(`Campaign "${name}" has been cancelled.`);
      refetch();
    } catch (err) {
      toast.error("Failed to cancel campaign.");
    }
  };

  const handleDeleteCampaign = async (id, name) => {
    if (!confirm(`Are you sure you want to delete campaign "${name}"? This action cannot be undone.`)) return;
    try {
      await deleteCampaign(id);
      toast.success(`Campaign "${name}" has been deleted.`);
      refetch();
    } catch (err) {
      toast.error("Failed to delete campaign.");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return (
          <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
          </span>
        );
      case "sending":
        return (
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 w-fit animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sending
          </span>
        );
      case "scheduled":
        return (
          <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 w-fit">
            <Clock className="w-3.5 h-3.5" /> Scheduled
          </span>
        );
      case "cancelled":
        return (
          <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 w-fit">
            <XCircle className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
      case "partially_failed":
        return (
          <span className="bg-amber-100 text-amber-900 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 w-fit">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Partial Fail
          </span>
        );
      case "failed":
        return (
          <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 w-fit">
            <XCircle className="w-3.5 h-3.5 text-red-600" /> Failed
          </span>
        );
      default:
        return (
          <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 w-fit">
            <Clock className="w-3.5 h-3.5" /> Draft
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* ── Page Header with WhatsApp Dark Teal Theme ── */}
      <div className="bg-gradient-to-r from-[#075e54] to-[#128c7e] text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-3">
            <Send className="w-8 h-8 text-[#25d366]" />
            WhatsApp Campaigns Dashboard
          </h1>
          <p className="text-xs text-emerald-100 max-w-xl leading-relaxed">
            Create, schedule, and monitor bulk WhatsApp marketing & webinar invitation campaigns.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 z-10 w-full sm:w-auto">
          <Link
            href="/admin/whatsapp/templates"
            className="px-4 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-2xl border border-white/20 transition-all flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4 text-emerald-300" />
            Manage Templates
          </Link>

          <Link
            href="/admin/whatsapp/campaigns/create"
            className="px-5 py-3 bg-[#25d366] hover:bg-[#20bd5a] text-white text-xs font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 transform hover:scale-[1.03]"
          >
            <Plus className="w-4 h-4" />
            Create Campaign
          </Link>
        </div>
      </div>

      {/* ── Summary Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs text-gray-500 font-medium">Total Campaigns</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalCampaigns}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Campaigns created</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
            <Send className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs text-gray-500 font-medium">Total Sent</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalSent.toLocaleString()}</p>
            <p className="text-[11px] text-blue-600 mt-0.5">WhatsApp messages</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs text-gray-500 font-medium">Delivery Rate</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{deliveryRate}%</p>
            <p className="text-[11px] text-emerald-700 mt-0.5">{totalDelivered.toLocaleString()} delivered</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs text-gray-500 font-medium">Read Rate</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{readRate}%</p>
            <p className="text-[11px] text-indigo-700 mt-0.5">{totalRead.toLocaleString()} read</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── Filter Tabs & Search ── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {[
            { id: "all", label: `All (${campaigns.length})` },
            { id: "sending", label: "Sending" },
            { id: "completed", label: "Completed" },
            { id: "failed", label: "Failed" },
            { id: "cancelled", label: "Cancelled" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === tab.id
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-purple-500 bg-gray-50/50"
          />
        </div>
      </div>

      {/* ── Campaign Table ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400 font-medium">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading campaigns...
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="p-12 text-center text-gray-400 space-y-3">
            <Send className="w-10 h-10 mx-auto text-gray-300" />
            <p className="text-sm font-bold text-gray-800">No Campaigns Found</p>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Create your first WhatsApp campaign to send bulk announcements or webinar invitations to teachers and customers.
            </p>
            <Link
              href="/admin/whatsapp/campaigns/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all"
            >
              <Plus className="w-4 h-4" /> Create Campaign Now
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Campaign Name</th>
                  <th className="py-3.5 px-4">Template</th>
                  <th className="py-3.5 px-4">Audience</th>
                  <th className="py-3.5 px-4 text-center">Total</th>
                  <th className="py-3.5 px-4 text-center">Sent</th>
                  <th className="py-3.5 px-4 text-center">Delivered</th>
                  <th className="py-3.5 px-4 text-center">Read</th>
                  <th className="py-3.5 px-4 text-center">Failed</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredCampaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      <Link href={`/admin/whatsapp/campaigns/${c.id}`} className="hover:text-purple-600 transition-colors">
                        {c.campaign_name}
                      </Link>
                      <p className="text-[11px] font-normal text-gray-400 mt-0.5">Created: {c.created_at}</p>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-medium text-purple-700 bg-purple-50/50 rounded-lg">
                      {c.template_name}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-gray-800 capitalize">
                      {(c.audience_type || "").replace("_", " ")}
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-gray-900">
                      {(c.total_recipients || 0).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-center font-semibold text-blue-600">
                      {(c.sent_count || 0).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-center font-semibold text-emerald-600">
                      {(c.delivered_count || 0).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-center font-semibold text-indigo-600">
                      {(c.read_count || 0).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-center font-semibold text-red-500">
                      {c.failed_count || 0}
                    </td>

                    <td className="py-3.5 px-4">{getStatusBadge(c.status)}</td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap min-w-[130px]">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/whatsapp/campaigns/${c.id}`}
                          className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold flex items-center gap-1.5 transition-all whitespace-nowrap shadow-2xs hover:shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-purple-600" /> View Report
                        </Link>

                        {(c.status === "sending" || c.status === "scheduled") && (
                          <button
                            onClick={() => handleCancel(c.id, c.campaign_name)}
                            className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setCampaignToDelete({ id: c.id, name: c.campaign_name });
                            setDeleteModalOpen(true);
                          }}
                          className="p-2 bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-xl transition-all cursor-pointer"
                          title="Delete Campaign"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── CUSTOM DELETE CAMPAIGN CONFIRMATION MODAL ── */}
      {deleteModalOpen && campaignToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-gray-100 transform transition-all scale-100 text-left">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-gray-900">Delete Campaign?</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Are you sure you want to delete <span className="font-bold text-gray-800">"{campaignToDelete.name}"</span>?
                </p>
              </div>
            </div>

            <div className="bg-red-50/70 rounded-2xl p-3.5 border border-red-100 text-xs text-red-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                This action will permanently delete campaign #{campaignToDelete.id} and all associated recipient status logs from your database. This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setCampaignToDelete(null);
                }}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true);
                  try {
                    await deleteCampaign(campaignToDelete.id);
                    toast.success(`Campaign "${campaignToDelete.name}" deleted.`);
                    refetch();
                    setDeleteModalOpen(false);
                    setCampaignToDelete(null);
                  } catch (err) {
                    toast.error("Failed to delete campaign.");
                  } finally {
                    setDeleting(false);
                  }
                }}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" /> Delete Campaign
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
