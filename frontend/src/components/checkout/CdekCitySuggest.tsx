"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { fetchCdekCities, type CdekCity } from "@/lib/data/cdek";

// ============================================
// Типы
// ============================================

interface CdekCitySuggestProps {
  /** Текущее значение поля */
  value: string;
  /** Колбэк при изменении текста (ввод пользователем) */
  onChange: (value: string) => void;
  /** Колбэк при выборе города из списка */
  onCitySelect: (city: CdekCity) => void;
  /** Сбросить выбранный город (при ручном редактировании после выбора) */
  onCityClear: () => void;
  /** CSS-класс для input */
  className?: string;
  /** placeholder */
  placeholder?: string;
  /** id для label */
  id?: string;
  /** required */
  required?: boolean;
}

// ============================================
// Компонент
// ============================================

export function CdekCitySuggest({
  value,
  onChange,
  onCitySelect,
  onCityClear,
  className = "",
  placeholder = "Начните вводить город",
  id,
  required,
}: CdekCitySuggestProps) {
  const [suggestions, setSuggestions] = useState<CdekCity[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selectedCode, setSelectedCode] = useState<number | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced fetch
  useEffect(() => {
    // Если пользователь уже выбрал город — не ищем снова
    if (selectedCode !== null) return;

    if (!value || value.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const cities = await fetchCdekCities(value);
        setSuggestions(cities);
        setOpen(cities.length > 0);
        setActiveIndex(-1);
      } catch {
        setSuggestions([]);
        setOpen(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [value, selectedCode]);

  // Click outside — close
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const el = listRef.current.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const selectCity = useCallback(
    (city: CdekCity) => {
      onChange(city.city);
      setSelectedCode(city.code);
      setSuggestions([]);
      setOpen(false);
      setActiveIndex(-1);
      onCitySelect(city);
    },
    [onChange, onCitySelect]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onChange(v);

    // Если пользователь отредактировал текст после выбора — сброс
    if (selectedCode !== null) {
      setSelectedCode(null);
      onCityClear();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) =>
          i < suggestions.length - 1 ? i + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) =>
          i > 0 ? i - 1 : suggestions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          selectCity(suggestions[activeIndex]);
        }
        break;
      case "Escape":
        setOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0 && selectedCode === null) {
            setOpen(true);
          }
        }}
        placeholder={placeholder}
        className={className}
        required={required}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-activedescendant={
          activeIndex >= 0 ? `cdek-city-${activeIndex}` : undefined
        }
      />

      {open && suggestions.length > 0 && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg"
        >
          {suggestions.map((city, idx) => (
            <li
              key={city.code}
              id={`cdek-city-${idx}`}
              role="option"
              aria-selected={idx === activeIndex}
              onMouseDown={(e) => {
                e.preventDefault(); // prevent input blur
                selectCity(city);
              }}
              onMouseEnter={() => setActiveIndex(idx)}
              className={`cursor-pointer px-4 py-2.5 text-sm transition-colors ${
                idx === activeIndex
                  ? "bg-primary-50 text-primary-900"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className="font-medium">{city.city}</span>
              <span className="text-gray-500"> — {city.region}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
