import api from "./axios";

export const getCart = () => api.get("/api/cart/").then((r) => r.data);

export const addCartItem = (product, quantity = 1) =>
  api.post("/api/cart/", {
    product_id: product.id,
    quantity,
    title: product.title,
    price: product.price,
    original_price: product.originalPrice ?? null,
    image: product.image,
    author: product.author,
    category: product.category,
  }).then((r) => r.data);

export const updateCartItem = (productId, quantity) =>
  api.put(`/api/cart/${productId}`, { quantity }).then((r) => r.data);

export const removeCartItem = (productId) =>
  api.delete(`/api/cart/${productId}`);

export const clearCartApi = () => api.delete("/api/cart/");

// items = [{product_id, quantity, title, price, original_price, image, author, category}]
export const syncCart = (items) =>
  api.post("/api/cart/sync", { items }).then((r) => r.data);
