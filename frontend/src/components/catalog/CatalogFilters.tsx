"use client";

import { FABRIC_TYPE_LABELS } from "@/types/product";
import { useCatalogFilters } from "@/hooks/useCatalogFilters";
import { ColorDropdown } from "./ColorDropdown";

interface CatalogFiltersProps {
  currentFilters: Record<string, string | undefined>;
}

/**
 * Боковая панель фильтров каталога тканей.
 * Фильтрация через URL search params (SSR-совместимо).
 */
export const CatalogFilters = ({ currentFilters }: CatalogFiltersProps) => {
  const {
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    updateFilter,
    resetFilters,
  } = useCatalogFilters(currentFilters);

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
        <div className="flex flex-wrap gap-2 lg:flex-col">
          {Object.entries(FABRIC_TYPE_LABELS).map(([value, label]) => {
            const isActive = currentFilters.type === value;
            return (
              <button
                key={value}
                onClick={() => updateFilter("type", isActive ? null : value)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? "border-primary-500 bg-primary-500 text-white shadow-sm"
                    : "border-gray-300 bg-white text-gray-600 hover:border-primary-300 hover:text-primary-700"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Цвет */}
      <fieldset>
        <legend className="mb-3 text-sm font-medium text-gray-900">Цвет</legend>
        <ColorDropdown
          currentColor={currentFilters.color}
          onSelect={(color) => updateFilter("color", color)}
        />
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
            onKeyDown={(e) => {
              if (e.key === "Enter")
                updateFilter(
                  "min_price",
                  (e.target as HTMLInputElement).value || null,
                );
            }}
            className="w-full rounded border px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="до"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            onBlur={(e) => updateFilter("max_price", e.target.value || null)}
            onKeyDown={(e) => {
              if (e.key === "Enter")
                updateFilter(
                  "max_price",
                  (e.target as HTMLInputElement).value || null,
                );
            }}
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
          value={currentFilters.sort || "created_at_desc"}
          onChange={(e) =>
            updateFilter(
              "sort",
              e.target.value === "created_at_desc" ? null : e.target.value,
            )
          }
          className="w-full rounded border px-3 py-2 text-sm"
        >
          <option value="created_at_desc">Новинки</option>
          <option value="price_asc">Цена: по возрастанию</option>
          <option value="price_desc">Цена: по убыванию</option>
          <option value="title_asc">Название: А–Я</option>
        </select>
      </fieldset>
    </div>
  );
};
