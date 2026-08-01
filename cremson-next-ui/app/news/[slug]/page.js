"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../../lib/api/axios";
import Link from "next/link";
import {
  Calendar,
  User,
  Share2,
  ChevronRight,
  ArrowLeft,
  Newspaper,
  MessageCircle,
  Globe,
  Send,
  Clock,
  Sparkles,
} from "lucide-react";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";

const CATEGORY_COLORS = {
  News: "bg-teal-600 text-white",
  Blogs: "bg-amber-600 text-white",
  Analysis: "bg-purple-600 text-white",
  Events: "bg-pink-600 text-white",
};

export default function ArticleDetailPage({ params }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const { data: blog, isLoading, isError } = useQuery({
    queryKey: ["blog_detail", slug],
    queryFn: async () => {
      const { data } = await api.get(`/api/blogs/${slug}`);
      return data;
    },
  });

  const { data: allBlogs = [] } = useQuery({
    queryKey: ["public_blogs_related"],
    queryFn: async () => {
      const { data } = await api.get("/api/blogs/", { params: { only_published: true } });
      return data;
    },
  });

  const relatedBlogs = allBlogs.filter((b) => b.slug !== slug).slice(0, 3);
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = blog ? encodeURIComponent(`${blog.title} - Educart Latest Updates`) : "";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />

      <main className="flex-1">
        {isLoading ? (
          <div className="py-24 text-center text-gray-500 font-semibold">
            Loading article details...
          </div>
        ) : isError || !blog ? (
          <div className="py-24 max-w-xl mx-auto text-center px-4">
            <Newspaper className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">Article Not Found</h1>
            <Link
              href="/news"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-bold rounded-xl shadow-md hover:bg-purple-700 transition-all mt-4"
            >
              <ArrowLeft className="w-4 h-4" /> Back to News & Updates
            </Link>
          </div>
        ) : (
          <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
            <div className="flex items-center justify-between">
              <nav className="flex items-center gap-2 text-xs font-semibold text-gray-500 overflow-x-auto">
                <Link href="/" className="hover:text-purple-600 transition-colors shrink-0">
                  Home
                </Link>
                <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />
                <Link href="/news" className="hover:text-purple-600 transition-colors shrink-0">
                  News & Updates
                </Link>
                <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />
                <span className="text-gray-900 font-bold truncate max-w-[200px] sm:max-w-xs">
                  {blog.title}
                </span>
              </nav>

              <Link
                href="/news"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-800 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> All Updates
              </Link>
            </div>

            <div className="space-y-4 border-b border-gray-200 pb-8">
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-extrabold tracking-wider uppercase ${
                    CATEGORY_COLORS[blog.category] || "bg-purple-600 text-white"
                  }`}
                >
                  {blog.category}
                </span>
                <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> 3 min read
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-gray-900 leading-tight tracking-tight">
                {blog.title}
              </h1>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-bold text-sm">
                    {blog.author ? blog.author.charAt(0) : "E"}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{blog.author || "Cremson Editorial"}</h4>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Published on {blog.published_date}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 mr-1 flex items-center gap-1">
                    <Share2 className="w-3.5 h-3.5" /> Share:
                  </span>
                  <a
                    href={`https://api.whatsapp.com/send?text=${shareText}%20${encodeURIComponent(currentUrl)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full transition-colors shadow-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors shadow-sm"
                  >
                    <Globe className="w-4 h-4" />
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(currentUrl)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-sky-500 hover:bg-sky-600 text-white rounded-full transition-colors shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            {blog.image && (
              <div className="rounded-3xl overflow-hidden shadow-lg border border-gray-200 bg-gray-100 max-h-[460px]">
                <img src={blog.image} alt={blog.title} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-200 shadow-sm">
              <div
                className="prose prose-purple max-w-none text-gray-800 leading-relaxed text-base sm:text-lg space-y-4"
                dangerouslySetInnerHTML={{ __html: blog.content }}
              />
            </div>

            {relatedBlogs.length > 0 && (
              <div className="pt-10 border-t border-gray-200 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" /> Related News & Articles
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {relatedBlogs.map((item) => (
                    <Link
                      key={item.id}
                      href={`/news/${item.slug}`}
                      className="bg-white p-4 rounded-2xl border border-gray-200 hover:shadow-lg transition-all group flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-36 object-cover rounded-xl border border-gray-100 group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-600 text-white">
                          {item.category}
                        </span>
                        <h4 className="font-bold text-gray-900 text-sm group-hover:text-purple-600 transition-colors line-clamp-2">
                          {item.title}
                        </h4>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>
        )}
      </main>

      <Footer />
    </div>
  );
}
