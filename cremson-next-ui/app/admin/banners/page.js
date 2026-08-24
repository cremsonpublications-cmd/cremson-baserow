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
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [isDraggable, setIsDraggable] = useState(false);
  const fileInputRef = useRef(null);

  const bannersRef = useRef(banners);
  const draggedIndexRef = useRef(draggedIndex);

  useEffect(() => {
    bannersRef.current = banners;
  }, [banners]);

  useEffect(() => {
    draggedIndexRef.current = draggedIndex;
  }, [draggedIndex]);

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

  function handleDragStart(e, index) {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  }

  function handleDragOver(e, index) {
    e.preventDefault();
    const currentDraggedIndex = draggedIndexRef.current;
    if (currentDraggedIndex === null || currentDraggedIndex === index) return;

    const currentBanners = bannersRef.current;
    const updated = [...currentBanners];
    const [draggedItem] = updated.splice(currentDraggedIndex, 1);
    updated.splice(index, 0, draggedItem);

    setBanners(updated);
    setDraggedIndex(index);
  }

  async function handleDragEnd() {
    setDraggedIndex(null);
    setIsDraggable(false);

    const currentBanners = bannersRef.current;
    const reordered = currentBanners.map((b, i) => ({ ...b, sort_order: i + 1 }));
    setBanners(reordered);

    try {
      await Promise.all(
        reordered.map((b) => api.patch(`/api/banners/${b.id}`, { sort_order: b.sort_order }))
      );
      toast.success("Banners reordered successfully");
    } catch {
      toast.error("Failed to update banner order");
      fetchBanners();
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banner Images</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage homepage carousel banners (Recommended: 2158 × 729 px). Images are stored in Cloudinary, URLs in Baserow.
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
          <p className="text-sm text-gray-400 mt-1">Click to upload your first banner image (Recommended: 2158 × 729 px)</p>
        </div>
      ) : (
        <div className="space-y-4">
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              draggable={isDraggable}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onDrop={(e) => e.preventDefault()}
              className={`bg-white border rounded-xl overflow-hidden shadow-sm transition-all duration-200 ${
                draggedIndex === index
                  ? "opacity-40 border-dashed border-purple-400 bg-purple-50/20 scale-[0.99] shadow-inner"
                  : "border-gray-200 hover:shadow-md hover:border-gray-300"
              }`}
            >
              <div className="flex items-stretch gap-0">
                {/* Drag handle & Order number */}
                <div className="flex flex-col items-center justify-center bg-gray-50 border-r border-gray-200 px-3 py-3 gap-2 select-none">
                  <div
                    className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-purple-600 transition-colors p-1.5 rounded-lg hover:bg-gray-200/50"
                    onMouseDown={() => setIsDraggable(true)}
                    onMouseUp={() => setIsDraggable(false)}
                    onTouchStart={() => setIsDraggable(true)}
                    onTouchEnd={() => setIsDraggable(false)}
                    title="Drag to reorder banner"
                  >
                    <GripVertical size={18} />
                  </div>
                  <span className="text-xs font-bold text-gray-400">#{index + 1}</span>
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
                <div className="flex flex-col items-center justify-center gap-4 px-5 border-l border-gray-100 bg-gray-50/30 min-w-[120px]">
                  {/* Enable / Disable Switch */}
                  <div className="flex flex-col items-center gap-1.5">
                    <button
                      onClick={() => handleToggleActive(banner.id, !banner.is_active)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                        banner.is_active ? 'bg-purple-600' : 'bg-gray-200'
                      }`}
                      title={banner.is_active ? "Click to disable banner" : "Click to enable banner"}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          banner.is_active ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className={`text-[10px] font-bold tracking-wider uppercase select-none ${banner.is_active ? 'text-purple-600' : 'text-gray-400'}`}>
                      {banner.is_active ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(banner.id, banner.image_url)}
                    disabled={deleting === banner.id}
                    title="Delete banner"
                    className="p-1.5 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
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
