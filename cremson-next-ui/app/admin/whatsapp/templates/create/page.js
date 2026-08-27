"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Smartphone,
  Plus,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileText,
  MessageSquare,
  RefreshCw,
  Edit3,
} from "lucide-react";
import { createTemplate, getWhatsAppTemplates } from "@/lib/api/whatsappCampaigns";
import { toast } from "sonner";

function CreateWhatsAppTemplateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editTargetName = searchParams.get("edit");
  const isEditing = Boolean(editTargetName);

  // Form State
  const [displayName, setDisplayName] = useState("");
  const [category, setCategory] = useState("MARKETING");
  const [language, setLanguage] = useState("en");
  const [description, setDescription] = useState("");
  const [bodyText, setBodyText] = useState("");

  // Sample values for Meta approval (mapping of variable key -> sample string)
  const [sampleValues, setSampleValues] = useState({});

  // Button CTA State
  const [buttonText, setButtonText] = useState("");
  const [buttonUrl, setButtonUrl] = useState("");

  const [submitting, setSubmitting] = useState(false);

  // Pre-fill existing template data if editing
  useEffect(() => {
    if (!editTargetName) return;
    async function loadTemplateForEdit() {
      try {
        const res = await getWhatsAppTemplates();
        const templates = res.templates || [];
        const target = templates.find((t) => t.name === editTargetName);
        if (target) {
          setDisplayName(target.display_name || target.name);
          setCategory(target.category || "MARKETING");
          setLanguage(target.language || "en");
          setDescription(target.description || "");
          setBodyText(target.body_preview || "");

          if (Array.isArray(target.buttons) && target.buttons.length > 0) {
            setButtonText(target.buttons[0].text || "");
            setButtonUrl(target.buttons[0].url || "");
          }
        }
      } catch (err) {
        toast.error("Failed to load template data for editing.");
      }
    }
    loadTemplateForEdit();
  }, [editTargetName]);

  // System name auto-slug generator
  const systemName = displayName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_");

  // Detect dynamic variables from body text (e.g. {{1}}, {{2}}, {{3}})
  const detectedVarMatches = bodyText.match(/\{\{(\d+)\}\}/g) || [];
  const detectedVarKeys = Array.from(
    new Set(detectedVarMatches.map((m) => m.replace(/[\{\}]/g, "")))
  ).sort((a, b) => parseInt(a) - parseInt(b));

  // Sync sampleValues object whenever detectedVarKeys change
  useEffect(() => {
    setSampleValues((prev) => {
      const updated = { ...prev };
      detectedVarKeys.forEach((key) => {
        if (updated[key] === undefined) {
          updated[key] = "";
        }
      });
      return updated;
    });
  }, [bodyText]);

  const handleSampleChange = (key, value) => {
    setSampleValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Live preview message body generator
  const buildLivePreviewBody = () => {
    let text = bodyText || "";
    detectedVarKeys.forEach((key) => {
      const val = sampleValues[key] || `{{${key}}}`;
      text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), val);
    });
    return text;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!displayName.trim()) {
      toast.error("Please enter a Template Display Name.");
      return;
    }
    if (!bodyText.trim()) {
      toast.error("Please enter Message Body Text.");
      return;
    }

    // Validate that all detected variables have sample values entered
    for (const key of detectedVarKeys) {
      if (!sampleValues[key] || !sampleValues[key].trim()) {
        toast.error(`Please fill in the sample value for variable {{${key}}}.`);
        return;
      }
    }

    setSubmitting(true);

    try {
      const variablesPayload = detectedVarKeys.map((key) => ({
        key: key,
        label: key === "1" ? "Recipient Name" : `Variable ${key}`,
        source: key === "1" ? "recipient_name" : "custom",
        default: sampleValues[key] || "",
      }));

      const buttonsPayload = buttonText.trim()
        ? [
            {
              type: "URL",
              text: buttonText.trim(),
              url: buttonUrl.trim() || "https://cremsonpublications.com",
            },
          ]
        : [];

      const payload = {
        name: systemName || "custom_template",
        display_name: displayName.trim(),
        category: category,
        language: language,
        status: "PENDING",
        description: description.trim(),
        body_preview: bodyText.trim(),
        variables: variablesPayload,
        buttons: buttonsPayload,
        sample_values: sampleValues,
        is_editing: isEditing,
      };

      toast.info("Submitting template to Meta Graph API for review...");
      const res = await createTemplate(payload);

      if (res.success) {
        toast.success(res.message || "Template submitted successfully!");
        router.push("/admin/whatsapp/templates");
      } else {
        toast.error("Failed to submit template to Meta.");
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "An error occurred while creating template.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <Link
            href="/admin/whatsapp/templates"
            className="text-xs font-bold text-gray-500 hover:text-gray-800 flex items-center gap-1 mb-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Templates Explorer
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-[#075e54]" />
            {isEditing ? `Edit Template: "${displayName || editTargetName}"` : "Create New WhatsApp Template"}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {isEditing
              ? "Modify your template text & variables. Submitting will register a new updated version with Meta."
              : "Design your WhatsApp message, configure variable sample values, and submit to Meta for approval."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── Left Column: Template Form ── */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
          {/* Card 1: Basic Settings */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-[#075e54] text-xs flex items-center justify-center font-bold">1</span>
              Template Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Template Display Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Teacher Webinar Invitation 2026"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#075e54] bg-gray-50/50 font-medium"
                />
                {displayName && (
                  <p className="text-[11px] font-mono text-gray-400 mt-1">
                    System Meta Name: <span className="font-bold text-[#075e54]">{systemName}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#075e54] bg-gray-50/50 font-semibold"
                >
                  <option value="MARKETING">MARKETING (Campaigns & Offers)</option>
                  <option value="UTILITY">UTILITY (Notifications & Updates)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Description / Internal Note</label>
              <input
                type="text"
                placeholder="Brief internal note describing when to use this template..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#075e54] bg-gray-50/50 font-medium"
              />
            </div>
          </div>

          {/* Card 2: Message Body Text */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-[#075e54] text-xs flex items-center justify-center font-bold">2</span>
                Message Body Text <span className="text-red-500">*</span>
              </h2>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                Use {"{{1}}"}, {"{{2}}"} for placeholders
              </span>
            </div>

            <div>
              <textarea
                rows={7}
                required
                placeholder="Write your template message here..."
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                className="w-full p-4 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#075e54] bg-gray-50/50 font-medium leading-relaxed"
              />
            </div>

            {detectedVarKeys.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap text-xs bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/80">
                <Sparkles className="w-4 h-4 text-[#075e54]" />
                <span className="font-bold text-[#075e54]">Detected Variables:</span>
                {detectedVarKeys.map((k) => (
                  <span
                    key={k}
                    className="font-mono font-bold text-xs bg-[#075e54] text-white px-2 py-0.5 rounded-md shadow-2xs"
                  >
                    {"{{"}
                    {k}
                    {"}}"}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Card 3: Variable Sample Values for Meta Approval */}
          {detectedVarKeys.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-[#075e54] text-xs flex items-center justify-center font-bold">3</span>
                  Sample Values for Meta Approval
                </h2>
                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                  Meta Graph API requires example sample data for every variable placeholder so their automated approval system understands your message during review.
                </p>
              </div>

              <div className="space-y-3">
                {detectedVarKeys.map((key) => (
                  <div key={key} className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-200/80 space-y-1.5">
                    <label className="block text-xs font-bold text-gray-800 flex items-center gap-1.5">
                      <span className="font-mono bg-[#075e54] text-white px-1.5 py-0.5 rounded text-[11px]">
                        {"{{"}
                        {key}
                        {"}}"}
                      </span>
                      Sample Value for Variable {key} <span className="text-red-500">*</span>
                      {key === "1" && <span className="text-[11px] text-emerald-700 font-semibold">(e.g. Recipient Name)</span>}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={`Enter sample text for {{${key}}}...`}
                      value={sampleValues[key] || ""}
                      onChange={(e) => handleSampleChange(key, e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-[#075e54] bg-white font-medium"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Card 4: Action Button (Optional) */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-[#075e54] text-xs flex items-center justify-center font-bold">4</span>
              Action Button (Optional)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Button CTA Text</label>
                <input
                  type="text"
                  placeholder="e.g. Join Webinar or Buy Books"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#075e54] bg-gray-50/50 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Button Target URL</label>
                <input
                  type="url"
                  placeholder="https://us05web.zoom.us/..."
                  value={buttonUrl}
                  onChange={(e) => setButtonUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#075e54] bg-gray-50/50 font-medium font-mono"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-[#25d366] hover:bg-[#20bd5a] text-white font-extrabold text-sm rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 transform hover:scale-[1.01] cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" /> Submitting to Meta Graph API...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" /> Submit Template to Meta for Approval
                </>
              )}
            </button>
          </div>
        </form>

        {/* ── Right Column: Live WhatsApp Mobile Preview ── */}
        <div className="lg:col-span-5 sticky top-6 space-y-4">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden text-left">
            {/* Phone Header Bar */}
            <div className="bg-[#075e54] text-white p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                📚
              </div>
              <div>
                <p className="font-bold text-sm leading-tight flex items-center gap-1">
                  Cremson Publications
                  <span className="w-3.5 h-3.5 bg-[#25d366] text-white rounded-full flex items-center justify-center text-[8px] font-black">
                    ✓
                  </span>
                </p>
                <p className="text-[10px] text-emerald-200 font-medium">Official Business Account</p>
              </div>
            </div>

            {/* Phone Chat Background */}
            <div className="bg-[#efeae2] p-5 min-h-[380px] space-y-3 flex flex-col justify-between relative">
              <div className="bg-white rounded-2xl rounded-tl-xs p-4 shadow-sm space-y-2 border border-gray-100 max-w-[95%] text-gray-800 text-xs leading-relaxed">
                <p className="font-semibold text-emerald-900 border-b border-gray-100 pb-1.5 text-[11px]">
                  📌 Live Preview (With Custom Sample Values)
                </p>
                <div className="whitespace-pre-wrap font-sans text-gray-800">
                  {buildLivePreviewBody() || "Start typing your template message to see live preview..."}
                </div>
                <div className="text-[10px] text-gray-400 text-right pt-1 font-mono flex items-center justify-end gap-1">
                  10:30 AM <span className="text-blue-500 font-bold">✓✓</span>
                </div>
              </div>

              {/* Action Button Preview */}
              {buttonText.trim() && (
                <div className="bg-white/90 backdrop-blur-xs rounded-xl p-2.5 text-center text-xs font-bold text-[#075e54] border border-gray-200 shadow-xs flex items-center justify-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" />
                  {buttonText.trim()}
                </div>
              )}
            </div>
          </div>

          <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-200/80 text-xs text-emerald-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-[#075e54]">
              <CheckCircle2 className="w-4 h-4" /> Enforced Meta Direct Submission
            </p>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Templates created here are submitted directly to Meta Graph API. Once approved by Meta, your template will instantly update to <span className="font-bold text-emerald-900">APPROVED</span> status on your dashboard!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreateWhatsAppTemplatePage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-xs font-bold text-gray-500">Loading template editor...</div>}>
      <CreateWhatsAppTemplateForm />
    </React.Suspense>
  );
}
