"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/api/axios";
import Link from "next/link";
import {
  Calendar,
  User,
  ArrowRight,
  Search,
  Newspaper,
  ChevronRight,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

const CATEGORY_COLORS = {
  News: "bg-teal-600 text-white",
  Blogs: "bg-amber-600 text-white",
  Analysis: "bg-purple-600 text-white",
  Events: "bg-pink-600 text-white",
};

export default function NewsPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: blogs = [], isLoading } = useQuery({
    queryKey: ["public_blogs", selectedCategory, searchQuery],
    queryFn: async () => {
      const params = { only_published: true };
      if (selectedCategory !== "All") params.category = selectedCategory;
      if (searchQuery) params.search = searchQuery;
      const { data } = await api.get("/api/blogs/", { params });
      return data;
    },
  });

  const featuredPost = blogs.find((b) => b.featured) || blogs[0];
  const regularPosts = blogs.filter((b) => b.id !== featuredPost?.id);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />

      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-purple-900 via-indigo-900 to-gray-900 text-white py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none">
          <span className="text-[18vw] font-black tracking-tighter text-white">NEWS</span>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <nav className="flex items-center gap-2 text-xs font-semibold text-purple-200 mb-6">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3 h-3 text-purple-400" />
            <span className="text-white">Latest Updates & Blogs</span>
          </nav>

          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/20 backdrop-blur-md border border-purple-400/30 text-purple-200 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Educart Insights & Board Updates
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Latest News, Exams & Educational Insights
            </h1>
            <p className="mt-4 text-base sm:text-lg text-purple-100/90 leading-relaxed">
              Stay ahead with official CBSE exam notifications, board result announcements, expert analysis, and specimen resource launches.
            </p>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-200" />
              <input
                type="text"
                placeholder="Search updates by keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/10 text-white placeholder-purple-200/70 border border-white/10 rounded-xl text-sm focus:outline-none focus:bg-white/20 transition-all"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {["All", "News", "Blogs", "Analysis", "Events"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-white text-purple-900 shadow-md scale-105"
                      : "bg-white/10 text-purple-100 hover:bg-white/20"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {isLoading ? (
          <div className="py-20 text-center text-gray-500 font-semibold">
            Loading news and blogs...
          </div>
        ) : blogs.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-gray-200 p-8">
            <Newspaper className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800">No Articles Found</h3>
          </div>
        ) : (
          <>
            {featuredPost && selectedCategory === "All" && !searchQuery && (
              <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 grid grid-cols-1 lg:grid-cols-12 group">
                <div className="lg:col-span-7 relative h-72 lg:h-auto overflow-hidden bg-gray-100">
                  <img
                    src={featuredPost.image}
                    alt={featuredPost.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span
                    className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-extrabold tracking-wider uppercase shadow-md ${
                      CATEGORY_COLORS[featuredPost.category] || "bg-purple-600 text-white"
                    }`}
                  >
                    {featuredPost.category}
                  </span>
                </div>

                <div className="lg:col-span-5 p-6 sm:p-10 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 text-xs font-semibold text-gray-500">
                      <span className="flex items-center gap-1 text-purple-600 font-bold">
                        <TrendingUp className="w-3.5 h-3.5" /> Featured Spotlight
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" /> {featuredPost.published_date}
                      </span>
                    </div>

                    <Link href={`/news/${featuredPost.slug}`}>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 group-hover:text-purple-600 transition-colors leading-snug">
                        {featuredPost.title}
                      </h2>
                    </Link>

                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                      {featuredPost.excerpt}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                      <User className="w-4 h-4 text-purple-500" />
                      <span>{featuredPost.author || "Editorial Team"}</span>
                    </div>

                    <Link
                      href={`/news/${featuredPost.slug}`}
                      className="inline-flex items-center gap-2 text-sm font-extrabold text-purple-600 hover:text-purple-800 transition-colors"
                    >
                      Read Article <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  {selectedCategory === "All" ? "Recent Updates & Articles" : `${selectedCategory} Articles`}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {(selectedCategory === "All" && !searchQuery ? regularPosts : blogs).map((post) => (
                  <article
                    key={post.id}
                    className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
                  >
                    <div className="relative h-48 overflow-hidden bg-gray-100">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span
                        className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold tracking-wider uppercase shadow ${
                          CATEGORY_COLORS[post.category] || "bg-purple-600 text-white"
                        }`}
                      >
                        {post.category}
                      </span>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> {post.published_date}
                          </span>
                        </div>

                        <Link href={`/news/${post.slug}`}>
                          <h4 className="font-bold text-gray-900 text-base group-hover:text-purple-600 transition-colors line-clamp-2 leading-snug">
                            {post.title}
                          </h4>
                        </Link>

                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                          {post.excerpt}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-purple-600">
                        <Link
                          href={`/news/${post.slug}`}
                          className="inline-flex items-center gap-1.5 hover:text-purple-800 transition-colors"
                        >
                          Read Article <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
