import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { loadAllProducts } from "../product-cache";

/**
 * GET /store/products/featured
 *
 * Возвращает товары для раздела «Популярные ткани».
 * Сортировка: сначала товары со скидкой (по убыванию discount_percent).
 * Использует общий Redis-кеш.
 *
 * Query params:
 *   ?limit=8 — количество товаров (по умолчанию 8)
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const limit = parseInt(req.query.limit as string) || 8;

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const products = await loadAllProducts(query);

  // Сортируем: скидка по убыванию, затем без скидки
  const sorted = [...products].sort((a: any, b: any) => {
    const da = Number(a.metadata?.discount_percent) || 0;
    const db = Number(b.metadata?.discount_percent) || 0;
    return db - da;
  });

  res.json({
    products: sorted.slice(0, limit),
    count: sorted.length,
  });
}
