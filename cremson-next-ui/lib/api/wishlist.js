import api from "./axios";

export const getWishlist = () => api.get("/api/wishlist/").then((r) => r.data.product_ids);

export const addWishlistItem = (productId) =>
  api.post("/api/wishlist/", { product_id: productId }).then((r) => r.data.product_ids);

export const removeWishlistItem = (productId) =>
  api.delete(`/api/wishlist/${productId}`);

export const clearWishlistApi = () => api.delete("/api/wishlist/");

export const syncWishlist = (productIds) =>
  api.post("/api/wishlist/sync", { product_ids: productIds }).then((r) => r.data.product_ids);
