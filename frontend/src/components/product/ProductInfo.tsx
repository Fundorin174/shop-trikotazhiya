"use client";

import { useState, useEffect, useCallback } from "react";
import { formatPrice, formatWidth, MEASUREMENT_UNITS, MEASUREMENT_UNITS_FULL, MIN_CUT_METERS, CUT_STEP_METERS, cmToMeters, metersToCm, pricePerCmToPerMeter } from "@/lib/utils";
import { FABRIC_TYPE_LABELS } from "@/types/product";
import type { Product, FabricMetadata } from "@/types/product";
import { SafeHtml } from "@/components/ui/SafeHtml";
import { useCartStore } from "@/store/cart-store";

interface ProductInfoProps {
  product: Product;
  fabricData: Record<string, unknown> | null;
}

/**
 * Блок информации о товаре: цена, характеристики, кнопка «В корзину».
 * Если товар уже в корзине — показывает текущее количество и кнопку «Обновить».
 */
export function ProductInfo({ product, fabricData }: ProductInfoProps) {
  const meta = fabricData as FabricMetadata | null;
  const variant = product.variants?.[0];
  const price = variant?.prices?.[0];
  const inStock = (variant?.inventory_quantity ?? 0) > 0;

  // Параметры отреза из metadata (или дефолты)
  const isFabric = meta?.measurement_unit === "running_meter";

  // --- Конверсии: в админке ВСЕ цены в рублях, formatPrice() ожидает копейки → ×100 ---
  const pricePerUnit = price ? pricePerCmToPerMeter(price.amount) : 0;
  const maxQtyMeters = isFabric ? cmToMeters(variant?.inventory_quantity ?? 0) : (variant?.inventory_quantity ?? 0);

  const min = meta?.min_order ?? (isFabric ? MIN_CUT_METERS : 1);
  const step = meta?.order_step ?? (isFabric ? CUT_STEP_METERS : 1);
  const unitShort = MEASUREMENT_UNITS[meta?.measurement_unit || "running_meter"] || "пог. м";
  const unitFull = MEASUREMENT_UNITS_FULL[meta?.measurement_unit || "running_meter"] || "метр погонный";

  // --- Связь с корзиной ---
  const items = useCartStore((s) => s.items);
  const addToCart = useCartStore((s) => s.addToCart);
  const updateItem = useCartStore((s) => s.updateItem);
  const refreshCart = useCartStore((s) => s.refreshCart);

  // Найти позицию корзины для этого варианта
  const cartItem = variant
    ? items.find((i) => i.variant_id === variant.id)
    : null;
  const isInCart = !!cartItem;

  // Количество в корзине (в метрах для тканей, в штуках для штучных)
  const cartQty = cartItem
    ? (isFabric ? cmToMeters(cartItem.quantity) : cartItem.quantity)
    : 0;

  const [quantity, setQuantity] = useState(min);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [updated, setUpdated] = useState(false);

  // Синхронизировать quantity с корзиной при загрузке/изменении
  useEffect(() => {
    if (isInCart && cartQty > 0) {
      setQuantity(Math.round(cartQty * 10) / 10);
    }
  }, [isInCart, cartQty]);

  // Подтянуть данные корзины при монтировании
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const handleAddToCart = async () => {
    if (!variant) return;
    setAdding(true);
    try {
      if (isFabric) {
        await addToCart(variant.id, metersToCm(quantity), {
          measurement_unit: "running_meter",
        });
      } else {
        await addToCart(variant.id, quantity);
      }
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error("Ошибка добавления в корзину:", err);
    } finally {
      setAdding(false);
    }
  };

  const handleUpdateCart = async () => {
    if (!cartItem) return;
    setAdding(true);
    try {
      const newQty = isFabric ? metersToCm(quantity) : quantity;
      await updateItem(cartItem.id, newQty);
      setUpdated(true);
      setTimeout(() => setUpdated(false), 2000);
    } catch (err) {
      console.error("Ошибка обновления корзины:", err);
    } finally {
      setAdding(false);
    }
  };

  // Проверить, изменилось ли количество относительно корзины
  const qtyChanged = isInCart && Math.abs(quantity - cartQty) >= (step * 0.5);

  const decrease = () => {
    setQuantity((q) => {
      const next = Math.round((q - step) * 10) / 10;
      return next >= min ? next : q;
    });
  };

  const increase = () => {
    setQuantity((q) => {
      const next = Math.round((q + step) * 10) / 10;
      return next <= maxQtyMeters ? next : q;
    });
  };

  // Итого: цена за единицу × количество (pricePerUnit уже в копейках)
  const totalPrice = Math.round(pricePerUnit * quantity);

  return (
    <div className="space-y-6">
      {/* Артикул */}
      {meta?.sku && (
        <p className="text-sm text-gray-500">Арт.: {meta.sku}</p>
      )}

      {/* Название */}
      <h1 className="font-heading text-2xl font-bold text-primary-900 sm:text-3xl">
        {product.title}
      </h1>

      {/* Краткое описание */}
      {meta?.short_description && (
        <SafeHtml
          html={String(meta.short_description)}
          as="div"
          className="text-gray-600"
        />
      )}

      {/* Цена */}
      {price && (
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold text-primary-800">
            {formatPrice(pricePerUnit, price.currency_code)}
          </span>
          <span className="text-sm text-gray-500">
            / {unitShort}
          </span>
        </div>
      )}

      {/* Скидка */}
      {meta?.discount_percent && meta.discount_percent > 0 && (
        <span className="inline-block rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
          Скидка {meta.discount_percent}%
        </span>
      )}

      {/* Характеристики */}
      <div className="space-y-3 border-t border-gray-200 pt-6">
        <h2 className="text-sm font-semibold text-gray-900">Характеристики</h2>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {meta?.fabric_type && (
            <>
              <dt className="text-gray-500">Тип ткани</dt>
              <dd className="text-gray-900">
                {FABRIC_TYPE_LABELS[meta.fabric_type] || meta.fabric_type}
              </dd>
            </>
          )}
          {meta?.composition && (
            <>
              <dt className="text-gray-500">Состав</dt>
              <dd className="text-gray-900">{meta.composition}</dd>
            </>
          )}
          {meta?.width_cm && (
            <>
              <dt className="text-gray-500">Ширина</dt>
              <dd className="text-gray-900">{formatWidth(meta.width_cm)}</dd>
            </>
          )}
          {meta?.country && (
            <>
              <dt className="text-gray-500">Страна</dt>
              <dd className="text-gray-900">{meta.country}</dd>
            </>
          )}
          {meta?.color && (
            <>
              <dt className="text-gray-500">Цвет</dt>
              <dd className="flex items-center gap-2 text-gray-900">
                {meta.color_hex && (
                  <span
                    className="inline-block h-4 w-4 rounded-full border"
                    style={{ backgroundColor: meta.color_hex }}
                  />
                )}
                {meta.color}
              </dd>
            </>
          )}
          {meta?.collection_name && (
            <>
              <dt className="text-gray-500">Коллекция</dt>
              <dd className="text-gray-900">{meta.collection_name}</dd>
            </>
          )}
          {meta?.quality && (
            <>
              <dt className="text-gray-500">Качество</dt>
              <dd className="text-gray-900">{meta.quality}</dd>
            </>
          )}
        </dl>
      </div>

      {/* Наличие + выбор количества + кнопка */}
      <div className="space-y-4 border-t border-gray-200 pt-6">
        <p className={`text-sm font-medium ${inStock ? "text-primary-600" : "text-red-600"}`}>
          {inStock
            ? `В наличии (${maxQtyMeters} ${unitShort})`
            : "Нет в наличии"}
        </p>

        {inStock && (
          <div className="space-y-3">
            {/* Селектор количества */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {isFabric ? "Длина отреза" : "Количество"}
                {isFabric && (
                  <span className="ml-1 text-xs text-gray-400">(мин. {min} пог. м, шаг {step} пог. м)</span>
                )}
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={decrease}
                  disabled={quantity <= min}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-lg font-bold text-gray-600 transition hover:bg-gray-100 disabled:opacity-40"
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  min={min}
                  max={maxQtyMeters}
                  step={step}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v) && v >= min && v <= maxQtyMeters) {
                      setQuantity(Math.round(v * 10) / 10);
                    }
                  }}
                  className="h-10 w-20 rounded-lg border border-gray-300 text-center text-base font-medium focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-500">
                  {unitShort}
                </span>
                <button
                  type="button"
                  onClick={increase}
                  disabled={quantity >= maxQtyMeters}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-lg font-bold text-gray-600 transition hover:bg-gray-100 disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>

            {/* Итого */}
            {price && (
              <div className="flex items-baseline justify-between rounded-lg bg-primary-50 px-4 py-3">
                <span className="text-sm text-gray-600">
                  {quantity} {unitShort} × {formatPrice(pricePerUnit, price.currency_code)}
                </span>
                <span className="text-lg font-bold text-primary-800">
                  = {formatPrice(totalPrice, price.currency_code)}
                </span>
              </div>
            )}
          </div>
        )}

        <button
          disabled={!inStock || adding || (isInCart && !qtyChanged)}
          onClick={isInCart ? handleUpdateCart : handleAddToCart}
          className={`w-full text-base ${
            isInCart && !qtyChanged
              ? "cursor-default rounded-lg bg-primary-100 py-3 font-semibold text-primary-700"
              : "btn-primary"
          }`}
        >
          {adding
            ? (isInCart ? "Обновляем..." : "Добавляем...")
            : updated
              ? "✓ Обновлено!"
              : added
                ? "✓ Добавлено!"
                : isInCart
                  ? (qtyChanged ? "Обновить количество" : "✓ Уже в корзине")
                  : inStock
                    ? "Добавить в корзину"
                    : "Сообщить о поступлении"}
        </button>
      </div>
    </div>
  );
}
