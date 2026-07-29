"use client";

import React from "react";
import { ShoppingCart, X, Minus, Plus, Trash2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import Link from "next/link";

export default function CartDrawer() {
  const {
    cart,
    setCart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
  } = useApp();

  if (!isCartOpen) return null;

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />
      
      {/* Sliding Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full animate-slide-in-right">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-red-500" />
              <h3 className="text-lg font-bold text-gray-900">Your Shopping Cart</h3>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-gray-100 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-xs mx-auto">
                <ShoppingCart className="text-gray-300 h-16 w-16 mb-4 animate-pulse" />
                <h4 className="text-base font-bold text-gray-700">Your cart is empty</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Looks like you haven&apos;t added any educational resources to your cart yet.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-6 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-full uppercase tracking-wider transition-colors shadow-md"
                >
                  Browse Catalog
                </button>
              </div>
            ) : (
              cart.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="flex gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100 relative group"
                >
                  <div className="w-20 h-20 bg-white rounded-lg p-1.5 flex items-center justify-center flex-shrink-0 border border-gray-100">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between py-0.5 text-left">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2">
                        {product.title}
                      </h4>
                      <span className="text-[11px] text-gray-500 font-medium">
                        Class: {product.class}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-gray-900">
                        ₹{product.price * quantity}
                      </span>

                      {/* Qty selectors */}
                      <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-2 py-1 shadow-sm">
                        <button
                          onClick={() => updateQuantity(product.id, -1)}
                          className="text-gray-500 hover:text-red-500 p-0.5 active:scale-95 transition-all"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-bold w-4 text-center">{quantity}</span>
                        <button
                          onClick={() => updateQuantity(product.id, 1)}
                          className="text-gray-500 hover:text-red-500 p-0.5 active:scale-95 transition-all"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromCart(product.id, product.title)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-all"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Checkout metrics */}
          {cart.length > 0 && (
            <div className="border-t border-gray-100 p-6 bg-gray-50/50 space-y-4">
              <div className="space-y-1.5 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal ({totalCartCount} items)</span>
                  <span className="font-bold text-gray-900">₹{cartSubtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-green-600 font-semibold">FREE</span>
                </div>
              </div>

              <hr className="border-t border-gray-200" />

              <div className="flex justify-between text-base font-bold text-gray-900">
                <span>Total Amount</span>
                <span>₹{cartSubtotal}</span>
              </div>

              <Link
                href="/checkout"
                onClick={() => {
                  setIsCartOpen(false);
                }}
                className="inline-flex items-center justify-center whitespace-nowrap w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-sm uppercase tracking-wider rounded-full shadow-lg active:scale-98 transition-all hover:shadow-orange-200"
              >
                Proceed To Checkout
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
