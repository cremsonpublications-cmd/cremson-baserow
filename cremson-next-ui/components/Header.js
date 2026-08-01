"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "../context/AppContext";
import CPLogo from "./CPLogo";
import Link from "next/link";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const {
    cart,
    wishlist,
    setIsCartOpen,
    setIsWishlistOpen,
    setIsMobileMenuOpen,
    searchQuery,
    setSearchQuery,
    user,
    authLogout
  } = useApp();

  if (pathname?.startsWith("/admin")) return null;

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Shop", href: "/shop" },
    { name: "Specimen", href: "/specimen" },
    { name: "News & Blogs", href: "/news" },
    { name: "About Us", href: "/about-us" },
    { name: "Contact Us", href: "/contact-us" }
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    router.push("/shop");
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (pathname !== "/shop") {
      router.push("/shop");
    }
  };

  return (
    <>
      <nav className="sticky top-0 bg-white z-[90] shadow-sm border-b border-gray-200" style={{ position: "sticky", top: "0px", zIndex: 100 }}>
        <div className="flex relative max-w-7xl mx-auto items-center justify-between py-5 md:py-6 px-4 xl:px-0">
          
          {/* Logo & Mobile Menu Hamburger */}
          <div className="flex items-center flex-shrink-0">
            <div className="block md:hidden mr-4">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                type="button"
                aria-haspopup="dialog"
                aria-expanded="false"
                className="focus:outline-none"
              >
                <img src="/icons/menu.svg" alt="Menu" className="cursor-pointer max-w-[22px] max-h-[22px]" />
              </button>
            </div>
            <Link className="mb-2 mr-4 lg:mr-8" href="/">
              <CPLogo className="max-w-[70px] md:max-w-[100px]" />
            </Link>
          </div>

          {/* Desktop Nav Links & Search */}
          <div className="hidden md:flex items-center flex-1 gap-4 lg:gap-8">
            <nav aria-label="Main" className="relative z-10 flex max-w-max flex-1 items-center justify-center flex-shrink-0">
              <div style={{ position: "relative" }}>
                <ul className="group flex flex-1 list-none items-center justify-center space-x-1">
                  {navLinks.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                      <li key={link.name}>
                        <Link
                          href={link.href}
                          onClick={() => {
                            if (link.href === "/shop") {
                              setSearchQuery("");
                            }
                          }}
                          className={`group inline-flex h-9 w-max items-center justify-center rounded-md bg-background py-2 text-sm focus:outline-none disabled:pointer-events-none disabled:opacity-50 font-[500] px-3 transition-colors duration-300 ${
                            isActive
                              ? "text-red-500 hover:text-red-500"
                              : "text-black hover:text-gray-600"
                          }`}
                        >
                          {link.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </nav>

            {/* Search Box */}
            <div className="flex-1 max-w-lg">
              <form onSubmit={handleSearchSubmit} className="relative w-full">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search h-4 w-4 text-gray-400">
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="m21 21-4.3-4.3"></path>
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search for products..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg bg-[#F0F0F0] placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-transparent text-left"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-red-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* User Operations */}
          <div className="flex items-center flex-shrink-0 gap-3">
            {/* Mobile Search Button (shows on small screens only) */}
            <button
              onClick={() => router.push("/shop")}
              className="block md:hidden p-1 focus:outline-none"
              aria-label="Search Catalog"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search text-red-500">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.3-4.3"></path>
              </svg>
            </button>

            {/* Wishlist Button */}
            <Link
              href="/wishlist"
              className="p-1 relative group focus:outline-none"
              aria-label="Wishlist"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-heart text-red-500 transition-all duration-300 group-hover:scale-110 group-hover:text-red-600">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
              </svg>
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Cart Button */}
            <Link
              href="/cart"
              className="relative mr-[14px] p-1 group focus:outline-none"
              aria-label="Shopping Cart"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shopping-cart text-red-500 transition-all duration-300 group-hover:scale-110 group-hover:text-red-600">
                <circle cx="8" cy="21" r="1"></circle>
                <circle cx="19" cy="21" r="1"></circle>
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
              </svg>
              {totalCartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white animate-pulse">
                  {totalCartCount}
                </span>
              )}
            </Link>

            {/* Profile Button with Dropdown */}
            <div className="relative" ref={profileRef}>
              {user ? (
                <>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="focus:outline-none cursor-pointer flex items-center"
                    aria-label="User Profile"
                  >
                    <span className="w-[30px] h-[30px] rounded-full bg-red-500 text-white text-sm font-bold flex items-center justify-center select-none">
                      {user.name?.charAt(0).toUpperCase()}
                    </span>
                  </button>
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-lg shadow-lg py-2 z-50 text-left">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <Link
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        href="/my-orders"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        My Orders
                      </Link>
                      <Link
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        href="/account/addresses"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        My Addresses
                      </Link>
                      <button
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          authLogout();
                          setIsProfileOpen(false);
                        }}
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <Link href="/auth/signin" className="p-1 focus:outline-none" aria-label="User Profile">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user text-red-500">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </Link>
              )}
            </div>
          </div>

        </div>
      </nav>
    </>
  );
}
