import { formatPrice, pricePerCmToPerMeter, originalPrice } from "@/lib/utils";
import type { FabricMetadata, ProductVariant } from "@/types/product";

interface ProductCardPriceProps {
  variant: ProductVariant;
  meta: FabricMetadata | null | undefined;
  discount: number;
}

/**
 * Блок цены в карточке товара.
 * Показывает текущую цену, зачёркнутую старую (при скидке) и единицу измерения.
 * Используется в CatalogGrid и HomePage для единообразного отображения.
 */
export const ProductCardPrice = ({ variant, meta, discount }: ProductCardPriceProps) => {
  const price = variant.prices?.[0];
  if (!price) return null;

  const isFabric = meta?.measurement_unit === "running_meter";
  const currentPrice = isFabric
    ? pricePerCmToPerMeter(price.amount)
    : price.amount;
  const unitLabel = isFabric ? "пог. м" : "шт.";

  return (
    <p className="mt-2 text-base font-semibold text-primary-800">
      {discount > 0 && (
        <span className="mr-2 text-sm font-normal text-gray-400 line-through">
          {formatPrice(originalPrice(currentPrice, discount), price.currency_code)}
        </span>
      )}
      {formatPrice(currentPrice, price.currency_code)}
      <span className="ml-1 text-xs font-normal text-gray-500">
        / {unitLabel}
      </span>
    </p>
  );
};
