"use client";

import { useState, useMemo, useRef, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useApp } from "../../context/AppContext";
import { useProducts, useCategories, useProductsPage } from "../../lib/api/hooks";
import { ChevronLeft, ChevronRight, ChevronDown, Check, Search, X } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";

const SORT_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Rating" },
];

function SortDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = SORT_OPTIONS.find((o) => o.value === value) || SORT_OPTIONS[0];

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 border border-black/10 rounded-lg py-1.5 px-3 text-sm font-semibold text-black bg-white hover:border-black/20 transition-colors cursor-pointer min-w-[160px] justify-between"
      >
        <span>{selected.label}</span>
        <ChevronDown className={`w-4 h-4 text-black/50 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-full min-w-[160px] bg-white border border-black/10 rounded-xl shadow-lg z-30 py-1 overflow-hidden">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors cursor-pointer ${
                value === opt.value
                  ? "bg-black text-white font-semibold"
                  : "text-black hover:bg-gray-50"
              }`}
            >
              <span>{opt.label}</span>
              {value === opt.value && <Check className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Custom premium checkbox component matching the CSS structure
function CustomCheckbox({ checked, onChange, label }) {
  return (
    <div className="flex items-center space-x-2 select-none">
      <div
        onClick={onChange}
        className={`h-4 w-4 rounded border flex items-center justify-center cursor-pointer transition-all ${checked
          ? "border-black bg-black text-white"
          : "border-gray-300 bg-white hover:border-gray-400"
          }`}
      >
        {checked && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-2.5 h-2.5"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      <span
        onClick={onChange}
        className={`text-sm cursor-pointer transition-colors ${checked ? "text-black font-semibold" : "text-black/60 hover:text-black"
          }`}
      >
        {label}
      </span>
    </div>
  );
}

function Shop() {
  const { addToCart, toggleWishlist, wishlist, cart, updateQuantity, removeFromCart } = useApp();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Local state only for the search input (controlled input with debounce)
  const [searchInput, setSearchInput] = useState(() => searchParams.get("search") || "");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Accordion Sections State
  const [openSections, setOpenSections] = useState({
    categories: true,
    subCategories: true,
    author: false,
    classes: false,
    edition: true,
    price: true,
    status: true,
  });

  const ITEMS_PER_PAGE = 9;

  // --- Read all filter values from URL (single source of truth) ---
  const searchVal = searchParams.get("search") || "";
  const selectedCategories = useMemo(() => searchParams.get("categories")?.split(",").filter(Boolean) || [], [searchParams]);
  const selectedSubCategories = useMemo(() => searchParams.get("subCategories")?.split(",").filter(Boolean) || [], [searchParams]);
  const selectedAuthors = useMemo(() => searchParams.get("authors")?.split(",").filter(Boolean) || [], [searchParams]);
  const selectedClasses = useMemo(() => searchParams.get("classes")?.split(",").filter(Boolean) || [], [searchParams]);
  const selectedEditions = useMemo(() => searchParams.get("editions")?.split(",").filter(Boolean) || [], [searchParams]);
  const selectedStatuses = useMemo(() => searchParams.get("statuses")?.split(",").filter(Boolean) || [], [searchParams]);
  const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : null;
  const sortBy = searchParams.get("sortBy") || "default";
  const currentPage = parseInt(searchParams.get("page")) || 1;

  // URL update helper — reads window.location to always have the latest params
  const updateUrl = useCallback((updates) => {
    const params = new URLSearchParams(window.location.search);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
        params.delete(key);
      } else if (Array.isArray(value)) {
        params.set(key, value.join(","));
      } else {
        params.set(key, String(value));
      }
    });
    const qs = params.toString();
    router.replace(qs ? `/shop?${qs}` : "/shop", { scroll: false });
  }, [router]);

  // Debounce search input → URL
  // isTypingRef prevents the URL-sync effect from overwriting what the user is typing
  const searchDebounceRef = useRef(null);
  const isTypingRef = useRef(false);

  const handleSearchChange = (value) => {
    isTypingRef.current = true;
    setSearchInput(value);
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      isTypingRef.current = false;
      updateUrl({ search: value || null, page: null });
    }, 300);
  };

  // Sync searchInput from URL only when the change comes externally (e.g. header search)
  useEffect(() => {
    if (!isTypingRef.current) {
      setSearchInput(searchVal);
    }
  }, [searchVal]);

  // Fetch ALL products once for sidebar filter options (authors, editions, etc.)
  const { data: allBooksData = [] } = useProducts({});
  const { data: categoriesData } = useCategories({ size: 100 });

  const categories = useMemo(() => {
    const fetched = (categoriesData?.results || []).filter((c) => c.is_active !== false);
    const hasComboCategory = fetched.some((c) => ["combos", "combo", "bundle", "bundles"].includes((c.name || "").toLowerCase()));
    const hasCombosInBooks = allBooksData.some((b) => b.isCombo);
    if (!hasComboCategory && hasCombosInBooks) {
      return [{ id: "combos-virtual", name: "Combos" }, ...fetched];
    }
    return fetched;
  }, [categoriesData, allBooksData]);

  // Derive unique filter options from ALL products (full dataset)
  const uniqueAuthors = useMemo(() => [...new Set(allBooksData.map((b) => b.author).filter(Boolean))].sort(), [allBooksData]);
  const uniqueClasses = useMemo(() => [...new Set(allBooksData.flatMap((b) => b.classes).filter(Boolean))].sort(), [allBooksData]);
  const uniqueSubCategories = useMemo(() => {
    const fromBooks = allBooksData.flatMap((b) => b.subCategories || []).filter(Boolean);
    const fromCats = (categoriesData?.results || [])
      .flatMap((c) => (c.sub_categories ? c.sub_categories.split(",").map((s) => s.trim()) : []))
      .filter(Boolean);
    return [...new Set([...fromBooks, ...fromCats])].sort();
  }, [allBooksData, categoriesData]);
  const uniqueEditions = useMemo(() => [...new Set(allBooksData.map((b) => b.edition).filter(Boolean))].sort(), [allBooksData]);
  const uniqueStatuses = useMemo(() => {
    const map = { in_stock: "In Stock", out_of_stock: "Out of Stock", on_backorders: "On Backorders" };
    return [...new Set(allBooksData.map((b) => b.stockStatus).filter(Boolean))].map((s) => ({ value: s, label: map[s] || s }));
  }, [allBooksData]);
  const priceRange = useMemo(() => {
    if (!allBooksData.length) return { min: 0, max: 2000 };
    const prices = allBooksData.map((b) => b.price).filter((p) => p > 0);
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [allBooksData]);

  const effectiveMaxPrice = maxPrice ?? priceRange.max;

  // Build params for backend API call from current URL state
  const apiParams = useMemo(() => {
    const params = { page: currentPage, size: ITEMS_PER_PAGE };
    if (searchVal) params.search = searchVal;

    const COMBO_NAMES = ["combos", "combo", "bundle", "bundles", "combo pack", "combo packs"];
    const isComboSelected = selectedCategories.some((c) => COMBO_NAMES.includes(c.toLowerCase()));
    const nonComboCategories = selectedCategories.filter((c) => !COMBO_NAMES.includes(c.toLowerCase()));
    if (isComboSelected) params.is_combo = true;
    if (nonComboCategories.length) params.category = nonComboCategories.join(",");

    if (selectedAuthors.length) params.author = selectedAuthors.join(",");
    if (selectedClasses.length) params.classes = selectedClasses.join(",");
    if (selectedEditions.length) params.edition = selectedEditions.join(",");
    if (selectedStatuses.length) params.stock_status = selectedStatuses.join(",");
    if (maxPrice !== null) params.max_price = maxPrice;
    if (sortBy !== "default") params.sort_by = sortBy;
    return params;
  }, [searchVal, selectedCategories, selectedAuthors, selectedClasses, selectedEditions, selectedStatuses, maxPrice, sortBy, currentPage]);

  // Fetch current page of products from backend with all filters applied
  const { data: pageData, isLoading: dataLoading } = useProductsPage(apiParams);
  const paginatedBooks = pageData?.results || [];
  const totalCount = pageData?.count || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE) || 1;

  const searchInputRef = useRef(null);
  useEffect(() => {
    if (searchParams.get("focusSearch") === "true") {
      setTimeout(() => {
        searchInputRef.current?.focus();
        searchInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, [searchParams]);

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleToggleFilter = (paramKey, currentList, item) => {
    const newList = currentList.includes(item)
      ? currentList.filter((i) => i !== item)
      : [...currentList, item];
    updateUrl({ [paramKey]: newList, page: null });
  };

  const handlePriceChange = (e) => {
    updateUrl({ maxPrice: Number(e.target.value), page: null });
  };

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
                  <linearGradient id={`starHalfGrad-${rating}`}>
                    <stop offset="50%" stopColor="#facc15" />
                    <stop offset="50%" stopColor="#e5e7eb" />
                  </linearGradient>
                </defs>
                <path fill={`url(#starHalfGrad-${rating})`} d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
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

  const renderFiltersList = () => {
    return (
      <div className="space-y-5 md:space-y-6 text-left">
        {/* Categories */}
        <div>
          <h3 className="flex">
            <button
              type="button"
              onClick={() => toggleSection("categories")}
              className="flex flex-1 items-center justify-between transition-all text-black font-bold text-xl hover:no-underline p-0 py-0.5"
            >
              Categories
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200"
                style={{ transform: openSections.categories ? "rotate(180deg)" : "rotate(0deg)" }}
              >
                <path
                  d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </h3>
          {openSections.categories && (
            <div className="pb-4 pl-[4px] pt-4">
              <div className="space-y-3">
                {categories.map((cat) => (
                  <CustomCheckbox
                    key={cat.id}
                    checked={selectedCategories.some((c) => c.toLowerCase() === (cat.name || "").toLowerCase())}
                    onChange={() => handleToggleFilter("categories", selectedCategories, cat.name)}
                    label={cat.name}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <hr className="border-t-black/10" />

        {/* Sub Categories */}
        <div>
          <h3 className="flex">
            <button
              type="button"
              onClick={() => toggleSection("subCategories")}
              className="flex flex-1 items-center justify-between transition-all text-black font-bold text-xl hover:no-underline p-0 py-0.5"
            >
              Sub Categories
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200"
                style={{ transform: openSections.subCategories ? "rotate(180deg)" : "rotate(0deg)" }}
              >
                <path
                  d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </h3>
          {openSections.subCategories && (
            <div className="pb-4 pl-[4px] pt-4">
              <div className="space-y-3">
                {uniqueSubCategories.map((sub) => (
                  <CustomCheckbox
                    key={sub}
                    checked={selectedSubCategories.includes(sub)}
                    onChange={() => handleToggleFilter("subCategories", selectedSubCategories, sub)}
                    label={sub}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <hr className="border-t-black/10" />

        {/* Author */}
        <div>
          <h3 className="flex">
            <button
              type="button"
              onClick={() => toggleSection("author")}
              className="flex flex-1 items-center justify-between transition-all text-black font-bold text-xl hover:no-underline p-0 py-0.5"
            >
              Author
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200"
                style={{ transform: openSections.author ? "rotate(180deg)" : "rotate(0deg)" }}
              >
                <path
                  d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </h3>
          {openSections.author && (
            <div className="pb-4 pl-[4px] pt-4">
              <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
                {uniqueAuthors.map((author) => (
                  <CustomCheckbox
                    key={author}
                    checked={selectedAuthors.includes(author)}
                    onChange={() => handleToggleFilter("authors", selectedAuthors, author)}
                    label={author}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <hr className="border-t-black/10" />

        {/* Classes */}
        <div>
          <h3 className="flex">
            <button
              type="button"
              onClick={() => toggleSection("classes")}
              className="flex flex-1 items-center justify-between transition-all text-black font-bold text-xl hover:no-underline p-0 py-0.5"
            >
              Classes
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200"
                style={{ transform: openSections.classes ? "rotate(180deg)" : "rotate(0deg)" }}
              >
                <path
                  d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </h3>
          {openSections.classes && (
            <div className="pb-4 pl-[4px] pt-4">
              <div className="space-y-3">
                {uniqueClasses.map((cls) => (
                  <CustomCheckbox
                    key={cls}
                    checked={selectedClasses.includes(cls)}
                    onChange={() => handleToggleFilter("classes", selectedClasses, cls)}
                    label={cls}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <hr className="border-t-black/10" />

        {/* Edition */}
        <div>
          <h3 className="flex">
            <button
              type="button"
              onClick={() => toggleSection("edition")}
              className="flex flex-1 items-center justify-between transition-all text-black font-bold text-xl hover:no-underline p-0 py-0.5"
            >
              Edition
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200"
                style={{ transform: openSections.edition ? "rotate(180deg)" : "rotate(0deg)" }}
              >
                <path
                  d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </h3>
          {openSections.edition && (
            <div className="pb-4 pl-[4px] pt-4">
              <div className="space-y-3">
                {uniqueEditions.map((edition) => (
                  <CustomCheckbox
                    key={edition}
                    checked={selectedEditions.includes(edition)}
                    onChange={() => handleToggleFilter("editions", selectedEditions, edition)}
                    label={edition}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <hr className="border-t-black/10" />

        {/* Price */}
        <div>
          <h3 className="flex">
            <button
              type="button"
              onClick={() => toggleSection("price")}
              className="flex flex-1 items-center justify-between transition-all text-black font-bold text-xl hover:no-underline p-0 py-0.5"
            >
              Price
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200"
                style={{ transform: openSections.price ? "rotate(180deg)" : "rotate(0deg)" }}
              >
                <path
                  d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </h3>
          {openSections.price && (
            <div className="pb-4 pl-[4px] pt-4">
              <div className="w-full relative">
                <input
                  type="range"
                  min={priceRange.min}
                  max={priceRange.max}
                  value={effectiveMaxPrice}
                  onChange={handlePriceChange}
                  className="w-full h-1 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: (() => {
                      const pct = priceRange.max === priceRange.min ? 100 : ((effectiveMaxPrice - priceRange.min) / (priceRange.max - priceRange.min)) * 100;
                      return `linear-gradient(to right, #000 0%, #000 ${pct}%, #e5e7eb ${pct}%, #e5e7eb 100%)`;
                    })(),
                  }}
                />
                <div className="flex justify-between text-sm text-black/60 mt-2">
                  <span>₹{priceRange.min}</span>
                  <span className="font-semibold text-black">₹{effectiveMaxPrice}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <hr className="border-t-black/10" />

        {/* Status */}
        <div>
          <h3 className="flex">
            <button
              type="button"
              onClick={() => toggleSection("status")}
              className="flex flex-1 items-center justify-between transition-all text-black font-bold text-xl hover:no-underline p-0 py-0.5"
            >
              Status
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200"
                style={{ transform: openSections.status ? "rotate(180deg)" : "rotate(0deg)" }}
              >
                <path
                  d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </h3>
          {openSections.status && (
            <div className="pb-4 pl-[4px] pt-4">
              <div className="space-y-3">
                {uniqueStatuses.map(({ value, label }) => (
                  <CustomCheckbox
                    key={value}
                    checked={selectedStatuses.includes(value)}
                    onChange={() => handleToggleFilter("statuses", selectedStatuses, value)}
                    label={label}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <main className="" >
      <div className="max-w-7xl mx-auto px-6 md:px-10 xl:px-12">
        <hr className="h-[1px] border-t-black/10 mb-5 sm:mb-6" />

        {/* Breadcrumbs */}
        <nav aria-label="breadcrumb" className="mb-5 sm:mb-9">
          <ol className="flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5">
            <li className="inline-flex items-center gap-1.5">
              <Link className="transition-colors hover:text-foreground text-left" href="/">
                Home
              </Link>
            </li>
            <li role="presentation" aria-hidden="true" className="[&>svg]:size-3.5">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M6.1584 3.13508C6.35985 2.94621 6.67627 2.95642 6.86514 3.15788L10.6151 7.15788C10.7954 7.3502 10.7954 7.64949 10.6151 7.84182L6.86514 11.8418C6.67627 12.0433 6.35985 12.0535 6.1584 11.8646C5.95694 11.6757 5.94673 11.3593 6.1356 11.1579L9.565 7.49985L6.1356 3.84182C5.94673 3.64036 5.95694 3.32394 6.1584 3.13508Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                />
              </svg>
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span role="link" aria-disabled="true" aria-current="page" className="font-normal text-foreground">
                Shop
              </span>
            </li>
          </ol>
        </nav>

        {/* Filters and Books Grid Area */}
        <div className="flex md:space-x-5 items-start">

          {/* Desktop Filters Sidebar */}
          <div className="hidden md:block min-w-[295px] max-w-[295px] border border-black/10 rounded-[20px] px-5 md:px-6 py-5 space-y-5 md:space-y-6">
            <div className="flex items-center justify-between">
              <span className="font-bold text-black text-xl">Filters</span>
              <svg
                stroke="currentColor"
                fill="none"
                strokeWidth="2"
                viewBox="0 0 24 24"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-2xl text-black/40"
                height="1em"
                width="1em"
                xmlns="http://www.w3.org/2000/svg"
              >
                <line x1="4" y1="21" x2="4" y2="14" />
                <line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" />
                <line x1="20" y1="12" x2="20" y2="3" />
                <line x1="1" y1="14" x2="7" y2="14" />
                <line x1="9" y1="8" x2="15" y2="8" />
                <line x1="17" y1="16" x2="23" y2="16" />
              </svg>
            </div>
            <hr className="border-t-black/10" />
            {renderFiltersList()}
          </div>

          {/* Mobile Drawer (sliding bottom or overlay dialog) */}
          {showMobileFilters && (
            <div className="fixed inset-0 z-[1000] flex md:hidden bg-black/60 backdrop-blur-sm transition-opacity duration-300">
              <div className="w-[320px] bg-white h-full p-6 overflow-y-auto shadow-2xl relative flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <span className="font-bold text-black text-xl">Filters</span>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="text-black/60 hover:text-black font-semibold text-xl p-2"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex-1 space-y-6">
                  {renderFiltersList()}
                </div>
              </div>
              <div className="flex-1" onClick={() => setShowMobileFilters(false)}></div>
            </div>
          )}

          {/* Main Products Listing Section */}
          <div className="flex flex-col w-full space-y-4">
            {/* Mobile On-Page Search Bar */}
            <div className="block md:hidden w-full">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  clearTimeout(searchDebounceRef.current);
                  updateUrl({ search: searchInput || null, page: null });
                }}
                className="relative w-full"
              >
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search books by title, author..."
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20 text-gray-900 shadow-sm"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => handleSearchChange("")}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-red-500 p-0.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </form>
            </div>

            {/* Header bar: title, sort, and product counts */}
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
              <div className="flex items-center justify-between">
                <h1 className="font-bold text-2xl md:text-[32px]">All Books</h1>
                <button
                  type="button"
                  onClick={() => setShowMobileFilters(true)}
                  className="h-8 w-8 rounded-full bg-[#F0F0F0] text-black p-1 md:hidden flex items-center justify-center transition-all hover:bg-gray-200 cursor-pointer"
                >
                  <svg
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-base"
                    height="1em"
                    width="1em"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <line x1="4" y1="21" x2="4" y2="14" />
                    <line x1="4" y1="10" x2="4" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12" y2="3" />
                    <line x1="20" y1="21" x2="20" y2="16" />
                    <line x1="20" y1="12" x2="20" y2="3" />
                    <line x1="1" y1="14" x2="7" y2="14" />
                    <line x1="9" y1="8" x2="15" y2="8" />
                    <line x1="17" y1="16" x2="23" y2="16" />
                  </svg>
                </button>
              </div>

              <div className="flex flex-col sm:items-center sm:flex-row gap-3">
                <span className="text-sm md:text-base text-black/60">
                  Showing {totalCount === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}-
                  {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} Products
                </span>

                <div className="flex items-center gap-2 text-sm sm:text-base font-semibold">
                  <span className="text-black/60">Sort by:</span>
                  <SortDropdown value={sortBy} onChange={(v) => updateUrl({ sortBy: v !== "default" ? v : null, page: null })} />
                </div>
              </div>
            </div>


            {/* Grid of Books */}
            {dataLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({length: 8}).map((_, i) => (
                  <div key={i} className="animate-pulse bg-white rounded-xl shadow p-3">
                    <div className="bg-gray-200 rounded-lg h-48 mb-3" />
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : paginatedBooks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 border border-dashed border-gray-200 rounded-3xl">
                <p className="text-gray-500 font-medium text-lg">No books found matching the selected filters.</p>
                <button
                  onClick={() => {
                    setSearchInput("");
                    router.replace("/shop", { scroll: false });
                  }}
                  className="mt-4 px-5 py-2.5 bg-black text-white rounded-full font-semibold text-sm transition-all hover:bg-black/80 cursor-pointer"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
                {paginatedBooks.map((book) => {
                  const isWishlisted = wishlist.includes(book.id);
                  const cartItem = cart?.find((item) => item.product.id === book.id);
                  const quantityInCart = cartItem ? cartItem.quantity : 0;

                  return (
                    <Link
                      key={book.id}
                      className="flex flex-col items-start aspect-auto group min-h-[367px] sm:min-h-0 text-left"
                      href={`/shop/product/${book.id}`}
                    >
                      {/* Image container */}
                      <div className="bg-[#F0EEED] rounded-[13px] lg:rounded-[20px] w-full lg:max-w-[295px] aspect-[3/4] mb-2.5 xl:mb-4 overflow-hidden relative py-1.5 px-3">
                        {book.image ? (
                          <img
                            src={book.image}
                            className="w-full h-full object-contain hover:scale-105 transition-transform duration-300 ease-in-out"
                            alt={book.title}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m3 15 5-5 4 4 3-3 6 6"/><circle cx="8.5" cy="8.5" r="1.5"/></svg>
                          </div>
                        )}
                        {/* Discount, Subcategory & Combo Badges */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 items-start">
                          {book.isCombo && (
                            <span className="bg-purple-600 text-white text-xs font-bold px-2.5 py-1 rounded shadow-md flex items-center gap-1">
                              📦 Combo Pack
                            </span>
                          )}
                          {book.subCategories && book.subCategories.length > 0 && (
                            <span className="bg-black/70 backdrop-blur-md text-white text-[11px] font-semibold px-2 py-0.5 rounded shadow">
                              {book.subCategories[0]}
                            </span>
                          )}
                          {book.discount && (
                            <span className="bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded shadow-md">
                              {book.discount.replace(/^-/, "")}
                            </span>
                          )}
                          {quantityInCart > 0 && (
                            <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded shadow-md flex items-center gap-1.5">
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shopping-cart"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                              {quantityInCart} in Cart
                            </span>
                          )}
                        </div>
                        {/* Wishlist Button */}
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
                            className={`lucide lucide-heart transition-all duration-200 ease-out group-hover:animate-bounce ${isWishlisted ? "text-red-500" : "text-gray-600 hover:text-red-500"
                              }`}
                            style={{ filter: "none" }}
                          >
                            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                          </svg>
                        </button>
                      </div>

                      {/* Details */}
                      <div className="mb-1">
                        <strong className="text-black xl:text-xl line-clamp-2 leading-tight hover:text-orange-500 transition-colors duration-200 cursor-pointer">
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

                      {/* Ratings */}
                      <div className="flex items-end gap-2 mb-2">
                        <div className="flex items-end gap-1">
                          {renderStars(book.rating)}
                          <span className="text-sm font-medium text-gray-700 ml-1">{book.rating.toFixed(1)}</span>
                        </div>
                        <span className="text-xs text-gray-500 pb-[2px]">({book.reviewsCount} reviews)</span>
                      </div>

                      {/* Price & Cart Actions */}
                      <div className="flex flex-col items-start w-full gap-3 mt-auto">
                        <div className="flex items-center space-x-[5px] xl:space-x-2.5">
                          <span className="font-bold text-black text-xl xl:text-2xl">₹{book.price}</span>
                          {book.originalPrice && (
                            <span className="font-bold text-black/40 line-through text-xl xl:text-2xl">
                              ₹{book.originalPrice}
                            </span>
                          )}
                        </div>
                        <div className="w-full">
                          {quantityInCart > 0 ? (
                            <div className="flex items-center justify-between h-10 bg-gray-900 text-white font-semibold rounded-full px-2 w-full transition-all duration-150 shadow-md">
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
                                className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
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
                                className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                addToCart(book);
                              }}
                              className="w-full h-10 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 rounded-full transition-all duration-150 text-sm whitespace-nowrap text-center cursor-pointer"
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-8">
                <button
                  disabled={currentPage === 1}
                  onClick={() => { updateUrl({ page: currentPage - 1 }); window.scrollTo(0, 0); }}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${currentPage === 1 ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100 hover:text-black cursor-pointer"
                    }`}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </button>
                <div className="flex items-center space-x-1">
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => { updateUrl({ page: pageNum }); window.scrollTo(0, 0); }}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${currentPage === pageNum
                          ? "bg-black text-white"
                          : "text-gray-700 hover:bg-gray-100 hover:text-black"
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => { updateUrl({ page: currentPage + 1 }); window.scrollTo(0, 0); }}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${currentPage === totalPages ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100 hover:text-black cursor-pointer"
                    }`}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}

function ShopFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-600 font-semibold">Loading Shop...</p>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<ShopFallback />}>
      <Shop />
    </Suspense>
  );
}
