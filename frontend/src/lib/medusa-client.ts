/**
 * Клиент для подключения к Medusa v2 Backend.
 *
 * Используем официальный @medusajs/js-sdk для типизированных запросов.
 * Конфигурация берётся из переменных окружения.
 */
import Medusa from "@medusajs/js-sdk";

// URL бэкенда Medusa — в dev через rewrites, в prod напрямую
const MEDUSA_BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";

// Publishable API Key — создаётся в админке Medusa
// Используется для store (витринных) запросов
const MEDUSA_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";

export const medusaClient = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  publishableKey: MEDUSA_PUBLISHABLE_KEY,
});

/**
 * Хелпер для серверных запросов к Medusa (Server Components / API Routes).
 * Не передаёт publishable key — используется для внутренних запросов.
 */
export async function medusaFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${MEDUSA_BACKEND_URL}${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(MEDUSA_PUBLISHABLE_KEY && {
        "x-publishable-api-key": MEDUSA_PUBLISHABLE_KEY,
      }),
      ...options?.headers,
    },
    // Ревалидация кеша Next.js — обновляем данные каждые 60 секунд
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`Medusa API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}
