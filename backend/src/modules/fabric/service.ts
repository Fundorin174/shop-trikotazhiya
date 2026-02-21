import { MedusaService } from "@medusajs/framework/utils";
import { FabricAttribute, FabricSupplierData } from "./models";

/**
 * ============================================
 * Сервис модуля Fabric
 * ============================================
 *
 * Наследуется от MedusaService — получает все CRUD-методы автоматически:
 * - listFabricAttributes / retrieveFabricAttribute
 * - createFabricAttributes / updateFabricAttributes / deleteFabricAttributes
 * - listFabricSupplierDatas / и т.д.
 *
 * При необходимости — добавляем кастомные методы ниже.
 */
class FabricModuleService extends MedusaService({
  FabricAttribute,
  FabricSupplierData,
}) {
  /**
   * Получить атрибуты ткани по артикулу (SKU).
   */
  async getBysku(sku: string) {
    const [result] = await this.listFabricAttributes({ sku });
    return result || null;
  }

  /**
   * Получить атрибуты ткани вместе с приватными данными поставщика.
   * Используется ТОЛЬКО в админке.
   */
  async getWithSupplierData(fabricAttributeId: string) {
    return this.retrieveFabricAttribute(fabricAttributeId, {
      relations: ["supplier_data"],
    });
  }

  /**
   * Создать запись ткани с данными поставщика (одной транзакцией).
   */
  async createFabricWithSupplier(
    publicData: Record<string, unknown>,
    supplierData?: Record<string, unknown>
  ) {
    const fabricAttr = await this.createFabricAttributes(publicData);

    if (supplierData) {
      await this.createFabricSupplierDatas({
        ...supplierData,
        fabric_attribute_id: fabricAttr.id,
      });
    }

    return fabricAttr;
  }
}

export default FabricModuleService;
