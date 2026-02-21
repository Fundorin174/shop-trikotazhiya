/**
 * Функции для получения данных о товарах из Medusa.
 * Используются в Server Components для SSR/ISR.
 */
import { medusaFetch } from "@/lib/medusa-client";
import type { Product, ProductListResponse, ProductFilters } from "@/types/product";

const PRODUCTS_LIMIT = 20;

/**
 * Получить список товаров с фильтрами и пагинацией.
 */
export async function getProductsList(
  filters: ProductFilters = {},
  page = 1
): Promise<Product[]> {
  const offset = (page - 1) * PRODUCTS_LIMIT;

  const params = new URLSearchParams({
    limit: String(filters.limit || PRODUCTS_LIMIT),
    offset: String(offset),
  });

  // Фильтры каталога
  if (filters.type) params.set("type", filters.type);
  if (filters.collection) params.set("collection_id", filters.collection);
  if (filters.sort) {
    // Формат: "price_asc", "title_desc", "created_at_desc"
    const [field, order] = filters.sort.split("_");
    params.set("order", `${order === "desc" ? "-" : ""}${field}`);
  }

  const data = await medusaFetch<ProductListResponse>(
    `/store/products?${params.toString()}`
  );

  return data.products;
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
      `/store/products?handle=${handle}&limit=1`
    );
    return data.products[0] || null;
  } catch {
    return null;
  }
}

/**
 * Получить «рекомендуемые» товары для главной страницы.
 * Выбираем из коллекции "featured" или последние добавленные.
 */
export async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const data = await medusaFetch<ProductListResponse>(
      `/store/products?limit=8&order=-created_at`
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
      `/store/products?collection_id=${collectionId}&limit=4`
    );
    // Исключаем текущий товар
    return data.products.filter((p) => p.id !== productId);
  } catch {
    return [];
  }
}
