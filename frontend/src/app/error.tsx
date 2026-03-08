"use client";

import Link from "next/link";

/**
 * Глобальная граница ошибок (Error Boundary).
 * Перехватывает необработанные ошибки в Server/Client Components.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container-shop flex flex-col items-center justify-center py-24 text-center">
      <h1 className="font-heading text-5xl font-bold text-primary-300">
        Ошибка
      </h1>
      <h2 className="mt-4 text-xl font-semibold text-gray-900">
        Что-то пошло не так
      </h2>
      <p className="mt-3 max-w-md text-gray-500">
        {error.message || "Произошла непредвиденная ошибка. Попробуйте обновить страницу."}
      </p>
      <div className="mt-8 flex gap-4">
        <button
          onClick={reset}
          className="btn-primary"
        >
          Попробовать снова
        </button>
        <Link href="/" className="btn-secondary">
          На главную
        </Link>
      </div>
    </div>
  );
}
