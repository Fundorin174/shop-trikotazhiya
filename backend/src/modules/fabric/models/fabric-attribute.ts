import { model } from "@medusajs/framework/utils";

/**
 * ============================================
 * Сущность: FabricAttribute
 * ============================================
 *
 * ПУБЛИЧНЫЕ поля товара-ткани, отображаемые на витрине.
 * Связывается с Product через Medusa Link (см. links/).
 *
 * Хранится в таблице: fabric_attribute
 */
const FabricAttribute = model.define("fabric_attribute", {
  // ─── Первичный ключ ───
  id: model.id().primaryKey(),

  // ─── Основная информация ───

  /** Артикул (уникальный, индексируемый) */
  sku: model.text().unique(),

  /** Название ткани */
  name: model.text(),

  /**
   * Тип ткани (enum).
   * Допустимые значения: cotton, silk, wool, linen, knit, synthetic,
   * blend, viscose, polyester, other
   */
  fabric_type: model.enum([
    "cotton",     // Хлопок
    "silk",       // Шёлк
    "wool",       // Шерсть
    "linen",      // Лён
    "knit",       // Трикотаж
    "synthetic",  // Синтетика
    "blend",      // Смесовая
    "viscose",    // Вискоза
    "polyester",  // Полиэстер
    "other",      // Прочее
  ]),

  /** Состав ткани (н-р: "100% хлопок, 200г/м²") */
  composition: model.text(),

  /** Качество ткани (описание) */
  quality: model.text().nullable(),

  /** Ширина в сантиметрах (десятичное, н-р: 150.5) */
  width_cm: model.float(),

  /** Цена за единицу измерения в копейках (целое число) */
  unit_price: model.bigNumber(),

  /**
   * Единица измерения.
   * meter — метр, running_meter — погонный метр, roll — рулон, cut — отрез
   */
  measurement_unit: model.enum([
    "meter",         // Метр
    "running_meter", // Погонный метр
    "roll",          // Рулон
    "cut",           // Отрез
  ]).default("meter"),

  /** Складской остаток (целое число) */
  stock_quantity: model.number().default(0),

  /** Страна производства */
  country: model.text().nullable(),

  /** Название коллекции */
  collection_name: model.text().nullable(),

  /** Цвет — текстовое название (н-р: "Бордовый") */
  color: model.text().nullable(),

  /** Цвет — hex-код (н-р: "#8B0000") */
  color_hex: model.text().nullable(),

  // ─── Контент ───

  /** Полное описание (для карточки товара и SEO) */
  full_description: model.text().nullable(),

  /** Краткое описание (для превью в каталоге) */
  short_description: model.text().nullable(),

  /**
   * Фото — массив URL.
   * Основные фото хранятся в Medusa Product.images.
   * Здесь — дополнительные (крупный план, палитра и т.д.)
   */
  extra_photos: model.json().nullable(),

  /** Видео — URL (YouTube / Yandex Disk) */
  video_url: model.text().nullable(),

  // ─── Скидки ───

  /** Процент скидки (н-р: 15.0) */
  discount_percent: model.float().nullable(),

  /** Абсолютный размер скидки в копейках */
  discount_amount: model.bigNumber().nullable(),

  // ─── Связь с приватными данными ───
  supplier_data: model.hasOne(() => FabricSupplierData, {
    mappedBy: "fabric_attribute",
  }),

  // ─── Timestamps ───
  created_at: model.dateTime().default(() => new Date()),
  updated_at: model.dateTime().default(() => new Date()),
});

/**
 * ============================================
 * Сущность: FabricSupplierData
 * ============================================
 *
 * ПРИВАТНЫЕ поля — данные о закупке и поставщике.
 * Видны ТОЛЬКО в админке, НЕ отдаются через Store API.
 *
 * Хранится в таблице: fabric_supplier_data
 */
const FabricSupplierData = model.define("fabric_supplier_data", {
  id: model.id().primaryKey(),

  /** Закупочная цена в копейках (скрытая) */
  purchase_price: model.bigNumber(),

  /** Имя поставщика */
  supplier_name: model.text().nullable(),

  /** Сайт поставщика */
  supplier_website: model.text().nullable(),

  /** Контакты поставщика (телефон, email, менеджер) */
  supplier_contacts: model.text().nullable(),

  /** Дополнительные заметки (внутренние) */
  internal_notes: model.text().nullable(),

  // ─── Связь с FabricAttribute ───
  fabric_attribute: model.belongsTo(() => FabricAttribute, {
    mappedBy: "supplier_data",
  }),

  // ─── Timestamps ───
  created_at: model.dateTime().default(() => new Date()),
  updated_at: model.dateTime().default(() => new Date()),
});

export { FabricAttribute, FabricSupplierData };
