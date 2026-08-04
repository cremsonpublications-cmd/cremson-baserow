"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import CPLogo from "../../../components/CPLogo";
import api from "../../../lib/api/axios";

export default function BlogDetailPage() {
  const { slug } = useParams();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  const [comments, setComments] = useState([
    {
      id: 1,
      author: "Dev Kumar",
      text: "Honestly, I did not expect this to work, but it totally did. Saved my project!",
      time: "a year ago",
    },
    {
      id: 2,
      author: "GreatStack",
      text: "Hi this blog is must to read",
      time: "a year ago",
    },
  ]);

  const [newName, setNewName] = useState("");
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/blogs/${slug}`);
        setPost(res.data);
      } catch (err) {
        console.error("Failed to load blog post details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (newName.trim() && newComment.trim()) {
      setComments((prev) => [
        ...prev,
        {
          id: Date.now(),
          author: newName,
          text: newComment,
          time: "Just now",
        },
      ]);
      setNewName("");
      setNewComment("");
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-white flex flex-col items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-gray-400 text-sm">Loading blog post details...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="w-full min-h-screen bg-white flex flex-col items-center justify-center gap-4 text-center p-6">
        <h1 className="text-2xl font-bold text-gray-800">Blog Post Not Found</h1>
        <p className="text-gray-500">The blog post you are trying to reach does not exist or has been removed.</p>
        <Link href="/blogs" className="px-6 py-2 bg-primary text-white rounded-full hover:opacity-90 transition">
          Back to Blogs
        </Link>
      </div>
    );
  }

  // Parse attachments (supports JSON array or fallback to single file)
  let attachments = [];
  if (post && post.pdf_url) {
    if (post.pdf_url.startsWith("[")) {
      try {
        attachments = JSON.parse(post.pdf_url);
      } catch (err) {
        attachments = [{ name: post.pdf_name || "Attachment File", url: post.pdf_url }];
      }
    } else {
      attachments = [{ name: post.pdf_name || "Attachment File", url: post.pdf_url }];
    }
  }

  return (
    <div className="w-full min-h-screen bg-white">
      {/* Local Toaster (for structure, placeholder) */}
      <div id="_rht_toaster" style={{ position: "fixed", zIndex: 9999, inset: "16px", pointerEvents: "none" }} />

      <div className="relative pb-16">
        {/* Dynamic Gradient Background replacing Vite's static asset */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 -z-1 opacity-40 w-full max-w-4xl h-[600px] bg-[radial-gradient(circle_at_top,rgba(80,68,229,0.15),transparent_70%)] pointer-events-none" />

        {/* Blog Meta & Title Header */}
        <div className="text-center mt-20 text-gray-600 px-4">
          <p className="text-primary py-4 font-medium">{post.date}</p>
          <h1 className="text-2xl sm:text-5xl font-bold max-w-4xl mx-auto text-gray-800 leading-tight">
            {post.title}
          </h1>
          <h2 className="my-5 max-w-2xl mx-auto text-lg text-gray-500 font-normal leading-relaxed">
            {post.description}
          </h2>
        </div>

        {/* Hero image */}
        <div className="mx-5 max-w-4xl md:mx-auto my-10 mt-6">
          <div className="relative aspect-video w-full rounded-3xl overflow-hidden shadow-md bg-gray-50 border border-gray-100">
            <img alt={post.title} className="object-cover w-full h-full" src={post.image} />
          </div>
        </div>
        {/* Content body rendered beautifully */}
        <div className="mx-5 max-w-4xl md:mx-auto">
          <article
            className="rich-text max-w-3xl mx-auto text-gray-700 leading-relaxed space-y-6 prose prose-slate"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

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
            .rich-text h1 {
              font-size: 1.875rem;
              font-weight: 700;
              color: #1f2937;
              margin-top: 2rem;
              margin-bottom: 1rem;
            }
            .rich-text h2 {
              font-size: 1.5rem;
              font-weight: 600;
              color: #1f2937;
              margin-top: 1.75rem;
              margin-bottom: 0.75rem;
            }
            .rich-text p {
              margin-bottom: 1.25rem;
            }
            .rich-text strong {
              font-weight: 600;
            }
          `}</style>

          <hr className="my-12 border-gray-150 max-w-3xl mx-auto" />

          {/* Comments list */}
          <div className="mt-14 mb-10 max-w-3xl mx-auto">
            <p className="font-semibold text-gray-900 mb-6 text-lg">Comments ({comments.length})</p>
            <div className="flex flex-col gap-5">
              {comments.map((comment) => (
                <div key={comment.id} className="relative bg-primary/[0.02] border border-primary/5 max-w-2xl p-5 rounded-xl text-gray-600 shadow-sm transition-all hover:bg-primary/[0.03]">
                  <div className="flex items-center gap-3 mb-2.5">
                    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-gray-400" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="9" r="3" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M17.9691 20C17.81 17.1085 16.9247 15 11.9999 15C7.07521 15 6.18991 17.1085 6.03076 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <p className="font-semibold text-gray-800 text-sm">{comment.author}</p>
                  </div>
                  <p className="text-sm text-gray-600 max-w-xl ml-9 leading-relaxed">{comment.text}</p>
                  <div className="absolute right-5 bottom-4 flex items-center gap-2 text-xs text-gray-400">
                    {comment.time}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add comment Form */}
          <div className="max-w-3xl mx-auto mt-12 bg-gray-50/50 p-6 rounded-2xl border border-gray-100 shadow-sm">
            <p className="font-semibold mb-4 text-gray-900">Add your comment</p>
            <form onSubmit={handleCommentSubmit} className="flex flex-col items-start gap-4 max-w-xl">
              <input
                placeholder="Name"
                required
                className="w-full p-3 border border-gray-300 rounded-lg outline-none bg-white focus:border-primary transition-all text-sm text-gray-700 shadow-sm"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <textarea
                placeholder="Comment"
                required
                className="w-full p-3 border border-gray-300 rounded-lg outline-none h-32 bg-white focus:border-primary transition-all text-sm text-gray-700 shadow-sm"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <button
                type="submit"
                className="bg-primary text-white rounded-lg p-2.5 px-8 hover:scale-102 hover:opacity-95 active:scale-95 transition-all cursor-pointer text-sm font-medium shadow"
              >
                Submit
              </button>
            </form>
          </div>

          {/* Share article on social media */}
          <div className="my-24 max-w-3xl mx-auto border-t border-gray-100 pt-10">
            <p className="font-semibold my-4 text-gray-900">Share this article on social media</p>
            <div className="flex gap-4">
              {/* Facebook Share Button */}
              <button
                onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
                className="hover:scale-105 transition-all duration-200 cursor-pointer"
                title="Share on Facebook"
              >
                <svg width="50" height="50" viewBox="0 0 58 58" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g filter="url(#fb-shadow)">
                    <path d="M29 49C41.7025 49 52 38.7025 52 26C52 13.2975 41.7025 3 29 3C16.2975 3 6 13.2975 6 26C6 38.7025 16.2975 49 29 49Z" fill="white" />
                  </g>
                  <path d="M30.8078 35.7731H26.5807V26.7731H24.4688V23.2991H26.5807V21.2181C26.5807 18.3891 27.7687 16.7051 31.1617 16.7051H33.9827V20.1751H32.2207C30.9017 20.1751 30.8137 20.6591 30.8137 21.5641L30.8078 23.2991H34.0028L33.6287 26.7691H30.8078V35.7691V35.7731Z" fill="#5044E5" />
                  <defs>
                    <filter id="fb-shadow" x="0" y="0" width="58" height="58" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                      <feFlood floodOpacity="0" result="BackgroundImageFix" />
                      <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                      <feOffset dy="3" />
                      <feGaussianBlur stdDeviation="3" />
                      <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.161 0" />
                      <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_8593_1246" />
                      <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_8593_1246" result="shape" />
                    </filter>
                  </defs>
                </svg>
              </button>

              {/* Twitter/X Share Button */}
              <button
                onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.title)}`, '_blank')}
                className="hover:scale-105 transition-all duration-200 cursor-pointer"
                title="Share on Twitter/X"
              >
                <svg width="50" height="50" viewBox="0 0 59 59" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g filter="url(#tw-shadow)">
                    <path d="M29.24 49.48C42.0751 49.48 52.48 39.0751 52.48 26.24C52.48 13.4045 42.0751 3 29.24 3C16.4045 3 6 13.4045 6 26.24C6 39.0751 16.4045 49.48 29.24 49.48Z" fill="white" />
                  </g>
                  <path d="M38.7789 20.3267C38.0648 20.6427 37.3074 20.8504 36.5319 20.9427C37.3486 20.4542 37.9599 19.6855 38.2519 18.7797C37.4838 19.2354 36.6433 19.556 35.7669 19.7277C35.2301 19.1557 34.5337 18.7582 33.7682 18.5868C33.0027 18.4154 32.2033 18.4779 31.4738 18.7664C30.7443 19.0548 30.1182 19.5558 29.6769 20.2044C29.2356 20.853 28.9994 21.6193 28.9989 22.4037C28.9983 22.7039 29.0319 23.0032 29.0989 23.2957C27.544 23.2176 26.023 22.8133 24.6344 22.1092C23.2458 21.4051 22.0209 20.4169 21.0389 19.2087C20.5386 20.0698 20.3853 21.0892 20.6101 22.0593C20.8349 23.0294 21.4209 23.8775 22.2489 24.4307C21.6279 24.4116 21.0205 24.2435 20.4779 23.9407V23.9927C20.4783 24.8949 20.7903 25.7692 21.3612 26.4677C21.9322 27.1662 22.7269 27.6459 23.6109 27.8257C23.2749 27.9172 22.9282 27.9632 22.5799 27.9627C22.3346 27.9628 22.0898 27.9393 21.8489 27.8927C22.0991 27.8927 22.5858 29.3497 23.2411 29.8368C23.8964 30.324 24.6876 30.5942 25.5039 30.6097C24.1172 31.6964 22.4057 32.2856 20.6439 32.2827C20.3321 32.2832 20.0206 32.2652 19.7109 32.2287C21.5006 33.3787 23.5837 33.9887 25.7109 33.9857C27.175 33.9956 28.6265 33.7145 29.981 33.1587C31.3356 32.603 32.5663 31.7836 33.6015 30.7484C34.6368 29.7131 35.4561 28.4824 36.0119 27.1279C36.5677 25.7733 36.8488 24.3218 36.8389 22.8577C36.8389 22.6877 36.8389 22.5197 36.8279 22.3517C37.5937 21.7984 38.2547 21.113 38.7799 20.3277L38.7789 20.3267Z" fill="#5044E5" />
                  <defs>
                    <filter id="tw-shadow" x="0" y="0" width="58.4766" height="58.48" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                      <feFlood floodOpacity="0" result="BackgroundImageFix" />
                      <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                      <feOffset dy="3" />
                      <feGaussianBlur stdDeviation="3" />
                      <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.161 0" />
                      <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_8593_1250" />
                      <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_8593_1250" result="shape" />
                    </filter>
                  </defs>
                </svg>
              </button>

              {/* Share/Plus Button */}
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: post.title,
                      text: post.description,
                      url: window.location.href,
                    }).catch(console.error);
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Link copied to clipboard!");
                  }
                }}
                className="hover:scale-105 transition-all duration-200 cursor-pointer"
                title="Copy Link"
              >
                <svg width="50" height="50" viewBox="0 0 59 59" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g filter="url(#plus-shadow)">
                    <path d="M29.239 49.478C42.0735 49.478 52.478 39.0735 52.478 26.239C52.478 13.4045 42.0735 3 29.239 3C16.4045 3 6 13.4045 6 26.239C6 39.0735 16.4045 49.478 29.239 49.478Z" fill="white" />
                  </g>
                  <path d="M25.2874 33.389C23.3426 33.3991 21.471 32.6475 20.0734 31.295C19.3908 30.6415 18.8476 29.8566 18.4765 28.9876C18.1054 28.1186 17.9141 27.1834 17.9141 26.2385C17.9141 25.2935 18.1054 24.3583 18.4765 23.4893C18.8476 22.6203 19.3908 21.8354 20.0734 21.182C21.436 19.877 23.2384 19.1304 25.1246 19.0896C27.0109 19.0489 28.8438 19.717 30.2614 20.962L28.0894 23.026C27.2994 22.3796 26.3102 22.0263 25.2894 22.026C24.1552 22.0097 23.0609 22.4442 22.2467 23.2341C21.4326 24.024 20.9653 25.1048 20.9474 26.239C20.9664 27.3721 21.4339 28.4515 22.2474 29.2405C23.061 30.0295 24.1542 30.4637 25.2874 30.448C26.1575 30.4517 27.0087 30.1952 27.7319 29.7114C28.455 29.2276 29.0169 28.5386 29.3454 27.733H25.1944V24.746H32.4944C32.75 25.9176 32.7004 27.1353 32.3501 28.2823C31.9999 29.4292 31.3609 30.4669 30.4944 31.296C29.0984 32.6464 27.2297 33.3975 25.2874 33.389ZM38.5874 29.27H36.7204V26.782H34.1544V24.972H36.7204V22.483H38.5874V24.972H41.1534V26.782H38.5874V29.271V29.27Z" fill="#5044E5" />
                  <defs>
                    <filter id="plus-shadow" x="0" y="0" width="58.4766" height="58.478" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                      <feFlood floodOpacity="0" result="BackgroundImageFix" />
                      <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                      <feOffset dy="3" />
                      <feGaussianBlur stdDeviation="3" />
                      <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.161 0" />
                      <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_8593_1254" />
                      <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_8593_1254" result="shape" />
                    </filter>
                  </defs>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Local Footer (consistent brand) */}
        <div className="px-6 md:px-16 lg:px-24 xl:px-32 bg-primary/[0.02] border-t border-gray-100 mt-20">
          <div className="flex flex-col md:flex-row items-start justify-between gap-10 py-10 border-b border-gray-500/10 text-gray-500">
            <div className="space-y-4">
              <CPLogo className="w-24 sm:w-32" />
              <p className="max-w-[410px] text-sm text-gray-500 leading-relaxed">
                Explore insightful guides, tech breakthroughs, and creative strategies from the team at Cremson.
                We believe in sharing content that inspires learning and growth.
              </p>
            </div>

            <div className="flex flex-wrap justify-between w-full md:w-[60%] gap-8">
              <div>
                <h3 className="font-semibold text-sm text-gray-900 md:mb-5 mb-2 uppercase tracking-wider">Quick Links</h3>
                <ul className="text-sm space-y-2">
                  <li><a href="/" className="hover:text-primary transition">Home</a></li>
                  <li><a href="/shop" className="hover:text-primary transition">Shop</a></li>
                  <li><a href="/specimen" className="hover:text-primary transition">Specimen</a></li>
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
              <div>
                <h3 className="font-semibold text-sm text-gray-900 md:mb-5 mb-2 uppercase tracking-wider">Follow Us</h3>
                <ul className="text-sm space-y-2">
                  <li>
                    <a href="https://www.instagram.com/cremsonbooks/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition flex items-center gap-1.5">
                      Instagram
                    </a>
                  </li>
                  <li>
                    <a href="https://www.youtube.com/@cremson_publications" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition flex items-center gap-1.5">
                      YouTube
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <p className="py-6 text-center text-xs md:text-sm text-gray-400">
            Copyright 2026 © Cremson Publications Blogs - All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
