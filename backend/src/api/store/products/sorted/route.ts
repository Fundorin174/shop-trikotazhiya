import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { loadAllProducts } from "../product-cache";

// ── Вспомогательные функции для «умного» сравнения цветов ──

/** Маппинг нормализованных названий цветов → hex */
const COLOR_HEX_MAP: Record<string, string> = {
  "белый": "#FFFFFF",
  "молочный": "#FFFDD0",
  "бежевый": "#F5F5DC",
  "пудровый": "#E8C4C4",
  "мятный": "#98FF98",
  "серый меланж": "#B0B0B0",
  "серебристый": "#C0C0C0",
  "графитовый": "#383838",
  "темно-синий": "#1B1B6F",
  "изумрудный": "#50C878",
  "мультиколор": "#FF69B4",
  "черный": "#000000",
};

/** Нормализация названия: нижний регистр, ё → е, trim */
const normalizeColorName = (s: string): string =>
  s.toLowerCase().replace(/ё/g, "е").trim();

/** Парсинг hex-строки в RGB-тройку */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

/**
 * Евклидово расстояние между двумя цветами в RGB-пространстве.
 * 0 = идентичны, ~441 = максимально далёкие (чёрный ↔ белый).
 */
function colorDistance(hex1: string, hex2: string): number {
  try {
    const [r1, g1, b1] = hexToRgb(hex1);
    const [r2, g2, b2] = hexToRgb(hex2);
    return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
  } catch {
    return Infinity;
  }
}

/**
 * Порог «близости» цвета: ~50 из 441 ≈ 11 % спектра.
 *
 * Что попадает:
 *   • #000000 ↔ #1A1A1A (расст. ≈ 45)  — тёмные вариации чёрного ✓
 *   • #383838 ↔ #303030 (расст. ≈ 14)  — оттенки графита ✓
 *   • #B0B0B0 ↔ #C0C0C0 (расст. ≈ 28)  — серый ≈ серебристый ✓
 *
 * Что НЕ попадает:
 *   • #000000 ↔ #383838 (расст. ≈ 97)  — чёрный ≠ графитовый ✗
 *   • #FFFFFF ↔ #FFFDD0 (расст. ≈ 48)  — белый ≠ молочный ✗
 *   • #1B1B6F ↔ #000000 (расст. ≈ 117) — синий ≠ чёрный ✗
 */
const COLOR_DISTANCE_THRESHOLD = 50;

/**
 * GET /store/products/sorted
 *
 * Возвращает товары с серверной сортировкой, включая по цене.
 * Кеширует полный список товаров в Redis (TTL 120 сек).
 *
 * Query params:
 *   ?sort=price_asc | price_desc | created_at_desc | title_asc
 *   ?type=футер           — фильтр по metadata.fabric_type
 *   ?min_price=100        — мин. цена (руб.)
 *   ?max_price=1000       — макс. цена (руб.)
 *   ?width_min=140        — мин. ширина (см)
 *   ?width_max=180        — макс. ширина (см)
 *   ?limit=12             — количество на странице
 *   ?page=1               — номер страницы
 */

/**
 * Отображаемая цена товара в рублях.
 *
 * Все amount в Medusa — в копейках (minor units).
 * Ткани: amount = копейки/см → числовое значение = рубли/метр (совпадение: ×100/÷100).
 * Штучные: amount = копейки → ÷100 для рублей.
 */
function displayPriceRubles(product: Record<string, any>): number | null {
  const amount = product.variants?.[0]?.prices?.[0]?.amount;
  if (amount == null) return null;
  const isFabric = product.metadata?.measurement_unit === "running_meter"
    || !product.metadata?.measurement_unit;
  return isFabric ? amount : amount / 100;
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const {
    sort,
    type,
    color,
    min_price,
    max_price,
    width_min,
    width_max,
    limit: limitQ,
    page: pageQ,
  } = req.query as Record<string, string | undefined>;

  const limit = parseInt(limitQ || "12") || 12;
  const page = parseInt(pageQ || "1") || 1;

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  // Загружаем товары (из кеша или БД)
  let products = await loadAllProducts(query);

  // ── Фильтрация ──

  if (type) {
    products = products.filter((p) => p.metadata?.fabric_type === type);
  }

  if (color) {
    const targetName = normalizeColorName(color);
    const targetHex = COLOR_HEX_MAP[targetName];

    products = products.filter((p) => {
      if (!p.metadata) return false;

      // 1) Точное совпадение по названию цвета (ё/е, регистр игнорируются)
      if (p.metadata.color && normalizeColorName(p.metadata.color) === targetName) {
        return true;
      }

      // 2) Fallback: близость hex-кодов (для товаров с иным названием, но похожим оттенком)
      if (targetHex && p.metadata.color_hex) {
        return colorDistance(targetHex, p.metadata.color_hex) <= COLOR_DISTANCE_THRESHOLD;
      }

      return false;
    });
  }

  if (min_price) {
    const min = Number(min_price);
    if (!isNaN(min)) {
      products = products.filter((p) => {
        const price = displayPriceRubles(p);
        return price != null && price >= min;
      });
    }
  }

  if (max_price) {
    const max = Number(max_price);
    if (!isNaN(max)) {
      products = products.filter((p) => {
        const price = displayPriceRubles(p);
        return price != null && price <= max;
      });
    }
  }

  if (width_min) {
    const min = Number(width_min);
    if (!isNaN(min)) {
      products = products.filter((p) => {
        const w = Number(p.metadata?.width_cm);
        return !isNaN(w) && w >= min;
      });
    }
  }

  if (width_max) {
    const max = Number(width_max);
    if (!isNaN(max)) {
      products = products.filter((p) => {
        const w = Number(p.metadata?.width_cm);
        return !isNaN(w) && w <= max;
      });
    }
  }

  // ── Сортировка ──

  if (sort) {
    switch (sort) {
      case "price_asc":
        products.sort((a, b) => {
          const pa = displayPriceRubles(a) ?? Infinity;
          const pb = displayPriceRubles(b) ?? Infinity;
          return pa - pb;
        });
        break;
      case "price_desc":
        products.sort((a, b) => {
          const pa = displayPriceRubles(a) ?? 0;
          const pb = displayPriceRubles(b) ?? 0;
          return pb - pa;
        });
        break;
      case "title_asc":
        products.sort((a, b) =>
          (a.title || "").localeCompare(b.title || "", "ru")
        );
        break;
      case "created_at_desc":
        products.sort((a, b) => {
          const da = a.created_at ? new Date(a.created_at).getTime() : 0;
          const db = b.created_at ? new Date(b.created_at).getTime() : 0;
          return db - da;
        });
        break;
    }
  }

  // ── Пагинация ──

  const total = products.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const offset = (safePage - 1) * limit;
  const paginated = products.slice(offset, offset + limit);

  res.json({
    products: paginated,
    count: total,
    page: safePage,
    totalPages,
    limit,
  });
}
