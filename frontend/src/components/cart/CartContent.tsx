"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Trash2, Minus, Plus } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { formatPrice, cmToMeters, metersToCm, pricePerCmToPerMeter, CM_PER_METER, MIN_CUT_METERS, CUT_STEP_METERS } from "@/lib/utils";
import type { MedusaCartLineItem } from "@/lib/data/cart";

/** Проверить, является ли позиция тканью (погонные метры). */
function isFabricItem(item: MedusaCartLineItem): boolean {
  return item.metadata?.measurement_unit === "running_meter";
}

/**
 * Содержимое страницы корзины.
 *
 * Для тканей: quantity в БД хранится в сантиметрах, отображается в метрах.
 * unit_price в БД — цена за 1 см, отображается цена за 1 метр.
 * Medusa считает total = unit_price × quantity — это корректно в см.
 */
export function CartContent() {
  const { items, total, loading, refreshCart, updateItem, removeItem, productImages } =
    useCartStore();

  // Обновить данные корзины при монтировании
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  if (items.length === 0) {
    return (
      <div className="mt-8 text-center">
        <p className="text-gray-500 text-lg">Корзина пуста</p>
        <Link
          href="/catalog"
          className="mt-4 inline-block rounded-lg bg-primary-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-primary-700"
        >
          Перейти в каталог →
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {/* Список позиций */}
      <ul className="divide-y divide-gray-200">
        {items.map((item) => {
          const fabric = isFabricItem(item);
          // Для тканей: переводим из см в метры для отображения
          const displayQty = fabric ? cmToMeters(item.quantity) : item.quantity;
          // Цена за единицу: в админке в рублях, formatPrice ждёт копейки → ×100
          const displayUnitPrice = pricePerCmToPerMeter(item.unit_price ?? 0);
          const unitLabel = fabric ? "пог. м" : "шт.";
          // Стоимость позиции:
          // Ткани — Medusa total уже корректен (unit_price × qty_cm = рубли × см → kopecks)
          // Штучные — Medusa total в рублях (unit_price_руб × qty), нужно ×100 для kopecks
          const rawTotal = item.total ?? item.subtotal ?? (item.unit_price ?? 0) * (item.quantity ?? 1);
          const lineTotal = fabric ? rawTotal : rawTotal * 100;

          // Шаг/мин для тканей (в см для API)
          const stepCm = metersToCm(CUT_STEP_METERS); // 10 см
          const minCm = metersToCm(MIN_CUT_METERS);    // 50 см

          return (
            <li key={item.id} className="flex gap-4 py-4">
              {/* Миниатюра: thumbnail → актуальное фото товара → заглушка */}
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                {(item.thumbnail || productImages[item.product_id]) ? (
                  <img
                    src={item.thumbnail || productImages[item.product_id]}
                    alt={item.product_title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-gray-400">
                    Нет фото
                  </div>
                )}
              </div>

              {/* Информация */}
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <Link
                    href={`/products/${item.product_handle}`}
                    className="font-medium text-gray-900 hover:text-primary-700"
                  >
                    {item.product_title}
                  </Link>
                  {item.title !== "Default variant" && (
                    <p className="text-sm text-gray-500">{item.title}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    {formatPrice(displayUnitPrice)} / {unitLabel}
                  </p>
                </div>

                {/* Количество + удалить */}
                <div className="mt-2 flex items-center gap-3">
                  {fabric ? (
                    /* --- Ткань: шаг 0.1 м = 10 см, мин 0.5 м = 50 см --- */
                    <FabricQuantityControl
                      quantityCm={item.quantity}
                      stepCm={stepCm}
                      minCm={minCm}
                      loading={loading}
                      onUpdate={(newQtyCm) => updateItem(item.id, newQtyCm)}
                      onRemove={() => removeItem(item.id)}
                    />
                  ) : (
                    /* --- Штучный товар: целые числа --- */
                    <div className="flex items-center rounded-lg border border-gray-300">
                      <button
                        type="button"
                        onClick={() => {
                          if (item.quantity <= 1) {
                            removeItem(item.id);
                          } else {
                            updateItem(item.id, item.quantity - 1);
                          }
                        }}
                        disabled={loading}
                        className="flex h-8 w-8 items-center justify-center text-gray-600 transition hover:bg-gray-100 disabled:opacity-40"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-10 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateItem(item.id, item.quantity + 1)}
                        disabled={loading}
                        className="flex h-8 w-8 items-center justify-center text-gray-600 transition hover:bg-gray-100 disabled:opacity-40"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    disabled={loading}
                    className="text-gray-400 transition hover:text-red-600 disabled:opacity-40"
                    aria-label="Удалить"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Стоимость позиции */}
              <div className="text-right">
                <span className="font-semibold text-gray-900">
                  {formatPrice(lineTotal)}
                </span>
                {fabric && (
                  <p className="mt-0.5 text-xs text-gray-400">
                    {displayQty} пог. м
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {/* Итого + кнопка оформления */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
        <div className="flex items-center justify-between text-lg font-bold text-gray-900">
          <span>Итого</span>
          <span>{formatPrice(total || 0)}</span>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Стоимость доставки рассчитывается при оформлении
        </p>
        <Link
          href="/checkout"
          className="btn-primary mt-4 block w-full text-center text-base"
        >
          Оформить заказ
        </Link>
      </div>
    </div>
  );
}

// ============================================
// Компонент управления количеством для тканей
// ============================================

interface FabricQuantityControlProps {
  quantityCm: number;   // текущее кол-во в см (из Medusa)
  stepCm: number;       // шаг в см (10 = 0.1 м)
  minCm: number;        // минимум в см (50 = 0.5 м)
  loading: boolean;
  onUpdate: (newQtyCm: number) => void;
  onRemove: () => void;
}

function FabricQuantityControl({
  quantityCm,
  stepCm,
  minCm,
  loading,
  onUpdate,
  onRemove,
}: FabricQuantityControlProps) {
  const displayMeters = cmToMeters(quantityCm);

  const decrease = () => {
    const next = quantityCm - stepCm;
    if (next < minCm) {
      onRemove();
    } else {
      onUpdate(next);
    }
  };

  const increase = () => {
    onUpdate(quantityCm + stepCm);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center rounded-lg border border-gray-300">
        <button
          type="button"
          onClick={decrease}
          disabled={loading}
          className="flex h-8 w-8 items-center justify-center text-gray-600 transition hover:bg-gray-100 disabled:opacity-40"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-14 text-center text-sm font-medium">
          {displayMeters}
        </span>
        <button
          type="button"
          onClick={increase}
          disabled={loading}
          className="flex h-8 w-8 items-center justify-center text-gray-600 transition hover:bg-gray-100 disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <span className="text-xs text-gray-500">пог. м</span>
    </div>
  );
}
