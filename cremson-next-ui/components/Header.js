"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useApp } from "../context/AppContext";
import CPLogo from "./CPLogo";
import Link from "next/link";
import { Menu, Search, X } from "lucide-react";
import { getApiBaseUrl } from "../lib/api/axios";
import { navigateToUrl } from "../lib/utils/navigation";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const headerSearchDebounce = useRef(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hierarchical study materials states
  const [studyMaterials, setStudyMaterials] = useState([]);
  const [activeL1, setActiveL1] = useState(null);
  const [activeL2, setActiveL2] = useState(null);

  // Hierarchical teaching resources states
  const [teachingResources, setTeachingResources] = useState([]);
  const [activeTRL1, setActiveTRL1] = useState(null);
  const [activeTRL2, setActiveTRL2] = useState(null);

  // Reset active L2 when L1 changes
  useEffect(() => {
    setActiveL2(null);
  }, [activeL1]);

  // Reset active TRL2 when TRL1 changes
  useEffect(() => {
    setActiveTRL2(null);
  }, [activeTRL1]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    // Fetch from backend
    const loadMaterials = async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/study-materials/`);
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setStudyMaterials(data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch study materials:", err);
      }
    };

    const loadTeachingResources = async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/teaching-resources/`);
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setTeachingResources(data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch teaching resources:", err);
      }
    };

    loadMaterials();
    loadTeachingResources();

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

  // Sync AppContext searchQuery from URL when arriving on shop page (e.g. via direct link with ?search=)
  useEffect(() => {
    if (pathname === "/shop") {
      setSearchQuery(searchParams.get("search") || "");
    }
  }, [pathname, searchParams]);

  if (pathname?.startsWith("/admin")) return null;

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const isTeacher = user && (user.role === "teacher" || user.is_admin || user.role === "admin" || user.role === "superadmin");

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Shop", href: "/shop" },
    { name: "Specimen", href: "/specimen" },
    { name: "Contact Us", href: "/contact-us" }
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const val = searchQuery.trim();
    router.push(val ? `/shop?search=${encodeURIComponent(val)}` : "/shop");
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (pathname === "/shop") {
      clearTimeout(headerSearchDebounce.current);
      headerSearchDebounce.current = setTimeout(() => {
        const params = new URLSearchParams(window.location.search);
        if (val) { params.set("search", val); } else { params.delete("search"); }
        params.delete("page");
        router.replace(params.toString() ? `/shop?${params.toString()}` : "/shop", { scroll: false });
      }, 300);
    } else {
      router.push(val ? `/shop?search=${encodeURIComponent(val)}` : "/shop");
    }
  };

  // Derive columns for the mega menu
  const rootItems = studyMaterials.filter((item) => !item.parent_id);
  const l2Items = activeL1 ? studyMaterials.filter((item) => item.parent_id === activeL1.id) : [];
  const l3Items = activeL2 ? studyMaterials.filter((item) => item.parent_id === activeL2.id) : [];

  // Derive columns for teaching resources mega menu
  const trRootItems = teachingResources.filter((item) => !item.parent_id);
  const trL2Items = activeTRL1 ? teachingResources.filter((item) => item.parent_id === activeTRL1.id) : [];
  const trL3Items = activeTRL2 ? teachingResources.filter((item) => item.parent_id === activeTRL2.id) : [];

  return (
    <>
      <nav className="sticky top-0 bg-white shadow-sm border-b border-gray-200" style={{ position: "sticky", top: "0px", zIndex: 999 }}>
        <div className="flex relative max-w-9xl mx-auto items-center justify-between py-3 md:py-6 px-4 md:px-6 xl:px-4">
          
          {/* Logo & Mobile Menu Hamburger */}
          <div className="flex items-center flex-shrink-0 gap-3 md:gap-0">
            <div className="block md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                type="button"
                aria-haspopup="dialog"
                aria-expanded="false"
                className="p-1 -ml-1 focus:outline-none cursor-pointer flex items-center justify-center hover:opacity-75 transition-opacity"
                aria-label="Open mobile menu"
              >
                <Menu className="w-6 h-6 text-red-500 hover:text-red-600 transition-colors" />
              </button>
            </div>
            <Link className="mr-3 lg:mr-8 flex items-center" href="/">
              <CPLogo className="max-w-[70px] md:max-w-[100px]" />
            </Link>
          </div>

          {/* Desktop Nav Links & Search */}
          <div className="hidden md:flex items-center flex-1 gap-2 lg:gap-8">
            <nav aria-label="Main" className="relative z-10 flex max-w-max flex-1 items-center justify-center flex-shrink-0">
              <div style={{ position: "relative" }}>
                <ul className="group flex flex-1 list-none items-center justify-center space-x-1">
                  {navLinks.map((link, idx) => {
                    const isActive = pathname === link.href;
                    return (
                      <React.Fragment key={link.name}>
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

                        {idx === 0 && (
                          <>
                            <li 
                              className="relative group/mega" 
                              key="free-study-material-item"
                              onMouseLeave={() => {
                                setActiveL1(null);
                                setActiveL2(null);
                              }}
                            >
                              <button className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-background py-2 text-sm focus:outline-none disabled:pointer-events-none disabled:opacity-50 font-[500] px-3 text-black hover:text-gray-600 transition-colors duration-300 gap-1.5 cursor-pointer">
                                <span>Free Study Material</span>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover/mega:rotate-180 duration-200 text-gray-500">
                                  <path d="m6 9 6 6 6-6" />
                                </svg>
                              </button>

                              {/* Mega Dropdown */}
                              {rootItems.length > 0 && (
                                <div 
                                  className="absolute left-[-80px] mt-4 bg-white border border-gray-200 rounded-b-lg shadow-2xl opacity-0 invisible group-hover/mega:opacity-100 group-hover/mega:visible transition-all duration-300 z-50 flex overflow-hidden border-t-[3.5px] border-t-red-500"
                                  style={{ width: l3Items.length > 0 ? "530px" : l2Items.length > 0 ? "370px" : "170px" }}
                                >
                                  {/* Column 1 - Root Categories */}
                                  <div className="w-[170px] bg-white border-r border-gray-150 flex-shrink-0 flex flex-col divide-y divide-gray-100">
                                    {rootItems.map((node) => {
                                      const hasChildren = studyMaterials.some((item) => item.parent_id === node.id);
                                      const isActive = activeL1?.id === node.id;
                                      return (
                                        <div
                                          key={node.id}
                                          onMouseEnter={() => setActiveL1(node)}
                                          onClick={() => {
                                            if (node.url) {
                                              navigateToUrl(node.url, router);
                                            }
                                          }}
                                          className={`py-3.5 px-4 flex items-center justify-between cursor-pointer transition-colors ${
                                            isActive
                                              ? "bg-red-50/70 text-red-600"
                                              : "hover:bg-gray-50/50 text-gray-700"
                                          }`}
                                        >
                                          <span className="border-b-[2px] border-red-500 pb-0.5 tracking-wide uppercase font-extrabold text-[12px]">
                                            {node.label}
                                          </span>
                                          {hasChildren && (
                                            <span className="text-[12px] font-bold text-black/60 select-none">»</span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Column 2 - Level 2 Categories/Links */}
                                  {l2Items.length > 0 && (
                                    <div className="w-[200px] bg-white border-r border-gray-150 flex-shrink-0 flex flex-col divide-y divide-gray-100 overflow-y-auto max-h-[460px]">
                                      {l2Items.map((node) => {
                                        const hasChildren = studyMaterials.some((item) => item.parent_id === node.id);
                                        const isActive = activeL2?.id === node.id;
                                        return (
                                          <div
                                            key={node.id}
                                            onMouseEnter={() => {
                                              if (hasChildren) {
                                                setActiveL2(node);
                                              }
                                            }}
                                            onClick={() => {
                                              if (node.url) {
                                                navigateToUrl(node.url, router);
                                              }
                                            }}
                                            className={`py-3.5 px-4 flex items-center justify-between cursor-pointer transition-colors ${
                                              isActive && hasChildren
                                                ? "bg-red-50/70 text-red-600 font-semibold"
                                                : "hover:bg-gray-50/50 text-gray-700"
                                            }`}
                                          >
                                            <span className="text-[12px] font-bold text-gray-700">
                                              {node.label}
                                            </span>
                                            {hasChildren ? (
                                              <span className="text-[12px] font-bold text-black/60 select-none">»</span>
                                            ) : (
                                              node.url && <span className="text-[12px] text-black/45 font-bold font-mono select-none">&gt;</span>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}

                                  {/* Column 3 - Level 3 Links */}
                                  {l3Items.length > 0 && (
                                    <div className="flex-1 bg-white flex flex-col divide-y divide-gray-100 overflow-y-auto max-h-[460px]">
                                      {l3Items.map((node) => (
                                        <div
                                          key={node.id}
                                          onClick={() => {
                                            if (node.url) {
                                              navigateToUrl(node.url, router);
                                            }
                                          }}
                                          className="py-3 px-5 flex items-center justify-between text-[12.5px] font-semibold text-gray-800 hover:bg-gray-50 hover:text-red-500 transition-colors cursor-pointer"
                                        >
                                          <span>{node.label}</span>
                                          {node.url && (
                                            <span className="text-[12.5px] text-black/50 font-bold font-mono select-none">&gt;</span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </li>

                            {mounted && isTeacher && (
                              <li 
                                className="relative group/mega" 
                                key="teaching-resources-item"
                                onMouseLeave={() => {
                                  setActiveTRL1(null);
                                  setActiveTRL2(null);
                                }}
                              >
                                <button className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-background py-2 text-sm focus:outline-none disabled:pointer-events-none disabled:opacity-50 font-[500] px-3 text-black hover:text-gray-600 transition-colors duration-300 gap-1.5 cursor-pointer">
                                  <span>Teaching Resources</span>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover/mega:rotate-180 duration-200 text-gray-500">
                                    <path d="m6 9 6 6 6-6" />
                                  </svg>
                                </button>

                                {/* Mega Dropdown */}
                                {trRootItems.length > 0 && (
                                  <div 
                                    className="absolute left-0 mt-4 bg-white border border-gray-200 rounded-b-lg shadow-2xl opacity-0 invisible group-hover/mega:opacity-100 group-hover/mega:visible transition-all duration-300 z-50 flex overflow-hidden border-t-[3.5px] border-t-red-500"
                                    style={{ width: trL3Items.length > 0 ? "530px" : trL2Items.length > 0 ? "370px" : "170px" }}
                                  >
                                    {/* Column 1 - Root Categories */}
                                    <div className="w-[170px] bg-white border-r border-gray-150 flex-shrink-0 flex flex-col divide-y divide-gray-100">
                                      {trRootItems.map((node) => {
                                        const hasChildren = teachingResources.some((item) => item.parent_id === node.id);
                                        const isActive = activeTRL1?.id === node.id;
                                        return (
                                          <div
                                            key={node.id}
                                            onMouseEnter={() => setActiveTRL1(node)}
                                            onClick={() => {
                                              if (node.url) {
                                                router.push(node.url);
                                              }
                                            }}
                                            className={`py-3.5 px-4 flex items-center justify-between cursor-pointer transition-colors ${
                                              isActive
                                                ? "bg-red-50/70 text-red-600"
                                                : "hover:bg-gray-50/50 text-gray-700"
                                            }`}
                                          >
                                            <span className="border-b-[2px] border-red-500 pb-0.5 tracking-wide uppercase font-extrabold text-[12px]">
                                              {node.label}
                                            </span>
                                            {hasChildren && (
                                              <span className="text-[12px] font-bold text-black/60 select-none">»</span>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>

                                    {/* Column 2 - Level 2 Categories/Links */}
                                    {trL2Items.length > 0 && (
                                      <div className="w-[200px] bg-white border-r border-gray-150 flex-shrink-0 flex flex-col divide-y divide-gray-100 overflow-y-auto max-h-[460px]">
                                        {trL2Items.map((node) => {
                                          const hasChildren = teachingResources.some((item) => item.parent_id === node.id);
                                          const isActive = activeTRL2?.id === node.id;
                                          return (
                                            <div
                                              key={node.id}
                                              onMouseEnter={() => {
                                                if (hasChildren) {
                                                  setActiveTRL2(node);
                                                }
                                              }}
                                              onClick={() => {
                                                if (node.url) {
                                                  router.push(node.url);
                                                }
                                              }}
                                              className={`py-3.5 px-4 flex items-center justify-between cursor-pointer transition-colors ${
                                                isActive && hasChildren
                                                  ? "bg-red-50/70 text-red-600 font-semibold"
                                                  : "hover:bg-gray-50/50 text-gray-700"
                                              }`}
                                            >
                                              <span className="text-[12px] font-bold text-gray-700">
                                                {node.label}
                                              </span>
                                              {hasChildren ? (
                                                <span className="text-[12px] font-bold text-black/60 select-none">»</span>
                                              ) : (
                                                node.url && <span className="text-[12px] text-black/45 font-bold font-mono select-none">&gt;</span>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}

                                    {/* Column 3 - Level 3 Links */}
                                    {trL3Items.length > 0 && (
                                      <div className="flex-1 bg-white flex flex-col divide-y divide-gray-100 overflow-y-auto max-h-[460px]">
                                        {trL3Items.map((node) => (
                                          <Link
                                            key={node.id}
                                            href={node.url || "#"}
                                            className="py-3 px-5 flex items-center justify-between text-[12.5px] font-semibold text-gray-800 hover:bg-gray-50 hover:text-red-500 transition-colors cursor-pointer"
                                          >
                                            <span>{node.label}</span>
                                            {node.url && (
                                              <span className="text-[12.5px] text-black/50 font-bold font-mono select-none">&gt;</span>
                                            )}
                                          </Link>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </li>
                            )}
                          </>
                        )}
                      </React.Fragment>
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
                      onClick={() => {
                        setSearchQuery("");
                        if (pathname === "/shop") {
                          const params = new URLSearchParams(window.location.search);
                          params.delete("search");
                          params.delete("page");
                          router.replace(params.toString() ? `/shop?${params.toString()}` : "/shop", { scroll: false });
                        }
                      }}
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
          <div className="flex items-center flex-shrink-0 gap-3 ml-4">
            {/* Mobile Search Button (shows on small screens only) */}
            <button
              onClick={() => router.push("/shop?focusSearch=true")}
              className="block md:hidden p-1 focus:outline-none cursor-pointer"
              aria-label="Search Catalog"
            >
              <Search className="w-5 h-5 text-red-500" />
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
              {mounted && wishlist.length > 0 && (
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
              {mounted && totalCartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white animate-pulse">
                  {totalCartCount}
                </span>
              )}
            </Link>

            {/* Profile Button with Dropdown */}
            <div className="relative" ref={profileRef}>
              {mounted && user ? (
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
