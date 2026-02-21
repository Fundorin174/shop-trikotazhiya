import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import type FabricModuleService from "../../../../modules/fabric/service";

/**
 * ============================================
 * Store API: GET /store/fabrics/:id
 * ============================================
 *
 * Публичный эндпоинт — один товар-ткань по ID.
 * Без приватных данных.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const fabricService: FabricModuleService = req.scope.resolve("fabricModuleService");
  const { id } = req.params;

  try {
    const fabric = await fabricService.retrieveFabricAttribute(id);
    res.json({ fabric });
  } catch {
    res.status(404).json({ message: "Ткань не найдена" });
  }
}
