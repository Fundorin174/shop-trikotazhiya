/**
 * Утилиты общего назначения.
 */

import { clsx, type ClassValue } from "clsx";

/**
 * Утилита для объединения CSS-классов (clsx).
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Форматирование цены в рублях.
 * Medusa хранит цены в копейках (minor units).
 */
export function formatPrice(amount: number, currency = "RUB"): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount / 100);
}

/**
 * Форматирование ширины ткани.
 */
export function formatWidth(widthCm: number): string {
  return `${widthCm} см`;
}

/**
 * Транслитерация для генерации URL-slug.
 */
export function slugify(text: string): string {
  const translitMap: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo",
    ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
    н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
    ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch",
    ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };

  return text
    .toLowerCase()
    .split("")
    .map((char) => translitMap[char] || char)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Обрезка текста до заданной длины.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s+\S*$/, "") + "…";
}

/**
 * Единицы измерения — краткие русские названия.
 */
export const MEASUREMENT_UNITS: Record<string, string> = {
  running_meter: "пог. м",
  piece: "шт.",
};

/** Единицы измерения — полные названия */
export const MEASUREMENT_UNITS_FULL: Record<string, string> = {
  running_meter: "метр погонный",
  piece: "штука",
};

/** Минимальный отрез в метрах */
export const MIN_CUT_METERS = 0.5;

/** Шаг отреза в метрах */
export const CUT_STEP_METERS = 0.1;
