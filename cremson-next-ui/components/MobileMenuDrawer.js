"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "../context/AppContext";
import CPLogo from "./CPLogo";
import { X, ChevronDown, Search, User, LogOut, Package, MapPin, BookOpen, GraduationCap, Home, ShoppingBag, BookMarked, Newspaper, PhoneCall } from "lucide-react";

export default function MobileMenuDrawer() {
  const router = useRouter();
  const {
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    searchQuery,
    setSearchQuery,
    user,
    authLogout,
  } = useApp();

  const [studyMaterials, setStudyMaterials] = useState([]);
  const [teachingResources, setTeachingResources] = useState([]);

  // Accordion open states
  const [isStudyOpen, setIsStudyOpen] = useState(false);
  const [isTeachingOpen, setIsTeachingOpen] = useState(false);
  const [openL1, setOpenL1] = useState(null);
  const [openTRL1, setOpenTRL1] = useState(null);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    fetch("http://localhost:8000/api/study-materials/")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setStudyMaterials(data || []))
      .catch(console.error);

    fetch("http://localhost:8000/api/teaching-resources/")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setTeachingResources(data || []))
      .catch(console.error);
  }, [isMobileMenuOpen]);

  if (!isMobileMenuOpen) return null;

  const handleLinkClick = (href) => {
    setIsMobileMenuOpen(false);
    if (href) router.push(href);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    router.push("/shop");
  };

  // Study Materials Tree
  const rootStudy = studyMaterials.filter((item) => !item.parent_id);
  const rootTeaching = teachingResources.filter((item) => !item.parent_id);

  return (
    <div className="fixed inset-0 z-[99999] overflow-hidden md:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Left-to-Right Drawer Panel */}
      <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-2xl flex flex-col h-full max-h-[100dvh] z-[100000] animate-in slide-in-from-left duration-300">
        
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80 flex-shrink-0">
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
            <CPLogo className="max-w-[85px]" />
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 rounded-full text-gray-500 hover:text-red-600 hover:bg-gray-200/60 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search input in drawer */}
        <div className="p-4 border-b border-gray-100 bg-white flex-shrink-0">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              placeholder="Search books..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl bg-gray-50 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20 text-gray-900"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          </form>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto min-h-0 px-4 py-3 space-y-1 text-left divide-y divide-gray-100/60">
          
          {/* Main Links */}
          <div className="space-y-1 pb-3">
            <button
              onClick={() => handleLinkClick("/")}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-800 hover:bg-red-50 hover:text-red-600 transition-all text-left"
            >
              <Home className="w-4 h-4 text-gray-400" /> Home
            </button>

            <button
              onClick={() => {
                setSearchQuery("");
                handleLinkClick("/shop");
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-800 hover:bg-red-50 hover:text-red-600 transition-all text-left"
            >
              <ShoppingBag className="w-4 h-4 text-gray-400" /> Shop
            </button>

            <button
              onClick={() => handleLinkClick("/specimen")}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-800 hover:bg-red-50 hover:text-red-600 transition-all text-left"
            >
              <BookMarked className="w-4 h-4 text-gray-400" /> Specimen Books
            </button>

            <button
              onClick={() => handleLinkClick("/blogs")}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-800 hover:bg-red-50 hover:text-red-600 transition-all text-left"
            >
              <Newspaper className="w-4 h-4 text-gray-400" /> Blogs
            </button>

            <button
              onClick={() => handleLinkClick("/contact-us")}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-800 hover:bg-red-50 hover:text-red-600 transition-all text-left"
            >
              <PhoneCall className="w-4 h-4 text-gray-400" /> Contact Us
            </button>
          </div>

          {/* Free Study Material Accordion */}
          <div className="py-3 space-y-1">
            <button
              onClick={() => setIsStudyOpen(!isStudyOpen)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4 text-red-500" />
                <span>Free Study Material</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isStudyOpen ? "rotate-180" : ""}`} />
            </button>

            {isStudyOpen && (
              <div className="pl-6 pt-1 pb-2 space-y-1 text-xs">
                {rootStudy.map((root) => {
                  const children = studyMaterials.filter((i) => i.parent_id === root.id);
                  const isExpanded = openL1 === root.id;
                  return (
                    <div key={root.id} className="space-y-1">
                      <div
                        onClick={() => {
                          if (children.length > 0) {
                            setOpenL1(isExpanded ? null : root.id);
                          } else if (root.url) {
                            handleLinkClick(root.url);
                          }
                        }}
                        className="flex items-center justify-between py-2 px-2 rounded-lg font-bold text-gray-700 hover:text-red-600 hover:bg-red-50/50 cursor-pointer"
                      >
                        <span className="uppercase text-[11px] tracking-wide">{root.label}</span>
                        {children.length > 0 && (
                          <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        )}
                      </div>

                      {isExpanded && children.length > 0 && (
                        <div className="pl-3 border-l-2 border-red-200 space-y-1 my-1">
                          {children.map((child) => {
                            const subChildren = studyMaterials.filter((i) => i.parent_id === child.id);
                            return (
                              <div key={child.id}>
                                <div
                                  onClick={() => child.url && handleLinkClick(child.url)}
                                  className="py-1.5 px-2 text-gray-600 font-semibold hover:text-red-600 cursor-pointer"
                                >
                                  {child.label}
                                </div>
                                {subChildren.map((sub) => (
                                  <div
                                    key={sub.id}
                                    onClick={() => sub.url && handleLinkClick(sub.url)}
                                    className="pl-3 py-1 text-gray-500 hover:text-red-500 cursor-pointer text-[11px]"
                                  >
                                    • {sub.label}
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Teaching Resources Accordion */}
          <div className="py-3 space-y-1">
            <button
              onClick={() => setIsTeachingOpen(!isTeachingOpen)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <GraduationCap className="w-4 h-4 text-red-500" />
                <span>Teaching Resources</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isTeachingOpen ? "rotate-180" : ""}`} />
            </button>

            {isTeachingOpen && (
              <div className="pl-6 pt-1 pb-2 space-y-1 text-xs">
                {rootTeaching.map((root) => {
                  const children = teachingResources.filter((i) => i.parent_id === root.id);
                  const isExpanded = openTRL1 === root.id;
                  return (
                    <div key={root.id} className="space-y-1">
                      <div
                        onClick={() => {
                          if (children.length > 0) {
                            setOpenTRL1(isExpanded ? null : root.id);
                          } else if (root.url) {
                            handleLinkClick(root.url);
                          }
                        }}
                        className="flex items-center justify-between py-2 px-2 rounded-lg font-bold text-gray-700 hover:text-red-600 hover:bg-red-50/50 cursor-pointer"
                      >
                        <span className="uppercase text-[11px] tracking-wide">{root.label}</span>
                        {children.length > 0 && (
                          <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        )}
                      </div>

                      {isExpanded && children.length > 0 && (
                        <div className="pl-3 border-l-2 border-red-200 space-y-1 my-1">
                          {children.map((child) => {
                            const subChildren = teachingResources.filter((i) => i.parent_id === child.id);
                            return (
                              <div key={child.id}>
                                <div
                                  onClick={() => child.url && handleLinkClick(child.url)}
                                  className="py-1.5 px-2 text-gray-600 font-semibold hover:text-red-600 cursor-pointer"
                                >
                                  {child.label}
                                </div>
                                {subChildren.map((sub) => (
                                  <div
                                    key={sub.id}
                                    onClick={() => sub.url && handleLinkClick(sub.url)}
                                    className="pl-3 py-1 text-gray-500 hover:text-red-500 cursor-pointer text-[11px]"
                                  >
                                    • {sub.label}
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* User Account / Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/70 text-left flex-shrink-0">
          {user ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 pb-2 border-b border-gray-200/60">
                <span className="w-9 h-9 rounded-full bg-red-500 text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
                  {user.name?.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-gray-900 truncate">{user.name}</p>
                  <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => handleLinkClick("/my-orders")}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-100"
                >
                  <Package className="w-3.5 h-3.5 text-orange-500" /> Orders
                </button>
                <button
                  onClick={() => handleLinkClick("/account/addresses")}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-100"
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-500" /> Addresses
                </button>
              </div>

              <button
                onClick={() => {
                  authLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 mt-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition-all"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleLinkClick("/auth/signin")}
              className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md transition-all"
            >
              <User className="w-4 h-4" /> Sign In / Register
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
