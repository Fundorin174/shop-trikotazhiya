/**
 * Валидация товаров для импорта.
 */

import type { ImportProduct } from "@/types/admin";
import { REQUIRED_FIELDS, VALID_FABRIC_TYPES } from "@/lib/admin/constants";

/** Проверить массив товаров на ошибки */
export function validateProducts(products: ImportProduct[]): string[] {
  const errors: string[] = [];
  const skus = new Set<string>();

  products.forEach((p, i) => {
    const n = i + 1;
    for (const field of REQUIRED_FIELDS) {
      if (p[field] == null || p[field] === "") {
        errors.push(`Товар #${n} («${p.title || "?"}»): отсутствует поле «${field}»`);
      }
    }
    if (p.price != null && (typeof p.price !== "number" || p.price <= 0)) {
      errors.push(`Товар #${n}: цена должна быть положительным числом`);
    }
    if (p.fabric_type && !VALID_FABRIC_TYPES.includes(p.fabric_type)) {
      errors.push(
        `Товар #${n}: неизвестный тип ткани «${p.fabric_type}». Допустимые: ${VALID_FABRIC_TYPES.join(", ")}`
      );
    }
    if (p.sku) {
      if (skus.has(p.sku)) {
        errors.push(`Товар #${n}: дублирующийся SKU «${p.sku}»`);
      }
      skus.add(p.sku);
    }
    if (p.measurement_unit && !["running_meter", "piece"].includes(p.measurement_unit)) {
      errors.push(`Товар #${n}: единица измерения должна быть «running_meter» или «piece»`);
    }
  });

  return errors;
}
