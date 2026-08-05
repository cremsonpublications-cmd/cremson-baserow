"use client";

import React from "react";
import { Heart, X } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function WishlistDrawer() {
  const {
    wishlist,
    isWishlistOpen,
    setIsWishlistOpen,
    addToCart,
    toggleWishlist,
    allProducts,
  } = useApp();

  if (!isWishlistOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={() => setIsWishlistOpen(false)}
      />
      
      {/* Sliding Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full animate-slide-in-right">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-red-500 fill-red-500" />
              <h3 className="text-lg font-bold text-gray-900">Saved Wishlist</h3>
            </div>
            <button
              onClick={() => setIsWishlistOpen(false)}
              className="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-gray-100 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {wishlist.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-xs mx-auto">
                <Heart className="text-gray-300 h-16 w-16 mb-4 animate-pulse" />
                <h4 className="text-base font-bold text-gray-700">Wishlist is empty</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Tap the heart icon on any textbook or lab manual to keep track of your favorite books here.
                </p>
                <button
                  onClick={() => setIsWishlistOpen(false)}
                  className="mt-6 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-full uppercase tracking-wider transition-colors shadow-md"
                >
                  Explore Books
                </button>
              </div>
            ) : (
              wishlist.map((id) => {
                const product = allProducts.find((item) => item.id === id);
                if (!product) return null;
                return (
                  <div
                    key={product.id}
                    className="flex gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100 relative group"
                  >
                    <div className="w-20 h-20 bg-white rounded-lg p-1.5 flex items-center justify-center flex-shrink-0 border border-gray-100">
                      <img
                        src={product.image || null}
                        alt={product.title}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-between py-0.5 text-left">
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2 pr-4">
                          {product.title}
                        </h4>
                        <span className="text-[11px] text-gray-500 font-medium block">
                          Class: {product.class} • ₹{product.price}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            addToCart(product);
                            toggleWishlist(product);
                          }}
                          className="px-3 py-1.5 bg-orange-500 hover:bg-red-600 text-white text-[10px] font-bold rounded-full transition-colors active:scale-95 shadow-sm"
                        >
                          Move to Cart
                        </button>
                        <button
                          onClick={() => toggleWishlist(product)}
                          className="px-3 py-1.5 border border-gray-200 hover:bg-gray-100 text-gray-600 text-[10px] font-bold rounded-full transition-all active:scale-95"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
