"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import api from "../../../lib/api/axios";
import ConfirmModal from "../components/ConfirmModal";

export default function TeachingResourcePostsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/teaching-resource-posts/");
      setPosts(res.data);
    } catch (err) {
      toast.error("Failed to load teaching resource pages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const togglePublish = async (id) => {
    try {
      const res = await api.put(`/api/teaching-resource-posts/${id}/status`);
      toast.success(`Status changed to ${res.data.status}`);
      setPosts((prev) =>
        prev.map((post) => (post.id === id ? { ...post, status: res.data.status } : post))
      );
    } catch (err) {
      toast.error("Failed to update status.");
    }
  };

  const copyLink = (slug) => {
    const link = `/teaching-resource/${slug}`;
    navigator.clipboard.writeText(link).then(() => {
      toast.success("Link copied! Paste it as the redirect URL in the navigation tree.");
    }).catch(() => {
      toast.error("Failed to copy link.");
    });
  };

  const triggerDelete = (post) => {
    setDeleteTarget(post);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/api/teaching-resource-posts/${deleteTarget.id}`);
      setPosts((prev) => prev.filter((post) => post.id !== deleteTarget.id));
      toast.success("Page deleted successfully!");
      setDeleteTarget(null);
    } catch (err) {
      toast.error("Failed to delete page.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 bg-blue-50/50 min-h-screen pb-10 text-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Teaching Resource Pages</h1>
          <p className="text-xs text-gray-400 mt-1">
            Create pages here, then copy their link and paste it as a redirect URL in the Teaching Resources navigation tree.
          </p>
        </div>
        <a
          href="/admin/teaching-resource-posts/add"
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add New Page
        </a>
      </div>

      <div className="relative max-w-7xl overflow-x-auto shadow-sm border border-gray-200 rounded-xl bg-white mb-10">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-gray-400 text-sm">Loading pages...</p>
          </div>
        ) : (
          <table className="w-full text-sm text-gray-500 text-left border-collapse">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <th scope="col" className="px-6 py-4"> # </th>
                <th scope="col" className="px-6 py-4"> Page Title </th>
                <th scope="col" className="px-6 py-4 max-sm:hidden"> Date </th>
                <th scope="col" className="px-6 py-4 max-sm:hidden"> Status </th>
                <th scope="col" className="px-6 py-4"> Actions </th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post, idx) => (
                <tr key={post.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                  <th className="px-6 py-4 font-semibold text-gray-700">{idx + 1}</th>
                  <td className="px-6 py-4 font-medium text-gray-800 max-w-md truncate">
                    {post.title}
                    <div className="text-[10px] text-gray-400 font-mono mt-0.5">/teaching-resource/{post.slug}</div>
                  </td>
                  <td className="px-6 py-4 max-sm:hidden text-gray-500">{post.date}</td>
                  <td className="px-6 py-4 max-sm:hidden">
                    <span
                      className={`text-xs font-semibold ${
                        post.status === "Published" ? "text-green-600 bg-green-50 px-2 py-0.5 rounded" : "text-amber-600 bg-amber-50 px-2 py-0.5 rounded"
                      }`}
                    >
                      {post.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex items-center gap-2 flex-wrap">
                    {/* Copy Link button */}
                    <button
                      onClick={() => copyLink(post.slug)}
                      className="border border-indigo-300 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1 text-xs rounded-lg transition-all cursor-pointer font-medium flex items-center gap-1"
                      title="Copy navigation link"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      Copy Link
                    </button>

                    <a
                      href={`/teaching-resource/${post.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-gray-300 px-3 py-1 text-xs rounded-lg hover:border-primary hover:text-primary transition-all cursor-pointer bg-white text-gray-600 font-medium flex items-center gap-1"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                      </svg>
                      View
                    </a>

                    <a
                      href={`/admin/teaching-resource-posts/add?edit=${post.id}`}
                      className="border border-gray-300 px-3 py-1 text-xs rounded-lg hover:border-primary hover:text-primary transition-all cursor-pointer bg-white text-gray-600 font-medium flex items-center gap-1"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
                      </svg>
                      Edit
                    </a>

                    <button
                      onClick={() => togglePublish(post.id)}
                      className="border border-gray-300 px-3 py-1 text-xs rounded-lg hover:border-primary hover:text-primary transition-all cursor-pointer bg-white text-gray-600 font-medium"
                    >
                      {post.status === "Published" ? "Unpublish" : "Publish"}
                    </button>

                    <button
                      onClick={() => triggerDelete(post)}
                      className="hover:scale-110 transition-all cursor-pointer"
                      title="Delete page"
                    >
                      <svg width="33" height="33" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="16.1368" cy="16.1368" r="15.6368" fill="#FEF7F5" stroke="#FFE7E2"/>
                        <rect x="12.2891" y="19.0146" width="9.38287" height="1.12594" rx="0.562972" transform="rotate(-45.7402 12.2891 19.0146)" fill="#FFA2A2"/>
                        <rect x="19.0078" y="19.7559" width="9.38287" height="1.12594" rx="0.562972" transform="rotate(-135.74 19.0078 19.7559)" fill="#FFA2A2"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-gray-400">
                    No teaching resource pages yet. Click &quot;Add New Page&quot; to create your first one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      {deleteTarget && (
        <ConfirmModal
          title="Delete Teaching Resource Page"
          message={`Are you sure you want to delete "${deleteTarget.title}"? This will permanently remove the page and its assets.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
