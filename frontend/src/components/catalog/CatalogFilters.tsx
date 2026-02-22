"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FABRIC_TYPE_LABELS, type FabricType } from "@/types/product";

interface CatalogFiltersProps {
  currentFilters: Record<string, string | undefined>;
}

/**
 * Боковая панель фильтров каталога тканей.
 * Фильтрация через URL search params (SSR-совместимо).
 */
export function CatalogFilters({ currentFilters }: CatalogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Локальное состояние инпутов — синхронизируется с URL
  const [minPrice, setMinPrice] = useState(currentFilters.min_price ?? "");
  const [maxPrice, setMaxPrice] = useState(currentFilters.max_price ?? "");
  const [widthMin, setWidthMin] = useState(currentFilters.width_min ?? "");
  const [widthMax, setWidthMax] = useState(currentFilters.width_max ?? "");

  // Синхронизация при изменении URL (в т.ч. при сбросе)
  useEffect(() => {
    setMinPrice(currentFilters.min_price ?? "");
    setMaxPrice(currentFilters.max_price ?? "");
    setWidthMin(currentFilters.width_min ?? "");
    setWidthMax(currentFilters.width_max ?? "");
  }, [currentFilters.min_price, currentFilters.max_price, currentFilters.width_min, currentFilters.width_max]);

  /** Обновить фильтр — добавляет/меняет параметр в URL */
  function updateFilter(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Сброс на первую страницу при изменении фильтра
    params.delete("page");
    router.push(`/catalog?${params.toString()}`);
  }

  /** Сбросить все фильтры */
  function resetFilters() {
    router.push("/catalog");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Фильтры</h2>
        <button
          onClick={resetFilters}
          className="text-sm text-accent-600 hover:text-accent-700"
        >
          Сбросить
        </button>
      </div>

      {/* Тип ткани */}
      <fieldset>
        <legend className="mb-3 text-sm font-medium text-gray-900">
          Тип ткани
        </legend>
        <div className="space-y-2">
          {Object.entries(FABRIC_TYPE_LABELS).map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="type"
                value={value}
                checked={currentFilters.type === value}
                onChange={() => updateFilter("type", value)}
                className="text-primary-600"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Цена */}
      <fieldset>
        <legend className="mb-3 text-sm font-medium text-gray-900">
          Цена, ₽
        </legend>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="от"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            onBlur={(e) => updateFilter("min_price", e.target.value || null)}
            onKeyDown={(e) => { if (e.key === "Enter") updateFilter("min_price", (e.target as HTMLInputElement).value || null); }}
            className="w-full rounded border px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="до"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            onBlur={(e) => updateFilter("max_price", e.target.value || null)}
            onKeyDown={(e) => { if (e.key === "Enter") updateFilter("max_price", (e.target as HTMLInputElement).value || null); }}
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </div>
      </fieldset>

      {/* Ширина */}
      <fieldset>
        <legend className="mb-3 text-sm font-medium text-gray-900">
          Ширина, см
        </legend>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="от"
            value={widthMin}
            onChange={(e) => setWidthMin(e.target.value)}
            onBlur={(e) => updateFilter("width_min", e.target.value || null)}
            onKeyDown={(e) => { if (e.key === "Enter") updateFilter("width_min", (e.target as HTMLInputElement).value || null); }}
            className="w-full rounded border px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="до"
            value={widthMax}
            onChange={(e) => setWidthMax(e.target.value)}
            onBlur={(e) => updateFilter("width_max", e.target.value || null)}
            onKeyDown={(e) => { if (e.key === "Enter") updateFilter("width_max", (e.target as HTMLInputElement).value || null); }}
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </div>
      </fieldset>

      {/* Сортировка */}
      <fieldset>
        <legend className="mb-3 text-sm font-medium text-gray-900">
          Сортировка
        </legend>
        <select
          value={currentFilters.sort || ""}
          onChange={(e) => updateFilter("sort", e.target.value || null)}
          className="w-full rounded border px-3 py-2 text-sm"
        >
          <option value="">По умолчанию</option>
          <option value="price_asc">Цена: по возрастанию</option>
          <option value="price_desc">Цена: по убыванию</option>
          <option value="title_asc">Название: А–Я</option>
          <option value="created_at_desc">Новинки</option>
        </select>
      </fieldset>
    </div>
  );
}
