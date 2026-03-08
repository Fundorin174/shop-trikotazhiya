/**
 * Типы для админ-панели.
 *
 * Используются как на клиенте (admin/page.tsx),
 * так и в API-роутах (api/admin/import, api/admin/products).
 */

// ============================================
// Табы
// ============================================

export type AdminTab = "import" | "products" | "add";

// ============================================
// Импорт
// ============================================

/** Товар для импорта (входные данные из JSON или формы) */
export interface ImportProduct {
  title: string;
  handle?: string;
  subtitle?: string;
  description?: string;
  price: number; // в рублях (будет конвертирован в копейки для метровых)
  sku: string;
  inventory?: number;
  fabric_type: string;
  composition: string;
  quality?: string;
  width_cm: number;
  measurement_unit?: "running_meter" | "piece";
  min_order?: number;
  order_step?: number;
  country?: string;
  collection_name?: string;
  color?: string;
  color_hex?: string;
  short_description?: string;
  full_description?: string;
  video_url?: string;
  discount_percent?: number;
  discount_amount?: number;
  thumbnail?: string;
  images?: string[];
}

/** Результат импорта одного товара */
export interface ImportResult {
  sku: string;
  title: string;
  success: boolean;
  message: string;
  productId?: string;
}

/** Ответ API импорта */
export interface ImportResponse {
  success: boolean;
  summary: { total: number; created: number; failed: number };
  results: ImportResult[];
  error?: string;
}

// ============================================
// Список товаров Medusa
// ============================================

/** Товар из Medusa (для списка в админке) */
export interface MedusaProduct {
  id: string;
  title: string;
  handle: string;
  status: string;
  sku: string;
  variantId: string;
  price: number;
  currency: string;
  fabric_type: string;
  measurement_unit: string;
  inventory: number | null;
  created_at: string;
}

// ============================================
// Сортировка
// ============================================

export type SortKey = "sku" | "title" | "fabric_type" | "price" | "status" | "inventory" | "created_at";
export type SortDir = "asc" | "desc";
