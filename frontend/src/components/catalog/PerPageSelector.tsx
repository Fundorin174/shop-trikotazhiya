"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, memo } from "react";

const PER_PAGE_OPTIONS = [12, 20, 40, 100] as const;
const DEFAULT_PER_PAGE = 20;

interface PerPageSelectorProps {
  current: number;
}

/**
 * Селектор количества товаров на странице.
 * Обновляет URL-параметр `limit`, сбрасывает страницу на 1.
 */
export const PerPageSelector = memo(({ current }: PerPageSelectorProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = Number(e.target.value);
      const params = new URLSearchParams(searchParams.toString());

      if (value === DEFAULT_PER_PAGE) {
        params.delete("limit");
      } else {
        params.set("limit", String(value));
      }
      // Сбрасываем на первую страницу
      params.delete("page");

      const qs = params.toString();
      router.push(`/catalog${qs ? `?${qs}` : ""}`);
    },
    [searchParams, router],
  );

  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <label htmlFor="per-page">Показывать:</label>
      <select
        id="per-page"
        value={current}
        onChange={handleChange}
        className="rounded border border-gray-300 px-2 py-1 text-sm"
      >
        {PER_PAGE_OPTIONS.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </div>
  );
});

PerPageSelector.displayName = "PerPageSelector";
