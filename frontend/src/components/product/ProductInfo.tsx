"use client";

import { formatPrice, formatWidth, MEASUREMENT_UNITS } from "@/lib/utils";
import { FABRIC_TYPE_LABELS } from "@/types/product";
import type { Product, FabricMetadata } from "@/types/product";

interface ProductInfoProps {
  product: Product;
  fabricData: Record<string, unknown> | null;
}

/**
 * Блок информации о товаре: цена, характеристики, кнопка «В корзину».
 */
export function ProductInfo({ product, fabricData }: ProductInfoProps) {
  const meta = fabricData as FabricMetadata | null;
  const variant = product.variants?.[0];
  const price = variant?.prices?.[0];
  const inStock = (variant?.inventory_quantity ?? 0) > 0;

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
        <p className="text-gray-600">{meta.short_description}</p>
      )}

      {/* Цена */}
      {price && (
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold text-primary-800">
            {formatPrice(price.amount, price.currency_code)}
          </span>
          {meta?.measurement_unit && (
            <span className="text-sm text-gray-500">
              / {MEASUREMENT_UNITS[meta.measurement_unit] || meta.measurement_unit}
            </span>
          )}
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

      {/* Наличие + кнопка */}
      <div className="space-y-4 border-t border-gray-200 pt-6">
        <p className={`text-sm font-medium ${inStock ? "text-primary-600" : "text-red-600"}`}>
          {inStock
            ? `В наличии (${variant?.inventory_quantity} ${MEASUREMENT_UNITS[meta?.measurement_unit || "meter"] || "шт."})`
            : "Нет в наличии"}
        </p>

        {/* TODO: выбор количества */}
        <button
          disabled={!inStock}
          className="btn-primary w-full text-base"
        >
          {inStock ? "Добавить в корзину" : "Сообщить о поступлении"}
        </button>
      </div>
    </div>
  );
}
