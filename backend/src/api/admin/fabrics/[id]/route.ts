import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import type FabricModuleService from "../../../../modules/fabric/service";

/**
 * ============================================
 * Admin API: GET /admin/fabrics/:id
 * ============================================
 *
 * Полные данные о ткани (включая поставщика).
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const fabricService: FabricModuleService = req.scope.resolve("fabricModuleService");
  const { id } = req.params;

  try {
    const fabric = await fabricService.getWithSupplierData(id);
    res.json({ fabric });
  } catch {
    res.status(404).json({ message: "Ткань не найдена" });
  }
}

/**
 * Admin API: PUT /admin/fabrics/:id
 *
 * Обновить данные ткани.
 */
export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const fabricService: FabricModuleService = req.scope.resolve("fabricModuleService");
  const { id } = req.params;
  const { supplier_data, ...publicData } = req.body as Record<string, unknown> & {
    supplier_data?: Record<string, unknown>;
  };

  // Обновляем публичные данные
  const fabric = await fabricService.updateFabricAttributes({
    id,
    ...publicData,
  });

  // Обновляем приватные данные поставщика (если переданы)
  if (supplier_data) {
    const existing = await fabricService.getWithSupplierData(id);
    if (existing.supplier_data) {
      await fabricService.updateFabricSupplierDatas({
        id: existing.supplier_data.id,
        ...supplier_data,
      });
    } else {
      await fabricService.createFabricSupplierDatas({
        ...supplier_data,
        fabric_attribute_id: id,
      });
    }
  }

  res.json({ fabric });
}

/**
 * Admin API: DELETE /admin/fabrics/:id
 *
 * Удалить запись ткани (каскадно удалит supplier_data).
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const fabricService: FabricModuleService = req.scope.resolve("fabricModuleService");
  const { id } = req.params;

  await fabricService.deleteFabricAttributes(id);
  res.status(200).json({ id, deleted: true });
}
