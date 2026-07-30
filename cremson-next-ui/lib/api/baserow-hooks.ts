/**
 * TanStack Query hooks for all Cremson Baserow-backed API endpoints.
 *
 * Install deps:
 *   npm install @tanstack/react-query
 *
 * Wrap your app with <QueryClientProvider client={queryClient}> before using
 * any of these hooks.
 */

import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import type {
  BaserowPage,
  User,
  Order,
  Product,
  Category,
  Review,
  Coupon,
  SpecimenRequest,
  ShippingSetting,
} from "./types";

// ---------------------------------------------------------------------------
// Base config
// ---------------------------------------------------------------------------

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL !== undefined
    ? process.env.NEXT_PUBLIC_API_URL
    : "http://localhost:8000";

// ---------------------------------------------------------------------------
// Generic fetcher
// ---------------------------------------------------------------------------

async function fetchAPI<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Helper: build query string from an object, omitting undefined/null values
// ---------------------------------------------------------------------------

function buildQuery(params: Record<string, unknown>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      qs.set(key, String(value));
    }
  }
  const str = qs.toString();
  return str ? `?${str}` : "";
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export interface UseUsersParams {
  page?: number;
  size?: number;
  search?: string;
}

export function useUsers(
  params: UseUsersParams = {},
  options?: Omit<UseQueryOptions<BaserowPage<User>>, "queryKey" | "queryFn">
) {
  const { page = 1, size = 100, search } = params;
  const qs = buildQuery({ page, size, search });
  return useQuery<BaserowPage<User>>({
    queryKey: ["users", page, size, search],
    queryFn: () => fetchAPI<BaserowPage<User>>(`/api/users/${qs}`),
    ...options,
  });
}

export function useUser(
  id: number | undefined,
  options?: Omit<UseQueryOptions<User>, "queryKey" | "queryFn">
) {
  return useQuery<User>({
    queryKey: ["users", id],
    queryFn: () => fetchAPI<User>(`/api/users/${id}`),
    enabled: id !== undefined,
    ...options,
  });
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export interface UseOrdersParams {
  page?: number;
  size?: number;
  search?: string;
  order_status?: string;
}

export function useOrders(
  params: UseOrdersParams = {},
  options?: Omit<UseQueryOptions<BaserowPage<Order>>, "queryKey" | "queryFn">
) {
  const { page = 1, size = 100, search, order_status } = params;
  const qs = buildQuery({ page, size, search, order_status });
  return useQuery<BaserowPage<Order>>({
    queryKey: ["orders", page, size, search, order_status],
    queryFn: () => fetchAPI<BaserowPage<Order>>(`/api/orders/${qs}`),
    ...options,
  });
}

export function useOrder(
  id: number | undefined,
  options?: Omit<UseQueryOptions<Order>, "queryKey" | "queryFn">
) {
  return useQuery<Order>({
    queryKey: ["orders", id],
    queryFn: () => fetchAPI<Order>(`/api/orders/${id}`),
    enabled: id !== undefined,
    ...options,
  });
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export interface UseProductsParams {
  page?: number;
  size?: number;
  search?: string;
  category_id?: number;
  is_active?: boolean;
}

export function useProducts(
  params: UseProductsParams = {},
  options?: Omit<UseQueryOptions<BaserowPage<Product>>, "queryKey" | "queryFn">
) {
  const { page = 1, size = 100, search, category_id, is_active } = params;
  const qs = buildQuery({ page, size, search, category_id, is_active });
  return useQuery<BaserowPage<Product>>({
    queryKey: ["products", page, size, search, category_id, is_active],
    queryFn: () => fetchAPI<BaserowPage<Product>>(`/api/products/${qs}`),
    ...options,
  });
}

export function useProduct(
  id: number | undefined,
  options?: Omit<UseQueryOptions<Product>, "queryKey" | "queryFn">
) {
  return useQuery<Product>({
    queryKey: ["products", id],
    queryFn: () => fetchAPI<Product>(`/api/products/${id}`),
    enabled: id !== undefined,
    ...options,
  });
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export interface UseCategoriesParams {
  page?: number;
  size?: number;
  search?: string;
}

export function useCategories(
  params: UseCategoriesParams = {},
  options?: Omit<
    UseQueryOptions<BaserowPage<Category>>,
    "queryKey" | "queryFn"
  >
) {
  const { page = 1, size = 100, search } = params;
  const qs = buildQuery({ page, size, search });
  return useQuery<BaserowPage<Category>>({
    queryKey: ["categories", page, size, search],
    queryFn: () => fetchAPI<BaserowPage<Category>>(`/api/categories/${qs}`),
    ...options,
  });
}

export function useCategory(
  id: number | undefined,
  options?: Omit<UseQueryOptions<Category>, "queryKey" | "queryFn">
) {
  return useQuery<Category>({
    queryKey: ["categories", id],
    queryFn: () => fetchAPI<Category>(`/api/categories/${id}`),
    enabled: id !== undefined,
    ...options,
  });
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export interface UseReviewsParams {
  page?: number;
  size?: number;
  search?: string;
}

export function useReviews(
  params: UseReviewsParams = {},
  options?: Omit<UseQueryOptions<BaserowPage<Review>>, "queryKey" | "queryFn">
) {
  const { page = 1, size = 100, search } = params;
  const qs = buildQuery({ page, size, search });
  return useQuery<BaserowPage<Review>>({
    queryKey: ["reviews", page, size, search],
    queryFn: () => fetchAPI<BaserowPage<Review>>(`/api/reviews/${qs}`),
    ...options,
  });
}

export function useReview(
  id: number | undefined,
  options?: Omit<UseQueryOptions<Review>, "queryKey" | "queryFn">
) {
  return useQuery<Review>({
    queryKey: ["reviews", id],
    queryFn: () => fetchAPI<Review>(`/api/reviews/${id}`),
    enabled: id !== undefined,
    ...options,
  });
}

// ---------------------------------------------------------------------------
// Coupons
// ---------------------------------------------------------------------------

export interface UseCouponsParams {
  page?: number;
  size?: number;
  search?: string;
}

export function useCoupons(
  params: UseCouponsParams = {},
  options?: Omit<UseQueryOptions<BaserowPage<Coupon>>, "queryKey" | "queryFn">
) {
  const { page = 1, size = 100, search } = params;
  const qs = buildQuery({ page, size, search });
  return useQuery<BaserowPage<Coupon>>({
    queryKey: ["coupons", page, size, search],
    queryFn: () => fetchAPI<BaserowPage<Coupon>>(`/api/coupons/${qs}`),
    ...options,
  });
}

export function useCoupon(
  id: number | undefined,
  options?: Omit<UseQueryOptions<Coupon>, "queryKey" | "queryFn">
) {
  return useQuery<Coupon>({
    queryKey: ["coupons", id],
    queryFn: () => fetchAPI<Coupon>(`/api/coupons/${id}`),
    enabled: id !== undefined,
    ...options,
  });
}

// ---------------------------------------------------------------------------
// Specimen Requests
// ---------------------------------------------------------------------------

export interface UseSpecimenRequestsParams {
  page?: number;
  size?: number;
  search?: string;
}

export function useSpecimenRequests(
  params: UseSpecimenRequestsParams = {},
  options?: Omit<
    UseQueryOptions<BaserowPage<SpecimenRequest>>,
    "queryKey" | "queryFn"
  >
) {
  const { page = 1, size = 100, search } = params;
  const qs = buildQuery({ page, size, search });
  return useQuery<BaserowPage<SpecimenRequest>>({
    queryKey: ["specimen_requests", page, size, search],
    queryFn: () =>
      fetchAPI<BaserowPage<SpecimenRequest>>(`/api/specimen-requests/${qs}`),
    ...options,
  });
}

export function useSpecimenRequest(
  id: number | undefined,
  options?: Omit<UseQueryOptions<SpecimenRequest>, "queryKey" | "queryFn">
) {
  return useQuery<SpecimenRequest>({
    queryKey: ["specimen_requests", id],
    queryFn: () => fetchAPI<SpecimenRequest>(`/api/specimen-requests/${id}`),
    enabled: id !== undefined,
    ...options,
  });
}

// ---------------------------------------------------------------------------
// Shipping Settings
// ---------------------------------------------------------------------------

export function useShippingSettings(
  options?: Omit<
    UseQueryOptions<BaserowPage<ShippingSetting>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery<BaserowPage<ShippingSetting>>({
    queryKey: ["shipping_settings"],
    queryFn: () =>
      fetchAPI<BaserowPage<ShippingSetting>>(`/api/shipping-settings/`),
    // Shipping settings rarely change — cache for 5 minutes
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useShippingSetting(
  id: number | undefined,
  options?: Omit<UseQueryOptions<ShippingSetting>, "queryKey" | "queryFn">
) {
  return useQuery<ShippingSetting>({
    queryKey: ["shipping_settings", id],
    queryFn: () =>
      fetchAPI<ShippingSetting>(`/api/shipping-settings/${id}`),
    enabled: id !== undefined,
    ...options,
  });
}
