"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  fetchCdekPvz,
  fetchCdekCalculation,
  type CdekPvzPoint,
  type CdekTariff,
} from "@/lib/data/cdek";

// ============================================
// Типы
// ============================================

export interface SelectedPvz {
  code: string;
  name: string;
  address: string;
  city: string;
  cityCode: number;
  postalCode: string;
}

interface CdekPvzPickerProps {
  /** Код города СДЭК (выбранный через CdekCitySuggest) */
  cityCode: number | null;
  /** Колбэк при выборе ПВЗ */
  onSelect: (pvz: SelectedPvz, tariff: CdekTariff | null) => void;
  /** Текущий выбранный ПВЗ (code) */
  selectedCode?: string;
}

// ============================================
// Компонент
// ============================================

export function CdekPvzPicker({
  cityCode,
  onSelect,
  selectedCode,
}: CdekPvzPickerProps) {
  const [points, setPoints] = useState<CdekPvzPoint[]>([]);
  const [tariff, setTariff] = useState<CdekTariff | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Когда меняется код города — загрузить ПВЗ + расчёт
  useEffect(() => {
    if (!cityCode) {
      setPoints([]);
      setTariff(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [pvzList, tariffs] = await Promise.all([
          fetchCdekPvz(cityCode!),
          fetchCdekCalculation(cityCode!),
        ]);
        if (cancelled) return;

        setPoints(pvzList);
        setTariff(tariffs[0] ?? null);

        if (pvzList.length === 0) {
          setError("В этом городе нет пунктов выдачи СДЭК");
        }
      } catch {
        if (!cancelled) setError("Не удалось загрузить пункты выдачи");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [cityCode]);

  // Фильтрация ПВЗ по поиску
  const filteredPoints = useMemo(() => {
    if (!searchQuery.trim()) return points;
    const q = searchQuery.toLowerCase();
    return points.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.location.address.toLowerCase().includes(q) ||
        p.location.address_full.toLowerCase().includes(q)
    );
  }, [points, searchQuery]);

  const handleSelectPvz = useCallback(
    (p: CdekPvzPoint) => {
      const pvz: SelectedPvz = {
        code: p.code,
        name: p.name,
        address: p.location.address_full || p.location.address,
        city: p.location.city,
        cityCode: p.location.city_code,
        postalCode: p.location.postal_code || "",
      };
      onSelect(pvz, tariff);
    },
    [onSelect, tariff]
  );

  // ――― Рендер ―――

  // Если город не выбран
  if (!cityCode) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
        Выберите город для отображения пунктов выдачи СДЭК
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Стоимость доставки */}
      {tariff && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
          <svg className="h-5 w-5 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <div className="text-sm">
            <span className="font-medium text-green-800">
              Доставка СДЭК: {tariff.delivery_sum} ₽
            </span>
            <span className="text-green-700">
              {" "}· {tariff.period_min}–{tariff.period_max} дн.
            </span>
          </div>
        </div>
      )}

      {/* Загрузка */}
      {loading && (
        <div className="flex items-center gap-2 py-4 text-sm text-gray-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-primary-500" />
          Загрузка пунктов выдачи...
        </div>
      )}

      {/* Ошибка */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Поиск по ПВЗ */}
      {points.length > 5 && (
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск по адресу ПВЗ..."
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      )}

      {/* Список ПВЗ */}
      {!loading && filteredPoints.length > 0 && (
        <div className="max-h-72 space-y-2 overflow-auto pr-1">
          {filteredPoints.map((p) => {
            const isSelected = selectedCode === p.code;
            return (
              <button
                key={p.code}
                type="button"
                onClick={() => handleSelectPvz(p)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  isSelected
                    ? "border-primary-500 bg-primary-50 ring-1 ring-primary-500"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {p.name}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-600">
                      {p.location.address_full || p.location.address}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {p.work_time}
                    </p>
                  </div>
                  {isSelected && (
                    <svg className="h-5 w-5 shrink-0 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {!loading && points.length > 0 && filteredPoints.length === 0 && (
        <p className="text-sm text-gray-500">
          Ничего не найдено. Попробуйте другой запрос.
        </p>
      )}
    </div>
  );
}
