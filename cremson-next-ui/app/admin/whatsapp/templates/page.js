"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  FileText,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Search,
  ExternalLink,
  Plus,
  Edit,
  Trash2,
  Smartphone,
  Sparkles,
  X,
  MessageSquare,
  Send,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";
import { getWhatsAppTemplates, createTemplate, updateTemplate, deleteTemplate, syncTemplatesFromMeta } from "@/lib/api/whatsappCampaigns";
import { toast } from "sonner";

export default function AdminWhatsAppTemplatesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    name: "",
    display_name: "",
    category: "MARKETING",
    language: "en",
    status: "APPROVED",
    description: "",
    body_preview: "",
    button_text: "Register Now",
    button_url: "https://cremsonpublications.com",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["whatsapp-templates"],
    queryFn: getWhatsAppTemplates,
  });

  const rawTemplates = Array.isArray(data?.templates) ? data.templates : [];
  // Sort by ID descending so latest created templates always show at the top first
  const templates = [...rawTemplates].sort((a, b) => (b.id || 0) - (a.id || 0));

  const filteredTemplates = templates.filter((t) => {
    if (activeCategory !== "all" && t.category !== activeCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        (t.display_name || "").toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenAddModal = () => {
    setEditingTemplate(null);
    setForm({
      name: "",
      display_name: "",
      category: "MARKETING",
      language: "en",
      status: "APPROVED",
      description: "",
      body_preview: "",
      button_text: "",
      button_url: "",
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (t) => {
    setEditingTemplate(t);
    const btn = (t.buttons && t.buttons[0]) || {};
    setForm({
      name: t.name,
      display_name: t.display_name || t.name,
      category: t.category || "MARKETING",
      language: t.language || "en",
      status: t.status || "APPROVED",
      description: t.description || "",
      body_preview: t.body_preview || "",
      button_text: btn.text || "Register Now",
      button_url: btn.url || "https://cremsonpublications.com",
    });
    setModalOpen(true);
  };

  const handleDelete = async (name, displayName) => {
    if (!confirm(`Are you sure you want to delete template "${displayName}"?`)) return;
    try {
      await deleteTemplate(name);
      toast.success(`Template "${displayName}" deleted.`);
      queryClient.invalidateQueries({ queryKey: ["whatsapp-templates"] });
    } catch (err) {
      toast.error("Failed to delete template.");
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!form.display_name.trim() || !form.body_preview.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    // Auto-detect variables from {{1}}, {{2}}, etc.
    const varMatches = form.body_preview.match(/\{\{(\d+)\}\}/g) || [];
    const varKeys = [...new Set(varMatches.map((m) => m.replace(/[\{\}]/g, "")))];

    const variables = varKeys.map((key) => {
      if (key === "1") {
        return { key: "1", label: "Recipient Name", source: "recipient_name" };
      } else {
        return { key: key, label: `Variable ${key}`, source: "custom", default: "" };
      }
    });

    const buttons = form.button_text
      ? [{ type: "URL", text: form.button_text, url: form.button_url || "https://cremsonpublications.com" }]
      : [];

    const systemName = editingTemplate
      ? editingTemplate.name
      : (form.name || form.display_name).trim().toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/_+/g, "_");

    const payload = {
      name: systemName,
      display_name: form.display_name.trim(),
      category: form.category || "MARKETING",
      language: form.language || "en",
      status: editingTemplate ? editingTemplate.status : "PENDING",
      description: form.description.trim(),
      body_preview: form.body_preview.trim(),
      variables: variables,
      buttons: buttons,
    };

    setSubmitting(true);
    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate.name, payload);
        toast.success(`Template "${form.display_name}" updated successfully!`);
      } else {
        await createTemplate(payload);
        toast.success(`Template "${form.display_name}" created successfully!`);
      }
      queryClient.invalidateQueries({ queryKey: ["whatsapp-templates"] });
      setModalOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to save template.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* ── STICKY TOP HEADER CONTAINER (Hero Banner + Search & Category Tabs) ── */}
      <div className="sticky top-0 z-30 space-y-4 pt-2 pb-3 bg-[#f8fafc]/95 backdrop-blur-md">
        {/* ── Header with WhatsApp Dark Teal Theme ── */}
        <div className="bg-gradient-to-r from-[#075e54] to-[#128c7e] text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
          {/* Background Decorative Pattern */}
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-8 -translate-y-8">
            <MessageSquare className="w-64 h-64 text-white" />
          </div>

          <div className="space-y-2 z-10">
            <Link
              href="/admin/whatsapp/campaigns"
              className="text-xs font-bold text-emerald-200 hover:text-white flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Campaigns Dashboard
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-3">
              <Smartphone className="w-8 h-8 text-[#25d366]" />
              WhatsApp Marketing Templates
            </h1>
            <p className="text-xs text-emerald-100 max-w-xl leading-relaxed">
              Manage approved Meta templates used for bulk marketing announcements, teacher webinar invitations, and book launches.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 z-10 w-full sm:w-auto">
            <button
              onClick={async () => {
                try {
                  toast.info("Syncing template statuses from Meta Graph API...");
                  await syncTemplatesFromMeta();
                  queryClient.invalidateQueries({ queryKey: ["whatsapp-templates"] });
                  toast.success("Template approval statuses updated from Meta!");
                } catch (err) {
                  toast.error("Failed to sync template statuses from Meta.");
                }
              }}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-2xl border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-emerald-300 animate-spin-hover" /> Sync Meta Status
            </button>

            <Link
              href="/admin/whatsapp/templates/create"
              className="px-5 py-3 bg-[#25d366] hover:bg-[#20bd5a] text-white text-xs font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 transform hover:scale-[1.03] cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add New Template
            </Link>

            <a
              href="https://business.facebook.com/wa/manage/message-templates"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-2xl border border-white/20 transition-all flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4 text-emerald-300" /> Meta Manager
            </a>
          </div>
        </div>

        {/* ── Search & Category Tabs ── */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200/80 p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md transition-all">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {["all", "MARKETING", "UTILITY"].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeCategory === cat
                    ? "bg-[#075e54] text-white shadow-xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat === "all" ? `All Templates (${templates.length})` : cat}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search templates by name or text..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#128c7e] bg-gray-50/50"
            />
          </div>
        </div>
      </div>
      {/* ── END STICKY TOP HEADER CONTAINER ── */}

      {/* ── Template Cards Grid with WhatsApp Chat Feel ── */}
      {isLoading ? (
        <div className="p-12 text-center text-gray-400 font-medium">
          <div className="w-8 h-8 border-4 border-[#075e54] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading WhatsApp marketing templates...
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center text-gray-400 space-y-3">
          <MessageSquare className="w-10 h-10 mx-auto text-gray-300" />
          <p className="text-sm font-bold text-gray-800">No Templates Found</p>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Add your first WhatsApp marketing template to start sending bulk webinar invitations and book announcements.
          </p>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#075e54] text-white text-xs font-bold rounded-xl hover:bg-[#128c7e] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Template Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((t) => (
            <div
              key={t.name}
              className="bg-white rounded-3xl border border-gray-200 p-5 shadow-xs hover:shadow-lg hover:border-emerald-200 transition-all flex flex-col justify-between space-y-4 relative group"
            >
              <div className="space-y-3">
                {/* Header info */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-900">{t.display_name || t.name}</h3>
                    <p className="text-[11px] font-mono text-[#075e54] font-semibold mt-0.5">{t.name}</p>
                  </div>
                  {t.status === "APPROVED" && (
                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-800 border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Approved
                    </span>
                  )}
                  {(t.status === "PENDING" || t.status === "IN_REVIEW") && (
                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full border bg-amber-50 text-amber-900 border-amber-200 flex items-center gap-1 animate-pulse">
                      <Clock className="w-3 h-3 text-amber-600" /> In Review (Meta Approval)
                    </span>
                  )}
                  {t.status === "REJECTED" && (
                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full border bg-red-50 text-red-800 border-red-200 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-red-600" /> Rejected by Meta
                    </span>
                  )}
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="bg-emerald-100 text-[#075e54] font-bold px-2 py-0.5 rounded-md">
                    {t.category}
                  </span>
                  <span className="text-gray-400 font-medium">Lang: {t.language}</span>
                </div>

                <p className="text-xs text-gray-600 line-clamp-2">{t.description}</p>

                {/* ── Authentic WhatsApp Mobile Chat Bubble Card ── */}
                <div className="bg-[#efeae2] rounded-3xl p-3.5 border border-emerald-100 shadow-inner relative space-y-2 text-xs">
                  {/* WhatsApp Business Header Bar */}
                  <div className="bg-[#075e54] text-white px-3 py-1.5 rounded-xl flex items-center justify-between text-[10px] font-bold shadow-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-[#25d366] text-white flex items-center justify-center text-[9px]">📚</span>
                      <span>Cremson Publications</span>
                      <span className="bg-[#25d366] text-white rounded-full w-3.5 h-3.5 text-[8px] flex items-center justify-center font-black">✓</span>
                    </div>
                    <span className="text-[9px] text-emerald-200">Verified Business</span>
                  </div>

                  {/* Today Date Badge */}
                  <div className="flex justify-center my-1">
                    <span className="bg-[#ffffff]/80 text-gray-500 text-[9px] font-bold px-2.5 py-0.5 rounded-md shadow-2xs uppercase">
                      Today
                    </span>
                  </div>

                  {/* Speech Bubble Card */}
                  <div className="bg-white rounded-2xl rounded-tl-sm p-3.5 shadow-sm border border-gray-100/80 space-y-2.5 relative">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                      <p className="text-[10px] font-extrabold text-[#075e54] flex items-center gap-1">
                        Cremson Official Notice
                      </p>
                      <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono font-bold">WhatsApp Template</span>
                    </div>

                    <p className="whitespace-pre-line text-[11px] leading-relaxed text-gray-800 font-sans">
                      {t.body_preview}
                    </p>

                    <div className="flex justify-end items-center gap-1 text-[9px] text-gray-400 pt-0.5 border-t border-gray-50">
                      <span className="font-medium">10:00 AM</span>
                      <span className="text-[#34b7f1] font-bold text-[11px]">✓✓</span>
                    </div>

                    {/* WhatsApp Interactive Action Button */}
                    {t.buttons && t.buttons.length > 0 && (
                      <div className="pt-2 border-t border-gray-100">
                        <div className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-[#075e54] text-xs font-bold rounded-xl text-center flex items-center justify-center gap-1.5 cursor-pointer border border-emerald-200/60 shadow-2xs">
                          <span>🔗</span> {t.buttons[0].text}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Variables Pills */}
                {t.variables && t.variables.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Dynamic Variables</p>
                    <div className="flex flex-wrap gap-1">
                      {t.variables.map((v) => (
                        <span key={v.key} className="text-[10px] font-mono bg-purple-50 text-purple-700 font-semibold px-2 py-0.5 rounded-md border border-purple-100">
                          {`{{${v.key}}}`} {v.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <Link
                    href={`/admin/whatsapp/templates/create?edit=${t.name}`}
                    className="p-2 rounded-xl text-gray-500 hover:text-[#075e54] hover:bg-emerald-50 transition-colors cursor-pointer flex items-center justify-center"
                    title="Edit Template"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>

                  <button
                    onClick={() => {
                      setTemplateToDelete({ name: t.name, displayName: t.display_name });
                      setDeleteModalOpen(true);
                    }}
                    className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Delete Template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <Link
                  href={`/admin/whatsapp/campaigns/create?template=${t.name}`}
                  className="px-4 py-2 bg-[#075e54] hover:bg-[#128c7e] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> Use in Campaign
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add / Edit Template Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto text-left">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#075e54]" />
                {editingTemplate ? "Edit WhatsApp Template" : "Add New WhatsApp Template"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Template Display Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. New 2026 Academic Book Launch"
                    value={form.display_name}
                    onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#075e54] bg-gray-50/50"
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5">Meta System Name will be automatically generated from this title.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#075e54] bg-gray-50/50"
                  >
                    <option value="MARKETING">MARKETING (Campaigns)</option>
                    <option value="UTILITY">UTILITY (Transactional)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Announce new textbook releases or special discount offers"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#075e54] bg-gray-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Message Body Text <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder={`Hello {{1}},\n\nWe are excited to announce our new {{2}} book series!\n\nExplore catalog: {{3}}\n\nCremson Publications Team`}
                  value={form.body_preview}
                  onChange={(e) => setForm({ ...form, body_preview: e.target.value })}
                  className="w-full p-3.5 rounded-2xl border border-gray-200 text-xs leading-relaxed font-sans focus:outline-none focus:border-[#075e54] bg-gray-50/50"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Use <code className="text-[#075e54] font-bold">{`{{1}}`}</code> for Recipient Name, <code className="text-[#075e54] font-bold">{`{{2}}`}</code>, <code className="text-[#075e54] font-bold">{`{{3}}`}</code> for custom campaign parameters.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Button CTA Text</label>
                  <input
                    type="text"
                    placeholder="e.g. Shop Books or View Catalog"
                    value={form.button_text}
                    onChange={(e) => setForm({ ...form, button_text: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#075e54] bg-gray-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Button Target URL</label>
                  <input
                    type="url"
                    placeholder="e.g. https://cremsonpublications.com/shop"
                    value={form.button_url}
                    onChange={(e) => setForm({ ...form, button_url: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#075e54] bg-gray-50/50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#075e54] hover:bg-[#128c7e] text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
                >
                  {submitting ? "Saving..." : editingTemplate ? "Save Template Changes" : "Create Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CUSTOM DELETE CONFIRMATION MODAL ── */}
      {deleteModalOpen && templateToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-gray-100 transform transition-all scale-100 text-left">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-gray-900">Delete Template?</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Are you sure you want to delete <span className="font-bold text-gray-800">"{templateToDelete.displayName}"</span>?
                </p>
              </div>
            </div>

            <div className="bg-red-50/70 rounded-2xl p-3.5 border border-red-100 text-xs text-red-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                This action will delete the template directly from your <span className="font-bold text-red-950">Meta WABA Account</span> as well as your local database catalog.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setTemplateToDelete(null);
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
                    await deleteTemplate(templateToDelete.name);
                    toast.success(`Template "${templateToDelete.displayName}" deleted successfully.`);
                    queryClient.invalidateQueries({ queryKey: ["whatsapp-templates"] });
                    setDeleteModalOpen(false);
                    setTemplateToDelete(null);
                  } catch (err) {
                    toast.error("Failed to delete template.");
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
                    <Trash2 className="w-3.5 h-3.5" /> Delete Template
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
