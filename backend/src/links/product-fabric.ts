import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";
import FabricModule from "../modules/fabric";

/**
 * ============================================
 * Link: Product ↔ FabricAttribute
 * ============================================
 *
 * Связывает стандартный Product из Medusa с кастомными
 * данными ткани (FabricAttribute) из нашего модуля.
 *
 * Связь 1:1 — у каждого Product может быть один FabricAttribute.
 *
 * Medusa v2 автоматически создаёт промежуточную таблицу
 * и API для управления связями.
 */
export default defineLink(
  ProductModule.linkable.product,
  FabricModule.linkable.fabricAttribute
);
