"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import ConfirmModal from "../components/ConfirmModal";
import api from "@/lib/api/axios";
import { Trash2, MessageSquare, Search } from "lucide-react";

export default function BlogCommentsPage() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/blogs/admin/all-comments");
      setComments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load comments:", err);
      toast.error("Failed to load blog comments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const triggerDelete = (comment) => {
    setDeleteTarget(comment);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/api/blogs/comments/${deleteTarget.id}`);
      toast.success("Comment deleted successfully!");
      setComments((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to delete comment.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredComments = comments.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (c.blog_title || "").toLowerCase().includes(q) ||
      (c.user_name || "").toLowerCase().includes(q) ||
      (c.user_email || "").toLowerCase().includes(q) ||
      (c.comment_text || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
              <MessageSquare className="w-7 h-7 text-purple-600" />
              Blog Comments ({comments.length})
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Manage user comments submitted on blog articles.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search comments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-purple-500 bg-white"
            />
          </div>
        </div>

        {/* Comments Table */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400 text-xs font-medium">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Loading comments...
            </div>
          ) : filteredComments.length === 0 ? (
            <div className="p-12 text-center">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-700">No blog comments found</p>
              <p className="text-xs text-gray-400 mt-1">User comments submitted on blogs will appear here.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 uppercase font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Blog Title</th>
                  <th className="px-6 py-3.5">Author</th>
                  <th className="px-6 py-3.5">Comment</th>
                  <th className="px-6 py-3.5 max-sm:hidden">Date</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredComments.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900 max-w-xs truncate">
                      {item.blog_title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-gray-800">{item.user_name}</div>
                      <div className="text-[11px] text-gray-400">{item.user_email}</div>
                    </td>
                    <td className="px-6 py-4 max-w-md text-gray-700 leading-relaxed font-sans">
                      {item.comment_text}
                    </td>
                    <td className="px-6 py-4 max-sm:hidden text-gray-400 whitespace-nowrap">
                      {item.created_at}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => triggerDelete(item)}
                        className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete comment permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <ConfirmModal
          isOpen={!!deleteTarget}
          title="Delete Comment"
          message={`Are you sure you want to delete the comment from "${deleteTarget.user_name}"?`}
          confirmText="Delete"
          loading={deleteLoading}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
