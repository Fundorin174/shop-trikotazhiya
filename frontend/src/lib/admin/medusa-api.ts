/**
 * Общая утилита для запросов к Medusa Admin API.
 *
 * Используется в API-роутах:
 * - api/admin/products/route.ts
 * - api/admin/import/route.ts
 */

const MEDUSA_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";

/**
 * Выполнить запрос к Medusa Admin API.
 * Автоматически добавляет заголовки авторизации и Content-Type.
 *
 * @throws Error если Medusa вернул не-200 ответ
 */
export async function medusaApi(
  method: string,
  path: string,
  token: string,
  body?: unknown,
) {
  const opts: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${MEDUSA_URL}${path}`, opts);
  const text = await res.text();
  if (!res.ok) {
    throw new Error(
      `Medusa ${method} ${path} → ${res.status}: ${text.substring(0, 300)}`,
    );
  }
  return text ? JSON.parse(text) : {};
}

/** Транслитерация русского текста для генерации handle */
export function transliterate(text: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh",
    з: "z", и: "i", й: "j", к: "k", л: "l", м: "m", н: "n", о: "o",
    п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
    ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu",
    я: "ya",
  };
  return text
    .toLowerCase()
    .split("")
    .map((c) => map[c] ?? c)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
