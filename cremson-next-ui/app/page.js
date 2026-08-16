"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Star, Heart, MapPin, Phone, Smartphone, Mail, Clock } from "lucide-react";
import { useApp } from "../context/AppContext";
import { BANNER_SLIDES } from "../data/books";
import { useProducts } from "../lib/api/hooks";
import api from "../lib/api/axios";
import Link from "next/link";

export default function Home() {
  const { addToCart, toggleWishlist, wishlist, setSearchQuery, cart, updateQuantity, removeFromCart } = useApp();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState(BANNER_SLIDES);
  const { data: books = [], isLoading: booksLoading } = useProducts();

  // Fetch banners from API (fallback to static data)
  useEffect(() => {
    api.get("/api/banners/?active_only=true")
      .then((res) => {
        const data = res.data;
        if (Array.isArray(data) && data.length > 0) {
          setSlides(data.map((b) => ({ id: b.id, image: b.image_url, title: b.title })));
        }
      })
      .catch(() => {}); // silently fall back to static slides
  }, []);

  const [blogs, setBlogs] = useState([]);
  const [blogsLoading, setBlogsLoading] = useState(true);

  // Fetch published blogs for the homepage
  useEffect(() => {
    api.get("/api/blogs/?status=Published")
      .then((res) => {
        if (Array.isArray(res.data)) {
          // Limit to latest 4 blogs matching the 4-column layout
          setBlogs(res.data.slice(0, 4));
        }
      })
      .catch((err) => {
        console.error("Failed to load blogs on homepage:", err);
      })
      .finally(() => {
        setBlogsLoading(false);
      });
  }, []);

  // Auto transition for banner carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  return (
    <div className="w-full">
      {/* CAROUSEL BANNER SECTION */}
      <section className="relative overflow-hidden aspect-[2.96/1] sm:aspect-auto h-auto sm:h-[450px] md:h-[520px] bg-[#EAEAEA] select-none" id="home">
        {/* Slides list */}
        <div
          className="h-full flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {slides.map((slide) => (
            <div key={slide.id} className="w-full h-full flex-shrink-0 relative">
              <div className="absolute inset-0">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-contain transition-opacity duration-300 ease-in-out"
                  style={{ willChange: "opacity" }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <button
          onClick={handlePrevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/80 hover:text-black text-white transition-all backdrop-blur-sm shadow-md"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
        <button
          onClick={handleNextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/80 hover:text-black text-white transition-all backdrop-blur-sm shadow-md"
          aria-label="Next Slide"
        >
          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        {/* Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full transition-all ${
                index === currentSlide ? "bg-red-600 sm:w-8" : "bg-white/50 hover:bg-white"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* BEST SELLING BOOKS SECTION */}
      <main className="my-6 sm:my-[72px] p-1">
        <section className="max-w-7xl mx-auto text-center">
          <h2 className="font-integralCF text-2xl sm:text-[32px] md:text-5xl mb-6 sm:mb-10 md:mb-14 capitalize" style={{ opacity: 1, transform: "none" }}>
            Best Selling Books
          </h2>
          <div style={{ opacity: 1, transform: "none" }}>
            <div className="px-4 xl:px-0 mb-6 md:mb-9">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
                {booksLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="w-full animate-pulse">
                        <div className="bg-[#F0EEED] rounded-[13px] lg:rounded-[20px] aspect-square mb-2.5 xl:mb-4 bg-gray-200" />
                        <div className="h-4 bg-gray-200 rounded mb-2 w-3/4" />
                        <div className="h-3 bg-gray-200 rounded mb-1 w-1/2" />
                        <div className="h-3 bg-gray-200 rounded mb-3 w-1/3" />
                        <div className="h-6 bg-gray-200 rounded w-1/2" />
                      </div>
                    ))
                  : books.slice(0, 8).map((book) => {
                  const isWishlisted = wishlist.includes(book.id);
                  const cartItem = cart?.find((item) => item.product.id === book.id);
                  const quantityInCart = cartItem ? cartItem.quantity : 0;
                  return (
                    <div key={book.id} className="w-full">
                      <Link className="flex flex-col items-start aspect-auto group min-h-[367px] sm:min-h-0 text-left" href={`/shop/product/${book.id}`}>
                        <div className="bg-[#F0EEED] rounded-[13px] lg:rounded-[20px] w-full lg:max-w-[295px] aspect-[3/4] mb-2.5 xl:mb-4 overflow-hidden relative py-1.5 px-3">
                          <img
                            src={book.image || null}
                            className="w-full h-full object-contain hover:scale-105 transition-transform duration-300 ease-in-out"
                            alt={book.title}
                          />
                          <div className="absolute top-3 left-3 flex flex-col gap-2">
                            {book.discount && (
                              <span className="bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded shadow-md">
                                {book.discount.replace(/^-/, "")}
                              </span>
                            )}
                            {quantityInCart > 0 && (
                              <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded shadow-md flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shopping-cart"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                                {quantityInCart} in Cart
                              </span>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleWishlist(book);
                            }}
                            className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill={isWishlisted ? "currentColor" : "none"}
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className={`lucide lucide-heart transition-all duration-200 ease-out group-hover:animate-bounce ${
                                isWishlisted ? "text-red-500 fill-red-500" : "text-gray-600 hover:text-red-500"
                              }`}
                            >
                              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                            </svg>
                          </button>
                        </div>

                        <div className="mb-1">
                          <strong className="text-sm sm:text-base xl:text-xl line-clamp-2 leading-tight hover:text-orange-500 transition-colors duration-200 cursor-pointer">
                            {book.title}
                          </strong>
                        </div>

                        <div className="mb-2 text-left text-sm text-gray-600">
                          <div className="mb-1">
                            <span className="font-medium">Author:</span> {book.author}
                          </div>
                          <div>
                            <span className="font-medium">Class:</span> {book.class}
                          </div>
                        </div>

                        {/* Rating Stars */}
                        <div className="flex items-end gap-2 mb-2">
                          <div className="flex items-end gap-1">
                            <div className="flex text-yellow-400">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <svg
                                  key={i}
                                  className="inline-block"
                                  stroke="currentColor"
                                  fill={i < Math.floor(book.rating) ? "currentColor" : "none"}
                                  strokeWidth="0"
                                  viewBox="0 0 24 24"
                                  width="14"
                                  height="14"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
                                </svg>
                              ))}
                            </div>
                            <span className="text-sm font-medium text-gray-700">{book.rating.toFixed(1)}</span>
                          </div>
                          <span className="text-xs text-gray-500 pb-[2px]">({book.reviewsCount} reviews)</span>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-2.5 sm:gap-0 mt-auto">
                          <div className="flex items-center space-x-[5px] xl:space-x-2.5">
                            <span className="font-bold text-black text-base sm:text-xl xl:text-2xl">₹{book.price}</span>
                            {book.originalPrice && (
                              <span className="font-bold text-black/40 line-through text-base sm:text-xl xl:text-2xl">
                                ₹{book.originalPrice}
                              </span>
                            )}
                          </div>
                          <div className="flex justify-start sm:justify-end w-full sm:w-auto">
                            {quantityInCart > 0 ? (
                              <div className="flex items-center justify-between h-10 bg-gray-900 text-white font-semibold rounded-full px-2 w-full sm:w-[120px] transition-all duration-150 shadow-md">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (quantityInCart === 1) {
                                      removeFromCart(book.id);
                                    } else {
                                      updateQuantity(book.id, -1);
                                    }
                                  }}
                                  className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-white/20 text-white transition-colors"
                                >
                                  {quantityInCart === 1 ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                  ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-minus"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                  )}
                                </button>
                                <span className="text-sm font-bold min-w-4 text-center select-none">{quantityInCart}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    updateQuantity(book.id, 1);
                                  }}
                                  className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-white/20 text-white transition-colors"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  addToCart(book);
                                }}
                                className="w-full sm:w-auto h-10 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 rounded-full transition-all duration-150 text-sm whitespace-nowrap text-center"
                              >
                                Add to Cart
                              </button>
                            )}
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="w-full px-4 sm:px-0 text-center">
              <Link
                className="w-full inline-block sm:w-[218px] px-[54px] py-4 border rounded-full hover:bg-black hover:text-white text-black transition-all font-medium text-sm sm:text-base border-black/10"
                href="/shop"
                onClick={() => setSearchQuery("")}
              >
                View All
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* OUR BLOGS / NEWS SECTION */}
      {!blogsLoading && blogs.length > 0 && (
        <section className="max-w-7xl mx-auto my-12 sm:my-20 px-4 xl:px-0 relative text-center pt-14 sm:pt-20 md:pt-24">
          {/* Big background "BLOGS" heading */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 select-none pointer-events-none opacity-[0.08] font-integralCF font-extrabold text-[80px] sm:text-[120px] md:text-[160px] leading-none text-gray-900 tracking-wider z-0 uppercase">
            BLOGS
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 md:gap-8 mb-10 md:mb-12 relative z-10">
            {blogs.map((post) => {
              const catLower = (post.category || "").toLowerCase();
              let badgeColor = "bg-gray-800 text-white";
              if (catLower.includes("event")) {
                // Purple event badge
                badgeColor = "bg-[#5B21B6] text-white";
              } else if (catLower.includes("news")) {
                // Teal news badge
                badgeColor = "bg-[#115E59] text-white";
              }

              return (
                <Link
                  key={post.id}
                  href={`/blogs/${post.slug}`}
                  className="w-full rounded-2xl overflow-hidden border border-gray-200/60 shadow-sm hover:shadow-lg hover:shadow-gray-100 hover:translate-y-[-4px] transition-all duration-300 cursor-pointer flex flex-col bg-white text-left"
                >
                  <div className="relative aspect-[1.6/1] w-full overflow-hidden bg-gray-50">
                    <img
                      alt={post.title}
                      className="object-cover w-full h-full hover:scale-105 transition-transform duration-500"
                      src={post.image || null}
                      loading="lazy"
                    />
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <h3 className="mb-4 font-semibold text-gray-950 text-base leading-snug line-clamp-2 hover:text-orange-500 transition-colors">
                      {post.title}
                    </h3>
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 text-xs text-gray-500">
                      <span className="font-medium">{post.date}</span>
                      {post.category && post.category !== "None" && (
                        <span className={`px-2.5 py-1 rounded-[4px] text-[10px] font-bold uppercase tracking-wider ${badgeColor}`}>
                          {post.category}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

            <Link
              className="w-full inline-block sm:w-[218px] px-[54px] py-4 border rounded-full hover:bg-black hover:text-white text-black transition-all font-medium text-sm sm:text-base border-black/10"
              href="/blogs"
            >
              View All Blogs
            </Link>
        </section>
      )}

    </div>
  );
}
