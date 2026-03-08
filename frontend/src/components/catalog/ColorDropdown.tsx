"use client";

import { useState, useRef, useEffect } from "react";
import { COLOR_OPTIONS } from "@/types/product";

interface ColorDropdownProps {
  currentColor?: string;
  onSelect: (color: string | null) => void;
}

/**
 * Выпадающий фильтр по цвету.
 */
export const ColorDropdown = ({ currentColor, onSelect }: ColorDropdownProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const LIGHT_HEXES = ["#FFFFFF", "#FFFDD0", "#F5F5DC", "#98FF98"];
  const selectedHex =
    COLOR_OPTIONS.find((c) => c.name === currentColor)?.hex || "#ccc";
  const isLight = (hex: string) => LIGHT_HEXES.includes(hex);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded border bg-white px-3 py-2 text-sm text-gray-700 hover:border-gray-400"
      >
        <span className="flex items-center gap-2">
          {currentColor ? (
            <>
              <span
                className={`inline-block h-3 w-3 rounded-full${
                  isLight(selectedHex) ? " border border-gray-300" : ""
                }`}
                style={{ backgroundColor: selectedHex }}
              />
              {currentColor}
            </>
          ) : (
            "Все цвета"
          )}
        </span>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <ul className="mt-1 max-h-60 w-full overflow-auto rounded border border-gray-200 bg-white py-1 shadow-lg">
          <li>
            <button
              type="button"
              onClick={() => {
                onSelect(null);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${
                !currentColor
                  ? "font-medium text-primary-700 bg-primary-50"
                  : "text-gray-700"
              }`}
            >
              Все цвета
            </button>
          </li>
          {COLOR_OPTIONS.map(({ name, hex }) => {
            const active = currentColor === name;
            return (
              <li key={name}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(active ? null : name);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${
                    active
                      ? "font-medium text-primary-700 bg-primary-50"
                      : "text-gray-700"
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 rounded-full${
                      isLight(hex) ? " border border-gray-300" : ""
                    }`}
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
  );
};
