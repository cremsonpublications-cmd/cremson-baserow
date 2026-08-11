"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import CPLogo from "../../components/CPLogo";
import api from "../../lib/api/axios";

export default function BlogsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState(["All"]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const fetchBlogsAndCategories = async () => {
      try {
        setLoading(true);
        const [blogsRes, categoriesRes] = await Promise.all([
          api.get("/api/blogs/?status=Published"),
          api.get("/api/blogs/categories")
        ]);
        setPosts(blogsRes.data);
        setCategories(["All", ...categoriesRes.data.map((c) => c.name)]);
      } catch (err) {
        console.error("Failed to load data from backend:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogsAndCategories();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setActiveSearch(searchQuery);
  };

  const handleSubscribeSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  // Filter posts
  const filteredPosts = posts.filter((post) => {
    const matchesCategory =
      selectedCategory === "All" || post.category === selectedCategory;
    const matchesSearch =
      post.title.toLowerCase().includes(activeSearch.toLowerCase()) ||
      post.description.toLowerCase().includes(activeSearch.toLowerCase()) ||
      post.category.toLowerCase().includes(activeSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full min-h-screen bg-white">
      {/* Local Toaster (for structure, placeholder) */}
      <div id="_rht_toaster" style={{ position: "fixed", zIndex: 9999, inset: "16px", pointerEvents: "none" }} />

      {/* Hero section */}
      <div className="mx-8 sm:mx-16 xl:mx-24 relative overflow-hidden">
        <div className="text-center mt-12 mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            Cremson Blogs
          </h1>
          <form onSubmit={handleSearchSubmit} className="flex justify-between max-w-lg max-sm:scale-75 mx-auto border border-gray-300 bg-white rounded-xl overflow-hidden shadow-sm focus-within:border-primary transition-all">
            <input
              placeholder="Search for blogs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 outline-none text-gray-700"
              type="text"
            />
            <button type="submit" className="bg-primary text-white px-8 py-2.5 m-1 rounded-lg hover:scale-105 active:scale-95 transition-all cursor-pointer font-medium text-sm">
              Search
            </button>
          </form>
        </div>
        {/* Dynamic Gradient Background replacing the missing static asset */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 -z-1 opacity-40 w-full max-w-4xl h-[600px] bg-[radial-gradient(circle_at_top,rgba(80,68,229,0.15),transparent_70%)] pointer-events-none" />
      </div>

      {/* Categories filter and Blog list */}
      <div>
        <div className="flex flex-wrap justify-center gap-4 sm:gap-8 my-10 relative px-4">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <div key={cat} className="relative">
                <button
                  onClick={() => setSelectedCategory(cat)}
                  className={`cursor-pointer text-sm font-medium px-4 py-1.5 rounded-full transition-all duration-300 ${isActive ? "text-white bg-primary shadow-sm" : "text-gray-500 hover:text-gray-900"
                    }`}
                >
                  {cat}
                </button>
              </div>
            );
          })}
        </div>

        {/* Filter results information */}
        {(activeSearch || selectedCategory !== "All") && (
          <div className="text-center text-sm text-gray-500 mb-6">
            Showing {filteredPosts.length} results
            {selectedCategory !== "All" && <span> in <strong className="text-gray-800">{selectedCategory}</strong></span>}
            {activeSearch && <span> matching "<strong className="text-gray-800">{activeSearch}</strong>"</span>}
            <button
              onClick={() => {
                setSelectedCategory("All");
                setSearchQuery("");
                setActiveSearch("");
              }}
              className="ml-2 text-primary underline hover:text-primary-dark"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Blog grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8 mb-24 mx-8 sm:mx-16 xl:mx-40">
          {loading ? (
            <div className="col-span-full py-12 text-center flex flex-col items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-gray-400 text-sm">Loading blogs from database...</p>
            </div>
          ) : filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blogs/${post.slug}`}
                className="w-full rounded-lg overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:shadow-primary/5 hover:translate-y-[-2px] transition-all duration-300 cursor-pointer flex flex-col bg-white"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-gray-50">
                  <img
                    alt={post.title}
                    className="object-cover w-full h-full hover:scale-105 transition-transform duration-500"
                    src={post.image || null}
                    loading="lazy"
                  />
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  {post.category && post.category !== "None" && (
                    <span className="px-3 py-1 self-start bg-primary/10 rounded-full text-primary text-xs font-semibold mb-3">
                      {post.category}
                    </span>
                  )}
                  <h5 className="mb-2 font-semibold text-gray-900 text-base leading-snug line-clamp-2">
                    {post.title}
                  </h5>
                  <div
                    className="text-xs text-gray-500 line-clamp-3 mt-auto"
                    dangerouslySetInnerHTML={{ __html: post.description }}
                  />
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400">
                    <span>{post.date}</span>
                    <span className="flex items-center gap-1.5 font-medium text-rose-500 bg-rose-50 px-2.5 py-1 rounded-full">
                      <svg className="w-3.5 h-3.5 fill-rose-500 stroke-rose-500" viewBox="0 0 24 24" strokeWidth="2">
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                      </svg>
                      {post.likes || 0}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-gray-500">
              No blogs found. Try adjusting your search or category filter.
            </div>
          )}
        </div>
      </div>



      {/* Local Footer (from snippet, adapted for Cremson Publications branding) */}
      <div className="px-6 md:px-16 lg:px-24 xl:px-32 bg-primary/[0.02] border-t border-gray-100">
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
  );
}
