"use client";

export const runtime = "edge";

import React, { useState, useEffect, use } from "react";
import { useApp } from "../../../../context/AppContext";
import { useProduct, useProducts } from "../../../../lib/api/hooks";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Star rating helper component
function StarRating({ rating, size = 19 }) {
  const fullStars = Math.floor(rating);
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => {
        const isFilled = i < fullStars;
        return (
          <svg
            key={i}
            className="inline-block"
            stroke="currentColor"
            fill={isFilled ? "#FFBC0B" : "none"}
            strokeWidth={isFilled ? "0" : "1.5"}
            viewBox="0 0 24 24"
            width={size}
            height={size}
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
          </svg>
        );
      })}
    </div>
  );
}

export default function ProductDetailClient({ initialBook, bookId }) {
  const router = useRouter();
  const { cart, wishlist, addToCart, toggleWishlist, setIsCartOpen, updateQuantity, removeFromCart } = useApp();

  const id = bookId;

  const { data: book, isLoading: loading } = useProduct(id, initialBook);
  const { data: allCatalogProducts } = useProducts();

  const comboIncludedProducts = React.useMemo(() => {
    if (!book?.isCombo || !Array.isArray(book?.comboProductIds) || book.comboProductIds.length === 0) {
      return [];
    }
    const ids = book.comboProductIds.map(String);
    return (allCatalogProducts || []).filter((p) => ids.includes(String(p.id)));
  }, [book, allCatalogProducts]);

  const [zoomStyle, setZoomStyle] = useState({ transformOrigin: "center center" });
  const [selectedBoughtIds, setSelectedBoughtIds] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [reviewerName, setReviewerName] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [currentUrl, setCurrentUrl] = useState("");

  const handleBuyNow = () => {
    addToCart(book);
    router.push("/cart");
  };

  // Handle URL fetch for sharing links
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
  }, []);

  const boughtTogetherCandidates = React.useMemo(() => {
    if (!book || book.isCombo) return [];

    const otherNormalBooks = (allCatalogProducts || []).filter(
      (p) => String(p.id) !== String(book.id) && !p.isCombo
    );

    if (otherNormalBooks.length === 0) return [book];

    // Prefer books in the same class or category
    const matching = otherNormalBooks.filter(
      (p) => p.class === book.class || (p.mainCategory && p.mainCategory === book.mainCategory)
    );

    const candidatesPool = matching.length >= 2 ? matching : otherNormalBooks;

    // Pick 2 items deterministically based on book id so it stays stable
    const seed = Number(book.id) || 1;
    const sorted = [...candidatesPool].sort((a, b) => ((Number(a.id) * seed) % 17) - ((Number(b.id) * seed) % 17));
    const extraBooks = sorted.slice(0, 2);

    return [book, ...extraBooks];
  }, [book, allCatalogProducts]);

  // Pre-populate bought together selections once candidates are computed
  useEffect(() => {
    if (boughtTogetherCandidates.length > 0) {
      setSelectedBoughtIds(boughtTogetherCandidates.map((b) => b.id));
    }
  }, [boughtTogetherCandidates]);

  if (loading) return (
    <main className="animate-pulse">
      <div className="max-w-7xl mx-auto px-4 xl:px-0 mt-6">
        <hr className="h-[1px] border-t-black/10 mb-5 sm:mb-6" />

        {/* Breadcrumbs Skeleton */}
        <div className="flex items-center gap-2 mb-5 sm:mb-9">
          <div className="h-4 bg-gray-200 rounded w-12" />
          <span className="text-gray-300">/</span>
          <div className="h-4 bg-gray-200 rounded w-10" />
          <span className="text-gray-300">/</span>
          <div className="h-4 bg-gray-200 rounded w-24" />
        </div>

        {/* Product Details Section Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-10 mb-11">
          {/* Left side: Image and Thumbnails */}
          <div>
            <div className="flex flex-col space-y-3">
              <div className="bg-gray-150 rounded-[13px] sm:rounded-[20px] w-full h-[400px] sm:h-[450px] lg:h-[500px]" />
              <div className="flex space-x-3 w-full">
                <div className="bg-gray-150 rounded-[8px] w-[80px] h-[80px]" />
              </div>
            </div>
          </div>

          {/* Right side: Metadata & Action Panel */}
          <div className="text-left flex flex-col justify-start">
            {/* Title */}
            <div className="h-8 sm:h-10 bg-gray-200 rounded w-3/4 mb-3" />
            
            {/* Author */}
            <div className="h-5 bg-gray-200 rounded w-1/3 mb-4" />

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 w-4 bg-gray-200 rounded-full" />
                ))}
              </div>
              <div className="h-4 bg-gray-200 rounded w-16" />
            </div>

            {/* Stock Tag */}
            <div className="h-6 bg-gray-200 rounded-full w-20 mb-4" />

            {/* Price */}
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-5" />

            <hr className="h-[1px] border-t-black/10 mb-5" />

            {/* Action Buttons */}
            <div className="flex items-center gap-3 sm:gap-4 mb-6">
              <div className="flex-1 h-12 md:h-[52px] bg-gray-200 rounded-full" />
              <div className="w-[140px] sm:w-[160px] h-12 md:h-[52px] bg-gray-200 rounded-full" />
            </div>

            <hr className="h-[1px] border-t-black/10 mb-5" />

            {/* Trust factors */}
            <div className="space-y-4 pt-4">
              <div className="flex gap-4">
                <div className="h-5 bg-gray-200 rounded w-32" />
                <div className="h-5 bg-gray-200 rounded w-32" />
              </div>
              <div className="h-5 bg-gray-200 rounded w-48" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );

  if (!book) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
        <p className="text-gray-600 mb-6">The book you are looking for does not exist in our catalog.</p>
        <Link href="/shop" className="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition-all">
          Back to Shop
        </Link>
      </div>
    );
  }

  const selectedItems = boughtTogetherCandidates.filter((item) =>
    selectedBoughtIds.includes(item.id)
  );

  const totalBoughtTogetherPrice = selectedItems.reduce((sum, item) => sum + item.price, 0);

  // Wishlist check
  const isWishlisted = wishlist.includes(book.id);
  const cartItem = cart?.find((item) => item.product.id === book.id);
  const quantityInCart = cartItem ? cartItem.quantity : 0;

  // Dynamic reviews counts
  const totalReviews = book.reviewsCount + reviews.length;
  const averageRating = totalReviews > 0
    ? ((book.rating * book.reviewsCount + reviews.reduce((sum, r) => sum + r.rating, 0)) / totalReviews)
    : book.rating;

  // Zoom events
  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({ transformOrigin: `${x}% ${y}%` });
  };

  const handleMouseLeave = () => {
    setZoomStyle({ transformOrigin: "center center" });
  };

  // Toggle bought together items
  const toggleBoughtSelection = (itemId) => {
    if (itemId === book.id) return; // Active product is required
    if (selectedBoughtIds.includes(itemId)) {
      setSelectedBoughtIds(selectedBoughtIds.filter((itemVal) => itemVal !== itemId));
    } else {
      setSelectedBoughtIds([...selectedBoughtIds, itemId]);
    }
  };

  // Add all selected bought together to cart
  const handleAddAllToCart = () => {
    selectedItems.forEach((item) => {
      addToCart(item);
    });
    setIsCartOpen(true);
  };

  // Submit local review
  const handleAddReviewSubmit = (e) => {
    e.preventDefault();
    if (!reviewerName.trim() || !reviewText.trim()) return;
    const newReview = {
      id: Date.now(),
      name: reviewerName,
      text: reviewText,
      rating: reviewRating,
      date: new Date().toLocaleDateString()
    };
    setReviews([newReview, ...reviews]);
    setReviewerName("");
    setReviewText("");
    setReviewRating(5);
    setShowReviewForm(false);
  };

  // Clipboard copy link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
  };

  const recommendedBooks = [];

  return (
    <main>
      <div className="max-w-7xl mx-auto px-4 xl:px-0 mt-6">
        <hr className="h-[1px] border-t-black/10 mb-5 sm:mb-6" />

        {/* Breadcrumbs */}
        <nav aria-label="breadcrumb" className="mb-5 sm:mb-9 text-left">
          <ol className="flex flex-wrap items-center gap-1.5 break-words text-sm text-gray-500 sm:gap-2.5">
            <li className="inline-flex items-center gap-1.5">
              <Link className="transition-colors hover:text-black" href="/">Home</Link>
            </li>
            <li role="presentation" aria-hidden="true" className="text-gray-400">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.1584 3.13508C6.35985 2.94621 6.67627 2.95642 6.86514 3.15788L10.6151 7.15788C10.7954 7.3502 10.7954 7.64949 10.6151 7.84182L6.86514 11.8418C6.67627 12.0433 6.35985 12.0535 6.1584 11.8646C5.95694 11.6757 5.94673 11.3593 6.1356 11.1579L9.565 7.49985L6.1356 3.84182C5.94673 3.64036 5.95694 3.32394 6.1584 3.13508Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Link className="transition-colors hover:text-black" href="/shop">Shop</Link>
            </li>
            <li role="presentation" aria-hidden="true" className="text-gray-400">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.1584 3.13508C6.35985 2.94621 6.67627 2.95642 6.86514 3.15788L10.6151 7.15788C10.7954 7.3502 10.7954 7.64949 10.6151 7.84182L6.86514 11.8418C6.67627 12.0433 6.35985 12.0535 6.1584 11.8646C5.95694 11.6757 5.94673 11.3593 6.1356 11.1579L9.565 7.49985L6.1356 3.84182C5.94673 3.64036 5.95694 3.32394 6.1584 3.13508Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span role="link" aria-disabled="true" aria-current="page" className="font-normal text-black font-semibold">
                {book.title}
              </span>
            </li>
          </ol>
        </nav>

        {/* Product Details Section */}
        <section className="mb-11">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-10">
            {/* Left side: Image and Thumbnails */}
            <div>
              <div className="flex flex-col space-y-3">
                <div className="relative bg-[#F0EEED] rounded-[13px] sm:rounded-[20px] w-full mx-auto h-[400px] sm:h-[450px] lg:h-[500px] overflow-hidden flex items-center justify-center p-4">
                  <div className="relative w-full h-full bg-transparent overflow-hidden rounded-lg group">
                    <div
                      className="relative w-full h-full overflow-hidden cursor-crosshair flex items-center justify-center"
                      onMouseMove={handleMouseMove}
                      onMouseLeave={handleMouseLeave}
                    >
                      <img
                        src={book.image}
                        alt={`${book.title} - Main Image`}
                        className="max-w-full max-h-full object-contain transition-transform duration-300 hover:scale-[2]"
                        draggable="false"
                        style={zoomStyle}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => toggleWishlist(book)}
                    className="absolute top-3 right-3 p-2.5 bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110 z-30"
                    title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill={isWishlisted ? "red" : "none"}
                      stroke={isWishlisted ? "red" : "currentColor"}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`w-5 h-5 transition-colors duration-200 ${isWishlisted ? "text-red-500" : "text-gray-600 hover:text-red-500"}`}
                    >
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                    </svg>
                  </button>
                </div>

                {/* Product thumbnails */}
                <div className="flex space-x-3 w-full items-center justify-start overflow-x-auto py-2">
                  <button type="button" className="bg-[#F0EEED] rounded-[8px] w-[80px] h-[80px] flex-shrink-0 overflow-hidden p-1 border-2 transition-all border-gray-600">
                    <img src={book.image} className="w-full h-full object-contain hover:scale-105 transition-all duration-500" alt={book.title} />
                  </button>
                </div>
              </div>
            </div>

            {/* Right side: Book Metadata & Buy Panel */}
            <div className="text-left flex flex-col justify-start">
              <div className="flex items-center gap-2 mb-2">
                {book.isCombo && (
                  <span className="px-3 py-1 bg-purple-600 text-white font-bold text-xs rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                    📦 Combo Pack
                  </span>
                )}
              </div>
              <h1 className="font-integralCF text-2xl md:text-[36px] md:leading-[40px] mb-3 capitalize text-gray-900 font-bold">{book.title}</h1>

              <div className="mb-4">
                <p className="text-lg font-medium text-gray-700 mb-2">by {book.author}</p>
                <div className="flex flex-wrap gap-4 text-xs sm:text-sm text-gray-500">
                  {book.isbn && <span>ISBN: {book.isbn}</span>}
                  {book.edition && <span>Edition: {book.edition}</span>}
                  {book.class && <span>Class: {book.class}</span>}
                  {book.category && <span>Category: {book.category}</span>}
                </div>
              </div>

              {/* Combo Included Books Card */}
              {book.isCombo && comboIncludedProducts.length > 0 && (
                <div className="mb-5 p-4 bg-purple-50/70 border border-purple-200 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                      📚 Combo Pack Includes ({comboIncludedProducts.length} Books)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {comboIncludedProducts.map((item) => (
                      <Link
                        key={item.id}
                        href={`/shop/product/${item.id}`}
                        className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-purple-100 shadow-sm hover:border-purple-300 transition-all group"
                      >
                        {item.image ? (
                          <img src={item.image} alt={item.title} className="w-10 h-12 object-contain shrink-0 rounded" />
                        ) : (
                          <div className="w-10 h-12 bg-purple-100 rounded shrink-0 flex items-center justify-center text-purple-500 font-bold text-xs">
                            BOOK
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-gray-900 truncate group-hover:text-purple-600 transition-colors">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-gray-500 truncate">₹{item.price}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Star Rating Info */}
              <div className="flex items-center gap-2 mb-4">
                <StarRating rating={averageRating} />
                <span className="text-black text-xs font-semibold pb-0.5 ml-1">
                  {averageRating.toFixed(1)}
                  <span className="text-black/40 font-normal">/5</span>
                  <span className="text-gray-500 font-normal ml-1">({totalReviews} reviews)</span>
                </span>
              </div>

              {/* Stock Tag */}
              <div className="mb-4">
                <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-semibold bg-green-100 text-green-800">
                  In Stock
                </span>
              </div>

              {/* Bulk Pricing Tier Evaluation */}
              {(() => {
                const currentQty = quantityInCart > 0 ? quantityInCart : 1;
                let activeBulkTier = null;
                if (book.enable_bulk_pricing && book.bulk_pricing) {
                  let tiers = [];
                  if (Array.isArray(book.bulk_pricing)) {
                    tiers = book.bulk_pricing;
                  } else if (typeof book.bulk_pricing === "string") {
                    try { tiers = JSON.parse(book.bulk_pricing); } catch {}
                  }
                  if (Array.isArray(tiers)) {
                    const sorted = [...tiers].sort((a, b) => Number(b.min_qty) - Number(a.min_qty));
                    activeBulkTier = sorted.find((t) => currentQty >= Number(t.min_qty));
                  }
                }

                const effectiveUnitPrice = activeBulkTier ? Number(activeBulkTier.price) : book.price;
                const showBulkDiscountNotice = !!activeBulkTier;

                // Calculate display original price (strikethrough) and discount badge
                let displayOriginalPrice = null;
                let discountTag = null;

                if (!showBulkDiscountNotice) {
                  if (book.isCombo && comboIncludedProducts.length > 0) {
                    const comboSum = comboIncludedProducts.reduce((sum, item) => sum + (item.mrp || item.originalPrice || item.price || 0), 0);
                    if (comboSum > effectiveUnitPrice) {
                      displayOriginalPrice = comboSum;
                      const savePct = Math.round(((comboSum - effectiveUnitPrice) / comboSum) * 100);
                      discountTag = `-${savePct}% Combo Savings`;
                    }
                  }

                  if (!displayOriginalPrice) {
                    if (book.originalPrice && Number(book.originalPrice) > effectiveUnitPrice) {
                      displayOriginalPrice = Number(book.originalPrice);
                      const savePct = Math.round(((displayOriginalPrice - effectiveUnitPrice) / displayOriginalPrice) * 100);
                      discountTag = book.discount || `-${savePct}%`;
                    } else if (book.mrp && Number(book.mrp) > effectiveUnitPrice) {
                      displayOriginalPrice = Number(book.mrp);
                      const savePct = Math.round(((displayOriginalPrice - effectiveUnitPrice) / displayOriginalPrice) * 100);
                      discountTag = `-${savePct}%`;
                    }
                  }
                }

                return (
                  <div>
                    {/* Pricing */}
                    <div className="flex items-center space-x-2.5 sm:space-x-3 mb-2">
                      <span className="font-bold text-black text-2xl sm:text-[32px]">₹{effectiveUnitPrice}</span>
                      {showBulkDiscountNotice ? (
                        <>
                          <span className="text-black/30 line-through text-2xl sm:text-[32px]">₹{book.mrp || book.originalPrice || book.price}</span>
                          <span className="text-emerald-700 font-bold text-xs sm:text-sm px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full">
                            Bulk Price Applied (₹{effectiveUnitPrice}/book)
                          </span>
                        </>
                      ) : (
                        displayOriginalPrice && (
                          <>
                            <span className="text-black/30 line-through text-2xl sm:text-[32px]">₹{displayOriginalPrice}</span>
                            {discountTag && (
                              <span className="text-red-500 font-bold text-xs sm:text-sm px-3 py-1 bg-red-50 rounded-full">{discountTag}</span>
                            )}
                          </>
                        )
                      )}
                    </div>

                    {/* Bulk Pricing Available Info Banner */}
                    {book.enable_bulk_pricing && book.bulk_pricing && (
                      <div className="mb-4 p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-left">
                        <span className="text-xs font-bold text-amber-800 uppercase tracking-wide flex items-center gap-1 mb-1">
                          📦 Bulk Pricing Tiers
                        </span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {(() => {
                            let tiers = [];
                            if (Array.isArray(book.bulk_pricing)) tiers = book.bulk_pricing;
                            else if (typeof book.bulk_pricing === "string") {
                              try { tiers = JSON.parse(book.bulk_pricing); } catch {}
                            }
                            return (Array.isArray(tiers) ? tiers : []).sort((a, b) => Number(a.min_qty) - Number(b.min_qty)).map((tier, idx) => (
                              <span
                                key={idx}
                                className={`text-xs px-2.5 py-1 rounded-md font-semibold border ${
                                  currentQty >= Number(tier.min_qty)
                                    ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                                    : "bg-white text-gray-700 border-gray-200"
                                }`}
                              >
                                {tier.min_qty}+ books: ₹{tier.price}/each
                              </span>
                            ));
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              <hr className="h-[1px] border-t-black/10 mb-5" />

              {/* Dynamic Action Buttons */}
              <div className="flex items-center gap-3 sm:gap-4 mb-6">
                <button
                  onClick={handleBuyNow}
                  type="button"
                  className="flex-1 rounded-full h-12 md:h-[52px] text-sm sm:text-base font-bold transition-all bg-black text-white hover:bg-gray-800 shadow-md active:scale-95"
                >
                  Buy Now
                </button>
                {quantityInCart > 0 ? (
                  <div className="flex items-center justify-between h-12 md:h-[52px] bg-gray-900 text-white font-bold rounded-full px-3 w-[140px] sm:w-[160px] shadow-md transition-all duration-150">
                    <button
                      type="button"
                      onClick={() => {
                        if (quantityInCart === 1) {
                          removeFromCart(book.id);
                        } else {
                          updateQuantity(book.id, -1);
                        }
                      }}
                      className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-full hover:bg-white/20 text-white transition-colors"
                    >
                      {quantityInCart === 1 ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-minus"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      )}
                    </button>
                    <span className="text-sm sm:text-base font-bold select-none">{quantityInCart}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(book.id, 1)}
                      className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-full hover:bg-white/20 text-white transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => addToCart(book)}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 sm:px-8 rounded-full h-12 md:h-[52px] text-sm sm:text-base transition-all duration-200 whitespace-nowrap active:scale-95 shadow-md"
                  >
                    Add to Cart
                  </button>
                )}
              </div>

              {/* Product trust factors */}
              <div className="mt-4 space-y-4 pt-4 border-t border-gray-100">
                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => setShowDeliveryModal(true)}
                    className="flex items-center gap-3 text-gray-700 hover:text-black transition-colors text-left cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-truck w-6 h-6 text-black">
                      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"></path>
                      <path d="M15 18H9"></path>
                      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"></path>
                      <circle cx="17" cy="18" r="2"></circle>
                      <circle cx="7" cy="18" r="2"></circle>
                    </svg>
                    <span className="text-sm sm:text-base font-semibold">Delivery &amp; Return</span>
                  </button>
                  <a href="/contact-us" className="flex items-center gap-3 text-gray-700 hover:text-black transition-colors text-left">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-help w-6 h-6 text-black">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                      <path d="M12 17h.01"></path>
                    </svg>
                    <span className="text-sm sm:text-base font-semibold">Ask a Question</span>
                  </a>
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-smile w-5 h-5 text-black">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                    <line x1="9" x2="9.01" y1="9" y2="9"></line>
                    <line x1="15" x2="15.01" y1="9" y2="9"></line>
                  </svg>
                  <span className="text-sm font-medium">15 people are viewing this right now</span>
                </div>

                {/* Social Share Grid */}
                <div className="flex items-center gap-4 pt-2">
                  <span className="text-gray-700 font-bold text-sm uppercase">Share:</span>
                  <div className="flex items-center gap-2.5">
                    <a
                      href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(book.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-black hover:text-black"
                      title="Share on Twitter"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-twitter w-4.5 h-4.5">
                        <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                      </svg>
                    </a>
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-black hover:text-black"
                      title="Share on Facebook"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-facebook w-4.5 h-4.5">
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                      </svg>
                    </a>
                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(book.title + " " + currentUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-black hover:text-black"
                      title="Share on WhatsApp"
                    >
                      <svg className="w-4.5 h-4.5 text-black" fill="currentColor" viewBox="0 0 24 24" width="20" height="20">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"></path>
                      </svg>
                    </a>
                    <button
                      onClick={handleCopyLink}
                      className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-black hover:text-black"
                      title="Copy Link"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy w-4.5 h-4.5">
                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bought Together Stateful Section */}
        {!book.isCombo && boughtTogetherCandidates.length > 1 && (
          <section className="mb-11 text-left">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8 mb-8">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 lg:mb-8">Bought Together</h2>

              {/* Visual Grid representing connection */}
              <div className="flex items-center justify-start sm:justify-center gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8 p-3 sm:p-4 lg:p-6 bg-gray-50 rounded-xl overflow-x-auto">
                {boughtTogetherCandidates.map((candidate, idx) => {
                  const isSelected = selectedBoughtIds.includes(candidate.id);
                  const isCurrent = candidate.id === book.id;

                  return (
                    <React.Fragment key={candidate.id}>
                      {idx > 0 && (
                        <div className="flex-shrink-0 bg-white rounded-full p-2 shadow-sm border border-gray-200">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400">
                            <path d="M5 12h14"></path>
                            <path d="M12 5v14"></path>
                          </svg>
                        </div>
                      )}

                      <div className="flex flex-col items-center flex-shrink-0">
                        <div
                          onClick={() => toggleBoughtSelection(candidate.id)}
                          className={`relative group ${isCurrent ? "cursor-default" : "cursor-pointer"}`}
                        >
                          <div className={`w-24 h-32 sm:w-28 sm:h-36 lg:w-32 lg:h-40 bg-white rounded-lg shadow-md overflow-hidden border-2 transition-all duration-200 p-1 flex items-center justify-center ${
                            isSelected
                              ? isCurrent
                                ? "border-green-500 ring-2 ring-green-100"
                                : "border-blue-500 ring-2 sm:ring-4 ring-blue-100 transform scale-105"
                              : "border-gray-200 opacity-60 hover:opacity-100 hover:border-blue-300 hover:shadow-lg"
                          }`}>
                            <img src={candidate.image} alt={candidate.title} className="max-w-full max-h-full object-contain" />
                          </div>

                          {/* Selector Badges */}
                          {isSelected ? (
                            <div className={`absolute -top-2 -right-2 rounded-full p-1 text-white ${isCurrent ? "bg-green-500" : "bg-blue-500"}`}>
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                              </svg>
                            </div>
                          ) : (
                            <div className="absolute -top-2 -right-2 rounded-full p-1 bg-gray-300 text-gray-600 group-hover:bg-blue-400 group-hover:text-white">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                <path d="M5 12h14"></path>
                                <path d="M12 5v14"></path>
                              </svg>
                            </div>
                          )}
                        </div>

                        <div className="mt-2 sm:mt-3 text-center max-w-[100px] sm:max-w-[120px] lg:max-w-[140px]">
                          <p className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">{candidate.title}</p>
                          <p className={`text-sm sm:text-base font-bold mt-1 ${isCurrent ? "text-green-600" : "text-blue-600"}`}>₹{candidate.price}</p>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Selected items list */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected Items:</h3>
                <div className="space-y-3">
                  {selectedItems.map((item) => {
                    const isCurrent = item.id === book.id;
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between bg-white rounded-lg p-4 shadow-sm border-2 ${
                          isCurrent ? "border-green-300 animate-pulse" : "border-gray-100"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-2.5 h-2.5 rounded-full ${isCurrent ? "bg-green-500" : "bg-blue-500"}`}></div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 text-sm sm:text-base">{item.title}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                              <span>by {item.author}</span>
                              {item.class && <span className="text-blue-600 font-semibold">Class {item.class}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <p className="text-lg font-bold text-gray-900">₹{item.price}</p>
                          {!isCurrent && (
                            <button
                              onClick={() => toggleBoughtSelection(item.id)}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-all duration-200 mt-1"
                              title="Remove from selection"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5">
                                <path d="M3 6h18"></path>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                <line x1="10" x2="10" y1="11" y2="17"></line>
                                <line x1="14" x2="14" y1="11" y2="17"></line>
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total aggregation bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t-2 border-gray-100">
                <div className="text-center sm:text-left">
                  <p className="text-2xl font-bold text-gray-900">
                    Total Price: <span className="text-blue-600">₹{totalBoughtTogetherPrice}</span>
                  </p>
                </div>
                <button
                  onClick={handleAddAllToCart}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-[1.03] shadow-lg hover:shadow-xl"
                >
                  ADD ALL TO CART
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Dynamic Reviews Section */}
        <section className="mb-11 text-left">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Reviews &amp; Ratings</h2>
              {!showReviewForm && (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base"
                >
                  Write a Review
                </button>
              )}
            </div>

            {/* Local Review Form Overlay/Card */}
            {showReviewForm && (
              <form onSubmit={handleAddReviewSubmit} className="bg-gray-50 border border-gray-100 rounded-xl p-4 sm:p-6 mb-6">
                <h3 className="font-bold text-lg text-gray-900 mb-4">Write Your Review</h3>
                <div className="grid grid-cols-1 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Your Name</label>
                    <input
                      type="text"
                      className="w-full p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-black"
                      placeholder="Enter your name"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Rating</label>
                    <div className="flex items-center gap-1.5 mt-1">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setReviewRating(val)}
                          className="text-gray-300 hover:text-yellow-400 focus:outline-none"
                        >
                          <svg
                            className={`w-7 h-7 ${val <= reviewRating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                            stroke="currentColor"
                            fill={val <= reviewRating ? "currentColor" : "none"}
                            strokeWidth="1.5"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Review Message</label>
                    <textarea
                      rows="4"
                      className="w-full p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-black"
                      placeholder="Write your review here..."
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      required
                    ></textarea>
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-semibold"
                  >
                    Submit Review
                  </button>
                </div>
              </form>
            )}

            {/* Reviews list */}
            {reviews.length === 0 ? (
              <div className="text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star h-12 w-12 text-gray-300 mx-auto mb-4">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews yet</h3>
                <p className="text-gray-500 mb-4">Be the first to review this book!</p>
                {!showReviewForm && (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold shadow"
                  >
                    Write the first review
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((rev) => (
                  <div key={rev.id} className="border-b border-gray-100 pb-5">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 text-base">{rev.name}</h4>
                      <span className="text-xs text-gray-400">{rev.date}</span>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      <StarRating rating={rev.rating} size={15} />
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">{rev.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* You Might Also Like — hidden when no recommended books available */}
        {recommendedBooks.length > 0 && (
          <div className="mb-[50px] sm:mb-20">
            <section className="max-w-7xl mx-auto text-center">
              <h2 className="font-integralCF text-[32px] md:text-5xl mb-8 md:mb-14 capitalize font-bold text-gray-900">
                You might also like
              </h2>

              <div className="px-4 xl:px-0 mb-6 md:mb-9">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
                  {recommendedBooks.map((recBook) => {
                    const isWish = wishlist.includes(recBook.id);
                    const recCartItem = cart?.find((item) => item.product.id === recBook.id);
                    const recQuantityInCart = recCartItem ? recCartItem.quantity : 0;
                    return (
                      <div key={recBook.id} className="w-full flex flex-col justify-between text-left">
                        <div className="flex flex-col items-start aspect-auto group min-h-[367px] sm:min-h-0">
                          {/* Image Container */}
                          <div className="bg-[#F0EEED] rounded-[13px] lg:rounded-[20px] w-full aspect-square mb-2.5 xl:mb-4 overflow-hidden relative p-4 flex items-center justify-center">
                            <Link href={`/shop/product/${recBook.id}`} className="w-full h-full flex items-center justify-center">
                              <img src={recBook.image} className="max-w-full max-h-full object-contain hover:scale-105 transition-transform duration-300 ease-in-out" alt={recBook.title} />
                            </Link>

                            {/* Wishlist Heart Overlay */}
                            <button
                              onClick={() => toggleWishlist(recBook)}
                              className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110 z-20"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill={isWish ? "red" : "none"}
                                stroke={isWish ? "red" : "currentColor"}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={`transition-all duration-200 ${isWish ? "text-red-500 scale-110" : "text-gray-600 hover:text-red-500"}`}
                              >
                                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                              </svg>
                            </button>

                            {recQuantityInCart > 0 && (
                              <span className="absolute top-3 left-3 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shopping-cart"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                                {recQuantityInCart} in Cart
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          <div className="mb-1 w-full">
                            <Link href={`/shop/product/${recBook.id}`}>
                              <strong className="text-black xl:text-lg font-bold line-clamp-2 leading-tight hover:text-orange-500 transition-colors duration-200 cursor-pointer">
                                {recBook.title}
                              </strong>
                            </Link>
                          </div>

                          {/* Info details */}
                          <div className="mb-2 text-left text-xs sm:text-sm text-gray-500">
                            <div className="mb-1"><span className="font-semibold text-gray-700">Author:</span> {recBook.author}</div>
                            <div><span className="font-semibold text-gray-700">Class:</span> {recBook.class}</div>
                          </div>

                          {/* Star review bar */}
                          <div className="flex items-center gap-2 mb-2">
                            <StarRating rating={recBook.rating} size={14} />
                            <span className="text-sm font-semibold text-gray-700">{recBook.rating.toFixed(1)}</span>
                            <span className="text-xs text-gray-400 font-normal">({recBook.reviewsCount})</span>
                          </div>

                          {/* Price & Add to Cart footer row */}
                          <div className="flex items-center justify-between w-full mt-auto pt-2">
                            <div className="flex items-center space-x-[5px] xl:space-x-2.5">
                              <span className="font-bold text-black text-lg xl:text-xl">₹{recBook.price}</span>
                              {recBook.originalPrice && (
                                <span className="text-black/30 line-through text-sm sm:text-base font-normal">₹{recBook.originalPrice}</span>
                              )}
                            </div>
                            <div className="flex justify-end">
                              {recQuantityInCart > 0 ? (
                                <div className="flex items-center justify-between h-9 sm:h-10 bg-gray-900 text-white font-semibold rounded-full px-2 w-[110px] sm:w-[120px] transition-all duration-150 shadow-md">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (recQuantityInCart === 1) {
                                        removeFromCart(recBook.id);
                                      } else {
                                        updateQuantity(recBook.id, -1);
                                      }
                                    }}
                                    className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-white/20 text-white transition-colors"
                                  >
                                    {recQuantityInCart === 1 ? (
                                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                    ) : (
                                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-minus"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                    )}
                                  </button>
                                  <span className="text-xs sm:text-sm font-bold min-w-4 text-center select-none">{recQuantityInCart}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      updateQuantity(recBook.id, 1);
                                    }}
                                    className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-white/20 text-white transition-colors"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => addToCart(recBook)}
                                  className="h-9 sm:h-10 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 rounded-full transition-all duration-150 text-xs sm:text-sm whitespace-nowrap active:scale-95 shadow-sm"
                                >
                                  Add to Cart
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Delivery & Return Information Modal */}
      {showDeliveryModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto shadow-xl text-left">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold text-gray-900">Delivery &amp; Return Information</h2>
              <button
                onClick={() => setShowDeliveryModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer p-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x w-6 h-6">
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-truck w-5 h-5 mr-2 text-gray-600">
                    <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"></path>
                    <path d="M15 18H9"></path>
                    <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"></path>
                    <circle cx="17" cy="18" r="2"></circle>
                    <circle cx="7" cy="18" r="2"></circle>
                  </svg>
                  Delivery Information
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                    We aim to deliver your order safely and on time. All orders are usually delivered within 4–5 working days from the date of dispatch.
                    {"\n"}Delivery timelines may vary slightly depending on your location, courier service availability, and order size.
                    {"\n\n"}Delivery Charges:
                    {"\n"}Applicable as per your delivery address and order value. The exact delivery charge (if any) will be displayed at checkout before you make the payment.
                    {"\n\n"}Once your order has been shipped, you will receive an email or WhatsApp notification with your tracking details so you can monitor your delivery status in real time.
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-rotate-ccw w-5 h-5 mr-2 text-gray-600">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                    <path d="M3 3v5h5"></path>
                  </svg>
                  Returns &amp; Exchanges
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                    We take utmost care in packaging and dispatching your order. However, if you happen to receive a damaged, defective, or incorrect product, we will be happy to offer an exchange.
                    {"\n\n"}Please note the following terms:
                    {"\n"}• Exchange is applicable only in cases where the product received is damaged, misprinted, or incorrect.
                    {"\n"}• We do not offer returns or refunds for any other reasons (such as change of mind or wrong selection).
                    {"\n"}• Customers must notify us within 14 days of delivery to be eligible for an exchange.
                    {"\n"}• We do not arrange return pickups. You will need to ship the product back to our address (as provided in the exchange confirmation email).
                    {"\n"}• Once we receive and verify the returned product, a replacement copy will be dispatched to you at no additional cost.
                    {"\n"}• The exchanged product will be the same title and edition as originally ordered (unless otherwise agreed upon in writing).
                    {"\n\n"}—
                    {"\n\n"}How to Raise an Exchange Request
                    {"\n\n"}To initiate an exchange or report a damaged/incorrect product:
                    {"\n"}1. Email us at info@cremsonpublications.com within 14 days of receiving your order.
                    {"\n"}2. Mention your Order ID, the issue faced, and attach clear photographs of the product and packaging.
                    {"\n"}3. Our team will review your request and respond with the return shipping details and next steps.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
