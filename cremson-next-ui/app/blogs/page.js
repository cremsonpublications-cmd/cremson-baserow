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
        <div className="text-center mt-20 mb-8">
          <div className="inline-flex items-center justify-center gap-4 px-6 py-1.5 mb-4 border border-primary/40 bg-primary/10 rounded-full text-sm text-primary">
            <p>New: Interactive Blog Hub</p>
            <img
              className="w-2.5"
              alt=""
              src="data:image/svg+xml,%3csvg%20width='13'%20height='13'%20viewBox='0%200%2013%2013'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M9.94893%201.40177L9.90308%203.8843C9.89653%204.22491%2010.1127%204.67687%2010.3878%204.87993L12.0122%206.11134C13.0537%206.89736%2012.8834%207.86024%2011.6389%208.25325L9.52316%208.91482C9.16945%209.02618%208.79609%209.41264%208.70439%209.7729L8.20002%2011.6987C7.80046%2013.2183%206.80483%2013.369%205.97951%2012.0327L4.82665%2010.1659C4.61704%209.8253%204.11923%209.56984%203.72622%209.58949L1.53845%209.70085C-0.0270471%209.77945%20-0.472461%208.87552%200.54937%207.68339L1.84631%206.17684C2.08867%205.89518%202.20002%205.37117%202.08867%205.01748L1.42055%202.89522C1.03409%201.65068%201.72841%200.962908%202.96639%201.36902L4.8987%202.00439C5.22623%202.10919%205.7175%202.03714%205.99261%201.83408L8.01007%200.37994C9.10395%20-0.399533%209.97513%200.0589805%209.94893%201.40177Z'%20fill='%235044E5'/%3e%3cpath%20d='M12.6652%2012.0979L10.6805%2010.1132C10.4906%209.92321%2010.1762%209.92321%209.98622%2010.1132C9.79626%2010.3031%209.79626%2010.6175%209.98622%2010.8075L11.9709%2012.7922C12.0692%2012.8905%2012.1936%2012.9363%2012.3181%2012.9363C12.4425%2012.9363%2012.567%2012.8905%2012.6652%2012.7922C12.8552%2012.6022%2012.8552%2012.2878%2012.6652%2012.0979Z'%20fill='%235044E5'/%3e%3c/svg%3e"
            />
          </div>
          <h1 className="text-3xl sm:text-6xl font-semibold sm:leading-[1.1] text-gray-700">
            Your own <span className="text-primary font-bold">blogging</span> <br /> platform.
          </h1>
          <p className="my-6 sm:my-8 max-w-2xl m-auto max-sm:text-xs text-gray-500">
            This is your space to think out loud, to share what matters, and to write without filters.
            Whether it's one word or a thousand, your story starts right here.
          </p>
          <form onSubmit={handleSearchSubmit} className="flex justify-between max-w-lg max-sm:scale-75 mx-auto border border-gray-300 bg-white rounded overflow-hidden shadow-sm focus-within:border-primary transition-all">
            <input
              placeholder="Search for blogs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 outline-none text-gray-700"
              type="text"
            />
            <button type="submit" className="bg-primary text-white px-8 py-2 m-1.5 rounded hover:scale-105 active:scale-95 transition-all cursor-pointer">
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
                    src={post.image}
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

      {/* Subscribe section */}
      <div className="flex flex-col items-center justify-center text-center space-y-2 my-32 px-4">
        <h1 className="md:text-4xl text-2xl font-bold text-gray-900">Never Miss a Blog!</h1>
        <p className="md:text-lg text-gray-500/70 pb-8 max-w-lg">
          Subscribe to get the latest blog, new tech, and exclusive news directly in your inbox.
        </p>
        <form onSubmit={handleSubscribeSubmit} className="flex items-center justify-between max-w-2xl w-full md:h-13 h-12 shadow-sm border border-gray-300 rounded-md overflow-hidden bg-white focus-within:border-primary transition-all">
          <input
            className="h-full outline-none w-full px-4 text-gray-700 bg-transparent"
            placeholder="Enter your email id"
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            type="submit"
            className="md:px-12 px-6 h-full text-white bg-primary hover:bg-opacity-95 transition-all cursor-pointer font-medium whitespace-nowrap"
          >
            {subscribed ? "Subscribed!" : "Subscribe"}
          </button>
        </form>
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
  );
}
