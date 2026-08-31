"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../../../lib/api/axios";
import { toast } from "sonner";
import {
  Plus,
  Edit3,
  Trash2,
  Eye,
  Loader2,
  Megaphone,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from "lucide-react";

export default function AdminCampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  async function fetchCampaigns() {
    setLoading(true);
    try {
      const res = await api.get("/api/campaigns/");
      setCampaigns(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Failed to load campaigns.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCampaigns();
  }, []);

  async function handleDelete(id) {
    setDeletingId(id);
    try {
      await api.delete(`/api/campaigns/${id}`);
      toast.success("Campaign deleted.");
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
    } catch {
      toast.error("Failed to delete campaign.");
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
            <Megaphone size={20} className="text-red-700" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">Campaigns</h1>
            <p className="text-xs text-gray-500 mt-0.5">Manage landing page campaigns</p>
          </div>
        </div>
        <button
          onClick={() => router.push("/admin/campaigns/new")}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-sm font-bold shadow transition-colors cursor-pointer"
        >
          <Plus size={16} />
          Create New Campaign
        </button>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={28} className="text-red-700 animate-spin" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Megaphone size={40} className="text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No campaigns yet.</p>
            <p className="text-gray-400 text-sm mt-1">Click "Create New Campaign" to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Campaign
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Headline
                  </th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Active
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                    {/* Title + thumbnail */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {campaign.hero_image ? (
                          <img
                            src={campaign.hero_image}
                            alt={campaign.title}
                            className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                            onError={(e) => { e.target.style.display = "none"; }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                            <Megaphone size={16} className="text-gray-400" />
                          </div>
                        )}
                        <span className="font-semibold text-gray-900 line-clamp-1">{campaign.title}</span>
                      </div>
                    </td>

                    {/* Slug */}
                    <td className="px-5 py-4">
                      <code className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {campaign.slug}
                      </code>
                    </td>

                    {/* Headline */}
                    <td className="px-5 py-4 text-gray-600 max-w-xs">
                      <span className="line-clamp-1">{campaign.hero_headline || "—"}</span>
                    </td>

                    {/* Active badge */}
                    <td className="px-5 py-4 text-center">
                      {campaign.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          <CheckCircle2 size={10} />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200/60">
                          <XCircle size={10} />
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {/* View public page */}
                        <a
                          href={`/campaign/${campaign.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                          title="View live page"
                        >
                          <ExternalLink size={12} />
                          View
                        </a>

                        {/* Edit */}
                        <button
                          onClick={() => router.push(`/admin/campaigns/${campaign.id}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60 transition-colors cursor-pointer"
                        >
                          <Edit3 size={12} />
                          Edit
                        </button>

                        {/* Delete */}
                        {confirmId === campaign.id ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleDelete(campaign.id)}
                              disabled={deletingId === campaign.id}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-700 text-white hover:bg-red-800 transition-colors cursor-pointer disabled:opacity-60"
                            >
                              {deletingId === campaign.id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                "Confirm"
                              )}
                            </button>
                            <button
                              onClick={() => setConfirmId(null)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmId(campaign.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200/60 transition-colors cursor-pointer"
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Count */}
      {!loading && campaigns.length > 0 && (
        <p className="text-xs text-gray-400 mt-3 text-right">
          {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""} total
        </p>
      )}
    </div>
  );
}
