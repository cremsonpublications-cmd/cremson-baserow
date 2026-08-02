"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import ConfirmModal from "../components/ConfirmModal";

export default function BlogCommentsPage() {
  const [comments, setComments] = useState([
    {
      id: 1,
      blogTitle: "A detailed step by step guide to manage your lifestyle",
      name: "Dev Kumar",
      comment: "Honestly, I did not expect this to work, but it totally did. Saved my project!",
      date: "5/28/2025",
      approved: true,
    },
    {
      id: 2,
      blogTitle: "A detailed step by step guide to manage your lifestyle",
      name: "GreatStack",
      comment: "Hi this blog is must to read",
      date: "5/28/2025",
      approved: true,
    },
    {
      id: 3,
      blogTitle: "How to create an effective startup roadmap or ideas",
      name: "John Roe",
      comment: "Great breakdown of the MVP process. Very helpful!",
      date: "6/14/2025",
      approved: false,
    },
  ]);

  const [activeFilter, setActiveFilter] = useState("Approved"); // Approved or Rejected
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filteredComments = comments.filter((c) => 
    activeFilter === "Approved" ? c.approved : !c.approved
  );

  const toggleApproval = (id) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextApproval = !c.approved;
          toast.success(nextApproval ? "Comment approved!" : "Comment approval revoked.");
          return { ...c, approved: nextApproval };
        }
        return c;
      })
    );
  };

  const triggerDelete = (comment) => {
    setDeleteTarget(comment);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setComments((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    toast.success("Comment deleted successfully!");
    setDeleteTarget(null);
    setDeleteLoading(false);
  };

  return (
    <div className="flex-1 pt-5 px-5 sm:pt-12 sm:pl-16 bg-blue-50/50 min-h-screen pb-10">
      
      <div className="flex justify-between items-center max-w-7xl">
        <h1 className="text-xl font-bold text-gray-800">Comments</h1>
        
        <div className="flex gap-4">
          <button
            onClick={() => setActiveFilter("Approved")}
            className={`shadow-custom-sm border rounded-full px-4 py-1 cursor-pointer text-xs font-semibold transition-all ${
              activeFilter === "Approved"
                ? "bg-primary text-white border-primary"
                : "bg-white text-gray-700 hover:bg-gray-150 border-gray-300"
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setActiveFilter("Rejected")}
            className={`shadow-custom-sm border rounded-full px-4 py-1 cursor-pointer text-xs font-semibold transition-all ${
              activeFilter === "Rejected"
                ? "bg-primary text-white border-primary"
                : "bg-white text-gray-700 hover:bg-gray-150 border-gray-300"
            }`}
          >
            Rejected
          </button>
        </div>
      </div>

      <div className="relative mt-6 max-w-7xl overflow-x-auto bg-white shadow-sm border border-gray-200 rounded-xl mb-10">
        <table className="w-full text-sm text-gray-500 text-left border-collapse">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
            <tr>
              <th scope="col" className="px-6 py-3"> Blog Title &amp; Comment </th>
              <th scope="col" className="px-6 py-3 max-sm:hidden"> Date </th>
              <th scope="col" className="px-6 py-3"> Action </th>
            </tr>
          </thead>
          <tbody>
            {filteredComments.map((item) => (
              <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 max-w-md">
                  <b className="font-semibold text-gray-700">Blog</b>: {item.blogTitle}
                  <br /><br />
                  <b className="font-semibold text-gray-700">Name</b>: {item.name}
                  <br />
                  <b className="font-semibold text-gray-700">Comment</b>: {item.comment}
                </td>
                <td className="px-6 py-4 max-sm:hidden text-gray-500">{item.date}</td>
                <td className="px-6 py-4">
                  <div className="inline-flex items-center gap-4">
                    {activeFilter === "Approved" ? (
                      <button
                        onClick={() => triggerDelete(item)}
                        className="text-xs font-semibold rounded-full px-3.5 py-1.5 cursor-pointer transition-all border border-red-200 bg-red-50/50 text-red-600 hover:bg-red-50 hover:border-red-300 flex items-center gap-1.5 font-medium"
                        title="Reject and delete comment"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Reject &amp; Delete
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => toggleApproval(item.id)}
                          className="text-xs font-semibold rounded-full px-3.5 py-1.5 cursor-pointer transition-all border border-green-200 bg-green-50 text-green-600 hover:bg-green-100 flex items-center gap-1 font-medium"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                          Approve
                        </button>
                        
                        <button
                          onClick={() => triggerDelete(item)}
                          className="hover:scale-110 transition-all cursor-pointer text-gray-400 hover:text-red-500"
                          title="Delete comment permanently"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                            <path d="M831.24 280.772c5.657 0 10.24-4.583 10.24-10.24v-83.528c0-5.657-4.583-10.24-10.24-10.24H194.558a10.238 10.238 0 00-10.24 10.24v83.528c0 5.657 4.583 10.24 10.24 10.24H831.24zm0 40.96H194.558c-28.278 0-51.2-22.922-51.2-51.2v-83.528c0-28.278 22.922-51.2 51.2-51.2H831.24c28.278 0 51.2 22.922 51.2 51.2v83.528c0 28.278-22.922 51.2-51.2 51.2z" />
                            <path d="M806.809 304.688l-58.245 666.45c-.544 6.246-6.714 11.9-12.99 11.9H290.226c-6.276 0-12.447-5.654-12.99-11.893L218.99 304.688c-.985-11.268-10.917-19.604-22.185-18.619s-19.604 10.917-18.619 22.185l58.245 666.45c2.385 27.401 26.278 49.294 53.795 49.294h445.348c27.517 0 51.41-21.893 53.796-49.301l58.244-666.443c.985-11.268-7.351-21.201-18.619-22.185s-21.201 7.351-22.185 18.619zM422.02 155.082V51.3c0-5.726 4.601-10.342 10.24-10.342h161.28c5.639 0 10.24 4.617 10.24 10.342v103.782c0 11.311 9.169 20.48 20.48 20.48s20.48-9.169 20.48-20.48V51.3c0-28.316-22.908-51.302-51.2-51.302H432.26c-28.292 0-51.2 22.987-51.2 51.302v103.782c0 11.311 9.169 20.48 20.48 20.48s20.48-9.169 20.48-20.48z" />
                            <path d="M496.004 410.821v460.964c0 11.311 9.169 20.48 20.48 20.48s20.48-9.169 20.48-20.48V410.821c0-11.311-9.169-20.48-20.48-20.48s-20.48 9.169-20.48 20.48zm-192.435 1.767l39.936 460.964c.976 11.269 10.903 19.612 22.171 18.636s19.612-10.903 18.636-22.171l-39.936-460.964c-.976-11.269-10.903-19.612-22.171-18.636s-19.612 10.903-18.636 22.171zm377.856-3.535l-39.936 460.964c-.976 11.269 7.367 21.195 18.636 22.171s21.195-7.367 22.171-18.636l39.936-460.964c.976-11.269-7.367-21.195-18.636-22.171s-21.195 7.367-22.171 18.636z" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredComments.length === 0 && (
              <tr>
                <td colSpan="3" className="px-6 py-10 text-center text-gray-400">
                  No comments found under this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {deleteTarget && (
        <ConfirmModal
          title="Delete Comment"
          message="Are you sure you want to permanently delete this comment? This action cannot be undone."
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
