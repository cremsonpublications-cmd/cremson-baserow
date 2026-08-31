"use client";


import React, { useState, use } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Send,
  ArrowLeft,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  RefreshCw,
  Search,
  RotateCcw,
} from "lucide-react";
import { getCampaignDetails, getCampaignRecipients, retryFailedRecipients, cancelCampaign } from "@/lib/api/whatsappCampaigns";
import { toast } from "sonner";

export default function AdminWhatsAppCampaignDetailPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const campaignId = params.id;

  const [recipientPage, setRecipientPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch Campaign Details
  const { data: campaign, isLoading: loadingCampaign, refetch: refetchCampaign } = useQuery({
    queryKey: ["whatsapp-campaign-detail", campaignId],
    queryFn: () => getCampaignDetails(campaignId),
    refetchInterval: (query) => {
      const st = (query?.state?.data?.status || "").toLowerCase();
      return (st === "sending" || st === "queued" || st === "pending") ? 3000 : false;
    },
  });

  // Fetch Campaign Recipients
  const { data: recipientsData, isLoading: loadingRecipients, refetch: refetchRecipients } = useQuery({
    queryKey: ["whatsapp-campaign-recipients", campaignId, recipientPage, statusFilter],
    queryFn: () => getCampaignRecipients(campaignId, recipientPage, 50, statusFilter),
    refetchInterval: () => {
      const st = (campaign?.status || "").toLowerCase();
      return (st === "sending" || st === "queued" || st === "pending") ? 3000 : false;
    },
  });

  const recipients = Array.isArray(recipientsData?.recipients) ? recipientsData.recipients : [];
  const totalRecipientsCount = recipientsData?.total || 0;

  const handleRetryFailed = async () => {
    setActionLoading(true);
    try {
      const res = await retryFailedRecipients(campaignId);
      toast.success(res.message || "Failed recipients re-queued.");
      refetchCampaign();
      refetchRecipients();
    } catch (err) {
      toast.error("Failed to retry failed recipients.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel remaining queued messages for this campaign?")) return;
    setActionLoading(true);
    try {
      await cancelCampaign(campaignId);
      toast.success("Campaign cancelled.");
      refetchCampaign();
      refetchRecipients();
    } catch (err) {
      toast.error("Failed to cancel campaign.");
    } finally {
      setActionLoading(false);
    }
  };

  const getRecipientStatusBadge = (status) => {
    switch (status) {
      case "read":
        return <span className="bg-indigo-100 text-indigo-800 text-[11px] font-bold px-2 py-0.5 rounded-md">✓✓ Read</span>;
      case "delivered":
        return <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-md">✓ Delivered</span>;
      case "sent":
        return <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded-md">✓ Sent</span>;
      case "failed":
        return <span className="bg-red-100 text-red-800 text-[11px] font-bold px-2 py-0.5 rounded-md">✗ Failed</span>;
      case "cancelled":
        return <span className="bg-gray-100 text-gray-700 text-[11px] font-bold px-2 py-0.5 rounded-md">Cancelled</span>;
      default:
        return <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-md">Queued</span>;
    }
  };

  if (loadingCampaign) {
    return (
      <div className="p-12 text-center text-gray-400 font-medium">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Loading campaign statistics...
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-12 text-center text-gray-500 space-y-3">
        <AlertCircle className="w-10 h-10 mx-auto text-red-400" />
        <p className="text-base font-bold text-gray-800">Campaign Not Found</p>
        <Link href="/admin/whatsapp/campaigns" className="text-purple-600 font-bold hover:underline text-xs">
          ← Back to Campaigns
        </Link>
      </div>
    );
  }

  const sent = campaign.sent_count || 0;
  const delivered = campaign.delivered_count || 0;
  const read = campaign.read_count || 0;
  const failed = campaign.failed_count || 0;
  const total = campaign.total_recipients || 1;

  const deliveredPct = Math.round((delivered / total) * 100);
  const readPct = Math.round((read / total) * 100);

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <Link
            href="/admin/whatsapp/campaigns"
            className="text-xs font-bold text-gray-500 hover:text-gray-800 flex items-center gap-1 mb-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Campaigns
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{campaign.campaign_name}</h1>
            <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">
              #{campaign.id}
            </span>
            {campaign.status === "completed" && (
              <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Completed
              </span>
            )}
            {campaign.status === "sending" && (
              <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sending...
              </span>
            )}
            {campaign.status === "failed" && (
              <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5 text-red-600" /> Failed
              </span>
            )}
            {campaign.status === "partially_failed" && (
              <span className="bg-amber-100 text-amber-900 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Partial Fail
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {failed > 0 && (
            <button
              onClick={handleRetryFailed}
              disabled={actionLoading}
              className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-xl border border-amber-200 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Retry Failed ({failed})
            </button>
          )}

          {(campaign.status === "sending" || campaign.status === "scheduled") && (
            <button
              onClick={handleCancel}
              disabled={actionLoading}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl border border-red-200 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" /> Cancel Campaign
            </button>
          )}
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-2xl border border-gray-200 p-3.5 text-center shadow-xs">
          <p className="text-[11px] text-gray-400 font-semibold">Total Recipients</p>
          <p className="text-xl font-extrabold text-gray-900 mt-1">{total.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-3.5 text-center shadow-xs">
          <p className="text-[11px] text-amber-500 font-semibold">Queued</p>
          <p className="text-xl font-extrabold text-amber-600 mt-1">{campaign.queued_count || 0}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-3.5 text-center shadow-xs">
          <p className="text-[11px] text-blue-500 font-semibold">Sent</p>
          <p className="text-xl font-extrabold text-blue-600 mt-1">{sent.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-3.5 text-center shadow-xs">
          <p className="text-[11px] text-emerald-600 font-semibold">Delivered</p>
          <p className="text-xl font-extrabold text-emerald-600 mt-1">{delivered.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-3.5 text-center shadow-xs">
          <p className="text-[11px] text-indigo-600 font-semibold">Read</p>
          <p className="text-xl font-extrabold text-indigo-600 mt-1">{read.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-3.5 text-center shadow-xs">
          <p className="text-[11px] text-red-500 font-semibold">Failed</p>
          <p className="text-xl font-extrabold text-red-500 mt-1">{failed}</p>
        </div>
      </div>

      {/* ── Delivery & Read Progress Bars ── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold text-gray-700">
            <span>Delivered Rate ({deliveredPct}%)</span>
            <span className="text-emerald-600">{delivered} / {total}</span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${deliveredPct}%` }} />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold text-gray-700">
            <span>Read Rate ({readPct}%)</span>
            <span className="text-indigo-600">{read} / {total}</span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${readPct}%` }} />
          </div>
        </div>
      </div>

      {/* ── Recipient Status Table ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden space-y-3 p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-600" /> Recipient Status Logs ({totalRecipientsCount})
          </h3>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {["", "sent", "delivered", "read", "failed", "queued"].map((st) => (
              <button
                key={st}
                onClick={() => { setStatusFilter(st); setRecipientPage(1); }}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                  statusFilter === st
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {st || "All Statuses"}
              </button>
            ))}
          </div>
        </div>

        {loadingRecipients ? (
          <div className="p-8 text-center text-gray-400 text-xs font-medium">Loading recipient logs...</div>
        ) : recipients.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs">No recipients found for this status.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Recipient</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">WhatsApp Message ID (wamid)</th>
                  <th className="py-2.5 px-3">Sent Time</th>
                  <th className="py-2.5 px-3">Error / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {recipients.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-gray-900">{r.recipient_name || "—"}</td>
                    <td className="py-2.5 px-3 font-mono text-gray-800">{r.phone_number}</td>
                    <td className="py-2.5 px-3">{getRecipientStatusBadge(r.status)}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-gray-500">{r.whatsapp_message_id || "—"}</td>
                    <td className="py-2.5 px-3 text-gray-500 text-[11px]">{r.sent_at || r.created_at}</td>
                    <td className="py-2.5 px-3 text-red-600 text-[11px]">
                      {r.error_message ? `${r.error_code}: ${r.error_message}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
