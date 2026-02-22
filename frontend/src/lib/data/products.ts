/**
 * Функции для получения данных о товарах из Medusa.
 * Используются в Server Components для SSR/ISR.
 */
import { medusaFetch } from "@/lib/medusa-client";
import type { Product, ProductListResponse, ProductFilters } from "@/types/product";

const PRODUCTS_LIMIT = 12;

/** Поля для запроса — включаем variants с ценами, наличием, изображениями и metadata */
const PRODUCT_FIELDS = "*variants,*variants.prices,*variants.inventory_quantity,*images,*metadata";

/** Результат пагинированного списка */
export interface PaginatedProducts {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

/** Ответ от /store/products/sorted */
interface SortedProductsResponse {
  products: Product[];
  count: number;
  page: number;
  totalPages: number;
  limit: number;
}

/**
 * Получить список товаров с фильтрами, сортировкой и пагинацией.
 * Вся логика (включая сортировку по цене) выполняется на бэкенде
 * через кастомный endpoint GET /store/products/sorted.
 */
export async function getProductsList(
  filters: ProductFilters = {},
  page = 1
): Promise<PaginatedProducts> {
  const limit = filters.limit ? Number(filters.limit) : PRODUCTS_LIMIT;

  const params = new URLSearchParams();
  params.set("limit", String(limit));
  params.set("page", String(page));

  if (filters.type) params.set("type", filters.type);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.min_price) params.set("min_price", filters.min_price);
  if (filters.max_price) params.set("max_price", filters.max_price);
  if (filters.width_min) params.set("width_min", filters.width_min);
  if (filters.width_max) params.set("width_max", filters.width_max);

  try {
    const data = await medusaFetch<SortedProductsResponse>(
      `/store/products/sorted?${params.toString()}`
    );

    return {
      products: data.products,
      total: data.count,
      page: data.page,
      totalPages: data.totalPages,
      limit: data.limit,
    };
  } catch (error) {
    console.error("[getProductsList] Failed to fetch products:", error);
    return { products: [], total: 0, page: 1, totalPages: 1, limit };
  }
}

/**
 * Получить товар по handle (URL slug).
 * Используется для SSR страницы /products/[handle].
 */
export async function getProductByHandle(
  handle: string
): Promise<Product | null> {
  try {
    const data = await medusaFetch<ProductListResponse>(
      `/store/products?handle=${handle}&limit=1&fields=${PRODUCT_FIELDS}`
    );
    return data.products[0] || null;
  } catch {
    return null;
  }
}

/**
 * Получить «рекомендуемые» товары для главной страницы.
 * Бэкенд сортирует: сначала со скидкой (по убыванию %), затем остальные.
 */
export async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const data = await medusaFetch<ProductListResponse>(
      `/store/products/featured?limit=8`
    );
    return data.products;
  } catch {
    return [];
  }
}

/**
 * Получить похожие товары (из той же коллекции).
 */
export async function getRelatedProducts(
  productId: string,
  collectionId?: string | null
): Promise<Product[]> {
  if (!collectionId) return [];

  try {
    const data = await medusaFetch<ProductListResponse>(
      `/store/products?collection_id=${collectionId}&limit=4&fields=${PRODUCT_FIELDS}`
    );
    // Исключаем текущий товар
    return data.products.filter((p) => p.id !== productId);
  } catch {
    return [];
  }
}
