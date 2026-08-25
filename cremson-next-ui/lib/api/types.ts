// ---------------------------------------------------------------------------
// Baserow pagination envelope
// ---------------------------------------------------------------------------

export interface BaserowPage<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ---------------------------------------------------------------------------
// Users  (table 761)
// ---------------------------------------------------------------------------

export interface User {
  id: number;
  order: string;
  /** Display name or username */
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  role?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Orders  (table 762)
// ---------------------------------------------------------------------------

export interface Order {
  id: number;
  order: string;
  order_number?: string;
  order_status?: string;
  total_amount?: number;
  subtotal?: number;
  discount?: number;
  shipping_cost?: number;
  tax?: number;
  payment_method?: string;
  payment_status?: string;
  shipping_address?: string;
  notes?: string;
  user_id?: number;
  coupon_id?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Products  (table 763)
// ---------------------------------------------------------------------------

export interface Product {
  id: number;
  order: string;
  name?: string;
  description?: string;
  price?: number;
  sale_price?: number;
  sku?: string;
  stock?: number;
  is_active?: boolean;
  category_id?: number;
  image_url?: string;
  images?: string;
  weight?: number;
  dimensions?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Categories  (table 764)
// ---------------------------------------------------------------------------

export interface Category {
  id: number;
  order: string;
  name?: string;
  slug?: string;
  description?: string;
  parent_id?: number | null;
  image_url?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Reviews  (table 765)
// ---------------------------------------------------------------------------

export interface Review {
  id: number;
  order: string;
  rating?: number;
  title?: string;
  body?: string;
  user_id?: number;
  product_id?: number;
  is_approved?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Coupons  (table 766)
// ---------------------------------------------------------------------------

export interface Coupon {
  id: number;
  order: string;
  code?: string;
  description?: string;
  discount_type?: "percentage" | "fixed" | string;
  discount_value?: number;
  minimum_order?: number;
  max_discount_amount?: number;
  max_uses?: number;
  uses_count?: number;
  is_active?: boolean;
  first_order_only?: boolean;
  valid_from?: string;
  valid_until?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Specimen Requests  (table 767)
// ---------------------------------------------------------------------------

export interface SpecimenRequest {
  id: number;
  order: string;
  requester_name?: string;
  requester_email?: string;
  requester_phone?: string;
  company?: string;
  product_id?: number;
  quantity?: number;
  status?: string;
  notes?: string;
  shipping_address?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Shipping Settings  (table 768)
// ---------------------------------------------------------------------------

export interface ShippingSetting {
  id: number;
  order: string;
  name?: string;
  carrier?: string;
  method?: string;
  price?: number;
  free_above?: number;
  estimated_days?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}
