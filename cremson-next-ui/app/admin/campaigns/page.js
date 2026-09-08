"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "../../../lib/api/axios";
import { toast } from "sonner";
import { campaignData as defaultCampaignData } from "../../../data/campaignData";
import {
  Megaphone,
  Plus,
  Trash2,
  ExternalLink,
  Edit,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function AdminCampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const nameInputRef = useRef(null);

  const generatedSlug = slugify(newName);

  async function loadCampaigns() {
    setLoading(true);
    try {
      const res = await api.get("/api/campaigns/");
      const items = Array.isArray(res.data)
        ? res.data
        : res.data.results || res.data.items || [];
      setCampaigns(items);
    } catch (err) {
      toast.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCampaigns();
  }, []);

  useEffect(() => {
    if (showNewForm && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [showNewForm]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error("Please enter a campaign name");
      return;
    }
    setCreating(true);
    try {
      const slug = generatedSlug || `campaign-${Date.now()}`;
      const payload = {
        title: newName.trim(),
        slug,
        is_active: false,
        data: {
          ...defaultCampaignData,
          meta: {
            ...defaultCampaignData.meta,
            slug,
            title: newName.trim(),
          },
        },
      };
      const res = await api.post("/api/campaigns/", payload);
      const created = res.data;
      toast.success("Campaign created!");
      setNewName("");
      setShowNewForm(false);
      router.push(`/admin/campaigns/${created.id}`);
    } catch (err) {
      toast.error("Failed to create campaign");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`Delete campaign "${title}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await api.delete(`/api/campaigns/${id}`);
      toast.success("Campaign deleted");
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      toast.error("Failed to delete campaign");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center border border-red-100">
            <Megaphone size={20} className="text-red-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campaign Pages</h1>
            <p className="text-sm text-gray-500">Manage your visual landing campaigns</p>
          </div>
        </div>
        <button
          onClick={() => setShowNewForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm cursor-pointer"
        >
          <Plus size={16} />
          New Campaign
        </button>
      </div>

      {/* New Campaign Inline Form */}
      {showNewForm && (
        <div className="mb-6 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Create New Campaign</h2>
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Campaign Name
              </label>
              <input
                ref={nameInputRef}
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. PAT Physical Education 2025"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100"
              />
            </div>
            {generatedSlug && (
              <p className="text-xs text-gray-400">
                Slug:{" "}
                <span className="font-mono text-gray-600 bg-gray-50 px-2 py-0.5 rounded">
                  {generatedSlug}
                </span>
              </p>
            )}
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={creating || !newName.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                {creating ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Plus size={14} />
                )}
                {creating ? "Creating..." : "Create & Edit"}
              </button>
              <button
                type="button"
                onClick={() => { setShowNewForm(false); setNewName(""); }}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Campaign List */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin text-red-700" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 border border-gray-100">
            <Megaphone size={28} className="text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium mb-1">No campaigns yet</p>
          <p className="text-sm text-gray-400">Click "New Campaign" to create your first one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign) => {
            const slug = campaign.slug || campaign.data?.meta?.slug || "";
            const headline =
              campaign.data?.hero?.headline ||
              campaign.data?.meta?.title ||
              "";
            const isActive = campaign.is_active;

            return (
              <div
                key={campaign.id}
                className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-4 hover:border-gray-300 transition-colors group shadow-sm"
              >
                {/* Status dot */}
                <div
                  className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    isActive ? "bg-green-500" : "bg-gray-300"
                  }`}
                  title={isActive ? "Live" : "Draft"}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm truncate">
                      {campaign.title || "Untitled Campaign"}
                    </span>
                    {slug && (
                      <span className="text-xs font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md flex-shrink-0">
                        /{slug}
                      </span>
                    )}
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                        isActive
                          ? "bg-green-50 text-green-700 border border-green-100"
                          : "bg-gray-50 text-gray-500 border border-gray-200"
                      }`}
                    >
                      {isActive ? "Live" : "Draft"}
                    </span>
                  </div>
                  {headline && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate max-w-lg">
                      {headline}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => router.push(`/admin/campaigns/${campaign.id}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit size={13} />
                    Edit
                  </button>
                  {slug && (
                    <a
                      href={`/campaign/${slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                    >
                      <ExternalLink size={13} />
                      View Live
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(campaign.id, campaign.title)}
                    disabled={deletingId === campaign.id}
                    className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    title="Delete campaign"
                  >
                    {deletingId === campaign.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
