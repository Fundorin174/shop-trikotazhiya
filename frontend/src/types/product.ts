/**
 * Типы товаров для фронтенда.
 *
 * Расширяют стандартные типы Medusa кастомными полями для тканей.
 * Публичные поля доступны через Store API.
 * Приватные поля (закупка, поставщик) НЕ попадают на витрину.
 */

// ============================================
// Enums / справочники
// ============================================

/** Типы тканей */
export type FabricType =
  | "kulirka"          // Кулирка
  | "footer"           // Футер
  | "kapitoniy"        // Капитоний
  | "kashkorse"        // Кашкорсе
  | "pike"             // Пике
  | "ribana"           // Рибана
  | "interlok"         // Интерлок
  | "kupony"           // Купоны с принтом
  | "trikotazh_vyazka" // Трикотажная вязка
  | "termopolotno"     // Термополотно
  | "dzhersi"          // Джерси
  | "furnitura";       // Фурнитура

/** Единицы измерения */
export type MeasurementUnit =
  | "running_meter" // Метр погонный (ткани)
  | "piece";        // Штука (купоны, фурнитура)

/** Русские названия типов тканей */
export const FABRIC_TYPE_LABELS: Record<FabricType, string> = {
  kulirka: "Кулирка",
  footer: "Футер",
  kapitoniy: "Капитоний",
  kashkorse: "Кашкорсе",
  pike: "Пике",
  ribana: "Рибана",
  interlok: "Интерлок",
  kupony: "Купоны с принтом",
  trikotazh_vyazka: "Трикотажная вязка",
  termopolotno: "Термополотно",
  dzhersi: "Джерси",
  furnitura: "Фурнитура",
};

// ============================================
// Основная модель товара
// ============================================

/**
 * Стандартный Product из Medusa + кастомные поля ткани.
 *
 * Кастомные поля хранятся в metadata (JSON) на стороне Medusa.
 * При необходимости — можно вынести в отдельную таблицу через кастомный модуль.
 */
export interface Product {
  id: string;
  title: string;
  handle: string;
  subtitle?: string | null;
  description?: string | null;
  thumbnail?: string | null;
  status: "draft" | "proposed" | "published" | "rejected";
  collection_id?: string | null;
  images?: ProductImage[];
  variants?: ProductVariant[];
  metadata?: FabricMetadata | null;
  created_at: string;
  updated_at: string;
}

/** Изображение товара */
export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
}

/** Вариант товара (размер / цвет / кол-во) */
export interface ProductVariant {
  id: string;
  title: string;
  sku?: string | null;
  prices: ProductPrice[];
  inventory_quantity: number;
  manage_inventory: boolean;
  metadata?: Record<string, unknown> | null;
}

/** Цена варианта */
export interface ProductPrice {
  id: string;
  amount: number;          // в копейках (minor units)
  currency_code: string;   // "rub"
}

// ============================================
// Кастомные поля ткани (metadata)
// ============================================

/**
 * ПУБЛИЧНЫЕ поля — отображаются на витрине.
 * Хранятся в product.metadata
 */
export interface FabricMetadata {
  // Основная информация
  sku: string;                    // Артикул (уникальный)
  fabric_type: FabricType;        // Тип ткани
  composition: string;            // Состав: "100% хлопок, 200г/м²"
  quality: string;                // Качество ткани
  width_cm: number;               // Ширина (см)
  measurement_unit: MeasurementUnit; // Единица измерения
  country: string;                // Страна производства
  collection_name: string;        // Коллекция
  color: string;                  // Цвет (название или hex)
  color_hex?: string;             // Цвет (hex code)

  // Контент
  short_description: string;      // Краткое описание (для превью)
  full_description: string;       // Полное описание (для карточки)
  video_url?: string;             // Видео (YouTube / Yandex Disk)

  // Скидка
  discount_percent?: number;      // Размер скидки в %
  discount_amount?: number;       // Размер скидки в рублях

  // Параметры отреза
  min_order?: number;             // Мин. заказ (метры или штуки), по умолчанию 0.5
  order_step?: number;            // Шаг отреза, по умолчанию 0.1

  // Приватные поля НЕ попадают в metadata на витрине —
  // они хранятся в отдельной таблице fabric_supplier_data (см. схему БД)
}

// ============================================
// API-ответы
// ============================================

export interface ProductListResponse {
  products: Product[];
  count: number;
  offset: number;
  limit: number;
}

/** Фильтры каталога */
export interface ProductFilters {
  type?: string;
  color?: string;
  min_price?: string;
  max_price?: string;
  width_min?: string;
  width_max?: string;
  collection?: string;
  sort?: string;
  page?: string;
  limit?: number;
}
