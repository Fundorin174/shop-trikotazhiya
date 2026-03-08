"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Хук для управления фильтрами каталога через URL search params.
 */
export function useCatalogFilters(currentFilters: Record<string, string | undefined>) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [minPrice, setMinPrice] = useState(currentFilters.min_price ?? "");
  const [maxPrice, setMaxPrice] = useState(currentFilters.max_price ?? "");

  // Синхронизация при изменении URL (в т.ч. при сбросе)
  useEffect(() => {
    setMinPrice(currentFilters.min_price ?? "");
    setMaxPrice(currentFilters.max_price ?? "");
  }, [currentFilters.min_price, currentFilters.max_price]);

  /** Обновить фильтр — добавляет/меняет параметр в URL */
  const updateFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`/catalog?${params.toString()}`);
    },
    [searchParams, router],
  );

  const resetFilters = useCallback(() => {
    router.push("/catalog");
  }, [router]);

  return {
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    updateFilter,
    resetFilters,
  };
}
