"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Send,
  ArrowLeft,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  Smartphone,
  AlertCircle,
  Calendar,
  Filter,
  Search,
  CheckSquare,
  Square,
} from "lucide-react";
import { getWhatsAppTemplates, previewAudience, createCampaign } from "@/lib/api/whatsappCampaigns";
import { toast } from "sonner";

export default function CreateWhatsAppCampaignPage() {
  const router = useRouter();

  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  // Form State
  const [campaignName, setCampaignName] = useState("");
  const [selectedTemplateName, setSelectedTemplateName] = useState("");
  const [audienceType, setAudienceType] = useState("teachers_all");
  const [audienceCount, setAudienceCount] = useState(0);
  const [loadingAudience, setLoadingAudience] = useState(false);

  // Specific Recipient Selection State
  const [subMode, setSubMode] = useState("all"); // 'all' or 'specific'
  const [fullRecipientsList, setFullRecipientsList] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [recipientSearch, setRecipientSearch] = useState("");

  const [variables, setVariables] = useState({});
  const [sendOption, setSendOption] = useState("now"); // 'now' or 'schedule'
  const [scheduledAtDate, setScheduledAtDate] = useState("");
  const [scheduledAtTime, setScheduledAtTime] = useState("10:00");

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [customPhoneNumbers, setCustomPhoneNumbers] = useState("");

  // Fetch Templates
  useEffect(() => {
    getWhatsAppTemplates()
      .then((data) => {
        const rawList = Array.isArray(data?.templates) ? data.templates : [];
        const list = [...rawList].sort((a, b) => (b.id || 0) - (a.id || 0));
        setTemplates(list);
        if (list.length > 0) {
          setSelectedTemplateName(list[0].name);
        }
      })
      .catch((err) => toast.error("Failed to load WhatsApp templates."))
      .finally(() => setLoadingTemplates(false));
  }, []);

  // Selected template object
  const activeTemplate = templates.find((t) => t.name === selectedTemplateName) || templates[0];

  // Fetch audience list and count
  useEffect(() => {
    if (!audienceType) return;
    setLoadingAudience(true);

    if (audienceType === "custom_numbers") {
      previewAudience(audienceType, customPhoneNumbers)
        .then((data) => setAudienceCount(data.total_count || 0))
        .catch((err) => console.error("Audience preview error:", err))
        .finally(() => setLoadingAudience(false));
    } else {
      previewAudience(audienceType, "")
        .then((data) => {
          const list = Array.isArray(data?.recipients) ? data.recipients : [];
          setFullRecipientsList(list);
          const allIds = list.map((r) => r.user_id);
          setSelectedUserIds(allIds);
          if (subMode === "all") {
            setAudienceCount(list.length);
          } else {
            setAudienceCount(allIds.length);
          }
        })
        .catch((err) => console.error("Audience preview error:", err))
        .finally(() => setLoadingAudience(false));
    }
  }, [audienceType, customPhoneNumbers]);

  // Update audience count when subMode or selectedUserIds change
  useEffect(() => {
    if (audienceType === "custom_numbers") return;
    if (subMode === "all") {
      setAudienceCount(fullRecipientsList.length);
    } else {
      setAudienceCount(selectedUserIds.length);
    }
  }, [subMode, selectedUserIds, fullRecipientsList, audienceType]);

  // Filtered recipients for checklist view
  const filteredRecipients = fullRecipientsList.filter((r) => {
    if (!recipientSearch.trim()) return true;
    const q = recipientSearch.toLowerCase();
    return (
      (r.recipient_name || "").toLowerCase().includes(q) ||
      (r.phone_number || "").includes(q) ||
      (r.city || "").toLowerCase().includes(q) ||
      (r.email || "").toLowerCase().includes(q)
    );
  });

  // Update variables default on template selection change
  useEffect(() => {
    if (!activeTemplate) return;
    const initialVars = {};
    (activeTemplate.variables || []).forEach((v) => {
      if (v.key !== "1") {
        initialVars[v.key] = v.default || "";
      }
    });
    setVariables(initialVars);
  }, [selectedTemplateName]);

  const handleVariableChange = (key, val) => {
    setVariables((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (!campaignName.trim()) {
      toast.error("Please enter a Campaign Name.");
      return;
    }
    if (!selectedTemplateName) {
      toast.error("Please select a WhatsApp Template.");
      return;
    }
    if (audienceType === "custom_numbers" && !customPhoneNumbers.trim()) {
      toast.error("Please enter at least one phone number.");
      return;
    }
    if (audienceCount === 0) {
      toast.error("The selected audience has 0 valid recipients.");
      return;
    }
    if (sendOption === "schedule" && !scheduledAtDate) {
      toast.error("Please pick a schedule date.");
      return;
    }

    setConfirmModalOpen(true);
  };

  const handleConfirmAndSend = async () => {
    setSubmitting(true);
    try {
      const filterValue = audienceType === "custom_numbers"
        ? customPhoneNumbers
        : (subMode === "specific" ? selectedUserIds.join(",") : "");

      const res = await createCampaign({
        campaign_name: campaignName.trim(),
        template_name: selectedTemplateName,
        audience_type: audienceType,
        audience_filter: filterValue,
        variables: variables,
        scheduled_at: null,
      });

      toast.success(res.message || "Campaign created successfully!");
      router.push("/admin/whatsapp/campaigns");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to create campaign.");
    } finally {
      setSubmitting(false);
      setConfirmModalOpen(false);
    }
  };

  // Build live message body for WhatsApp Mobile Preview
  const buildPreviewBody = () => {
    if (!activeTemplate) return "";
    let body = activeTemplate.body_preview || "";
    body = body.replace("{{1}}", "Arjun Kumar");
    Object.keys(variables).forEach((k) => {
      const val = variables[k] || `{{${k}}}`;
      body = body.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), val);
    });
    return body;
  };

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <Link
            href="/admin/whatsapp/campaigns"
            className="text-xs font-bold text-gray-500 hover:text-gray-800 flex items-center gap-1 mb-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Campaigns
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" /> Create WhatsApp Campaign
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── Left Side: Form ── */}
        <form onSubmit={handleSubmitForm} className="lg:col-span-7 space-y-6">
          {/* Card 1: Campaign Details */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs flex items-center justify-center font-bold">1</span>
              Campaign Details
            </h2>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Campaign Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Teacher Webinar September 2026"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-purple-500 bg-gray-50/50 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Select WhatsApp Template <span className="text-red-500">*</span>
              </label>
              {loadingTemplates ? (
                <div className="py-2 text-xs text-gray-400">Loading approved templates...</div>
              ) : (
                <select
                  value={selectedTemplateName}
                  onChange={(e) => setSelectedTemplateName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-purple-500 bg-gray-50/50 font-semibold text-purple-900"
                >
                  {templates.map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.display_name} ({t.name}) — [{t.status}]
                    </option>
                  ))}
                </select>
              )}
              {activeTemplate && (
                <p className="text-[11px] text-gray-500 mt-1">{activeTemplate.description}</p>
              )}
            </div>
          </div>

          {/* Card 2: Audience Selection */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs flex items-center justify-center font-bold">2</span>
              Audience Selection
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: "teachers_all", title: "All Teachers", desc: "Registered teachers in CRM Table" },
                { id: "customers_all", title: "All Customers", desc: "Registered store customers" },
                { id: "custom_numbers", title: "Custom Phone Numbers", desc: "Manually enter or paste phone numbers" },
              ].map((aud) => (
                <div
                  key={aud.id}
                  onClick={() => {
                    setAudienceType(aud.id);
                    setSubMode("all");
                  }}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    audienceType === aud.id
                      ? "border-[#075e54] bg-emerald-50/60 shadow-xs"
                      : "border-gray-100 bg-white hover:border-gray-200"
                  }`}
                >
                  <p className="font-bold text-xs text-gray-900">{aud.title}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{aud.desc}</p>
                </div>
              ))}
            </div>

            {/* Sub-Mode Selector for Teachers / Customers */}
            {(audienceType === "teachers_all" || audienceType === "customers_all") && (
              <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-200/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200/60 pb-3">
                  <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-[#075e54]" /> Target Audience Scope:
                  </p>
                  <div className="flex items-center bg-gray-200/80 p-1 rounded-xl text-xs font-bold w-fit">
                    <button
                      type="button"
                      onClick={() => setSubMode("all")}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        subMode === "all" ? "bg-white text-[#075e54] shadow-2xs font-extrabold" : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Entire Group ({fullRecipientsList.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubMode("specific")}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        subMode === "specific" ? "bg-[#075e54] text-white shadow-2xs font-extrabold" : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Select Specific People ({selectedUserIds.length})
                    </button>
                  </div>
                </div>

                {subMode === "specific" && (
                  <div className="space-y-3">
                    {/* Search & Bulk Controls */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="relative w-full sm:w-72">
                        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search name, phone, city..."
                          value={recipientSearch}
                          onChange={(e) => setRecipientSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#075e54] bg-white font-medium"
                        />
                      </div>
                      <div className="flex items-center gap-3 w-full sm:w-auto justify-end text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            const visibleIds = filteredRecipients.map((r) => r.user_id);
                            setSelectedUserIds(Array.from(new Set([...selectedUserIds, ...visibleIds])));
                          }}
                          className="font-bold text-[#075e54] hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <CheckSquare className="w-3.5 h-3.5" /> Select Visible ({filteredRecipients.length})
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          type="button"
                          onClick={() => setSelectedUserIds([])}
                          className="font-bold text-red-600 hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <Square className="w-3.5 h-3.5" /> Deselect All
                        </button>
                      </div>
                    </div>

                    {/* Scrollable Recipients Checklist */}
                    <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-xl bg-white divide-y divide-gray-100 text-xs shadow-inner">
                      {filteredRecipients.length === 0 ? (
                        <div className="p-6 text-center text-gray-400 font-medium">No matching recipients found</div>
                      ) : (
                        filteredRecipients.map((r) => {
                          const isChecked = selectedUserIds.includes(r.user_id);
                          return (
                            <label
                              key={r.user_id}
                              className={`flex items-center justify-between p-3 hover:bg-emerald-50/50 cursor-pointer transition-colors ${
                                isChecked ? "bg-emerald-50/40" : ""
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedUserIds([...selectedUserIds, r.user_id]);
                                    } else {
                                      setSelectedUserIds(selectedUserIds.filter((id) => id !== r.user_id));
                                    }
                                  }}
                                  className="w-4 h-4 text-[#075e54] rounded border-gray-300 focus:ring-[#075e54] accent-[#075e54]"
                                />
                                <div>
                                  <p className="font-bold text-gray-900">{r.recipient_name}</p>
                                  <p className="text-[11px] text-gray-500 font-mono">{r.phone_number}</p>
                                </div>
                              </div>
                              {r.city && (
                                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                                  {r.city}
                                </span>
                              )}
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {audienceType === "custom_numbers" && (
              <div className="space-y-1.5 pt-2">
                <label className="block text-xs font-bold text-gray-700">
                  Enter / Paste Phone Numbers <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Enter 10-digit mobile numbers separated by commas or new lines (e.g. 9876543210, 9123456789)"
                  value={customPhoneNumbers}
                  onChange={(e) => setCustomPhoneNumbers(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 text-xs font-mono focus:outline-none focus:border-[#075e54] bg-gray-50/50"
                />
                <p className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100/80">
                  💡 Enter plain 10-digit mobile numbers. No need to add +91 or country codes — system formats all numbers automatically!
                </p>
              </div>
            )}

            <div className="bg-emerald-50/60 rounded-xl p-3.5 border border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#075e54]" />
                <span className="text-xs font-semibold text-[#075e54]">Total Recipients Snapshot:</span>
              </div>
              <span className="text-sm font-extrabold text-[#075e54] bg-white px-3 py-1 rounded-lg border border-emerald-200">
                {loadingAudience ? "Counting..." : `${audienceCount.toLocaleString()} Recipients`}
              </span>
            </div>
          </div>

          {/* Card 3: Template Variables */}
          {activeTemplate && activeTemplate.variables && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs flex items-center justify-center font-bold">3</span>
                Fill Template Variables
              </h2>

              <div className="space-y-3">
                {activeTemplate.variables.map((v) => (
                  <div key={v.key} className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-700">
                      Variable <code className="text-purple-600 bg-purple-50 px-1 py-0.5 rounded">{`{{${v.key}}}`}</code> — {v.label}
                    </label>
                    {v.source === "recipient_name" ? (
                      <input
                        type="text"
                        disabled
                        value="[ Automatically populated from recipient name ]"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs bg-gray-100 text-gray-500 italic"
                      />
                    ) : (
                      <input
                        type="text"
                        required
                        placeholder={v.default || `Enter value for {{${v.key}}}`}
                        value={variables[v.key] || ""}
                        onChange={(e) => handleVariableChange(v.key, e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-purple-500 bg-gray-50/50 font-medium"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 px-6 bg-[#075e54] hover:bg-[#128c7e] text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.01] flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            <Send className="w-4 h-4 text-[#25d366]" />
            Launch & Send Campaign Now
          </button>
        </form>

        {/* ── Right Side: WhatsApp Interactive Mobile Preview ── */}
        <div className="lg:col-span-5 sticky top-6 space-y-4">
          <div className="bg-emerald-900 rounded-[35px] p-4 shadow-2xl border-4 border-emerald-800 text-white max-w-sm mx-auto">
            {/* Phone Top Notch Bar */}
            <div className="flex items-center justify-between text-[11px] text-emerald-200 px-2 pb-3">
              <span className="font-bold">WhatsApp</span>
              <Smartphone className="w-4 h-4" />
            </div>

            {/* Chat Bubble Container */}
            <div className="bg-[#efeae2] rounded-3xl p-3.5 text-gray-900 space-y-3 min-h-[380px] shadow-inner flex flex-col justify-end relative">
              {/* Today Date Badge */}
              <div className="flex justify-center my-1">
                <span className="bg-[#ffffff]/90 text-gray-500 text-[9px] font-bold px-2.5 py-0.5 rounded-md shadow-2xs uppercase">
                  Today
                </span>
              </div>

              <div className="bg-white rounded-2xl rounded-tl-sm p-3.5 shadow-sm border border-gray-100/80 space-y-2.5 relative">
                {/* Header Tag */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                  <p className="text-[10px] font-extrabold text-[#075e54] flex items-center gap-1">
                    Cremson Official Notice
                  </p>
                  <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono font-bold">WhatsApp Template</span>
                </div>

                {/* Body Text */}
                <p className="whitespace-pre-line text-[11px] leading-relaxed text-gray-800 font-sans">
                  {buildPreviewBody()}
                </p>

                <div className="flex justify-end items-center gap-1 text-[9px] text-gray-400 pt-0.5 border-t border-gray-50">
                  <span className="font-medium">10:00 AM</span>
                  <span className="text-[#34b7f1] font-bold text-[11px]">✓✓</span>
                </div>

                {/* Button CTA preview */}
                {activeTemplate?.buttons && activeTemplate.buttons.length > 0 && (
                  <div className="pt-2 border-t border-gray-100">
                    <div className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-[#075e54] text-xs font-bold rounded-xl text-center flex items-center justify-center gap-1.5 cursor-pointer border border-emerald-200/60 shadow-2xs">
                      <span>🔗</span> {activeTemplate.buttons[0].text}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <p className="text-[10px] text-center text-emerald-300 mt-2">
              Preview shown with sample recipient "Arjun Kumar"
            </p>
          </div>
        </div>
      </div>

      {/* ── Safety Confirmation Modal ── */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Confirm Campaign Sending</h3>
                <p className="text-xs text-gray-500">Please review final parameters</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-gray-700 bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <p><strong>Campaign Name:</strong> {campaignName}</p>
              <p><strong>Template:</strong> <code className="text-purple-600">{selectedTemplateName}</code></p>
              <p><strong>Audience:</strong> {audienceType.replace("_", " ")}</p>
              <p><strong>Total Recipients:</strong> <span className="font-bold text-purple-700">{audienceCount.toLocaleString()}</span></p>
              <p><strong>Execution Mode:</strong> {sendOption === "now" ? "Immediate Send" : `Scheduled for ${scheduledAtDate} ${scheduledAtTime}`}</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmAndSend}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2"
              >
                {submitting ? "Enqueueing..." : "Confirm & Launch Campaign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
