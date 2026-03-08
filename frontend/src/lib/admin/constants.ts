/**
 * Константы для админ-панели.
 *
 * Валидные типы тканей, русские названия, обязательные поля.
 * Импортируются из types/product.ts (FABRIC_TYPE_LABELS) + дополнительные.
 */

import { FABRIC_TYPE_LABELS } from "@/types/product";

/** Обязательные поля для импорта */
export const REQUIRED_FIELDS = [
  "title",
  "sku",
  "price",
  "fabric_type",
  "composition",
  "width_cm",
] as const;

/** Допустимые значения fabric_type */
export const VALID_FABRIC_TYPES = [
  "kulirka",
  "footer",
  "kapitoniy",
  "kashkorse",
  "pike",
  "ribana",
  "interlok",
  "kupony",
  "trikotazh_vyazka",
  "termopolotno",
  "dzhersi",
  "furnitura",
];

/**
 * Русские названия типов тканей.
 * Реэкспорт из types/product.ts для удобства использования в админке.
 */
export const FABRIC_LABELS: Record<string, string> = FABRIC_TYPE_LABELS;

/** Пустая форма добавления товара */
export const EMPTY_FORM = {
  title: "",
  sku: "",
  handle: "",
  price: "",
  fabric_type: "",
  composition: "",
  width_cm: "",
  measurement_unit: "running_meter" as "running_meter" | "piece",
  inventory: "",
  description: "",
  subtitle: "",
  color: "",
  color_hex: "",
  country: "",
  quality: "",
  collection_name: "",
  video_url: "",
  min_order: "",
  order_step: "",
  short_description: "",
  full_description: "",
  discount_percent: "",
  discount_amount: "",
};

/** Максимальный размер изображения (байт) */
export const MAX_IMAGE_SIZE = 200 * 1024; // 200 KB
