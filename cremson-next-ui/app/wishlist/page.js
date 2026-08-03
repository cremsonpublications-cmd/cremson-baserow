"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useApp } from "../../context/AppContext";
import { Trash2, Minus, Plus } from "lucide-react";

function ConfirmModal({ title, message, confirmLabel = "Clear", onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">{title}</h3>
              <p className="mt-1 text-sm text-gray-500">{message}</p>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 pb-6">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors cursor-pointer">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function WishlistSkeleton() {
  return (
    <div className="w-full grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-gray-200 rounded-[13px] lg:rounded-[20px] aspect-square mb-2.5 xl:mb-4" />
          <div className="h-5 bg-gray-200 rounded mb-2 w-4/5" />
          <div className="h-4 bg-gray-200 rounded mb-1 w-3/5" />
          <div className="h-4 bg-gray-200 rounded mb-3 w-2/5" />
          <div className="flex items-center gap-1 mb-3">
            {[1,2,3,4,5].map((s) => <div key={s} className="w-3.5 h-3.5 bg-gray-200 rounded-sm" />)}
            <div className="h-4 bg-gray-200 rounded w-8 ml-1" />
          </div>
          <div className="flex justify-between items-center">
            <div className="h-7 bg-gray-200 rounded w-16" />
            <div className="h-9 bg-gray-200 rounded-full w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

const renderStars = (rating) => {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  return (
    <div className="flex items-center gap-0.5 text-yellow-400">
      {[...Array(5)].map((_, i) => {
        if (i < fullStars) {
          return (
            <svg key={i} xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          );
        } else if (i === fullStars && hasHalf) {
          return (
            <svg key={i} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24">
              <defs>
                <linearGradient id={`starHalfGradWish-${rating}`}>
                  <stop offset="50%" stopColor="#facc15" />
                  <stop offset="50%" stopColor="#e5e7eb" />
                </linearGradient>
              </defs>
              <path fill={`url(#starHalfGradWish-${rating})`} d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          );
        } else {
          return (
            <svg key={i} xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" className="text-gray-200" viewBox="0 0 24 24">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          );
        }
      })}
    </div>
  );
};

export default function WishlistPage() {
  const { wishlist, toggleWishlist, addToCart, updateQuantity, removeFromCart, cart, clearWishlist, allProducts, authLoading, productsLoading } = useApp();
  const [showConfirm, setShowConfirm] = useState(false);

  const wishlistedBooks = useMemo(() => {
    return allProducts.filter((book) => wishlist.includes(book.id));
  }, [wishlist, allProducts]);

  // Show skeleton while auth is loading OR while products are loading but we have wishlist IDs
  const isLoading = authLoading || (productsLoading && wishlist.length > 0);

  return (
    <main className="pb-20">
      <div className="max-w-7xl mx-auto px-6 md:px-10 xl:px-12">
        <hr className="h-[1px] border-t-black/10 mb-5 sm:mb-6" />

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div className="mb-4 sm:mb-0 text-left">
            <h1 className="font-bold text-2xl md:text-[32px] mb-2">My Wishlist</h1>
            {isLoading ? (
              <div className="h-5 bg-gray-200 rounded w-40 animate-pulse" />
            ) : (
              <p className="text-sm md:text-base text-black/60">
                {wishlistedBooks.length} {wishlistedBooks.length === 1 ? "item" : "items"} in your wishlist
              </p>
            )}
          </div>
          {!isLoading && wishlistedBooks.length > 0 && (
            <button
              onClick={() => setShowConfirm(true)}
              className="justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border bg-background shadow-sm hover:text-accent-foreground h-9 px-4 py-2 flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Clear Wishlist
            </button>
          )}
        </div>

        {isLoading ? (
          <WishlistSkeleton />
        ) : wishlistedBooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-gray-200 rounded-3xl text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-gray-300 mb-4 animate-pulse"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
            <h3 className="text-xl font-semibold mb-2 text-gray-700">Your wishlist is empty</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm">
              Explore our textbook and lab manual collection to add your favorite books here.
            </p>
            <Link href="/shop">
              <button className="px-6 py-2.5 bg-black text-white rounded-full font-semibold text-sm transition-all hover:bg-black/80 cursor-pointer">
                Explore Books
              </button>
            </Link>
          </div>
        ) : (
          <>
            <div className="w-full grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-5">
              {wishlistedBooks.map((book) => (
                <Link
                  key={book.id}
                  className="flex flex-col items-start aspect-auto group min-h-[367px] sm:min-h-0 text-left"
                  href={`/shop/product/${book.id}`}
                >
                  <div className="bg-[#F0EEED] rounded-[13px] lg:rounded-[20px] w-full lg:max-w-[295px] aspect-square mb-2.5 xl:mb-4 overflow-hidden relative p-4 flex items-center justify-center">
                    <img
                      src={book.image || null}
                      className="w-full h-full object-contain hover:scale-105 transition-transform duration-300 ease-in-out"
                      alt={book.title}
                    />
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(book); }}
                      className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="red" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-heart text-red-500 fill-red-500 transition-all duration-200 ease-out group-hover:animate-bounce" style={{ filter: "drop-shadow(rgba(239, 68, 68, 0.3) 0px 0px 6px)" }}>
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                      </svg>
                    </button>
                  </div>

                  <div className="mb-1">
                    <strong className="text-black xl:text-xl line-clamp-2 leading-tight hover:text-orange-500 transition-colors duration-200 cursor-pointer">
                      {book.title}
                    </strong>
                  </div>
                  <div className="mb-2 text-left text-sm text-gray-600">
                    <div className="mb-1"><span className="font-medium">Author:</span> {book.author}</div>
                    <div><span className="font-medium">Class:</span> {book.class}</div>
                  </div>
                  <div className="flex items-end gap-2 mb-2">
                    <div className="flex items-end gap-1">
                      {renderStars(book.rating)}
                      <span className="text-sm font-medium text-gray-700 ml-1">{book.rating.toFixed(1)}</span>
                    </div>
                    <span className="text-xs text-gray-500 pb-[2px]">({book.reviewsCount} reviews)</span>
                  </div>
                  {(() => {
                    const cartItem = cart.find((i) => i.product.id === book.id);
                    return (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-2.5 sm:gap-0 mt-auto">
                        <div className="flex items-center space-x-[5px] xl:space-x-2.5">
                          <span className="font-bold text-black text-xl xl:text-2xl">₹{book.price}</span>
                          {book.originalPrice && (
                            <span className="font-bold text-black/40 line-through text-xl xl:text-2xl">₹{book.originalPrice}</span>
                          )}
                        </div>
                        <div className="w-full sm:w-auto">
                          {cartItem ? (
                             <div
                              className="flex items-center justify-between bg-gray-900 text-white rounded-full px-3 h-10 w-full sm:w-auto sm:min-w-[105px] shadow-md"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            >
                              <button
                                type="button"
                                onClick={() => cartItem.quantity === 1 ? removeFromCart(book.id) : updateQuantity(book.id, -1)}
                                className="hover:bg-white/20 rounded-full p-1 transition-all duration-200 cursor-pointer"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-sm font-semibold select-none">{cartItem.quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(book.id, 1)}
                                className="hover:bg-white/20 rounded-full p-1 transition-all duration-200 cursor-pointer"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(book); }}
                              className="w-full sm:w-auto h-10 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 rounded-full transition-all duration-150 text-sm whitespace-nowrap text-center"
                            >
                              Add to Cart
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </Link>
              ))}
            </div>

            <div className="mt-12 text-center">
              <hr className="border-t-black/10 mb-8" />
              <h3 className="text-xl font-semibold mb-4">Want to discover more books?</h3>
              <Link href="/shop">
                <button className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 shadow h-9 bg-black text-white hover:bg-gray-800 px-8 py-3 rounded-full cursor-pointer">
                  Continue Shopping
                </button>
              </Link>
            </div>
          </>
        )}
      </div>

      {showConfirm && (
        <ConfirmModal
          title="Clear Wishlist"
          message="Are you sure you want to remove all items from your wishlist?"
          confirmLabel="Clear All"
          onConfirm={() => { clearWishlist(); setShowConfirm(false); }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </main>
  );
}
