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
export const adminMarkReadyForPickup = (orderId) => api.post(`/api/orders/${orderId}/ready-for-pickup`).then(r => r.data);
export const adminReturnOrder = (orderId, data) => api.post(`/api/orders/${orderId}/return`, data).then(r => r.data);
export const adminIssueRefund = (orderId, data) => api.post(`/api/orders/${orderId}/refund`, data).then(r => r.data);


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
export const adminApproveSpecimen = (id) => api.patch(`/api/specimen-requests/${id}/approve`).then(r => r.data);
export const adminRejectSpecimen = (id) => api.patch(`/api/specimen-requests/${id}/reject`).then(r => r.data);
export const adminBulkApproveSpecimen = (ids) => api.post("/api/specimen-requests/bulk-approve", { ids }).then(r => r.data);
export const adminBulkRejectSpecimen = (ids) => api.post("/api/specimen-requests/bulk-reject", { ids }).then(r => r.data);

// Shipping Settings
export const adminGetShippingSettings = (params) => api.get("/api/shipping-settings/", { params }).then(r => r.data);
export const adminUpdateShippingSetting = (id, data) => api.patch(`/api/shipping-settings/${id}`, data).then(r => r.data);

// CRM
// Schools
export const adminCreateSchool = (data) => api.post("/api/crm/schools", data).then(r => r.data);
export const adminUpdateSchool = (id, data) => api.patch(`/api/crm/schools/${id}`, data).then(r => r.data);
export const adminDeleteSchool = (id) => api.delete(`/api/crm/schools/${id}`).then(r => r.data);

// Teachers
export const adminCreateTeacher = (data) => api.post("/api/crm/teachers", data).then(r => r.data);
export const adminUpdateTeacher = (id, data) => api.patch(`/api/crm/teachers/${id}`, data).then(r => r.data);
export const adminDeleteTeacher = (id) => api.delete(`/api/crm/teachers/${id}`).then(r => r.data);

// Books (CRM)
export const adminCreateCRMBook = (data) => api.post("/api/crm/books", data).then(r => r.data);
export const adminUpdateCRMBook = (id, data) => api.patch(`/api/crm/books/${id}`, data).then(r => r.data);
export const adminDeleteCRMBook = (id) => api.delete(`/api/crm/books/${id}`).then(r => r.data);

// Subjects
export const adminCreateSubject = (data) => api.post("/api/crm/subjects", data).then(r => r.data);
export const adminUpdateSubject = (id, data) => api.patch(`/api/crm/subjects/${id}`, data).then(r => r.data);
export const adminDeleteSubject = (id) => api.delete(`/api/crm/subjects/${id}`).then(r => r.data);

// Specimen Requests (CRM)
export const adminCreateSpecimenRequest = (data) => api.post("/api/specimen-requests/", data).then(r => r.data);
export const adminUpdateSpecimenRequest = (id, data) => api.patch(`/api/specimen-requests/${id}`, data).then(r => r.data);
export const adminDeleteSpecimenRequest = (id) => api.delete(`/api/specimen-requests/${id}`).then(r => r.data);
