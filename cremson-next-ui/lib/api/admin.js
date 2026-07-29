import api from "./axios";

// Products
export const adminGetProducts = (params) => api.get("/api/products/", { params }).then(r => r.data);
export const adminCreateProduct = (data) => api.post("/api/products/", data).then(r => r.data);
export const adminUpdateProduct = (id, data) => api.patch(`/api/products/${id}`, data).then(r => r.data);
export const adminDeleteProduct = (id) => api.delete(`/api/products/${id}`).then(r => r.data);

// Categories
export const adminGetCategories = (params) => api.get("/api/categories/", { params }).then(r => r.data);
export const adminCreateCategory = (data) => api.post("/api/categories/", data).then(r => r.data);
export const adminUpdateCategory = (id, data) => api.patch(`/api/categories/${id}`, data).then(r => r.data);
export const adminDeleteCategory = (id) => api.delete(`/api/categories/${id}`).then(r => r.data);

// Orders
export const adminGetOrders = (params) => api.get("/api/orders/", { params }).then(r => r.data);
export const adminUpdateOrderStatus = (id, status) => api.patch(`/api/orders/${id}`, { order_status: status }).then(r => r.data);

// Coupons
export const adminGetCoupons = (params) => api.get("/api/coupons/", { params }).then(r => r.data);
export const adminCreateCoupon = (data) => api.post("/api/coupons/", data).then(r => r.data);
export const adminUpdateCoupon = (id, data) => api.patch(`/api/coupons/${id}`, data).then(r => r.data);
export const adminDeleteCoupon = (id) => api.delete(`/api/coupons/${id}`).then(r => r.data);

// Reviews
export const adminGetReviews = (params) => api.get("/api/reviews/", { params }).then(r => r.data);
export const adminDeleteReview = (id) => api.delete(`/api/reviews/${id}`).then(r => r.data);

// Specimen Requests
export const adminGetSpecimenRequests = (params) => api.get("/api/specimen-requests/", { params }).then(r => r.data);
export const adminUpdateSpecimenStatus = (id, status) => api.patch(`/api/specimen-requests/${id}`, { status }).then(r => r.data);

// Shipping Settings
export const adminGetShippingSettings = (params) => api.get("/api/shipping-settings/", { params }).then(r => r.data);
export const adminUpdateShippingSetting = (id, data) => api.patch(`/api/shipping-settings/${id}`, data).then(r => r.data);
