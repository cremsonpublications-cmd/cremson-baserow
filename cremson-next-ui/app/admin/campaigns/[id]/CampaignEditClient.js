"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "../../../../lib/api/axios";
import { toast } from "sonner";
import CampaignPage from "../../../../components/campaign/CampaignPage";
import {
  ArrowLeft,
  Save,
  ExternalLink,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";

// ─── Cloudinary upload ──────────────────────────────────────────────────────
async function uploadToCloudinary(file) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", "unsigned_preset");
  const res = await fetch(
    "https://api.cloudinary.com/v1_1/dkxxa3xt0/image/upload",
    { method: "POST", body: fd }
  );
  const json = await res.json();
  if (!json.secure_url) throw new Error("Upload failed");
  return json.secure_url;
}

// ─── Deep-path update helper ─────────────────────────────────────────────────
function setNestedValue(obj, path, value) {
  const copy = JSON.parse(JSON.stringify(obj));
  const parts = path.split(".");
  let cur = copy;
  for (let i = 0; i < parts.length - 1; i++) {
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
  return copy;
}

// ─── Auto-resize textarea ────────────────────────────────────────────────────
function AutoTextarea({ value, onChange, className, placeholder, rows = 2 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = ref.current.scrollHeight + "px";
    }
  }, [value]);
  return (
    <textarea
      ref={ref}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={`w-full resize-none overflow-hidden bg-transparent border-0 outline-none focus:border-l-2 focus:border-red-300 focus:pl-2 transition-all placeholder-gray-300 ${className}`}
    />
  );
}

// ─── Styled text input (no border look) ──────────────────────────────────────
function GhostInput({ value, onChange, className, placeholder }) {
  return (
    <input
      type="text"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-transparent border-0 outline-none focus:border-l-2 focus:border-red-300 focus:pl-2 transition-all placeholder-gray-300 ${className}`}
    />
  );
}

// ─── Image upload field ───────────────────────────────────────────────────────
function ImageField({ value, onChange, label = "Image" }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      onChange(url);
      toast.success("Image uploaded");
    } catch {
      toast.error("Image upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="mt-2">
      <p className="text-xs text-gray-400 mb-1.5">{label}</p>
      <div
        className="relative group cursor-pointer rounded-lg overflow-hidden border border-dashed border-gray-200 hover:border-red-300 transition-colors"
        onClick={() => fileRef.current?.click()}
      >
        {value ? (
          <>
            <img
              src={value}
              alt="preview"
              className="w-full h-28 object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-xs font-semibold bg-black/60 px-3 py-1.5 rounded-lg">
                Change Image
              </span>
            </div>
          </>
        ) : (
          <div className="h-20 flex flex-col items-center justify-center gap-1 text-gray-300">
            {uploading ? (
              <Loader2 size={20} className="animate-spin text-red-400" />
            ) : (
              <>
                <ImageIcon size={20} />
                <span className="text-xs">Click to upload</span>
              </>
            )}
          </div>
        )}
        {uploading && value && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <Loader2 size={20} className="animate-spin text-red-600" />
          </div>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}

// ─── Section accordion wrapper ────────────────────────────────────────────────
function SectionAccordion({ title, children, defaultOpen = false, visible, onToggleVisible }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100">
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-gray-50 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          {open ? (
            <ChevronDown size={15} className="text-gray-400" />
          ) : (
            <ChevronRight size={15} className="text-gray-400" />
          )}
          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            {title}
          </span>
        </div>
        {onToggleVisible !== undefined && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisible();
            }}
            className="text-gray-400 hover:text-gray-700 transition-colors cursor-pointer p-0.5"
            title={visible ? "Hide section" : "Show section"}
          >
            {visible ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
        )}
      </div>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}

// ─── 2-col grid for CTA pairs ─────────────────────────────────────────────────
function CtaRow({ labelValue, hrefValue, onLabelChange, onHrefChange, prefix = "" }) {
  return (
    <div className="grid grid-cols-2 gap-2 mt-1">
      <div className="bg-gray-50 rounded-lg px-2.5 py-2">
        <p className="text-[10px] text-gray-400 mb-0.5">{prefix ? prefix + " " : ""}Label</p>
        <GhostInput
          value={labelValue}
          onChange={onLabelChange}
          placeholder="Button text"
          className="text-xs text-gray-800"
        />
      </div>
      <div className="bg-gray-50 rounded-lg px-2.5 py-2">
        <p className="text-[10px] text-gray-400 mb-0.5">{prefix ? prefix + " " : ""}URL / Anchor</p>
        <GhostInput
          value={hrefValue}
          onChange={onHrefChange}
          placeholder="#section or https://..."
          className="text-xs text-gray-800"
        />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CampaignEditClient() {
  const { id } = useParams();
  const router = useRouter();

  const [campaign, setCampaign] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load campaign
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get(`/api/campaigns/${id}`)
      .then((res) => {
        const c = res.data;
        setCampaign({ id: c.id, slug: c.slug, title: c.title, is_active: c.is_active });
        setData(c.data || {});
      })
      .catch(() => toast.error("Failed to load campaign"))
      .finally(() => setLoading(false));
  }, [id]);

  // ─── State helpers ──────────────────────────────────────────────────────────
  const update = useCallback((path, value) => {
    setData((prev) => setNestedValue(prev, path, value));
  }, []);

  const updateItem = useCallback((section, idx, field, value) => {
    setData((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      if (field === null) {
        copy[section].items[idx] = value;
      } else {
        copy[section].items[idx][field] = value;
      }
      return copy;
    });
  }, []);

  const addItem = useCallback((section, template) => {
    setData((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy[section].items = [...(copy[section].items || []), { ...template }];
      return copy;
    });
  }, []);

  const removeItem = useCallback((section, idx) => {
    setData((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy[section].items = copy[section].items.filter((_, i) => i !== idx);
      return copy;
    });
  }, []);

  const toggleSection = useCallback((key) => {
    setData((prev) => setNestedValue(prev, `${key}.visible`, !prev[key]?.visible));
  }, []);

  // ─── Save ───────────────────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    try {
      await api.put(`/api/campaigns/${id}`, {
        slug: campaign.slug,
        title: campaign.title,
        is_active: campaign.is_active,
        data,
      });
      toast.success("Campaign saved!");
    } catch {
      toast.error("Failed to save campaign");
    } finally {
      setSaving(false);
    }
  }

  // ─── Loading state ──────────────────────────────────────────────────────────
  if (loading || !data || !campaign) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 size={28} className="animate-spin text-red-700" />
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen overflow-hidden">

      {/* ── Fixed Header ── */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-2.5 flex items-center gap-3 z-20">
        <button
          onClick={() => router.push("/admin/campaigns")}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors text-sm cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline text-xs font-medium">Back</span>
        </button>

        <div className="flex-1 min-w-0 flex items-center gap-2">
          <input
            value={campaign.title}
            onChange={(e) =>
              setCampaign((c) => ({ ...c, title: e.target.value }))
            }
            className="font-semibold text-gray-900 text-sm bg-transparent border-0 outline-none focus:bg-gray-50 rounded px-1 py-0.5 min-w-0 flex-1 max-w-xs"
            placeholder="Campaign title"
          />
          <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded hidden md:inline">
            /{campaign.slug}
          </span>
        </div>

        {/* Live/Draft toggle */}
        <button
          onClick={() =>
            setCampaign((c) => ({ ...c, is_active: !c.is_active }))
          }
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
            campaign.is_active
              ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
              : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
          }`}
        >
          {campaign.is_active ? <Eye size={13} /> : <EyeOff size={13} />}
          {campaign.is_active ? "Live" : "Draft"}
        </button>

        {campaign.slug && (
          <a
            href={`/campaign/${campaign.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ExternalLink size={13} />
            <span className="hidden sm:inline">View</span>
          </a>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-800 disabled:opacity-60 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-sm"
        >
          {saving ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Save size={13} />
          )}
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {/* ── Two-column body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT panel */}
        <div className="w-[380px] flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto">

          {/* ── Brand ── */}
          <SectionAccordion title="Brand">
            <GhostInput
              value={data.brand?.name}
              onChange={(v) => update("brand.name", v)}
              placeholder="Brand name"
              className="text-sm font-semibold text-gray-800"
            />
            <GhostInput
              value={data.brand?.whatsappNumber}
              onChange={(v) => update("brand.whatsappNumber", v)}
              placeholder="WhatsApp number (91...)"
              className="text-xs text-gray-600"
            />
            <div className="mt-1">
              <p className="text-[10px] text-gray-400 mb-0.5">WhatsApp message</p>
              <AutoTextarea
                value={data.brand?.whatsappText}
                onChange={(v) => update("brand.whatsappText", v)}
                placeholder="Pre-filled WhatsApp message..."
                className="text-xs text-gray-600"
              />
            </div>
            <ImageField
              label="Logo"
              value={data.brand?.logo}
              onChange={(v) => update("brand.logo", v)}
            />
          </SectionAccordion>

          {/* ── Hero ── */}
          <SectionAccordion
            title="Hero"
            defaultOpen={true}
            visible={data.hero?.visible}
            onToggleVisible={() => toggleSection("hero")}
          >
            <AutoTextarea
              value={data.hero?.headline}
              onChange={(v) => update("hero.headline", v)}
              placeholder="Main headline..."
              className="text-2xl font-bold text-gray-900 leading-tight"
              rows={2}
            />
            <AutoTextarea
              value={data.hero?.subtext}
              onChange={(v) => update("hero.subtext", v)}
              placeholder="Subtext / description..."
              className="text-sm text-gray-600 mt-1"
            />
            <p className="text-[10px] text-gray-400 mt-2 mb-0.5 font-medium uppercase tracking-wide">
              Primary CTA
            </p>
            <CtaRow
              labelValue={data.hero?.primaryCta?.label}
              hrefValue={data.hero?.primaryCta?.href}
              onLabelChange={(v) => update("hero.primaryCta.label", v)}
              onHrefChange={(v) => update("hero.primaryCta.href", v)}
            />
            <p className="text-[10px] text-gray-400 mt-2 mb-0.5 font-medium uppercase tracking-wide">
              Secondary CTA
            </p>
            <CtaRow
              labelValue={data.hero?.secondaryCta?.label}
              hrefValue={data.hero?.secondaryCta?.href}
              onLabelChange={(v) => update("hero.secondaryCta.label", v)}
              onHrefChange={(v) => update("hero.secondaryCta.href", v)}
            />
            <ImageField
              label="Hero Image"
              value={data.hero?.image}
              onChange={(v) => update("hero.image", v)}
            />
            <div className="bg-gray-50 rounded-lg px-2.5 py-2 mt-1">
              <p className="text-[10px] text-gray-400 mb-0.5">Image Alt Text</p>
              <GhostInput
                value={data.hero?.imageAlt}
                onChange={(v) => update("hero.imageAlt", v)}
                placeholder="Alt text for accessibility"
                className="text-xs text-gray-600"
              />
            </div>
          </SectionAccordion>

          {/* ── Why Choose ── */}
          <SectionAccordion
            title="Why Choose"
            visible={data.whyChoose?.visible}
            onToggleVisible={() => toggleSection("whyChoose")}
          >
            <GhostInput
              value={data.whyChoose?.heading}
              onChange={(v) => update("whyChoose.heading", v)}
              placeholder="Section heading"
              className="text-base font-bold text-gray-900"
            />
            <div className="space-y-2 mt-2">
              {(data.whyChoose?.items || []).map((item, idx) => (
                <div
                  key={idx}
                  className="bg-gray-50 rounded-xl px-3 py-2.5 relative group"
                >
                  <button
                    onClick={() => removeItem("whyChoose", idx)}
                    className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                  <GhostInput
                    value={item.title}
                    onChange={(v) => updateItem("whyChoose", idx, "title", v)}
                    placeholder="Title"
                    className="text-xs font-semibold text-gray-800"
                  />
                  <GhostInput
                    value={item.description}
                    onChange={(v) =>
                      updateItem("whyChoose", idx, "description", v)
                    }
                    placeholder="Description"
                    className="text-xs text-gray-500 mt-0.5"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() =>
                addItem("whyChoose", { icon: "Star", title: "", description: "" })
              }
              className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800 mt-1 cursor-pointer"
            >
              <Plus size={13} /> Add item
            </button>
          </SectionAccordion>

          {/* ── Product ── */}
          <SectionAccordion
            title="Product"
            visible={data.product?.visible}
            onToggleVisible={() => toggleSection("product")}
          >
            <GhostInput
              value={data.product?.title}
              onChange={(v) => update("product.title", v)}
              placeholder="Product title"
              className="text-base font-bold text-gray-900"
            />
            <GhostInput
              value={data.product?.classLabel}
              onChange={(v) => update("product.classLabel", v)}
              placeholder="Class / Grade label"
              className="text-xs text-gray-500"
            />
            <AutoTextarea
              value={data.product?.description}
              onChange={(v) => update("product.description", v)}
              placeholder="Product description..."
              className="text-sm text-gray-600 mt-1"
            />
            <p className="text-[10px] text-gray-400 mt-2 mb-1 font-medium uppercase tracking-wide">
              Features
            </p>
            <div className="space-y-1">
              {(data.product?.features || []).map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2 group">
                  <span className="text-red-400 text-xs flex-shrink-0">✓</span>
                  <GhostInput
                    value={feat}
                    onChange={(v) => {
                      setData((prev) => {
                        const copy = JSON.parse(JSON.stringify(prev));
                        copy.product.features[idx] = v;
                        return copy;
                      });
                    }}
                    placeholder="Feature item"
                    className="text-xs text-gray-700 flex-1"
                  />
                  <button
                    onClick={() => {
                      setData((prev) => {
                        const copy = JSON.parse(JSON.stringify(prev));
                        copy.product.features = copy.product.features.filter(
                          (_, i) => i !== idx
                        );
                        return copy;
                      });
                    }}
                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer flex-shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() =>
                setData((prev) => {
                  const copy = JSON.parse(JSON.stringify(prev));
                  copy.product.features = [
                    ...(copy.product.features || []),
                    "",
                  ];
                  return copy;
                })
              }
              className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800 mt-1 cursor-pointer"
            >
              <Plus size={13} /> Add feature
            </button>
            <ImageField
              label="Product Image"
              value={data.product?.image}
              onChange={(v) => update("product.image", v)}
            />
            <p className="text-[10px] text-gray-400 mt-2 mb-0.5 font-medium uppercase tracking-wide">
              CTA
            </p>
            <CtaRow
              labelValue={data.product?.cta?.label}
              hrefValue={data.product?.cta?.href}
              onLabelChange={(v) => update("product.cta.label", v)}
              onHrefChange={(v) => update("product.cta.href", v)}
            />
          </SectionAccordion>

          {/* ── Inside Pages ── */}
          <SectionAccordion
            title="Inside Pages"
            visible={data.insidePages?.visible}
            onToggleVisible={() => toggleSection("insidePages")}
          >
            <GhostInput
              value={data.insidePages?.heading}
              onChange={(v) => update("insidePages.heading", v)}
              placeholder="Section heading"
              className="text-base font-bold text-gray-900"
            />
            <div className="space-y-3 mt-2">
              {(data.insidePages?.items || []).map((item, idx) => (
                <div
                  key={idx}
                  className="bg-gray-50 rounded-xl px-3 py-2.5 relative group"
                >
                  <button
                    onClick={() => removeItem("insidePages", idx)}
                    className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                  <ImageField
                    label="Page image"
                    value={item.image}
                    onChange={(v) => updateItem("insidePages", idx, "image", v)}
                  />
                  <GhostInput
                    value={item.caption}
                    onChange={(v) =>
                      updateItem("insidePages", idx, "caption", v)
                    }
                    placeholder="Caption"
                    className="text-xs font-semibold text-gray-800 mt-2"
                  />
                  <GhostInput
                    value={item.description}
                    onChange={(v) =>
                      updateItem("insidePages", idx, "description", v)
                    }
                    placeholder="Short description"
                    className="text-xs text-gray-500 mt-0.5"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() =>
                addItem("insidePages", {
                  image: "",
                  caption: "",
                  description: "",
                })
              }
              className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800 mt-1 cursor-pointer"
            >
              <Plus size={13} /> Add page
            </button>
          </SectionAccordion>

          {/* ── Key Features ── */}
          <SectionAccordion
            title="Key Features"
            visible={data.features?.visible}
            onToggleVisible={() => toggleSection("features")}
          >
            <GhostInput
              value={data.features?.heading}
              onChange={(v) => update("features.heading", v)}
              placeholder="Section heading"
              className="text-base font-bold text-gray-900"
            />
            <div className="space-y-2 mt-2">
              {(data.features?.items || []).map((item, idx) => (
                <div
                  key={idx}
                  className="bg-gray-50 rounded-xl px-3 py-2.5 relative group"
                >
                  <button
                    onClick={() => removeItem("features", idx)}
                    className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                  <GhostInput
                    value={item.title}
                    onChange={(v) => updateItem("features", idx, "title", v)}
                    placeholder="Feature title"
                    className="text-xs font-semibold text-gray-800"
                  />
                  <AutoTextarea
                    value={item.description}
                    onChange={(v) =>
                      updateItem("features", idx, "description", v)
                    }
                    placeholder="Feature description..."
                    className="text-xs text-gray-500 mt-0.5"
                    rows={1}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() =>
                addItem("features", {
                  icon: "Star",
                  title: "",
                  description: "",
                })
              }
              className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800 mt-1 cursor-pointer"
            >
              <Plus size={13} /> Add feature
            </button>
          </SectionAccordion>

          {/* ── Combo Offer ── */}
          <SectionAccordion
            title="Combo Offer"
            visible={data.comboOffer?.visible}
            onToggleVisible={() => toggleSection("comboOffer")}
          >
            <GhostInput
              value={data.comboOffer?.heading}
              onChange={(v) => update("comboOffer.heading", v)}
              placeholder="Section heading"
              className="text-base font-bold text-gray-900"
            />
            <GhostInput
              value={data.comboOffer?.productName}
              onChange={(v) => update("comboOffer.productName", v)}
              placeholder="Product name"
              className="text-sm font-semibold text-gray-800 mt-1"
            />
            <GhostInput
              value={data.comboOffer?.label}
              onChange={(v) => update("comboOffer.label", v)}
              placeholder="Label (e.g. Complete Set)"
              className="text-xs text-gray-500"
            />
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="bg-gray-50 rounded-lg px-2.5 py-2">
                <p className="text-[10px] text-gray-400 mb-0.5">Original Price</p>
                <GhostInput
                  value={data.comboOffer?.originalPrice}
                  onChange={(v) => update("comboOffer.originalPrice", v)}
                  placeholder="₹900"
                  className="text-sm text-gray-700"
                />
              </div>
              <div className="bg-gray-50 rounded-lg px-2.5 py-2">
                <p className="text-[10px] text-gray-400 mb-0.5">Offer Price</p>
                <GhostInput
                  value={data.comboOffer?.offerPrice}
                  onChange={(v) => update("comboOffer.offerPrice", v)}
                  placeholder="₹750"
                  className="text-sm font-bold text-red-700"
                />
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg px-2.5 py-2 mt-1">
              <p className="text-[10px] text-gray-400 mb-0.5">Saving Text</p>
              <GhostInput
                value={data.comboOffer?.saving}
                onChange={(v) => update("comboOffer.saving", v)}
                placeholder="You Save ₹150 (17% OFF)"
                className="text-xs text-green-700"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-2 mb-0.5 font-medium uppercase tracking-wide">
              CTA
            </p>
            <CtaRow
              labelValue={data.comboOffer?.cta?.label}
              hrefValue={data.comboOffer?.cta?.href}
              onLabelChange={(v) => update("comboOffer.cta.label", v)}
              onHrefChange={(v) => update("comboOffer.cta.href", v)}
            />
          </SectionAccordion>

          {/* ── Audience ── */}
          <SectionAccordion
            title="Audience"
            visible={data.audience?.visible}
            onToggleVisible={() => toggleSection("audience")}
          >
            <GhostInput
              value={data.audience?.heading}
              onChange={(v) => update("audience.heading", v)}
              placeholder="Section heading"
              className="text-base font-bold text-gray-900"
            />
            <div className="space-y-1.5 mt-2">
              {(data.audience?.items || []).map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 group">
                  <GhostInput
                    value={item.title}
                    onChange={(v) => updateItem("audience", idx, "title", v)}
                    placeholder="Audience type"
                    className="text-sm text-gray-700 flex-1"
                  />
                  <button
                    onClick={() => removeItem("audience", idx)}
                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer flex-shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => addItem("audience", { icon: "User", title: "" })}
              className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800 mt-1 cursor-pointer"
            >
              <Plus size={13} /> Add audience
            </button>
          </SectionAccordion>

          {/* ── Testimonials ── */}
          <SectionAccordion
            title="Testimonials"
            visible={data.testimonials?.visible}
            onToggleVisible={() => toggleSection("testimonials")}
          >
            <GhostInput
              value={data.testimonials?.heading}
              onChange={(v) => update("testimonials.heading", v)}
              placeholder="Section heading"
              className="text-base font-bold text-gray-900"
            />
            <div className="space-y-3 mt-2">
              {(data.testimonials?.items || []).map((item, idx) => (
                <div
                  key={idx}
                  className="bg-gray-50 rounded-xl px-3 py-2.5 relative group"
                >
                  <button
                    onClick={() => removeItem("testimonials", idx)}
                    className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                  <AutoTextarea
                    value={item.quote}
                    onChange={(v) =>
                      updateItem("testimonials", idx, "quote", v)
                    }
                    placeholder="Quote..."
                    className="text-xs italic text-gray-600"
                    rows={2}
                  />
                  <GhostInput
                    value={item.name}
                    onChange={(v) => updateItem("testimonials", idx, "name", v)}
                    placeholder="Name"
                    className="text-xs font-semibold text-gray-800 mt-1.5"
                  />
                  <GhostInput
                    value={item.role}
                    onChange={(v) => updateItem("testimonials", idx, "role", v)}
                    placeholder="Role / Location"
                    className="text-xs text-gray-400"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() =>
                addItem("testimonials", { quote: "", name: "", role: "" })
              }
              className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800 mt-1 cursor-pointer"
            >
              <Plus size={13} /> Add testimonial
            </button>
          </SectionAccordion>

          {/* ── Empower Students ── */}
          <SectionAccordion
            title="Empower Students"
            visible={data.empowerStudents?.visible}
            onToggleVisible={() => toggleSection("empowerStudents")}
          >
            <GhostInput
              value={data.empowerStudents?.heading}
              onChange={(v) => update("empowerStudents.heading", v)}
              placeholder="Section heading"
              className="text-base font-bold text-gray-900"
            />
            <AutoTextarea
              value={data.empowerStudents?.subtext}
              onChange={(v) => update("empowerStudents.subtext", v)}
              placeholder="Subtext..."
              className="text-sm text-gray-600 mt-1"
            />
            <p className="text-[10px] text-gray-400 mt-2 mb-1 font-medium uppercase tracking-wide">
              Benefits
            </p>
            <div className="space-y-1.5">
              {(data.empowerStudents?.benefits || []).map((b, idx) => (
                <div key={idx} className="flex items-center gap-2 group">
                  <GhostInput
                    value={b.label}
                    onChange={(v) => {
                      setData((prev) => {
                        const copy = JSON.parse(JSON.stringify(prev));
                        copy.empowerStudents.benefits[idx].label = v;
                        return copy;
                      });
                    }}
                    placeholder="Benefit label"
                    className="text-sm text-gray-700 flex-1"
                  />
                  <button
                    onClick={() => {
                      setData((prev) => {
                        const copy = JSON.parse(JSON.stringify(prev));
                        copy.empowerStudents.benefits =
                          copy.empowerStudents.benefits.filter(
                            (_, i) => i !== idx
                          );
                        return copy;
                      });
                    }}
                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer flex-shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                setData((prev) => {
                  const copy = JSON.parse(JSON.stringify(prev));
                  copy.empowerStudents.benefits = [
                    ...(copy.empowerStudents.benefits || []),
                    { icon: "Star", label: "" },
                  ];
                  return copy;
                });
              }}
              className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800 mt-1 cursor-pointer"
            >
              <Plus size={13} /> Add benefit
            </button>
            <ImageField
              label="Section Image"
              value={data.empowerStudents?.image}
              onChange={(v) => update("empowerStudents.image", v)}
            />
          </SectionAccordion>

          {/* ── Final CTA ── */}
          <SectionAccordion
            title="Final CTA"
            visible={data.cta?.visible}
            onToggleVisible={() => toggleSection("cta")}
          >
            <AutoTextarea
              value={data.cta?.heading}
              onChange={(v) => update("cta.heading", v)}
              placeholder="Call-to-action heading..."
              className="text-xl font-bold text-gray-900"
              rows={2}
            />
            <AutoTextarea
              value={data.cta?.subtext}
              onChange={(v) => update("cta.subtext", v)}
              placeholder="Supporting subtext..."
              className="text-sm text-gray-600 mt-1"
            />
            <p className="text-[10px] text-gray-400 mt-2 mb-0.5 font-medium uppercase tracking-wide">
              Primary Button
            </p>
            <CtaRow
              labelValue={data.cta?.primaryBtn?.label}
              hrefValue={data.cta?.primaryBtn?.href}
              onLabelChange={(v) => update("cta.primaryBtn.label", v)}
              onHrefChange={(v) => update("cta.primaryBtn.href", v)}
            />
            <p className="text-[10px] text-gray-400 mt-2 mb-0.5 font-medium uppercase tracking-wide">
              Secondary Button
            </p>
            <CtaRow
              labelValue={data.cta?.secondaryBtn?.label}
              hrefValue={data.cta?.secondaryBtn?.href}
              onLabelChange={(v) => update("cta.secondaryBtn.label", v)}
              onHrefChange={(v) => update("cta.secondaryBtn.href", v)}
            />
          </SectionAccordion>

          {/* ── Footer ── */}
          <SectionAccordion title="Footer">
            <GhostInput
              value={data.footer?.copyright}
              onChange={(v) => update("footer.copyright", v)}
              placeholder="© 2025 Your Company. All rights reserved."
              className="text-xs text-gray-500"
            />
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="bg-gray-50 rounded-lg px-2.5 py-2">
                <p className="text-[10px] text-gray-400 mb-0.5">Phone</p>
                <GhostInput
                  value={data.footer?.contact?.phone}
                  onChange={(v) => update("footer.contact.phone", v)}
                  placeholder="+91 ..."
                  className="text-xs text-gray-700"
                />
              </div>
              <div className="bg-gray-50 rounded-lg px-2.5 py-2">
                <p className="text-[10px] text-gray-400 mb-0.5">Email</p>
                <GhostInput
                  value={data.footer?.contact?.email}
                  onChange={(v) => update("footer.contact.email", v)}
                  placeholder="email@example.com"
                  className="text-xs text-gray-700"
                />
              </div>
            </div>
          </SectionAccordion>

          {/* ── SEO / Meta ── */}
          <SectionAccordion title="SEO / Meta">
            <div className="bg-gray-50 rounded-lg px-2.5 py-2">
              <p className="text-[10px] text-gray-400 mb-0.5">Page Title</p>
              <GhostInput
                value={data.meta?.title}
                onChange={(v) => update("meta.title", v)}
                placeholder="SEO page title"
                className="text-sm text-gray-800"
              />
            </div>
            <div className="bg-gray-50 rounded-lg px-2.5 py-2 mt-1">
              <p className="text-[10px] text-gray-400 mb-0.5">Meta Description</p>
              <AutoTextarea
                value={data.meta?.description}
                onChange={(v) => update("meta.description", v)}
                placeholder="SEO meta description..."
                className="text-xs text-gray-600"
                rows={2}
              />
            </div>
          </SectionAccordion>

          {/* Bottom spacer */}
          <div className="h-8" />
        </div>

        {/* RIGHT panel — live preview */}
        <div className="flex-1 bg-gray-100 overflow-y-auto">
          <div className="sticky top-0 z-10 bg-gray-100 border-b border-gray-200 px-4 py-2 text-xs text-gray-400 font-medium">
            Live Preview — changes appear instantly
          </div>
          <div
            style={{
              transform: "scale(0.75)",
              width: "133.33%",
              transformOrigin: "top left",
            }}
          >
            <CampaignPage data={data} />
          </div>
        </div>
      </div>
    </div>
  );
}
