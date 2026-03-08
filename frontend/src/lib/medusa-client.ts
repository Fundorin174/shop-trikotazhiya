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

/** Таймаут для серверных fetch-запросов (мс) */
const FETCH_TIMEOUT = 15_000;

/** Количество повторных попыток при ошибке соединения */
const FETCH_RETRIES = 2;

/** Задержка между повторами (мс) */
const RETRY_DELAY = 1_000;

const IS_DEV = process.env.NODE_ENV === "development";

/**
 * Опции кеширования: в dev — без кеша (избегаем abort от ISR-механизма Next.js),
 * в prod — ISR с ревалидацией каждые 60 секунд.
 */
const cacheOptions: RequestInit = IS_DEV
  ? { cache: "no-store" }
  : { next: { revalidate: 60 } } as RequestInit;

/**
 * Хелпер для серверных запросов к Medusa (Server Components / API Routes).
 * Включает таймаут и retry-логику, чтобы не падать при медленном старте бэкенда.
 */
export async function medusaFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${MEDUSA_BACKEND_URL}${endpoint}`;

  let lastError: unknown;

  for (let attempt = 0; attempt <= FETCH_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        ...cacheOptions,
        ...options,
        signal: AbortSignal.timeout(FETCH_TIMEOUT),
        headers: {
          "Content-Type": "application/json",
          ...(MEDUSA_PUBLISHABLE_KEY && {
            "x-publishable-api-key": MEDUSA_PUBLISHABLE_KEY,
          }),
          ...options?.headers,
        },
      });

      if (!res.ok) {
        throw new Error(`Medusa API error: ${res.status} ${res.statusText}`);
      }

      return res.json() as Promise<T>;
    } catch (err) {
      lastError = err;

      // Повторяем только при сетевых ошибках (ECONNREFUSED, timeout, abort)
      const isRetryable =
        err instanceof TypeError ||
        (err instanceof DOMException && err.name === "AbortError") ||
        (err instanceof DOMException && err.name === "TimeoutError");

      if (!isRetryable || attempt === FETCH_RETRIES) break;

      await new Promise((r) => setTimeout(r, RETRY_DELAY * (attempt + 1)));
    }
  }

  throw lastError;
}
