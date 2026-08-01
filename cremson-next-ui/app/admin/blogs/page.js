"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../lib/api/axios";
import {
  Newspaper,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  FileText,
  Star,
  ExternalLink,
  Calendar,
  User,
  X,
  Sparkles,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";

const BlockNoteEditor = dynamic(
  () => import("../../../components/BlockNoteEditor"),
  {
    ssr: false,
    loading: () => (
      <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-2xl border border-gray-200">
        Loading Notion-style Editor...
      </div>
    ),
  }
);

const CATEGORY_COLORS = {
  News: "bg-teal-100 text-teal-800 border-teal-200",
  Blogs: "bg-amber-100 text-amber-800 border-amber-200",
  Analysis: "bg-purple-100 text-purple-800 border-purple-200",
  Events: "bg-pink-100 text-pink-800 border-pink-200",
};

export default function AdminBlogsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    category: "News",
    author: "Cremson Editorial",
    published_date: "",
    image: "",
    excerpt: "",
    content: "",
    is_published: true,
    featured: false,
  });

  const { data: blogs = [], isLoading } = useQuery({
    queryKey: ["admin_blogs", selectedCategory, searchQuery],
    queryFn: async () => {
      const params = { only_published: false };
      if (selectedCategory !== "All") params.category = selectedCategory;
      if (searchQuery) params.search = searchQuery;
      const { data } = await api.get("/api/blogs/", { params });
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (newBlog) => api.post("/api/blogs/", newBlog),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin_blogs"]);
      queryClient.invalidateQueries(["blogs"]);
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/api/blogs/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin_blogs"]);
      queryClient.invalidateQueries(["blogs"]);
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/api/blogs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin_blogs"]);
      queryClient.invalidateQueries(["blogs"]);
    },
  });

  function openCreateModal() {
    setEditingBlog(null);
    setFormData({
      title: "",
      category: "News",
      author: "Cremson Editorial",
      published_date: new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      image: "https://www.educart.co/img-cache/https%3A%2F%2Fcdn.prod.website-files.com%2F5f5cf4627107791c0412287b%2F6a69bf8b86ff839e6eb1a9ce_Untitled-March202026at16.19.50-331-ezgif.com-apng-to-avif-converter.avif",
      excerpt: "",
      content: "",
      is_published: true,
      featured: false,
    });
    setIsModalOpen(true);
  }

  function openEditModal(blog) {
    setEditingBlog(blog);
    setFormData({
      title: blog.title || "",
      category: blog.category || "News",
      author: blog.author || "Cremson Editorial",
      published_date: blog.published_date || "",
      image: blog.image || "",
      excerpt: blog.excerpt || "",
      content: blog.content || "",
      is_published: blog.is_published ?? true,
      featured: blog.featured ?? false,
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingBlog(null);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      alert("Please enter both Title and Content for the article.");
      return;
    }

    if (editingBlog) {
      updateMutation.mutate({ id: editingBlog.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  }

  function togglePublish(blog) {
    updateMutation.mutate({
      id: blog.id,
      data: { is_published: !blog.is_published },
    });
  }

  function toggleFeatured(blog) {
    updateMutation.mutate({
      id: blog.id,
      data: { featured: !blog.featured },
    });
  }

  function handleDelete(blog) {
    if (confirm(`Are you sure you want to delete "${blog.title}"?`)) {
      deleteMutation.mutate(blog.id);
    }
  }

  const totalArticles = blogs.length;
  const publishedCount = blogs.filter((b) => b.is_published).length;
  const featuredCount = blogs.filter((b) => b.featured).length;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 flex items-center gap-2.5">
            <Newspaper className="w-8 h-8 text-purple-600" />
            News & Blogs Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage articles, exam results, educational news, and events.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/news"
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-xl transition-all border border-gray-200"
          >
            <ExternalLink className="w-4 h-4" />
            View Public Page
          </Link>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Create Article
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Articles</p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{totalArticles}</h3>
          </div>
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Published</p>
            <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{publishedCount}</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Featured Posts</p>
            <h3 className="text-2xl font-extrabold text-amber-600 mt-1">{featuredCount}</h3>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
            <Star className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search articles by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {["All", "News", "Blogs", "Analysis", "Events"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? "bg-purple-600 text-white border-purple-600 shadow"
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Loading articles...</div>
        ) : blogs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Newspaper className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-base">No articles found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Article</th>
                  <th className="px-4 py-4">Category</th>
                  <th className="px-4 py-4">Author</th>
                  <th className="px-4 py-4">Date</th>
                  <th className="px-4 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {blogs.map((blog) => (
                  <tr key={blog.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 max-w-xs sm:max-w-md">
                      <div className="flex items-center gap-3">
                        {blog.image ? (
                          <img
                            src={blog.image}
                            alt={blog.title}
                            className="w-14 h-12 object-cover rounded-lg border border-gray-200 shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-12 bg-purple-50 rounded-lg border border-purple-100 flex items-center justify-center text-purple-400 font-bold text-xs shrink-0">
                            NEWS
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/news/${blog.slug}`}
                              target="_blank"
                              className="font-bold text-gray-900 text-sm hover:text-purple-600 transition-colors line-clamp-1"
                            >
                              {blog.title}
                            </Link>
                            {blog.featured && (
                              <span className="p-0.5 bg-amber-100 text-amber-700 rounded" title="Featured">
                                <Star className="w-3 h-3 fill-amber-500" />
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{blog.excerpt}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${
                          CATEGORY_COLORS[blog.category] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {blog.category}
                      </span>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        {blog.author || "Editorial"}
                      </div>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {blog.published_date || "—"}
                      </div>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => togglePublish(blog)}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-all ${
                          blog.is_published
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {blog.is_published ? (
                          <>
                            <Eye className="w-3 h-3 text-emerald-600" /> Published
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3 text-gray-500" /> Draft
                          </>
                        )}
                      </button>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                      <button
                        onClick={() => toggleFeatured(blog)}
                        className={`p-2 rounded-lg transition-colors cursor-pointer ${
                          blog.featured ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        <Star className={`w-4 h-4 ${blog.featured ? "fill-amber-500" : ""}`} />
                      </button>
                      <button
                        onClick={() => openEditModal(blog)}
                        className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(blog)}
                        className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 md:p-8 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeModal}
              className="absolute top-6 right-6 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              {editingBlog ? "Edit Article" : "Create New Article"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Article Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CBSE Class 10 Second Board Exam Result Declared: 2026"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  >
                    <option value="News">News</option>
                    <option value="Blogs">Blogs</option>
                    <option value="Analysis">Analysis</option>
                    <option value="Events">Events</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Author
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Date
                  </label>
                  <input
                    type="text"
                    value={formData.published_date}
                    onChange={(e) => setFormData({ ...formData, published_date: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Image Banner URL
                </label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Short Excerpt / Summary
                </label>
                <textarea
                  rows={2}
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Full Content (Notion WYSIWYG Editor) *
                  </label>
                  <span className="text-[11px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                    Type / for Slash Menu (Images, Tables, Headings)
                  </span>
                </div>
                <BlockNoteEditor
                  key={editingBlog ? editingBlog.id : "new"}
                  initialHTML={formData.content}
                  onChangeHTML={(html) => setFormData((prev) => ({ ...prev, content: html }))}
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  Publish Immediately
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="w-4 h-4 text-amber-500 rounded"
                  />
                  Featured Spotlight
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 font-semibold text-sm rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-600 text-white font-semibold text-sm rounded-xl shadow-md"
                >
                  {editingBlog ? "Save Changes" : "Publish Article"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
