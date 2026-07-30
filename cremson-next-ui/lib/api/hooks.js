import { useQuery } from "@tanstack/react-query";
import api from "./axios";
import { fetchAllProducts, fetchProduct } from "./products";

// ── Products ──────────────────────────────────────────────
export function useProducts(params = {}) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => fetchAllProducts(params),
  });
}

export function useProduct(id, initialData) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProduct(id),
    enabled: !!id,
    initialData,
  });
}

// ── Generic list hook (orders, users, coupons, categories, reviews) ──
function makeListHook(resource) {
  return function useList(params = {}) {
    return useQuery({
      queryKey: [resource, params],
      queryFn: async () => {
        const { data } = await api.get(`/api/${resource}/`, { params });
        return data;
      },
    });
  };
}

export const useOrders = makeListHook("orders");
export const useUsers = makeListHook("users");
export const useCoupons = makeListHook("coupons");
export const useCategories = makeListHook("categories");
export const useReviews = makeListHook("reviews");
export const useSpecimenRequests = makeListHook("specimen_requests");
export const useShippingSettings = makeListHook("shipping_settings");
