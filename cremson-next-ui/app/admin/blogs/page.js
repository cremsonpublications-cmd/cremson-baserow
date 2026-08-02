"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import api from "../../../lib/api/axios";
import ConfirmModal from "../components/ConfirmModal";

export default function BlogsDashboardPage() {
  const [allPosts, setAllPosts] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/blogs/");
      setAllPosts(res.data);
      setPosts(res.data.slice(0, 5));
    } catch (err) {
      toast.error("Failed to load blog dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const togglePublish = async (id) => {
    try {
      const res = await api.put(`/api/blogs/${id}/status`);
      toast.success(`Post status changed to ${res.data.status}`);
      setAllPosts((prev) =>
        prev.map((post) => (post.id === id ? { ...post, status: res.data.status } : post))
      );
      setPosts((prev) =>
        prev.map((post) => (post.id === id ? { ...post, status: res.data.status } : post))
      );
    } catch (err) {
      toast.error("Failed to update status.");
    }
  };

  const triggerDelete = (post) => {
    setDeleteTarget(post);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/api/blogs/${deleteTarget.id}`);
      setAllPosts((prev) => prev.filter((post) => post.id !== deleteTarget.id));
      setPosts((prev) => prev.filter((post) => post.id !== deleteTarget.id));
      toast.success("Blog post deleted successfully!");
      setDeleteTarget(null);
    } catch (err) {
      toast.error("Failed to delete blog post.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Stats computation
  const totalBlogs = allPosts.length;
  const totalComments = 2; // Hardcoded default from comments page
  const totalDrafts = allPosts.filter((p) => p.status === "Draft").length;

  return (
    <div className="flex-1 p-6 md:p-8 bg-blue-50/50 min-h-screen pb-10 text-gray-700">
      
        {/* Stats Grid */}
        <div className="flex flex-wrap gap-6 mb-8">
          {/* Card 1: Blogs */}
          <div className="flex items-center gap-4 bg-white p-5 min-w-[220px] rounded-xl border border-gray-100 shadow-sm hover:scale-102 transition-all">
            <div className="h-12 w-12 rounded-lg bg-indigo-50 flex items-center justify-center text-primary">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{totalBlogs}</p>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Blogs</p>
            </div>
          </div>

          {/* Card 2: Comments */}
          <div className="flex items-center gap-4 bg-white p-5 min-w-[220px] rounded-xl border border-gray-100 shadow-sm hover:scale-102 transition-all">
            <div className="h-12 w-12 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{totalComments}</p>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Comments</p>
            </div>
          </div>

          {/* Card 3: Drafts */}
          <div className="flex items-center gap-4 bg-white p-5 min-w-[220px] rounded-xl border border-gray-100 shadow-sm hover:scale-102 transition-all">
            <div className="h-12 w-12 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{totalDrafts}</p>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Drafts</p>
            </div>
          </div>
        </div>

        {/* Latest Blogs Table Section */}
        <div>
          <div className="flex items-center gap-3 m-4 mt-6 text-gray-700 font-semibold">
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none" className="text-primary" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.6637 16.5578L16.1637 13.3825L10.6637 10.207V12.1603H5.83594V14.6047H10.6637V16.5578Z" fill="currentColor" />
              <path d="M6.11285 4.88867C5.43784 4.88867 4.89062 5.43589 4.89062 6.11089C4.89062 6.7859 5.43784 7.33312 6.11285 7.33312H15.8906C16.5657 7.33312 17.1128 6.7859 17.1128 6.11089C17.1128 5.43589 16.5657 4.88867 15.8906 4.88867H6.11285Z" fill="currentColor" />
              <path fillRule="evenodd" clipRule="evenodd" d="M3.66667 0C1.64163 0 0 1.64163 0 3.66667V18.3333C0 20.3584 1.64163 22 3.66667 22H18.3333C20.3584 22 22 20.3584 22 18.3333V3.66667C22 1.64163 20.3584 0 18.3333 0H3.66667ZM18.3333 2.44444H3.66667C2.99166 2.44444 2.44444 2.99166 2.44444 3.66667V18.3333C2.44444 19.0084 2.99166 19.5556 3.66667 19.5556H18.3333C19.0084 19.5556 19.5556 19.0084 19.5556 18.3333V3.66667C19.5556 2.99166 19.0084 2.44444 18.3333 2.44444Z" fill="currentColor" />
            </svg>
            <p>Latest Blogs</p>
          </div>

          <div className="relative max-w-7xl overflow-x-auto shadow-sm border border-gray-200 rounded-xl bg-white mb-10">
            {loading ? (
              <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-gray-400 text-sm">Loading dashboard data...</p>
              </div>
            ) : (
              <table className="w-full text-sm text-gray-500 text-left border-collapse">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th scope="col" className="px-6 py-4"> # </th>
                    <th scope="col" className="px-6 py-4"> Blog Title </th>
                    <th scope="col" className="px-6 py-4 max-sm:hidden"> Date </th>
                    <th scope="col" className="px-6 py-4 max-sm:hidden"> Status </th>
                    <th scope="col" className="px-6 py-4"> Actions </th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post, idx) => (
                    <tr key={post.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <th className="px-6 py-4 font-semibold text-gray-700">{idx + 1}</th>
                      <td className="px-6 py-4 font-medium text-gray-800 truncate max-w-md">
                        {post.title}
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
                      <td className="px-6 py-4 flex items-center gap-3">
                        <a
                          href={`/blogs/${post.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="border border-gray-300 px-3 py-1 text-xs rounded-lg hover:border-primary hover:text-primary transition-all cursor-pointer bg-white text-gray-600 font-medium flex items-center gap-1"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          View
                        </a>

                        <a
                          href={`/admin/addBlog?edit=${post.id}`}
                          className="border border-gray-300 px-3 py-1 text-xs rounded-lg hover:border-primary hover:text-primary transition-all cursor-pointer bg-white text-gray-600 font-medium flex items-center gap-1"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                          title="Delete post"
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
                        No blogs available in the database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      {deleteTarget && (
        <ConfirmModal
          title="Delete Blog Post"
          message={`Are you sure you want to delete "${deleteTarget.title}"? This will permanently remove the post and its image from Cloudinary.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}
      </div>
  );
}
