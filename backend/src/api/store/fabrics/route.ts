import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import type FabricModuleService from "../../../modules/fabric/service";

/**
 * ============================================
 * Store API: GET /store/fabrics
 * ============================================
 *
 * Публичный эндпоинт — возвращает атрибуты тканей для витрины.
 * НЕ включает приватные данные (поставщик, закупочная цена).
 *
 * Query params:
 *   ?fabric_type=cotton      — фильтр по типу
 *   ?sku=ART-001             — поиск по артикулу
 *   ?limit=20&offset=0       — пагинация
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const fabricService: FabricModuleService = req.scope.resolve("fabricModuleService");

  const { fabric_type, sku, limit = "20", offset = "0" } = req.query as Record<string, string>;

  // Формируем фильтр
  const filters: Record<string, unknown> = {};
  if (fabric_type) filters.fabric_type = fabric_type;
  if (sku) filters.sku = sku;

  const [fabrics, count] = await fabricService.listAndCountFabricAttributes(
    filters,
    {
      take: parseInt(limit),
      skip: parseInt(offset),
      // НЕ загружаем supplier_data — приватные данные
    }
  );

  res.json({
    fabrics,
    count,
    limit: parseInt(limit),
    offset: parseInt(offset),
  });
}
