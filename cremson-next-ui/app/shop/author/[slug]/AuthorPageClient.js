"use client";

import Link from "next/link";
import { useApp } from "../../../../context/AppContext";

function StarIcon({ filled }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill={filled ? "#f59e0b" : "none"}
      stroke="#f59e0b"
      strokeWidth="2"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function renderStars(rating) {
  return Array.from({ length: 5 }, (_, i) => (
    <StarIcon key={i} filled={i < Math.round(rating)} />
  ));
}

export default function AuthorPageClient({ authorName, initialBooks, slug }) {
  const { cart, wishlist, addToCart, removeFromCart, toggleWishlist } = useApp();

  if (!authorName) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <h1 className="text-2xl font-bold text-gray-800">Author not found</h1>
        <p className="text-gray-500">We couldn't find any books for this author.</p>
        <Link
          href="/shop"
          className="mt-2 px-6 py-2.5 bg-black text-white rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors"
        >
          Browse All Books
        </Link>
      </div>
    );
  }

  const books = initialBooks || [];
  const shopFilterUrl = `/shop?authors=${encodeURIComponent(authorName)}`;

  return (
    <div className="min-h-screen bg-white">
      {/* Author Header */}
      <div className="bg-gray-50 border-b border-gray-100 px-4 sm:px-8 lg:px-16 py-10">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm text-gray-500 mb-1">
            <Link href="/shop" className="hover:text-black transition-colors">Shop</Link>
            {" / "}
            <span className="text-gray-700">Author</span>
            {" / "}
            <span className="text-black font-medium">{authorName}</span>
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-black mt-3">
            {authorName}
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            {books.length} {books.length === 1 ? "book" : "books"} available
          </p>
          <Link
            href={shopFilterUrl}
            className="inline-flex items-center gap-2 mt-4 px-5 py-2 bg-black text-white rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors"
          >
            Filter by this author in Shop
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
      </div>

      {/* Books Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 py-10">
        {books.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">No books found for this author.</p>
            <Link href="/shop" className="mt-4 inline-block text-black underline text-sm">
              Browse all books
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {books.map((book) => {
              const isWishlisted = wishlist.includes(book.id);
              const cartItem = cart?.find((item) => item.product.id === book.id);
              const quantityInCart = cartItem ? cartItem.quantity : 0;

              return (
                <Link
                  key={book.id}
                  href={`/shop/product/${book.id}`}
                  className="flex flex-col items-start group text-left"
                >
                  {/* Image */}
                  <div className="bg-transparent rounded-[13px] lg:rounded-[20px] w-full aspect-[3/4] mb-2.5 overflow-hidden relative py-1.5 px-3">
                    {book.image ? (
                      <img
                        src={book.image}
                        className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                        alt={book.title}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m3 15 5-5 4 4 3-3 6 6"/><circle cx="8.5" cy="8.5" r="1.5"/></svg>
                      </div>
                    )}
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 items-start">
                      {book.discount && (
                        <span className="bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded shadow-md">
                          {book.discount.replace(/^-/, "")}
                        </span>
                      )}
                      {quantityInCart > 0 && (
                        <span className="bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded shadow-md">
                          {quantityInCart} in Cart
                        </span>
                      )}
                    </div>
                    {/* Wishlist */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleWishlist(book);
                      }}
                      className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill={isWishlisted ? "red" : "none"}
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`transition-all duration-200 ${isWishlisted ? "text-red-500" : "text-gray-600 hover:text-red-500"}`}
                      >
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                      </svg>
                    </button>
                  </div>

                  {/* Title */}
                  <div className="mb-1">
                    <strong className="text-black text-sm xl:text-base line-clamp-2 leading-tight hover:text-orange-500 transition-colors duration-200">
                      {book.title}
                    </strong>
                  </div>

                  <div className="mb-2 text-left text-xs text-gray-500">
                    Class {book.class}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-2">
                    {renderStars(book.rating)}
                    <span className="text-xs text-gray-500 ml-1">({book.reviewsCount})</span>
                  </div>

                  {/* Price & Cart */}
                  <div className="flex flex-col w-full gap-2 mt-auto">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-black text-lg">₹{book.price}</span>
                      {book.originalPrice && (
                        <span className="font-medium text-black/40 line-through text-sm">
                          ₹{book.originalPrice}
                        </span>
                      )}
                    </div>
                    <div className="w-full" onClick={(e) => e.preventDefault()}>
                      {quantityInCart > 0 ? (
                        <div className="flex items-center justify-between h-9 bg-gray-900 text-white font-semibold rounded-full px-2 w-full">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (quantityInCart === 1) removeFromCart(book.id);
                              else addToCart(book, quantityInCart - 1);
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors text-lg leading-none"
                          >
                            −
                          </button>
                          <span className="text-sm">{quantityInCart}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              addToCart(book, quantityInCart + 1);
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors text-lg leading-none"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            addToCart(book, 1);
                          }}
                          className="w-full h-9 bg-black text-white text-xs font-semibold rounded-full hover:bg-gray-800 transition-colors"
                        >
                          Add to Cart
                        </button>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
