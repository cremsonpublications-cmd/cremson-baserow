"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useApp } from "../../../context/AppContext";

export default function TeachingResourceDetailPage() {
  const params = useParams();
  const rawSlug = params?.slug;
  const [slug, setSlug] = useState(rawSlug || "");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const parts = window.location.pathname.split("/").filter(Boolean);
      if (parts[0] === "teaching-resource" && parts[1] && parts[1] !== "default") {
        setSlug(parts[1]);
      } else if (rawSlug) {
        setSlug(rawSlug);
      }
    }
  }, [rawSlug]);

  const { user, setUser } = useApp();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showIdCardModal, setShowIdCardModal] = useState(false);
  const [uploadingIdCard, setUploadingIdCard] = useState(false);
  const [idCardError, setIdCardError] = useState("");
  const [pendingFile, setPendingFile] = useState(null);

  useEffect(() => {
    if (!slug || slug === "default") return;
    const fetchPost = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/teaching-resource-posts/${slug}`);
        setPost(res.data);
      } catch (err) {
        console.error("Failed to load teaching resource page:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-white flex flex-col items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-gray-400 text-sm">Loading page...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="w-full min-h-screen bg-white flex flex-col items-center justify-center gap-4 text-center p-6">
        <h1 className="text-2xl font-bold text-gray-800">Page Not Found</h1>
        <p className="text-gray-500">The teaching resource page you are looking for does not exist or has been removed.</p>
        <Link href="/" className="px-6 py-2 bg-primary text-white rounded-full hover:opacity-90 transition">
          Back to Home
        </Link>
      </div>
    );
  }

  let attachments = [];
  if (post && post.pdf_url) {
    if (post.pdf_url.startsWith("[")) {
      try {
        attachments = JSON.parse(post.pdf_url);
      } catch {
        attachments = [{ name: post.pdf_name || "Attachment File", url: post.pdf_url }];
      }
    } else {
      attachments = [{ name: post.pdf_name || "Attachment File", url: post.pdf_url }];
    }
  }

  const handleDownloadClick = (e, file) => {
    if (!user) {
      e.preventDefault();
      alert("Please sign in with a verified teacher account to download teaching resources.");
      return;
    }
    if (user.role === "teacher" && !user.id_card_url) {
      e.preventDefault();
      setPendingFile(file);
      setShowIdCardModal(true);
      return;
    }
  };

  async function handleIdCardUpload(fileObj) {
    if (!fileObj) return;
    setUploadingIdCard(true);
    setIdCardError("");
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", fileObj);
      uploadFormData.append("upload_preset", "unsigned_preset");

      const res = await fetch("https://api.cloudinary.com/v1_1/dkxxa3xt0/image/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (!res.ok) throw new Error("Image upload failed");
      const data = await res.json();

      await api.post("/api/auth/update-id-card", { id_card_url: data.secure_url });
      
      if (setUser) {
        setUser((prev) => ({ ...prev, id_card_url: data.secure_url }));
      }
      setShowIdCardModal(false);
      if (pendingFile) {
        window.open(pendingFile.url, "_blank");
      }
    } catch (err) {
      setIdCardError(err?.message || "Failed to upload ID Card photo. Please try again.");
    } finally {
      setUploadingIdCard(false);
    }
  }

  return (
    <div className="w-full min-h-screen bg-white">
      <div className="relative pb-16">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 -z-1 opacity-40 w-full max-w-4xl h-[600px] bg-[radial-gradient(circle_at_top,rgba(80,68,229,0.15),transparent_70%)] pointer-events-none" />

        {/* Page Meta & Title */}
        <div className="text-center mt-20 text-gray-600 px-4">
          <p className="text-primary py-4 font-medium">{post.date}</p>
          <h1 className="text-2xl sm:text-5xl font-bold max-w-4xl mx-auto text-gray-800 leading-tight">{post.title}</h1>
          <h2 className="my-5 max-w-2xl mx-auto text-lg text-gray-500 font-normal leading-relaxed">{post.description}</h2>
        </div>

        {/* Hero image */}
        <div className="mx-5 max-w-4xl md:mx-auto my-10 mt-6">
          <div className="relative aspect-video w-full rounded-3xl overflow-hidden shadow-md bg-gray-50 border border-gray-100">
            <img alt={post.title} className="object-cover w-full h-full" src={post.image || null} />
          </div>
        </div>

        {/* Content body */}
        <div className="mx-5 max-w-4xl md:mx-auto">
          <article
            className="rich-text max-w-3xl mx-auto text-gray-700 leading-relaxed space-y-6 prose prose-slate"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* PDF Attachments */}
          {attachments.length > 0 && (
            <div className="max-w-3xl mx-auto mt-10 space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Attached Materials</h3>
              <div className="grid grid-cols-1 gap-3">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="p-4 bg-primary/[0.03] border border-primary/10 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 hover:bg-primary/[0.05] hover:border-primary/20 transition-all duration-300 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 text-sm">{file.name}</h4>
                        <span className="text-[10px] text-gray-400 font-mono truncate max-w-[200px] block sm:max-w-none">{file.url.split('/').pop()}</span>
                      </div>
                    </div>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={file.name || "download.pdf"}
                      onClick={(e) => handleDownloadClick(e, file)}
                      className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-xl hover:opacity-95 active:scale-95 transition-all text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      Download
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          <style jsx global>{`
            .rich-text h1 { font-size: 2.25rem; font-weight: 800; color: #0f172a; margin-top: 2.5rem; margin-bottom: 1.25rem; line-height: 1.25; letter-spacing: -0.02em; }
            .rich-text h2 { font-size: 1.75rem; font-weight: 700; color: #1e293b; margin-top: 2rem; margin-bottom: 1rem; line-height: 1.3; letter-spacing: -0.01em; }
            .rich-text p { margin-bottom: 1.25rem; line-height: 1.75; color: #334155; }
            .rich-text strong { font-weight: 700; color: #0f172a; }
          `}</style>

          <hr className="my-12 border-gray-150 max-w-3xl mx-auto" />
        </div>

        {/* Footer */}
        <div className="px-6 md:px-16 lg:px-24 xl:px-32 bg-primary/[0.02] border-t border-gray-100 mt-20">
          <div className="flex flex-col md:flex-row items-start justify-between gap-10 py-10 border-b border-gray-500/10 text-gray-500">
            <div className="space-y-4">
              <CPLogo className="w-24 sm:w-32" />
              <p className="max-w-[410px] text-sm text-gray-500 leading-relaxed">
                Quality teaching resources and materials from Cremson Publications.
              </p>
            </div>
            <div className="flex flex-wrap justify-between w-full md:w-[60%] gap-8">
              <div>
                <h3 className="font-semibold text-sm text-gray-900 md:mb-5 mb-2 uppercase tracking-wider">Quick Links</h3>
                <ul className="text-sm space-y-2">
                  <li><a href="/" className="hover:text-primary transition">Home</a></li>
                  <li><a href="/shop" className="hover:text-primary transition">Buy Books</a></li>
                  <li><a href="/about-us" className="hover:text-primary transition">About Us</a></li>
                  <li><a href="/contact-us" className="hover:text-primary transition">Contact Us</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-900 md:mb-5 mb-2 uppercase tracking-wider">Need Help?</h3>
                <ul className="text-sm space-y-2">
                  <li><a href="/contact-us" className="hover:text-primary transition">Customer Support</a></li>
                  <li><a href="/terms-conditions" className="hover:text-primary transition">Terms of Service</a></li>
                  <li><a href="/privacy-policy" className="hover:text-primary transition">Privacy Policy</a></li>
                </ul>
              </div>
            </div>
          </div>
          <p className="py-6 text-center text-xs md:text-sm text-gray-400">
            Copyright 2026 © Cremson Publications - All Rights Reserved.
          </p>
        </div>

        {showIdCardModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border border-gray-100">
              <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-2">Teacher ID Card Required</h3>
              <p className="text-xs text-gray-600 leading-relaxed mb-6">
                To download teacher resource files, please upload a photo of your Teacher ID Card or School ID for verification.
              </p>

              {idCardError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                  {idCardError}
                </div>
              )}

              <label className="block w-full cursor-pointer">
                <div className="w-full py-8 border-2 border-dashed border-gray-300 hover:border-indigo-500 rounded-2xl bg-gray-50 flex flex-col items-center justify-center transition-all mb-4">
                  {uploadingIdCard ? (
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                      Uploading ID Card...
                    </div>
                  ) : (
                    <>
                      <span className="text-xs font-bold text-indigo-600">Click to Select ID Card Photo</span>
                      <span className="text-[10px] text-gray-400 mt-1">Supports JPG, PNG or WEBP</span>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingIdCard}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleIdCardUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                disabled={uploadingIdCard}
                onClick={() => setShowIdCardModal(false)}
                className="w-full py-2 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
