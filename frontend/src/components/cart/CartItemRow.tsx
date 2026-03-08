"use client";

import { memo } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import {
  formatPrice,
  cmToMeters,
  metersToCm,
  pricePerCmToPerMeter,
  MIN_CUT_METERS,
  CUT_STEP_METERS,
} from "@/lib/utils";
import type { MedusaCartLineItem } from "@/lib/data/cart";
import { FabricPlaceholder } from "@/components/ui/FabricPlaceholder";
import { FabricQuantityControl, PieceQuantityControl } from "./QuantityControls";

const isFabricItem = (item: MedusaCartLineItem): boolean => {
  return item.metadata?.measurement_unit === "running_meter";
};

interface CartItemRowProps {
  item: MedusaCartLineItem;
  productImage?: string;
  loading: boolean;
  onUpdate: (itemId: string, qty: number) => void;
  onRemove: (itemId: string) => void;
}

/**
 * Одна строка товара в корзине.
 */
export const CartItemRow = memo(({
  item,
  productImage,
  loading,
  onUpdate,
  onRemove,
}: CartItemRowProps) => {
  const fabric = isFabricItem(item);
  const displayQty = fabric ? cmToMeters(item.quantity) : item.quantity;
  const displayUnitPrice = fabric
    ? pricePerCmToPerMeter(item.unit_price ?? 0)
    : (item.unit_price ?? 0);
  const unitLabel = fabric ? "пог. м" : "шт.";
  const lineTotal =
    item.total ?? item.subtotal ?? (item.unit_price ?? 0) * (item.quantity ?? 1);

  const stepCm = metersToCm(CUT_STEP_METERS);
  const minCm = metersToCm(MIN_CUT_METERS);

  return (
    <li className="flex gap-4 py-4">
      {/* Миниатюра */}
      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100">
        {item.thumbnail || productImage ? (
          <img
            src={item.thumbnail || productImage}
            alt={item.product_title}
            className="h-full w-full object-cover"
          />
        ) : (
          <FabricPlaceholder />
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
            <FabricQuantityControl
              quantityCm={item.quantity}
              stepCm={stepCm}
              minCm={minCm}
              loading={loading}
              onUpdate={(newQtyCm) => onUpdate(item.id, newQtyCm)}
              onRemove={() => onRemove(item.id)}
            />
          ) : (
            <PieceQuantityControl
              quantity={item.quantity}
              loading={loading}
              onUpdate={(qty) => onUpdate(item.id, qty)}
              onRemove={() => onRemove(item.id)}
            />
          )}

          <button
            type="button"
            onClick={() => onRemove(item.id)}
            disabled={loading}
            className="text-gray-400 transition hover:text-red-600 disabled:opacity-40"
            aria-label="Удалить"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Стоимость */}
      <div className="text-right">
        <span className="font-semibold text-gray-900">
          {formatPrice(lineTotal)}
        </span>
        {fabric && (
          <p className="mt-0.5 text-xs text-gray-400">{displayQty} пог. м</p>
        )}
      </div>
    </li>
  );
});

CartItemRow.displayName = "CartItemRow";
