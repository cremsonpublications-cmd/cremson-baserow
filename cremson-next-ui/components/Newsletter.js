"use client";

import React, { useState } from "react";
import { Mail } from "lucide-react";
export default function Newsletter() {
  const [email, setEmail] = useState("");

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    setEmail("");
  };

  return (
    <div className="relative w-full max-w-7xl mx-auto px-4 z-20 translate-y-1/2">
      <div className="bg-black text-white rounded-3xl p-6 md:p-12 grid grid-cols-1 lg:grid-cols-2 items-center gap-6 shadow-2xl">
        <h3 className="font-extrabold text-2xl sm:text-4xl tracking-tight leading-tight uppercase max-w-lg text-left">
          Stay Up To Date About Our Latest Offers
        </h3>
        <div className="flex items-center w-full justify-end">
          <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <Mail className="h-5 w-5" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full pl-12 pr-4 py-3.5 bg-white text-gray-800 placeholder:text-gray-400 outline-none rounded-full text-sm focus:ring-2 focus:ring-red-500 text-left"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full text-sm uppercase tracking-wider transition-all shadow-lg hover:shadow-red-500/20 active:scale-95 whitespace-nowrap"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
