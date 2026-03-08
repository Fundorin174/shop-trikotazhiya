/**
 * Конфигурация клиентских запросов к Medusa API.
 *
 * Единая точка для URL бэкенда, API-ключа и заголовков.
 * Используется в cart.ts, checkout.ts, cdek.ts (клиентские запросы).
 */

export const MEDUSA_BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";

export const MEDUSA_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";

/**
 * Стандартные заголовки для Store API запросов.
 */
export function getStoreHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (MEDUSA_PUBLISHABLE_KEY) {
    headers["x-publishable-api-key"] = MEDUSA_PUBLISHABLE_KEY;
  }
  return headers;
}
