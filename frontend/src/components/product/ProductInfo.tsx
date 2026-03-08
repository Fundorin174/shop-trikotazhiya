"use client";

import {
  formatPrice,
  MEASUREMENT_UNITS,
  MIN_CUT_METERS,
  CUT_STEP_METERS,
  cmToMeters,
  pricePerCmToPerMeter,
  originalPrice,
} from "@/lib/utils";
import type { Product, FabricMetadata } from "@/types/product";
import { SafeHtml } from "@/components/ui/SafeHtml";
import { useProductCart } from "@/hooks/useProductCart";
import { ProductSpecs } from "./ProductSpecs";
import { QuantitySelector } from "./QuantitySelector";

interface ProductInfoProps {
  product: Product;
  fabricData: Record<string, unknown> | null;
}

/**
 * Блок информации о товаре: цена, характеристики, кнопка «В корзину».
 * Если товар уже в корзине — показывает текущее количество и кнопку «Обновить».
 */
export const ProductInfo = ({ product, fabricData }: ProductInfoProps) => {
  const meta = fabricData as FabricMetadata | null;
  const variant = product.variants?.[0];
  const price = variant?.prices?.[0];
  const inStock = (variant?.inventory_quantity ?? 0) > 0;

  const isFabric = meta?.measurement_unit === "running_meter";
  const pricePerUnit = price
    ? isFabric
      ? pricePerCmToPerMeter(price.amount)
      : price.amount
    : 0;
  const maxQtyMeters = isFabric
    ? cmToMeters(variant?.inventory_quantity ?? 0)
    : (variant?.inventory_quantity ?? 0);

  const min = meta?.min_order ?? (isFabric ? MIN_CUT_METERS : 1);
  const step = meta?.order_step ?? (isFabric ? CUT_STEP_METERS : 1);
  const unitShort =
    MEASUREMENT_UNITS[meta?.measurement_unit || "running_meter"] || "пог. м";

  const cart = useProductCart({
    variantId: variant?.id,
    isFabric,
    min,
    step,
    maxQtyMeters,
  });

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
          {meta?.discount_percent && meta.discount_percent > 0 && (
            <span className="text-xl text-gray-400 line-through">
              {formatPrice(
                originalPrice(pricePerUnit, meta.discount_percent),
                price.currency_code,
              )}
            </span>
          )}
          <span className="text-3xl font-bold text-primary-800">
            {formatPrice(pricePerUnit, price.currency_code)}
          </span>
          <span className="text-sm text-gray-500">/ {unitShort}</span>
        </div>
      )}

      {/* Скидка */}
      {meta?.discount_percent && meta.discount_percent > 0 && (
        <span className="inline-block rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
          Скидка {meta.discount_percent}%
        </span>
      )}

      {/* Характеристики */}
      <ProductSpecs meta={meta} />

      {/* Наличие + количество + кнопка */}
      <div className="space-y-4 border-t border-gray-200 pt-6">
        <p
          className={`text-sm font-medium ${inStock ? "text-primary-600" : "text-red-600"}`}
        >
          {inStock
            ? `В наличии (${maxQtyMeters} ${unitShort})`
            : "Нет в наличии"}
        </p>

        {inStock && price && (
          <QuantitySelector
            quantity={cart.quantity}
            setQuantity={cart.setQuantity}
            min={min}
            max={maxQtyMeters}
            step={step}
            unitShort={unitShort}
            isFabric={isFabric}
            decrease={cart.decrease}
            increase={cart.increase}
            pricePerUnit={pricePerUnit}
            currency={price.currency_code}
          />
        )}

        <button
          disabled={!inStock || cart.adding || (cart.isInCart && !cart.qtyChanged)}
          onClick={cart.isInCart ? cart.handleUpdateCart : cart.handleAddToCart}
          className={`w-full text-base ${
            cart.isInCart && !cart.qtyChanged
              ? "cursor-default rounded-lg bg-primary-100 py-3 font-semibold text-primary-700"
              : "btn-primary"
          }`}
        >
          {cart.adding
            ? cart.isInCart
              ? "Обновляем..."
              : "Добавляем..."
            : cart.updated
              ? "✓ Обновлено!"
              : cart.added
                ? "✓ Добавлено!"
                : cart.isInCart
                  ? cart.qtyChanged
                    ? "Обновить количество"
                    : "✓ Уже в корзине"
                  : inStock
                    ? "Добавить в корзину"
                    : "Сообщить о поступлении"}
        </button>
      </div>
    </div>
  );
};
