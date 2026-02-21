import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import type FabricModuleService from "../../../../modules/fabric/service";

/**
 * ============================================
 * Admin API: GET /admin/fabrics
 * ============================================
 *
 * Приватный эндпоинт (требует авторизации админа).
 * Возвращает ВСЕ данные, включая поставщика и закупочную цену.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const fabricService: FabricModuleService = req.scope.resolve("fabricModuleService");

  const { limit = "50", offset = "0" } = req.query as Record<string, string>;

  const [fabrics, count] = await fabricService.listAndCountFabricAttributes(
    {},
    {
      take: parseInt(limit),
      skip: parseInt(offset),
      relations: ["supplier_data"], // ← Включаем приватные данные
    }
  );

  res.json({ fabrics, count, limit: parseInt(limit), offset: parseInt(offset) });
}

/**
 * Admin API: POST /admin/fabrics
 *
 * Создать новую запись ткани (с опциональными данными поставщика).
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const fabricService: FabricModuleService = req.scope.resolve("fabricModuleService");

  const { supplier_data, ...publicData } = req.body as Record<string, unknown> & {
    supplier_data?: Record<string, unknown>;
  };

  const fabric = await fabricService.createFabricWithSupplier(
    publicData,
    supplier_data as Record<string, unknown> | undefined
  );

  res.status(201).json({ fabric });
}
