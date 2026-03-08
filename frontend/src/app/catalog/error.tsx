"use client";

import Link from "next/link";

/**
 * Граница ошибок для раздела каталога.
 * Перехватывает ошибки при загрузке товаров (недоступный бэкенд и т.п.).
 */
export default function CatalogError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container-shop py-24 text-center">
      <h1 className="font-heading text-3xl font-bold text-primary-900">
        Каталог тканей
      </h1>
      <div className="mt-12">
        <p className="text-lg text-gray-600">
          Не удалось загрузить товары
        </p>
        <p className="mt-2 text-sm text-gray-400">
          {error.message || "Сервер временно недоступен. Попробуйте позже."}
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <button onClick={reset} className="btn-primary">
            Попробовать снова
          </button>
          <Link href="/" className="btn-secondary">
            На главную
          </Link>
        </div>
      </div>
    </div>
  );
}
