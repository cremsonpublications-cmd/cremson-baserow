"use client";

import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import BlogEditor from "../components/BlogEditor";
import { marked } from "marked";
import api from "../../../lib/api/axios";

const htmlToMarkdown = (html) => {
  if (!html) return "";
  let md = html;
  
  // Replace headers
  md = md.replace(/<h1>(.*?)<\/h1>/gi, "# $1\n");
  md = md.replace(/<h2>(.*?)<\/h2>/gi, "## $1\n");
  md = md.replace(/<h3>(.*?)<\/h3>/gi, "### $1\n");
  md = md.replace(/<h4>(.*?)<\/h4>/gi, "#### $1\n");
  
  // Replace strong and em
  md = md.replace(/<strong>(.*?)<\/strong>/gi, "**$1**");
  md = md.replace(/<b>(.*?)<\/b>/gi, "**$1**");
  md = md.replace(/<em>(.*?)<\/em>/gi, "*$1*");
  md = md.replace(/<i>(.*?)<\/i>/gi, "*$1*");
  
  // Replace links
  md = md.replace(/<a href="(.*?)">(.*?)<\/a>/gi, "[$2]($1)");
  
  // Replace paragraphs
  md = md.replace(/<p>(.*?)<\/p>/gi, "$1\n\n");
  
  // Replace br
  md = md.replace(/<br\s*\/?>/gi, "\n");
  
  // Clean up any double newlines
  md = md.replace(/\n\s*\n\s*\n/g, "\n\n");
  
  return md.trim();
};

export default function AddBlogPage() {
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [category, setCategory] = useState("");
  const [publishNow, setPublishNow] = useState(true);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  
  // Edit mode states
  const [editId, setEditId] = useState(null);
  const [originalDate, setOriginalDate] = useState("");
  const [originalAuthor, setOriginalAuthor] = useState("");
  
  // PDF upload states
  const [attachments, setAttachments] = useState([]);
  const [currentPdfUrl, setCurrentPdfUrl] = useState("");
  const [currentPdfName, setCurrentPdfName] = useState("");
  const [uploadingPdf, setUploadingPdf] = useState(false);
  
  // Dynamic categories state
  const [categories, setCategories] = useState([]);
  const [showNewCatForm, setShowNewCatForm] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [addingCat, setAddingCat] = useState(false);

  // Modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [reassignRequired, setReassignRequired] = useState(false);
  const [affectedBlogsCount, setAffectedBlogsCount] = useState(0);
  const [reassignCategoryName, setReassignCategoryName] = useState("");
  const [deletingCategoryProgress, setDeletingCategoryProgress] = useState(false);

  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const pdfInputRef = useRef(null);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/api/blogs/categories");
        setCategories(res.data);
      } catch (err) {
        toast.error("Failed to load blog categories.");
      }
    };
    fetchCategories();
  }, []);

  // Load blog details if in edit mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const editParam = params.get("edit");
    if (editParam) {
      setEditId(editParam);
      const fetchBlogDetails = async () => {
        try {
          const res = await api.get(`/api/blogs/${editParam}`);
          const blog = res.data;
          setTitle(blog.title);
          setSubtitle(blog.description || "");
          setCategory(blog.category || "");
          setPublishNow(blog.status === "Published");
          setImagePreview(blog.image);
          setOriginalDate(blog.date || "");
          setOriginalAuthor(blog.author || "");
          
          // Convert content back to Markdown for the editor
          const mdContent = htmlToMarkdown(blog.content);
          setDescription(mdContent);
          if (editorRef.current) {
            editorRef.current.setMarkdown(mdContent);
          }
          
          // Parse attachments
          if (blog.pdf_url) {
            try {
              const parsed = JSON.parse(blog.pdf_url);
              if (Array.isArray(parsed)) {
                setAttachments(parsed);
              } else if (typeof parsed === "string") {
                setAttachments([{ name: blog.pdf_name || "Attachment", url: parsed }]);
              }
            } catch {
              // Legacy format
              setAttachments([{ name: blog.pdf_name || "Attachment", url: blog.pdf_url }]);
            }
          }
        } catch (err) {
          toast.error("Failed to load blog post details for editing.");
        }
      };
      fetchBlogDetails();
    }
  }, []);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "unsigned_preset");
      formData.append("folder", "blogs");

      const res = await fetch("https://api.cloudinary.com/v1_1/dkxxa3xt0/image/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Image upload failed");
      const data = await res.json();
      setImagePreview(data.secure_url);
      toast.success("Image uploaded to Cloudinary successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to upload image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePdfChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      toast.error("Only PDF files are allowed!");
      return;
    }

    setUploadingPdf(true);
    try {
      // Delete existing temporary PDF from Cloudinary if changing it
      if (currentPdfUrl) {
        try {
          await api.post("/api/admin/cloudinary/delete", { url: currentPdfUrl, resource_type: "raw" });
        } catch (delErr) {
          console.error("Failed to delete previous PDF from Cloudinary:", delErr);
        }
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "unsigned_preset");
      formData.append("folder", "blogs/pdfs");

      const res = await fetch("https://api.cloudinary.com/v1_1/dkxxa3xt0/raw/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("PDF upload failed");
      const data = await res.json();
      setCurrentPdfUrl(data.secure_url);
      
      const defaultName = file.name.replace(/\.[^/.]+$/, "");
      setCurrentPdfName(defaultName);
      
      toast.success("PDF uploaded to Cloudinary successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to upload PDF. Please try again.");
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    const cleanName = newCatName.trim();
    if (!cleanName) {
      toast.error("Category name cannot be empty!");
      return;
    }

    setAddingCat(true);
    try {
      const res = await api.post("/api/blogs/categories", { name: cleanName });
      toast.success(`Category "${cleanName}" created!`);
      
      // Update local categories list
      const updatedCats = [...categories, res.data].sort((a, b) => a.name.localeCompare(b.name));
      setCategories(updatedCats);
      setCategory(cleanName); // auto-select the newly created category
      setNewCatName("");
      setShowNewCatForm(false);
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to create category.";
      toast.error(msg);
    } finally {
      setAddingCat(false);
    }
  };

  // Trigger modal when category delete is clicked
  const triggerDeleteCategory = async (cat) => {
    setCategoryToDelete(cat);
    setDeletingCategoryProgress(false);
    setReassignCategoryName("");
    
    try {
      // Check if this category has blogs by making a test delete query
      const res = await api.delete(`/api/blogs/categories/${cat.id}`);
      // If it succeeded, it means there are no blogs using it! We need to undo or just put it back.
      // Wait, to avoid actual deletion, let's look at the response or just check if it returned requires_reassignment.
      if (res.data && res.data.requires_reassignment) {
        setReassignRequired(true);
        setAffectedBlogsCount(res.data.blog_count);
        setDeleteModalOpen(true);
      } else {
        // Successfully deleted (had 0 blogs), so we just update the frontend state!
        toast.success(`Category "${cat.name}" deleted successfully.`);
        setCategories((prev) => prev.filter((c) => c.id !== cat.id));
        if (category === cat.name) {
          setCategory("");
        }
      }
    } catch (err) {
      // If it failed because of assignment check:
      if (err.response?.data && err.response.data.requires_reassignment) {
        setReassignRequired(true);
        setAffectedBlogsCount(err.response.data.blog_count);
        setDeleteModalOpen(true);
      } else {
        const errorDetail = err.response?.data?.detail || "Failed to process delete category request.";
        toast.error(errorDetail);
      }
    }
  };

  // Execute deletion with optional reassignment
  const executeDeleteCategory = async (id, name, reassignTo = "") => {
    setDeletingCategoryProgress(true);
    try {
      const url = reassignTo 
        ? `/api/blogs/categories/${id}?reassign_to=${encodeURIComponent(reassignTo)}`
        : `/api/blogs/categories/${id}`;
        
      await api.delete(url);
      
      const successMsg = reassignTo 
        ? `Category "${name}" deleted. Reassigned posts to "${reassignTo}".`
        : `Category "${name}" deleted successfully.`;
        
      toast.success(successMsg);
      
      // Update local categories list
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
      
      // Reset selected category if it was the deleted one
      if (category === name) {
        setCategory(reassignTo || "");
      }
      
      // Close modal
      setDeleteModalOpen(false);
      setCategoryToDelete(null);
      setReassignRequired(false);
      setAffectedBlogsCount(0);
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to delete category.";
      toast.error(msg);
    } finally {
      setDeletingCategoryProgress(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title) {
      toast.error("Please fill in the blog title!");
      return;
    }

    setSaving(true);
    try {
      // Convert markdown content to HTML for the website representation
      const htmlContent = description ? marked.parse(description) : `<p>${subtitle || title}</p>`;
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

      // Auto-include any PDF uploaded but not explicitly added to list
      let finalAttachments = [...attachments];
      if (currentPdfUrl && currentPdfName.trim()) {
        finalAttachments.push({ name: currentPdfName.trim(), url: currentPdfUrl });
      }

      const blogData = {
        title,
        slug,
        category: category || "", // optional
        image: imagePreview || "https://res.cloudinary.com/dkxxa3xt0/image/upload/v1785568000/education_banner.jpg",
        author: originalAuthor || "Admin Editor",
        date: originalDate || `Published on ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
        description: subtitle || title,
        content: htmlContent,
        status: publishNow ? "Published" : "Draft",
        pdf_url: finalAttachments.length > 0 ? JSON.stringify(finalAttachments) : "",
        pdf_name: finalAttachments.length > 0 ? `${finalAttachments.length} Files` : ""
      };

      if (editId) {
        await api.put(`/api/blogs/${editId}`, blogData);
        toast.success("Blog post updated successfully!");
        // Redirect back to list
        setTimeout(() => {
          window.location.href = "/admin/listBlog";
        }, 1000);
      } else {
        await api.post("/api/blogs/", blogData);
        toast.success("Blog post created successfully!");

        // Reset Form
        setTitle("");
        setSubtitle("");
        setCategory("");
        setDescription("");
        setImagePreview(null);
        setAttachments([]);
        setCurrentPdfUrl("");
        setCurrentPdfName("");
        if (editorRef.current) {
          editorRef.current.setMarkdown("");
        }
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "Failed to save blog post.";
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 bg-blue-50/50 text-gray-600 min-h-screen relative">
      
      {/* Custom Modal for Category Deletion / Reassignment */}
      {deleteModalOpen && categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 transition-all duration-300">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl max-w-md w-full p-6 relative transition-transform duration-300 transform scale-100">
            
            {/* Header */}
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              Delete Category: {categoryToDelete.name}
            </h3>

            {/* Content */}
            {!reassignRequired ? (
              <div>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                  Are you sure you want to delete the category <strong className="text-gray-800">"{categoryToDelete.name}"</strong>? This category is currently not assigned to any blog posts.
                </p>
                
                {/* Actions */}
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteModalOpen(false);
                      setCategoryToDelete(null);
                    }}
                    className="px-4 py-2 text-xs border border-gray-300 text-gray-650 rounded-lg hover:bg-gray-50 font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => executeDeleteCategory(categoryToDelete.id, categoryToDelete.name)}
                    disabled={deletingCategoryProgress}
                    className="px-4 py-2 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    {deletingCategoryProgress ? "Deleting..." : "Delete Category"}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl mb-4 text-xs leading-relaxed flex items-start gap-2.5">
                  <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    This category is currently assigned to <strong className="font-bold">{affectedBlogsCount} blog post(s)</strong>. To delete it, please select another category to reassign these posts to:
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Reassign posts to:</label>
                  <select
                    className="w-full px-3 py-2 border text-sm text-gray-700 border-gray-300 outline-none rounded-lg bg-white focus:border-primary transition"
                    value={reassignCategoryName}
                    onChange={(e) => setReassignCategoryName(e.target.value)}
                  >
                    <option value="">Uncategorized (None)</option>
                    {categories
                      .filter((c) => c.id !== categoryToDelete.id)
                      .map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteModalOpen(false);
                      setCategoryToDelete(null);
                      setReassignRequired(false);
                      setAffectedBlogsCount(0);
                    }}
                    className="px-4 py-2 text-xs border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => executeDeleteCategory(categoryToDelete.id, categoryToDelete.name, reassignCategoryName)}
                    disabled={deletingCategoryProgress}
                    className="px-4 py-2 text-xs bg-primary text-white rounded-lg hover:opacity-90 font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    {deletingCategoryProgress ? "Saving..." : "Reassign & Delete"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4 md:p-10">
        <div className="bg-white w-full max-w-7xl mx-auto p-6 md:p-10 shadow-sm border border-gray-150 rounded-xl">
          <h1 className="text-xl font-bold text-gray-800 mb-6">{editId ? "Edit Blog Post" : "Add New Blog"}</h1>
          <p className="font-semibold text-gray-800 mb-2">Upload thumbnail</p>
          <div className="mb-4">
            <input 
              id="image" 
              type="file" 
              accept="image/*" 
              ref={fileInputRef}
              onChange={handleImageChange}
              className="hidden"
            />
            <div 
              onClick={() => !uploadingImage && fileInputRef.current?.click()}
              className="mt-2 h-44 w-full max-w-4xl rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-all bg-gray-50 overflow-hidden relative"
            >
              {uploadingImage ? (
                <div className="text-center p-4 flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="text-xs text-gray-500">Uploading banner image...</p>
                </div>
              ) : imagePreview ? (
                <img alt="Preview" className="object-cover w-full h-full" src={imagePreview} />
              ) : (
                <div className="text-center p-4">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="mt-1 text-xs text-gray-500">Click to upload banner image (Recommended: 892 × 172 px)</p>
                </div>
              )}
            </div>
          </div>

          <p className="mt-6 font-semibold text-gray-800">Blog title</p>
          <input
            placeholder="Type here"
            required
            className="w-full max-w-4xl mt-2 p-3 border border-gray-300 outline-none rounded-lg text-sm text-gray-700 bg-white focus:border-primary transition-all"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <p className="mt-6 font-semibold text-gray-800">Sub title</p>
          <input
            placeholder="Type here"
            className="w-full max-w-4xl mt-2 p-3 border border-gray-300 outline-none rounded-lg text-sm text-gray-700 bg-white focus:border-primary transition-all"
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
          />

          <p className="mt-6 font-semibold text-gray-800">Blog Description</p>
          <div className="max-w-4xl mt-2 relative">
            <BlogEditor
              editorRef={editorRef}
              markdown={description}
              onChange={setDescription}
              placeholder="Write your content here..."
            />
          </div>

          <p className="mt-6 font-semibold text-gray-800">Attachment PDFs (Optional)</p>
          
          {/* List of currently added attachments */}
          {attachments.length > 0 && (
            <div className="mt-2 max-w-4xl bg-gray-50 border border-gray-200 p-4 rounded-xl space-y-2">
              <p className="text-[11px] font-semibold text-gray-405 uppercase tracking-wider mb-1">Attachments List:</p>
              {attachments.map((file, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white border border-gray-150 px-3 py-2.5 rounded-lg">
                  <div className="flex items-center gap-2 max-w-[80%] truncate">
                    <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <span className="text-xs font-semibold text-gray-700 truncate">{file.name}</span>
                    <span className="text-[10px] text-gray-400 truncate font-mono">({file.url.split('/').pop()})</span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const urlToDelete = file.url;
                      setAttachments((prev) => prev.filter((_, i) => i !== idx));
                      try {
                        await api.post("/api/admin/cloudinary/delete", { url: urlToDelete, resource_type: "raw" });
                        toast.success("Attachment deleted from Cloudinary successfully.");
                      } catch (err) {
                        console.error("Failed to delete from Cloudinary:", err);
                      }
                    }}
                    className="text-red-500 hover:text-red-700 text-xs font-semibold cursor-pointer active:scale-95 transition-all p-1"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload input form */}
          <div className="mt-2 max-w-4xl border border-gray-200 bg-gray-50/50 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">PDF Link Text / Custom Name</label>
              <input
                placeholder="e.g. Chapter 1 PDF, Full Syllabus"
                className="w-full p-2.5 border border-gray-300 outline-none rounded-lg text-sm text-gray-700 bg-white focus:border-primary transition-all"
                type="text"
                value={currentPdfName}
                onChange={(e) => setCurrentPdfName(e.target.value)}
              />
            </div>
            
            <div className="w-full md:w-auto flex flex-col items-start">
              <input 
                id="pdfFile" 
                type="file" 
                accept="application/pdf" 
                ref={pdfInputRef}
                onChange={handlePdfChange}
                className="hidden"
              />
              
              <div className="flex gap-2 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => !uploadingPdf && pdfInputRef.current?.click()}
                  className="px-4 py-2.5 bg-white border border-gray-300 text-gray-650 rounded-lg hover:border-primary hover:text-primary transition-all text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98 shrink-0"
                  disabled={uploadingPdf}
                >
                  {uploadingPdf ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-primary"></div>
                      Uploading...
                    </>
                  ) : currentPdfUrl ? (
                    <>
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Change PDF
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                      </svg>
                      Select PDF
                    </>
                  )}
                </button>

                {currentPdfUrl && (
                  <button
                    type="button"
                    onClick={async () => {
                      const urlToDelete = currentPdfUrl;
                      setCurrentPdfUrl("");
                      setCurrentPdfName("");
                      try {
                        await api.post("/api/admin/cloudinary/delete", { url: urlToDelete, resource_type: "raw" });
                        toast.success("Uploaded PDF deleted from Cloudinary successfully.");
                      } catch (err) {
                        console.error("Failed to delete from Cloudinary:", err);
                      }
                    }}
                    className="px-4 py-2.5 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg transition-all text-xs font-semibold flex items-center justify-center cursor-pointer shadow-sm shrink-0"
                  >
                    Delete Uploaded
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (!currentPdfUrl) {
                      toast.error("Please upload a PDF first!");
                      return;
                    }
                    if (!currentPdfName.trim()) {
                      toast.error("Please enter a custom name for this PDF!");
                      return;
                    }
                    setAttachments((prev) => [...prev, { name: currentPdfName.trim(), url: currentPdfUrl }]);
                    setCurrentPdfUrl("");
                    setCurrentPdfName("");
                  }}
                  className="px-4 py-2.5 bg-primary text-white rounded-lg hover:opacity-90 active:scale-95 transition-all text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer shadow-sm shrink-0"
                >
                  + Add to List
                </button>
              </div>
              {currentPdfUrl && (
                <span className="text-[10px] text-gray-400 mt-1.5 font-mono max-w-[220px] truncate block" title={currentPdfUrl}>
                  {currentPdfUrl.split('/').pop()}
                </span>
              )}
            </div>
          </div>

          <p className="mt-6 font-semibold text-gray-800">Blog category</p>
          <div className="mt-2 max-w-4xl">
            <div className="flex items-center gap-3">
              <select
                name="category"
                className="flex-1 px-3 py-2 border text-gray-600 border-gray-300 outline-none rounded-lg bg-white focus:border-primary text-sm transition-all shadow-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Select category (optional)</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
              
              {!showNewCatForm ? (
                <button
                  type="button"
                  onClick={() => setShowNewCatForm(true)}
                  className="px-4 py-2 border border-primary/20 text-primary text-xs rounded-lg hover:bg-primary/5 active:scale-95 transition-all font-semibold cursor-pointer whitespace-nowrap"
                >
                  + Add Category
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShowNewCatForm(false);
                    setNewCatName("");
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-500 text-xs rounded-lg hover:bg-gray-50 active:scale-95 transition-all font-semibold cursor-pointer whitespace-nowrap"
                >
                  Cancel
                </button>
              )}
            </div>

            {showNewCatForm && (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="New category name"
                  required
                  className="flex-1 p-2 text-sm border border-gray-300 rounded-lg outline-none bg-white focus:border-primary"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  disabled={addingCat}
                  className="px-4 py-2 bg-primary text-white text-xs rounded-lg hover:opacity-90 active:scale-95 disabled:bg-gray-400 font-semibold cursor-pointer"
                >
                  {addingCat ? "..." : "Save"}
                </button>
              </div>
            )}

            {/* List of categories with delete 'x' button permanently visible below */}
            {categories.length > 0 && (
              <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-150">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Existing Categories (Click &times; to delete):</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <div 
                      key={cat.id} 
                      className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-xs text-gray-700 pl-3 pr-2 py-1 rounded-full shadow-sm hover:border-red-200 hover:bg-red-50/30 group transition-all"
                    >
                      <span className="font-medium">{cat.name}</span>
                      <button
                        type="button"
                        onClick={() => triggerDeleteCategory(cat)}
                        className="text-gray-400 hover:text-red-500 font-bold text-sm cursor-pointer transition-colors"
                        title={`Delete ${cat.name}`}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 mt-6">
            <input
              id="publishNow"
              className="scale-125 cursor-pointer accent-primary"
              type="checkbox"
              checked={publishNow}
              onChange={(e) => setPublishNow(e.target.checked)}
            />
            <label htmlFor="publishNow" className="text-sm font-medium text-gray-700 cursor-pointer">
              Publish Now
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-8 w-40 h-10 bg-primary text-white rounded-lg hover:opacity-90 active:scale-95 disabled:bg-gray-400 transition-all cursor-pointer text-sm font-medium shadow-md flex items-center justify-center"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : editId ? (
              "Update Blog"
            ) : (
              "Add Blog"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
