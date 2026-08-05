"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { fetchAllProducts } from "../lib/api/products";
import { getMe } from "../lib/api/auth";
import {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCartApi,
  syncCart,
} from "../lib/api/cart";
import {
  getWishlist,
  addWishlistItem,
  removeWishlistItem,
  clearWishlistApi,
  syncWishlist,
} from "../lib/api/wishlist";

const AppContext = createContext();

// Convert backend cart row → frontend {product, quantity} shape
function rowToCartItem(row) {
  return {
    rowId: row.id,
    product: {
      id: Number(row.product_id),
      title: row.title,
      price: Number(row.price),
      originalPrice: Number(row.original_price) || null,
      image: row.image,
      author: row.author,
      category: row.category,
    },
    quantity: Number(row.quantity),
  };
}

// Merge duplicate product_ids — keep highest quantity
function dedupeCart(items) {
  const seen = new Map();
  for (const item of items) {
    const pid = item.product.id;
    if (!seen.has(pid) || item.quantity > seen.get(pid).quantity) {
      seen.set(pid, item);
    }
  }
  return Array.from(seen.values());
}

// Convert frontend {product, quantity} → backend sync payload shape
function cartItemToRow(item) {
  return {
    product_id: item.product.id,
    quantity: item.quantity,
    title: item.product.title,
    price: item.product.price,
    original_price: item.product.originalPrice ?? null,
    image: item.product.image,
    author: item.product.author,
    category: item.product.category,
  };
}

export function AppProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [allProducts, setAllProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // Restore applied coupon from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("cremson_applied_coupon");
      if (saved) setAppliedCoupon(JSON.parse(saved));
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (appliedCoupon) {
      sessionStorage.setItem("cremson_applied_coupon", JSON.stringify(appliedCoupon));
    } else {
      sessionStorage.removeItem("cremson_applied_coupon");
    }
  }, [appliedCoupon]);

  // Track whether we've already loaded backend data for the current session
  const backendLoaded = useRef(false);

  useEffect(() => {
    fetchAllProducts()
      .then(setAllProducts)
      .catch(console.error)
      .finally(() => setProductsLoading(false));
  }, []);

  // Whenever live product data arrives, refresh cart item details so stale
  // snapshots (price, title, image, etc.) are replaced with current Baserow values.
  useEffect(() => {
    if (allProducts.length === 0) return;
    setCart((prev) =>
      prev.map((item) => {
        const fresh = allProducts.find((p) => p.id === item.product.id);
        return fresh ? { ...item, product: fresh } : item;
      })
    );
  }, [allProducts]);

  // Restore auth session from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("cremson_token");
    const savedRole = localStorage.getItem("cremson_role");
    if (token) {
      setAuthToken(token);
      if (savedRole) {
        setUser({ role: savedRole });
      }
      getMe(token)
        .then((u) => {
          setUser(u);
          localStorage.setItem("cremson_role", u.role);
          // Load cart + wishlist from backend
          return Promise.all([getCart(), getWishlist()]);
        })
        .then(([cartRows, wishlistIds]) => {
          setCart(dedupeCart(cartRows.map(rowToCartItem)));
          setWishlist(wishlistIds);
          backendLoaded.current = true;
        })
        .catch(() => {
          localStorage.removeItem("cremson_token");
          localStorage.removeItem("cremson_role");
          setAuthToken(null);
          setUser(null);
          // Fall back to localStorage
          _loadFromLocalStorage();
        })
        .finally(() => setAuthLoading(false));
    } else {
      _loadFromLocalStorage();
      setAuthLoading(false);
    }
  }, []);

  function _loadFromLocalStorage() {
    try {
      const savedCart = localStorage.getItem("cremson_cart");
      if (savedCart) setCart(JSON.parse(savedCart));
    } catch (e) { console.error("Error loading cart", e); }
    try {
      const savedWishlist = localStorage.getItem("cremson_wishlist");
      if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
    } catch (e) { console.error("Error loading wishlist", e); }
  }

  // Persist to localStorage for guests; backend handles logged-in users
  useEffect(() => {
    if (user) return; // backend is source of truth
    if (cart.length > 0) {
      localStorage.setItem("cremson_cart", JSON.stringify(cart));
    } else {
      localStorage.removeItem("cremson_cart");
    }
  }, [cart, user]);

  useEffect(() => {
    if (user) return;
    if (wishlist.length > 0) {
      localStorage.setItem("cremson_wishlist", JSON.stringify(wishlist));
    } else {
      localStorage.removeItem("cremson_wishlist");
    }
  }, [wishlist, user]);

  const showToast = (message, type = "success") => {
    if (type === "error") toast.error(message);
    else if (type === "info") toast.info(message);
    else toast.success(message);
  };

  const authLogin = async (token, userData) => {
    localStorage.setItem("cremson_token", token);
    localStorage.setItem("cremson_role", userData.role || "customer");
    setAuthToken(token);
    setUser(userData);

    // Merge local cart + wishlist into backend, then use backend as source
    try {
      const localCartRaw = localStorage.getItem("cremson_cart");
      const localWishlistRaw = localStorage.getItem("cremson_wishlist");
      const localCart = localCartRaw ? JSON.parse(localCartRaw) : [];
      const localWishlist = localWishlistRaw ? JSON.parse(localWishlistRaw) : [];

      const [cartRows, wishlistIds] = await Promise.all([
        syncCart(localCart.map(cartItemToRow)),
        syncWishlist(localWishlist),
      ]);

      setCart(dedupeCart(cartRows.map(rowToCartItem)));
      setWishlist(wishlistIds);
      backendLoaded.current = true;

      // Clear local copies — backend is now the source
      localStorage.removeItem("cremson_cart");
      localStorage.removeItem("cremson_wishlist");
    } catch (e) {
      console.error("Failed to sync cart/wishlist on login", e);
    }
  };

  const authLogout = () => {
    localStorage.clear();
    setAuthToken(null);
    setUser(null);
    setCart([]);
    setWishlist([]);
    backendLoaded.current = false;
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  const triggerCartToast = (product, quantity, action) => {
    // action: 'added' | 'increased' | 'decreased' | 'removed'
    toast.dismiss();
    toast.custom((t) => (
      <div className="flex items-center gap-3.5 bg-white border border-gray-100 rounded-2xl p-3 sm:p-4 shadow-[0_10px_30px_rgba(0,0,0,0.08)] max-w-sm w-full border-l-4 border-l-orange-500 pointer-events-auto">
        <div className="relative w-12 h-16 bg-gray-50 flex-shrink-0 flex items-center justify-center rounded-lg border border-gray-100 overflow-hidden">
          <img src={product.image || null} alt={product.title} className="max-w-full max-h-full object-contain" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
            {action === 'added' && 'Added to Cart'}
            {action === 'increased' && 'Increased Qty'}
            {action === 'decreased' && 'Decreased Qty'}
            {action === 'removed' && 'Removed from Cart'}
          </p>
          <h4 className="text-sm font-bold text-gray-900 truncate mt-0.5">{product.title}</h4>
          <div className="flex items-center gap-2 mt-1.5 text-left">
            {action !== 'removed' ? (
              <>
                <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">Qty: {quantity}</span>
                <span className="text-sm font-extrabold text-gray-900">₹{product.price * quantity}</span>
              </>
            ) : (
              <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Removed</span>
            )}
          </div>
        </div>
        {action !== 'removed' && (
          <a
            href="/cart"
            onClick={() => toast.dismiss(t)}
            className="text-xs font-extrabold text-white bg-orange-500 hover:bg-orange-600 px-3.5 py-2.5 rounded-xl transition-all shadow-md active:scale-95 whitespace-nowrap"
          >
            View Cart
          </a>
        )}
      </div>
    ), {
      duration: 3500,
    });
  };

  // ── Cart operations ──────────────────────────────────────────────────────────

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((i) => i.product.id === product.id);
      const newQty = existing ? existing.quantity + 1 : 1;
      const newCart = existing
        ? prevCart.map((i) => i.product.id === product.id ? { ...i, quantity: newQty } : i)
        : [...prevCart, { product, quantity: 1 }];

      if (user) {
        addCartItem(product, newQty).catch(console.error);
      }

      triggerCartToast(product, newQty, existing ? 'increased' : 'added');

      return newCart;
    });
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => {
      const item = prevCart.find((i) => i.product.id === productId);
      if (item) {
        triggerCartToast(item.product, 0, 'removed');
      }
      return prevCart.filter((i) => i.product.id !== productId);
    });
    if (user) {
      removeCartItem(productId).catch(console.error);
    }
  };

  const updateQuantity = (productId, delta) => {
    setCart((prevCart) => {
      const item = prevCart.find((i) => i.product.id === productId);
      if (!item) return prevCart;

      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        if (user) {
          removeCartItem(productId).catch(console.error);
        }
        triggerCartToast(item.product, 0, 'removed');
        return prevCart.filter((i) => i.product.id !== productId);
      }

      triggerCartToast(item.product, newQty, delta > 0 ? 'increased' : 'decreased');

      if (user) {
        updateCartItem(productId, newQty).catch(console.error);
      }

      return prevCart.map((i) => i.product.id === productId ? { ...i, quantity: newQty } : i);
    });
  };

  const clearCart = () => {
    setCart([]);
    if (user) {
      clearCartApi().catch(console.error);
    }
  };

  // ── Wishlist operations ──────────────────────────────────────────────────────

  const toggleWishlist = (book) => {
    setWishlist((prev) => {
      const isIn = prev.includes(book.id);
      if (isIn) {
        if (user) removeWishlistItem(book.id).catch(console.error);
        toast.info(`Removed from wishlist`);
        return prev.filter((id) => id !== book.id);
      } else {
        if (user) addWishlistItem(book.id).catch(console.error);
        toast.success(`Added to wishlist`);
        return [...prev, book.id];
      }
    });
  };

  const clearWishlist = () => {
    setWishlist([]);
    if (user) {
      clearWishlistApi().catch(console.error);
    }
  };

  return (
    <AppContext.Provider
      value={{
        cart,
        setCart,
        wishlist,
        setWishlist,
        isCartOpen,
        setIsCartOpen,
        isWishlistOpen,
        setIsWishlistOpen,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        searchQuery,
        setSearchQuery,
        showToast,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleWishlist,
        clearWishlist,
        user,
        setUser,
        authToken,
        authLoading,
        authLogin,
        authLogout,
        allProducts,
        productsLoading,
        appliedCoupon,
        setAppliedCoupon,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
