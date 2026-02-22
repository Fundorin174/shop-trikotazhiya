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

/**
 * Получить список товаров с фильтрами и серверной пагинацией.
 * Фильтрация по metadata (type, price, width) выполняется в Node,
 * поэтому загружаем все товары из Medusa, фильтруем и пагинируем.
 */
export async function getProductsList(
  filters: ProductFilters = {},
  page = 1
): Promise<PaginatedProducts> {
  const limit = filters.limit ? Number(filters.limit) : PRODUCTS_LIMIT;

  const params = new URLSearchParams({
    limit: "100",
    offset: "0",
    fields: PRODUCT_FIELDS,
  });

  // Фильтры каталога (collection — серверный фильтр Medusa)
  if (filters.collection) params.set("collection_id", filters.collection);
  if (filters.sort) {
    // Формат: "price_asc", "title_desc", "created_at_desc"
    const [field, order] = filters.sort.split("_");
    params.set("order", `${order === "desc" ? "-" : ""}${field}`);
  }

  try {
    const data = await medusaFetch<ProductListResponse>(
      `/store/products?${params.toString()}`
    );

    let products = data.products;

    // fabric_type хранится в metadata — фильтруем на клиенте
    if (filters.type) {
      products = products.filter(
        (p) => p.metadata?.fabric_type === filters.type
      );
    }

    // Фильтрация по цене (price.amount = руб, фильтр вводится в руб)
    if (filters.min_price) {
      const min = Number(filters.min_price);
      if (!isNaN(min)) {
        products = products.filter((p) => {
          const price = p.variants?.[0]?.prices?.[0]?.amount;
          return price != null && price >= min;
        });
      }
    }
    if (filters.max_price) {
      const max = Number(filters.max_price);
      if (!isNaN(max)) {
        products = products.filter((p) => {
          const price = p.variants?.[0]?.prices?.[0]?.amount;
          return price != null && price <= max;
        });
      }
    }

    // Фильтрация по ширине (metadata.width_cm = см, фильтр вводится в см)
    if (filters.width_min) {
      const min = Number(filters.width_min);
      if (!isNaN(min)) {
        products = products.filter((p) => {
          const w = Number(p.metadata?.width_cm);
          return !isNaN(w) && w >= min;
        });
      }
    }
    if (filters.width_max) {
      const max = Number(filters.width_max);
      if (!isNaN(max)) {
        products = products.filter((p) => {
          const w = Number(p.metadata?.width_cm);
          return !isNaN(w) && w <= max;
        });
      }
    }

    const total = products.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const offset = (safePage - 1) * limit;
    const paginatedProducts = products.slice(offset, offset + limit);

    return {
      products: paginatedProducts,
      total,
      page: safePage,
      totalPages,
      limit,
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
