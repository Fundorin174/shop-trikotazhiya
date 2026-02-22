import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { loadAllProducts } from "../product-cache";

/**
 * GET /store/products/sorted
 *
 * Возвращает товары с серверной сортировкой, включая по цене.
 * Кеширует полный список товаров в Redis (TTL 120 сек).
 *
 * Query params:
 *   ?sort=price_asc | price_desc | created_at_desc | title_asc
 *   ?type=футер           — фильтр по metadata.fabric_type
 *   ?min_price=100        — мин. цена (руб.)
 *   ?max_price=1000       — макс. цена (руб.)
 *   ?width_min=140        — мин. ширина (см)
 *   ?width_max=180        — макс. ширина (см)
 *   ?limit=12             — количество на странице
 *   ?page=1               — номер страницы
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const {
    sort,
    type,
    min_price,
    max_price,
    width_min,
    width_max,
    limit: limitQ,
    page: pageQ,
  } = req.query as Record<string, string | undefined>;

  const limit = parseInt(limitQ || "12") || 12;
  const page = parseInt(pageQ || "1") || 1;

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  // Загружаем товары (из кеша или БД)
  let products = await loadAllProducts(query);

  // ── Фильтрация ──

  if (type) {
    products = products.filter((p) => p.metadata?.fabric_type === type);
  }

  if (min_price) {
    const min = Number(min_price);
    if (!isNaN(min)) {
      products = products.filter((p) => {
        const price = p.variants?.[0]?.prices?.[0]?.amount;
        return price != null && price >= min;
      });
    }
  }

  if (max_price) {
    const max = Number(max_price);
    if (!isNaN(max)) {
      products = products.filter((p) => {
        const price = p.variants?.[0]?.prices?.[0]?.amount;
        return price != null && price <= max;
      });
    }
  }

  if (width_min) {
    const min = Number(width_min);
    if (!isNaN(min)) {
      products = products.filter((p) => {
        const w = Number(p.metadata?.width_cm);
        return !isNaN(w) && w >= min;
      });
    }
  }

  if (width_max) {
    const max = Number(width_max);
    if (!isNaN(max)) {
      products = products.filter((p) => {
        const w = Number(p.metadata?.width_cm);
        return !isNaN(w) && w <= max;
      });
    }
  }

  // ── Сортировка ──

  if (sort) {
    switch (sort) {
      case "price_asc":
        products.sort((a, b) => {
          const pa = a.variants?.[0]?.prices?.[0]?.amount ?? Infinity;
          const pb = b.variants?.[0]?.prices?.[0]?.amount ?? Infinity;
          return pa - pb;
        });
        break;
      case "price_desc":
        products.sort((a, b) => {
          const pa = a.variants?.[0]?.prices?.[0]?.amount ?? 0;
          const pb = b.variants?.[0]?.prices?.[0]?.amount ?? 0;
          return pb - pa;
        });
        break;
      case "title_asc":
        products.sort((a, b) =>
          (a.title || "").localeCompare(b.title || "", "ru")
        );
        break;
      case "created_at_desc":
        products.sort((a, b) => {
          const da = a.created_at ? new Date(a.created_at).getTime() : 0;
          const db = b.created_at ? new Date(b.created_at).getTime() : 0;
          return db - da;
        });
        break;
    }
  }

  // ── Пагинация ──

  const total = products.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const offset = (safePage - 1) * limit;
  const paginated = products.slice(offset, offset + limit);

  res.json({
    products: paginated,
    count: total,
    page: safePage,
    totalPages,
    limit,
  });
}
