/**
 * Типы корзины и checkout.
 */

export interface CartItem {
  id: string;
  variant_id: string;
  product_id: string;
  title: string;
  thumbnail?: string | null;
  quantity: number;
  unit_price: number; // В копейках
  subtotal: number;
  metadata?: Record<string, unknown>;
}

export interface Cart {
  id: string;
  items: CartItem[];
  region_id: string;
  subtotal: number;
  discount_total: number;
  shipping_total: number;
  tax_total: number;
  total: number;
  email?: string;
  shipping_address?: Address;
  billing_address?: Address;
}

export interface Address {
  first_name: string;
  last_name: string;
  phone?: string;
  address_1: string;
  address_2?: string;
  city: string;
  province?: string; // Область / край
  postal_code: string;
  country_code: string; // "ru"
}

export interface Order {
  id: string;
  display_id: number;
  status: "pending" | "completed" | "archived" | "canceled" | "requires_action";
  payment_status: "not_paid" | "awaiting" | "captured" | "refunded" | "canceled";
  fulfillment_status: "not_fulfilled" | "partially_fulfilled" | "fulfilled" | "shipped" | "returned";
  items: CartItem[];
  total: number;
  created_at: string;
}
