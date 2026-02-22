"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

interface MobileFilterPanelProps {
  children: React.ReactNode;
  hasActiveFilters?: boolean;
}

/**
 * На мобильных — скрывает фильтры за sticky-кнопку «Фильтры».
 * Рендерит фрагмент из двух блоков, чтобы sticky-родителем
 * был контейнер страницы (с полной высотой контента).
 */
export function MobileFilterPanel({
  children,
  hasActiveFilters,
}: MobileFilterPanelProps) {
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    setOpen(false);
  }, [searchParams]);

  function toggle() {
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        // Скролим наверх страницы, чтобы раскрытые фильтры были видны
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return next;
    });
  }

  return (
    <>
      {/* Кнопка «Фильтры» — sticky, родитель = container-shop (вся высота страницы) */}
      <div className="sticky top-16 z-40 -mx-4 mt-4 bg-white/95 px-4 py-2 backdrop-blur border-b border-gray-200 lg:hidden">
        <button
          onClick={toggle}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 active:bg-gray-100"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path
              fillRule="evenodd"
              d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 0 1 .628.74v2.288a2.25 2.25 0 0 1-.659 1.59l-4.682 4.683a2.25 2.25 0 0 0-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 0 1 8 18.25v-5.757a2.25 2.25 0 0 0-.659-1.591L2.659 6.22A2.25 2.25 0 0 1 2 4.629V2.34a.75.75 0 0 1 .628-.74Z"
              clipRule="evenodd"
            />
          </svg>
          Фильтры
          {hasActiveFilters && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
              ●
            </span>
          )}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          >
            <path
              fillRule="evenodd"
              d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* Панель фильтров — раскрывается / скрывается */}
      <div
        className={`overflow-hidden transition-all duration-300 lg:hidden ${
          open ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="pt-2">{children}</div>
      </div>
    </>
  );
}
