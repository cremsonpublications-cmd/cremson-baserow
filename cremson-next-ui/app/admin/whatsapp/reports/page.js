"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Send,
  ArrowLeft,
  CheckCircle2,
  TrendingUp,
  Users,
  AlertCircle,
  Clock,
} from "lucide-react";
import { getCampaigns } from "@/lib/api/whatsappCampaigns";

export default function AdminWhatsAppReportsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["whatsapp-campaigns"],
    queryFn: getCampaigns,
  });

  const campaigns = Array.isArray(data?.campaigns) ? data.campaigns : [];

  const totalCampaigns = campaigns.length;
  const totalSent = campaigns.reduce((acc, c) => acc + (c.sent_count || 0), 0);
  const totalDelivered = campaigns.reduce((acc, c) => acc + (c.delivered_count || 0), 0);
  const totalRead = campaigns.reduce((acc, c) => acc + (c.read_count || 0), 0);
  const totalFailed = campaigns.reduce((acc, c) => acc + (c.failed_count || 0), 0);

  const deliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0;
  const readRate = totalDelivered > 0 ? Math.round((totalRead / totalDelivered) * 100) : 0;

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
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-purple-600" /> WhatsApp Campaign Reports & Analytics
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Global engagement, delivery metrics, and performance overview across all campaigns.
          </p>
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
          <p className="text-xs text-gray-500 font-medium">Total Messages Sent</p>
          <p className="text-3xl font-extrabold text-gray-900 mt-2">{totalSent.toLocaleString()}</p>
          <p className="text-xs text-purple-600 font-semibold mt-1">Across {totalCampaigns} campaigns</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
          <p className="text-xs text-gray-500 font-medium">Successful Deliveries</p>
          <p className="text-3xl font-extrabold text-emerald-600 mt-2">{totalDelivered.toLocaleString()}</p>
          <p className="text-xs text-emerald-700 font-semibold mt-1">{deliveryRate}% Delivery Rate</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
          <p className="text-xs text-gray-500 font-medium">Total Reads</p>
          <p className="text-3xl font-extrabold text-indigo-600 mt-2">{totalRead.toLocaleString()}</p>
          <p className="text-xs text-indigo-700 font-semibold mt-1">{readRate}% Read Rate</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
          <p className="text-xs text-gray-500 font-medium">Failed Messages</p>
          <p className="text-3xl font-extrabold text-red-500 mt-2">{totalFailed}</p>
          <p className="text-xs text-red-600 font-semibold mt-1">Retryable in campaign details</p>
        </div>
      </div>

      {/* ── Performance Breakdown ── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
          Campaign Performance Breakdown
        </h3>

        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-xs">Loading analytics...</div>
        ) : campaigns.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs">No campaign data available.</div>
        ) : (
          <div className="space-y-4">
            {campaigns.map((c) => {
              const cTotal = c.total_recipients || 1;
              const cDel = c.delivered_count || 0;
              const cPct = Math.round((cDel / cTotal) * 100);
              return (
                <div key={c.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-gray-900">{c.campaign_name} <span className="font-mono text-purple-600">({c.template_name})</span></span>
                    <span className="text-emerald-700">{cDel} / {cTotal} Delivered ({cPct}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-600 rounded-full transition-all" style={{ width: `${cPct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
