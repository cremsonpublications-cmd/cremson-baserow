"use client";

import { useState, useEffect, useRef } from "react";
import api from "../../../lib/api/axios";
import { toast } from "sonner";
import { ImagePlus, Trash2, GripVertical, Eye, EyeOff, Plus, Loader2 } from "lucide-react";

const CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1/dkxxa3xt0/image/upload";
const UPLOAD_PRESET = "unsigned_preset";
const CLOUDINARY_FOLDER = "banner-images";

export default function AdminBannersPage() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const fileInputRef = useRef(null);

  async function fetchBanners() {
    setLoading(true);
    try {
      const res = await api.get("/api/banners/");
      setBanners(res.data);
    } catch {
      toast.error("Failed to load banners");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBanners();
  }, []);

  async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("folder", CLOUDINARY_FOLDER);

    const res = await fetch(CLOUDINARY_UPLOAD_URL, { method: "POST", body: formData });
    if (!res.ok) throw new Error("Cloudinary upload failed");
    const data = await res.json();
    return data.secure_url;
  }

  async function handleAddBanner(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setUploading(true);
    try {
      const imageUrl = await uploadToCloudinary(file);
      const res = await api.post("/api/banners/", {
        image_url: imageUrl,
        title: "",
        sort_order: banners.length + 1,
        is_active: true,
      });
      setBanners((prev) => [...prev, res.data]);
      toast.success("Banner added");
    } catch {
      toast.error("Failed to add banner");
    } finally {
      setUploading(false);
    }
  }

  async function handleTitleChange(id, title) {
    setBanners((prev) => prev.map((b) => (b.id === id ? { ...b, title } : b)));
  }

  async function handleSaveTitle(id, title) {
    setSaving(id);
    try {
      await api.patch(`/api/banners/${id}`, { title });
      toast.success("Title saved");
    } catch {
      toast.error("Failed to save title");
    } finally {
      setSaving(null);
    }
  }

  async function handleToggleActive(id, is_active) {
    setBanners((prev) => prev.map((b) => (b.id === id ? { ...b, is_active } : b)));
    try {
      await api.patch(`/api/banners/${id}`, { is_active });
    } catch {
      toast.error("Failed to update banner");
      setBanners((prev) => prev.map((b) => (b.id === id ? { ...b, is_active: !is_active } : b)));
    }
  }

  async function handleDelete(id, imageUrl) {
    if (!confirm("Delete this banner?")) return;
    setDeleting(id);
    try {
      await api.delete(`/api/banners/${id}`);
      if (imageUrl) {
        try {
          await api.post("/api/admin/cloudinary/delete", { url: imageUrl });
        } catch {}
      }
      setBanners((prev) => prev.filter((b) => b.id !== id));
      toast.success("Banner deleted");
    } catch {
      toast.error("Failed to delete banner");
    } finally {
      setDeleting(null);
    }
  }

  async function handleMoveUp(index) {
    if (index === 0) return;
    const updated = [...banners];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    // Reassign sort_order
    const reordered = updated.map((b, i) => ({ ...b, sort_order: i + 1 }));
    setBanners(reordered);
    try {
      await Promise.all(
        reordered.map((b) => api.patch(`/api/banners/${b.id}`, { sort_order: b.sort_order }))
      );
    } catch {
      toast.error("Failed to reorder banners");
    }
  }

  async function handleMoveDown(index) {
    if (index === banners.length - 1) return;
    const updated = [...banners];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    const reordered = updated.map((b, i) => ({ ...b, sort_order: i + 1 }));
    setBanners(reordered);
    try {
      await Promise.all(
        reordered.map((b) => api.patch(`/api/banners/${b.id}`, { sort_order: b.sort_order }))
      );
    } catch {
      toast.error("Failed to reorder banners");
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banner Images</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage homepage carousel banners. Images are stored in Cloudinary, URLs in Baserow.
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAddBanner}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            {uploading ? "Uploading..." : "Add Banner"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={32} className="animate-spin text-purple-500" />
        </div>
      ) : banners.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-16 flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-50/30 transition-all text-center"
        >
          <ImagePlus size={48} className="text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No banners yet</p>
          <p className="text-sm text-gray-400 mt-1">Click to upload your first banner image</p>
        </div>
      ) : (
        <div className="space-y-4">
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
            >
              <div className="flex items-stretch gap-0">
                {/* Order controls */}
                <div className="flex flex-col items-center justify-center bg-gray-50 border-r border-gray-200 px-2 py-3 gap-1 select-none">
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="text-gray-400 hover:text-gray-700 disabled:opacity-20 p-1 rounded"
                    title="Move up"
                  >
                    ▲
                  </button>
                  <span className="text-xs font-bold text-gray-400">{index + 1}</span>
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === banners.length - 1}
                    className="text-gray-400 hover:text-gray-700 disabled:opacity-20 p-1 rounded"
                    title="Move down"
                  >
                    ▼
                  </button>
                </div>

                {/* Image preview */}
                <div className="w-40 sm:w-52 h-28 flex-shrink-0 bg-gray-100 overflow-hidden">
                  {banner.image_url ? (
                    <img
                      src={banner.image_url}
                      alt={banner.title || "Banner"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <ImagePlus size={32} />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Title / Alt Text
                      </label>
                      <input
                        type="text"
                        value={banner.title}
                        onChange={(e) => handleTitleChange(banner.id, e.target.value)}
                        onBlur={(e) => handleSaveTitle(banner.id, e.target.value)}
                        placeholder="Enter banner title..."
                        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />
                    </div>
                    {saving === banner.id && (
                      <Loader2 size={14} className="animate-spin text-purple-500 mt-6 flex-shrink-0" />
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-400 truncate max-w-[200px] sm:max-w-xs">
                      {banner.image_url}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col items-center justify-center gap-3 px-4 border-l border-gray-100">
                  <button
                    onClick={() => handleToggleActive(banner.id, !banner.is_active)}
                    title={banner.is_active ? "Active — click to hide" : "Hidden — click to show"}
                    className={`p-2 rounded-full transition-colors ${
                      banner.is_active
                        ? "bg-green-100 text-green-600 hover:bg-green-200"
                        : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                    }`}
                  >
                    {banner.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button
                    onClick={() => handleDelete(banner.id, banner.image_url)}
                    disabled={deleting === banner.id}
                    className="p-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-40"
                  >
                    {deleting === banner.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
