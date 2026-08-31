"use client";


import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "../../../../lib/api/axios";
import { toast } from "sonner";
import {
  Save,
  ArrowLeft,
  Loader2,
  Upload,
  Image as ImageIcon,
  Megaphone,
  Globe,
  Star,
  Package,
  Tag,
  MessageSquare,
  Zap,
  Footprints,
} from "lucide-react";

// ─── Default campaign data shape ─────────────────────────────────────────────
const DEFAULT_DATA = {
  meta: {
    slug: "",
    title: "",
    description: "",
  },
  brand: {
    whatsappNumber: "",
    whatsappText: "",
  },
  hero: {
    headline: "",
    subtext: "",
    primaryCta: { label: "", href: "" },
    secondaryCta: { label: "", href: "" },
    image: "",
    imageAlt: "",
  },
  product: {
    title: "",
    classLabel: "",
    description: "",
    features: [],
    image: "",
    imageAlt: "",
    cta: { label: "", href: "" },
  },
  comboOffer: {
    heading: "Combo Offer",
    productName: "",
    label: "",
    originalPrice: "",
    offerPrice: "",
    saving: "",
    badges: [],
    cta: { label: "", href: "" },
  },
  testimonials: {
    heading: "What Teachers Say",
    items: [
      { quote: "", name: "", role: "" },
      { quote: "", name: "", role: "" },
      { quote: "", name: "", role: "" },
    ],
  },
  cta: {
    heading: "",
    subtext: "",
    primaryBtn: { label: "", href: "" },
    secondaryBtn: { label: "", href: "" },
  },
  footer: {
    copyright: "",
    contact: { phone: "", email: "" },
  },
};

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ icon: Icon, title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/60">
        <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
          <Icon size={16} className="text-red-700" />
        </div>
        <h2 className="text-sm font-bold text-gray-800">{title}</h2>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">{children}</div>
    </div>
  );
}

// ─── Field helpers ─────────────────────────────────────────────────────────────
function Field({ label, children, full = false }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent placeholder-gray-400 transition";

const textareaCls =
  "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent placeholder-gray-400 transition resize-none";

// ─── Image upload field ────────────────────────────────────────────────────────
function ImageUploadField({ label, value, onChange, folder = "campaigns" }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    setUploading(true);
    try {
      const res = await api.post("/api/admin/cloudinary/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data?.secure_url || res.data?.url || "";
      if (url) {
        onChange(url);
        toast.success("Image uploaded.");
      } else {
        toast.error("Upload returned no URL.");
      }
    } catch {
      toast.error("Image upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="md:col-span-2">
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      <div className="flex flex-col sm:flex-row gap-3 items-start">
        {/* Preview */}
        <div className="w-32 h-24 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
          {value ? (
            <img src={value} alt="preview" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon size={24} className="text-gray-300" />
          )}
        </div>
        <div className="flex-1 flex flex-col gap-2">
          {/* URL input */}
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Image URL (or upload below)"
            className={inputCls}
          />
          {/* Upload button */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 text-xs font-semibold text-gray-600 transition-colors cursor-pointer disabled:opacity-60 w-fit"
          >
            {uploading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Upload size={13} />
            )}
            {uploading ? "Uploading…" : "Upload New Image"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function CampaignEditPage() {
  const { id } = useParams();
  const router = useRouter();
  const isNew = id === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  // Top-level meta fields
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Nested campaign data
  const [data, setData] = useState(DEFAULT_DATA);

  // ── Load existing campaign ──
  useEffect(() => {
    if (isNew) return;
    setLoading(true);
    api
      .get(`/api/campaigns/${id}`)
      .then((res) => {
        const c = res.data;
        setSlug(c.slug || "");
        setTitle(c.title || "");
        setIsActive(!!c.is_active);
        // Merge with defaults so all keys exist
        const merged = deepMerge(DEFAULT_DATA, c.data || {});
        setData(merged);
      })
      .catch(() => {
        toast.error("Failed to load campaign.");
        router.push("/admin/campaigns");
      })
      .finally(() => setLoading(false));
  }, [id, isNew]);

  // ── Helpers to update nested data ──
  function setField(path, value) {
    setData((prev) => setNestedValue({ ...prev }, path, value));
  }

  function get(path) {
    return getNestedValue(data, path);
  }

  // ── Save ──
  async function handleSave() {
    if (!slug.trim()) { toast.error("Slug is required."); return; }
    if (!title.trim()) { toast.error("Title is required."); return; }

    // Build the full data payload including meta.slug + meta.title
    const fullData = {
      ...data,
      meta: { ...data.meta, slug: slug.trim(), title: title.trim() },
    };

    const payload = {
      slug: slug.trim(),
      title: title.trim(),
      is_active: isActive,
      data: fullData,
    };

    setSaving(true);
    try {
      if (isNew) {
        const res = await api.post("/api/campaigns/", payload);
        toast.success("Campaign created!");
        router.push(`/admin/campaigns/${res.data.id}`);
      } else {
        await api.put(`/api/campaigns/${id}`, payload);
        toast.success("Campaign saved!");
      }
    } catch {
      // error toast handled by axios interceptor
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="text-red-700 animate-spin" />
      </div>
    );
  }

  // ── Testimonials helpers ──
  const testimonials = Array.isArray(get("testimonials.items"))
    ? get("testimonials.items")
    : [{ quote: "", name: "", role: "" }, { quote: "", name: "", role: "" }, { quote: "", name: "", role: "" }];

  function updateTestimonial(idx, field, value) {
    const updated = testimonials.map((t, i) => (i === idx ? { ...t, [field]: value } : t));
    setField("testimonials.items", updated);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/admin/campaigns")}
            className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <Megaphone size={20} className="text-red-700" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-gray-900">
                {isNew ? "Create Campaign" : "Edit Campaign"}
              </h1>
              {!isNew && slug && (
                <p className="text-xs text-gray-400 mt-0.5">
                  <code>{slug}</code>
                </p>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-sm font-bold shadow transition-colors cursor-pointer disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? "Saving…" : "Save Campaign"}
        </button>
      </div>

      {/* ── SECTION: Meta ── */}
      <Section icon={Globe} title="Meta & Settings">
        <Field label="Slug *">
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
            placeholder="e.g. pat-physical-education"
            className={inputCls}
          />
          <p className="text-[10px] text-gray-400 mt-1">
            URL: <code>/campaign/{slug || "your-slug"}</code>
          </p>
        </Field>

        <Field label="Campaign Title *">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. PAT Physical Education Books"
            className={inputCls}
          />
        </Field>

        <Field label="Meta Description" full>
          <textarea
            rows={2}
            value={get("meta.description")}
            onChange={(e) => setField("meta.description", e.target.value)}
            placeholder="SEO description for this campaign page"
            className={textareaCls}
          />
        </Field>

        <Field label="Active">
          <label className="flex items-center gap-3 cursor-pointer w-fit">
            <div
              onClick={() => setIsActive((v) => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors ${isActive ? "bg-red-700" : "bg-gray-300"}`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${isActive ? "translate-x-6" : "translate-x-1"}`}
              />
            </div>
            <span className="text-sm font-medium text-gray-700">
              {isActive ? "Active (visible)" : "Inactive (hidden)"}
            </span>
          </label>
        </Field>
      </Section>

      {/* ── SECTION: Brand ── */}
      <Section icon={Tag} title="Brand & WhatsApp">
        <Field label="WhatsApp Number">
          <input
            type="text"
            value={get("brand.whatsappNumber")}
            onChange={(e) => setField("brand.whatsappNumber", e.target.value)}
            placeholder="e.g. 919205153617"
            className={inputCls}
          />
        </Field>

        <Field label="WhatsApp Pre-fill Text">
          <input
            type="text"
            value={get("brand.whatsappText")}
            onChange={(e) => setField("brand.whatsappText", e.target.value)}
            placeholder="e.g. Hello! I'm interested in your books."
            className={inputCls}
          />
        </Field>
      </Section>

      {/* ── SECTION: Hero ── */}
      <Section icon={Star} title="Hero Section">
        <Field label="Headline" full>
          <input
            type="text"
            value={get("hero.headline")}
            onChange={(e) => setField("hero.headline", e.target.value)}
            placeholder="Main headline shown in the hero"
            className={inputCls}
          />
        </Field>

        <Field label="Subtext" full>
          <textarea
            rows={3}
            value={get("hero.subtext")}
            onChange={(e) => setField("hero.subtext", e.target.value)}
            placeholder="Supporting text below the headline"
            className={textareaCls}
          />
        </Field>

        <Field label="Primary CTA — Label">
          <input
            type="text"
            value={get("hero.primaryCta.label")}
            onChange={(e) => setField("hero.primaryCta.label", e.target.value)}
            placeholder="e.g. Explore Books"
            className={inputCls}
          />
        </Field>

        <Field label="Primary CTA — Href">
          <input
            type="text"
            value={get("hero.primaryCta.href")}
            onChange={(e) => setField("hero.primaryCta.href", e.target.value)}
            placeholder="e.g. #product"
            className={inputCls}
          />
        </Field>

        <Field label="Secondary CTA — Label">
          <input
            type="text"
            value={get("hero.secondaryCta.label")}
            onChange={(e) => setField("hero.secondaryCta.label", e.target.value)}
            placeholder="e.g. WhatsApp Us"
            className={inputCls}
          />
        </Field>

        <Field label="Secondary CTA — Href">
          <input
            type="text"
            value={get("hero.secondaryCta.href")}
            onChange={(e) => setField("hero.secondaryCta.href", e.target.value)}
            placeholder="e.g. https://wa.me/919..."
            className={inputCls}
          />
        </Field>

        <Field label="Hero Image Alt Text">
          <input
            type="text"
            value={get("hero.imageAlt")}
            onChange={(e) => setField("hero.imageAlt", e.target.value)}
            placeholder="Alt text for accessibility"
            className={inputCls}
          />
        </Field>

        <ImageUploadField
          label="Hero Image"
          value={get("hero.image")}
          onChange={(url) => setField("hero.image", url)}
          folder="campaigns/hero"
        />
      </Section>

      {/* ── SECTION: Product ── */}
      <Section icon={Package} title="Product Section">
        <Field label="Product Title">
          <input
            type="text"
            value={get("product.title")}
            onChange={(e) => setField("product.title", e.target.value)}
            placeholder="e.g. PAT – Physical Activity Trainer"
            className={inputCls}
          />
        </Field>

        <Field label="Class Label">
          <input
            type="text"
            value={get("product.classLabel")}
            onChange={(e) => setField("product.classLabel", e.target.value)}
            placeholder="e.g. Class XI"
            className={inputCls}
          />
        </Field>

        <Field label="Product Description" full>
          <textarea
            rows={3}
            value={get("product.description")}
            onChange={(e) => setField("product.description", e.target.value)}
            placeholder="Describe the product"
            className={textareaCls}
          />
        </Field>

        <Field label="Features (one per line)" full>
          <textarea
            rows={5}
            value={Array.isArray(get("product.features")) ? get("product.features").join("\n") : ""}
            onChange={(e) =>
              setField(
                "product.features",
                e.target.value.split("\n").map((s) => s.trim()).filter(Boolean)
              )
            }
            placeholder={"Chapter-wise Notes\nActivity & Project Ideas\nMCQs, SAQs, LAQs"}
            className={textareaCls}
          />
        </Field>

        <Field label="Product CTA — Label">
          <input
            type="text"
            value={get("product.cta.label")}
            onChange={(e) => setField("product.cta.label", e.target.value)}
            placeholder="e.g. Order Now"
            className={inputCls}
          />
        </Field>

        <Field label="Product CTA — Href">
          <input
            type="text"
            value={get("product.cta.href")}
            onChange={(e) => setField("product.cta.href", e.target.value)}
            placeholder="e.g. #combo"
            className={inputCls}
          />
        </Field>

        <Field label="Product Image Alt Text">
          <input
            type="text"
            value={get("product.imageAlt")}
            onChange={(e) => setField("product.imageAlt", e.target.value)}
            placeholder="Alt text for the product image"
            className={inputCls}
          />
        </Field>

        <ImageUploadField
          label="Product Image"
          value={get("product.image")}
          onChange={(url) => setField("product.image", url)}
          folder="campaigns/product"
        />
      </Section>

      {/* ── SECTION: Combo Offer ── */}
      <Section icon={Zap} title="Combo Offer">
        <Field label="Section Heading">
          <input
            type="text"
            value={get("comboOffer.heading")}
            onChange={(e) => setField("comboOffer.heading", e.target.value)}
            placeholder="e.g. Combo Offer"
            className={inputCls}
          />
        </Field>

        <Field label="Product Name">
          <input
            type="text"
            value={get("comboOffer.productName")}
            onChange={(e) => setField("comboOffer.productName", e.target.value)}
            placeholder="e.g. PAT – Class XI + Class XII"
            className={inputCls}
          />
        </Field>

        <Field label="Label / Tag">
          <input
            type="text"
            value={get("comboOffer.label")}
            onChange={(e) => setField("comboOffer.label", e.target.value)}
            placeholder="e.g. Complete Set"
            className={inputCls}
          />
        </Field>

        <Field label="Original Price">
          <input
            type="text"
            value={get("comboOffer.originalPrice")}
            onChange={(e) => setField("comboOffer.originalPrice", e.target.value)}
            placeholder="e.g. ₹900"
            className={inputCls}
          />
        </Field>

        <Field label="Offer Price">
          <input
            type="text"
            value={get("comboOffer.offerPrice")}
            onChange={(e) => setField("comboOffer.offerPrice", e.target.value)}
            placeholder="e.g. ₹750"
            className={inputCls}
          />
        </Field>

        <Field label="Saving Text">
          <input
            type="text"
            value={get("comboOffer.saving")}
            onChange={(e) => setField("comboOffer.saving", e.target.value)}
            placeholder="e.g. You Save ₹150 (17% OFF)"
            className={inputCls}
          />
        </Field>

        <Field label="Badges (comma-separated)" full>
          <input
            type="text"
            value={Array.isArray(get("comboOffer.badges")) ? get("comboOffer.badges").join(", ") : ""}
            onChange={(e) =>
              setField(
                "comboOffer.badges",
                e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
              )
            }
            placeholder="e.g. Best Value, Limited Time Offer"
            className={inputCls}
          />
        </Field>

        <Field label="Combo CTA — Label">
          <input
            type="text"
            value={get("comboOffer.cta.label")}
            onChange={(e) => setField("comboOffer.cta.label", e.target.value)}
            placeholder="e.g. Order Now"
            className={inputCls}
          />
        </Field>

        <Field label="Combo CTA — Href">
          <input
            type="text"
            value={get("comboOffer.cta.href")}
            onChange={(e) => setField("comboOffer.cta.href", e.target.value)}
            placeholder="e.g. https://wa.me/919..."
            className={inputCls}
          />
        </Field>
      </Section>

      {/* ── SECTION: Testimonials ── */}
      <Section icon={MessageSquare} title="Testimonials">
        {testimonials.map((t, idx) => (
          <div key={idx} className="md:col-span-2 bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Testimonial {idx + 1}
            </p>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Quote</label>
              <textarea
                rows={2}
                value={t.quote}
                onChange={(e) => updateTestimonial(idx, "quote", e.target.value)}
                placeholder="What the teacher said…"
                className={textareaCls}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Name</label>
                <input
                  type="text"
                  value={t.name}
                  onChange={(e) => updateTestimonial(idx, "name", e.target.value)}
                  placeholder="e.g. Neha Sharma"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Role</label>
                <input
                  type="text"
                  value={t.role}
                  onChange={(e) => updateTestimonial(idx, "role", e.target.value)}
                  placeholder="e.g. PGT Physical Education, Delhi"
                  className={inputCls}
                />
              </div>
            </div>
          </div>
        ))}
      </Section>

      {/* ── SECTION: CTA ── */}
      <Section icon={Zap} title="Call to Action Section">
        <Field label="CTA Heading" full>
          <input
            type="text"
            value={get("cta.heading")}
            onChange={(e) => setField("cta.heading", e.target.value)}
            placeholder="e.g. Give Your Students Better Learning Resources."
            className={inputCls}
          />
        </Field>

        <Field label="CTA Subtext" full>
          <textarea
            rows={2}
            value={get("cta.subtext")}
            onChange={(e) => setField("cta.subtext", e.target.value)}
            placeholder="Supporting text below the heading"
            className={textareaCls}
          />
        </Field>

        <Field label="Primary Button — Label">
          <input
            type="text"
            value={get("cta.primaryBtn.label")}
            onChange={(e) => setField("cta.primaryBtn.label", e.target.value)}
            placeholder="e.g. Order Now"
            className={inputCls}
          />
        </Field>

        <Field label="Primary Button — Href">
          <input
            type="text"
            value={get("cta.primaryBtn.href")}
            onChange={(e) => setField("cta.primaryBtn.href", e.target.value)}
            placeholder="e.g. https://wa.me/919..."
            className={inputCls}
          />
        </Field>

        <Field label="Secondary Button — Label">
          <input
            type="text"
            value={get("cta.secondaryBtn.label")}
            onChange={(e) => setField("cta.secondaryBtn.label", e.target.value)}
            placeholder="e.g. WhatsApp Us"
            className={inputCls}
          />
        </Field>

        <Field label="Secondary Button — Href">
          <input
            type="text"
            value={get("cta.secondaryBtn.href")}
            onChange={(e) => setField("cta.secondaryBtn.href", e.target.value)}
            placeholder="e.g. https://wa.me/919..."
            className={inputCls}
          />
        </Field>
      </Section>

      {/* ── SECTION: Footer ── */}
      <Section icon={Footprints} title="Footer">
        <Field label="Copyright Text" full>
          <input
            type="text"
            value={get("footer.copyright")}
            onChange={(e) => setField("footer.copyright", e.target.value)}
            placeholder="e.g. © 2025 Cremson Publications. All rights reserved."
            className={inputCls}
          />
        </Field>

        <Field label="Contact Phone">
          <input
            type="text"
            value={get("footer.contact.phone")}
            onChange={(e) => setField("footer.contact.phone", e.target.value)}
            placeholder="e.g. +91 92051 53617"
            className={inputCls}
          />
        </Field>

        <Field label="Contact Email">
          <input
            type="text"
            value={get("footer.contact.email")}
            onChange={(e) => setField("footer.contact.email", e.target.value)}
            placeholder="e.g. cremsonpublications@gmail.com"
            className={inputCls}
          />
        </Field>
      </Section>

      {/* ── Save bar (bottom) ── */}
      <div className="flex justify-end gap-3 pt-2 pb-8">
        <button
          onClick={() => router.push("/admin/campaigns")}
          className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-sm font-bold shadow transition-colors cursor-pointer disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? "Saving…" : "Save Campaign"}
        </button>
      </div>
    </div>
  );
}

// ─── Deep merge utility ────────────────────────────────────────────────────────
function deepMerge(target, source) {
  const output = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] !== null &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key]) &&
      typeof target[key] === "object" &&
      !Array.isArray(target[key])
    ) {
      output[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      output[key] = source[key];
    }
  }
  return output;
}

// ─── Nested path getter/setter ────────────────────────────────────────────────
function getNestedValue(obj, path) {
  return path.split(".").reduce((acc, key) => (acc != null ? acc[key] : undefined), obj) ?? "";
}

function setNestedValue(obj, path, value) {
  const keys = path.split(".");
  const last = keys.pop();
  let current = obj;
  for (const key of keys) {
    if (current[key] == null || typeof current[key] !== "object") {
      current[key] = {};
    }
    current = current[key];
  }
  current[last] = value;
  return obj;
}
