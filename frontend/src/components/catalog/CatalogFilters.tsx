"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FABRIC_TYPE_LABELS, COLOR_OPTIONS, type FabricType } from "@/types/product";

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
  const [colorOpen, setColorOpen] = useState(false);
  const colorRef = useRef<HTMLDivElement>(null);

  // Закрытие dropdown при клике вне
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (colorRef.current && !colorRef.current.contains(e.target as Node)) {
        setColorOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Синхронизация при изменении URL (в т.ч. при сбросе)
  useEffect(() => {
    setMinPrice(currentFilters.min_price ?? "");
    setMaxPrice(currentFilters.max_price ?? "");
  }, [currentFilters.min_price, currentFilters.max_price]);

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
        <legend className="mb-3 text-sm font-medium text-gray-900">
          Цвет
        </legend>
        <div ref={colorRef} className="relative">
          <button
            type="button"
            onClick={() => setColorOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded border bg-white px-3 py-2 text-sm text-gray-700 hover:border-gray-400"
          >
            <span className="flex items-center gap-2">
              {currentFilters.color ? (
                <>
                  <span
                    className={`inline-block h-3 w-3 rounded-full${
                      ["#FFFFFF", "#FFFDD0", "#F5F5DC", "#98FF98"].includes(
                        COLOR_OPTIONS.find((c) => c.name === currentFilters.color)?.hex || ""
                      )
                        ? " border border-gray-300"
                        : ""
                    }`}
                    style={{
                      backgroundColor:
                        COLOR_OPTIONS.find((c) => c.name === currentFilters.color)?.hex || "#ccc",
                    }}
                  />
                  {currentFilters.color}
                </>
              ) : (
                "Все цвета"
              )}
            </span>
            <svg
              className={`h-4 w-4 text-gray-400 transition-transform ${colorOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {colorOpen && (
            <ul className="mt-1 max-h-60 w-full overflow-auto rounded border border-gray-200 bg-white py-1 shadow-lg">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    updateFilter("color", null);
                    setColorOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${
                    !currentFilters.color ? "font-medium text-primary-700 bg-primary-50" : "text-gray-700"
                  }`}
                >
                  Все цвета
                </button>
              </li>
              {COLOR_OPTIONS.map(({ name, hex }) => {
                const isActive = currentFilters.color === name;
                const isLight = ["#FFFFFF", "#FFFDD0", "#F5F5DC", "#98FF98"].includes(hex);
                return (
                  <li key={name}>
                    <button
                      type="button"
                      onClick={() => {
                        updateFilter("color", isActive ? null : name);
                        setColorOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${
                        isActive ? "font-medium text-primary-700 bg-primary-50" : "text-gray-700"
                      }`}
                    >
                      <span
                        className={`inline-block h-3 w-3 rounded-full${isLight ? " border border-gray-300" : ""}`}
                        style={{ backgroundColor: hex }}
                      />
                      {name}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
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
