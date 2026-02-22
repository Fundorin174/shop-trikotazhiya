import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * GET /store/products/featured
 *
 * Возвращает товары для раздела «Популярные ткани».
 * Сортировка: сначала товары со скидкой (по убыванию discount_percent),
 * затем остальные.
 *
 * Query params:
 *   ?limit=8 — количество товаров (по умолчанию 8)
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const limit = parseInt(req.query.limit as string) || 8;

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  // Загружаем все published товары с вариантами, ценами и изображениями
  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "subtitle",
      "handle",
      "description",
      "thumbnail",
      "status",
      "metadata",
      "images.*",
      "variants.*",
      "variants.prices.*",
      "variants.inventory_quantity",
    ],
    filters: {
      status: "published",
    },
  });

  // Сортируем: скидка по убыванию, затем без скидки
  const sorted = (products as any[]).sort((a, b) => {
    const da = Number(a.metadata?.discount_percent) || 0;
    const db = Number(b.metadata?.discount_percent) || 0;
    return db - da;
  });

  res.json({
    products: sorted.slice(0, limit),
    count: sorted.length,
  });
}
