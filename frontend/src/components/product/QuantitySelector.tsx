import { memo } from "react";
import { formatPrice } from "@/lib/utils";

interface QuantitySelectorProps {
  quantity: number;
  setQuantity: (q: number) => void;
  min: number;
  max: number;
  step: number;
  unitShort: string;
  isFabric: boolean;
  decrease: () => void;
  increase: () => void;
  pricePerUnit: number;
  currency?: string;
}

/**
 * Селектор количества с кнопками +/− и итогом.
 */
export const QuantitySelector = memo(({
  quantity,
  setQuantity,
  min,
  max,
  step,
  unitShort,
  isFabric,
  decrease,
  increase,
  pricePerUnit,
  currency,
}: QuantitySelectorProps) => {
  const totalPrice = Math.round(pricePerUnit * quantity);

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          {isFabric ? "Длина отреза" : "Количество"}
          {isFabric && (
            <span className="ml-1 text-xs text-gray-400">
              (мин. {min} пог. м, шаг {step} пог. м)
            </span>
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
            max={max}
            step={step}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v) && v >= min && v <= max) {
                setQuantity(Math.round(v * 10) / 10);
              }
            }}
            className="h-10 w-20 rounded-lg border border-gray-300 text-center text-base font-medium focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-500">{unitShort}</span>
          <button
            type="button"
            onClick={increase}
            disabled={quantity >= max}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-lg font-bold text-gray-600 transition hover:bg-gray-100 disabled:opacity-40"
          >
            +
          </button>
        </div>
      </div>

      {/* Итого */}
      <div className="flex items-baseline justify-between rounded-lg bg-primary-50 px-4 py-3">
        <span className="text-sm text-gray-600">
          {quantity} {unitShort} × {formatPrice(pricePerUnit, currency)}
        </span>
        <span className="text-lg font-bold text-primary-800">
          = {formatPrice(totalPrice, currency)}
        </span>
      </div>
    </div>
  );
});

QuantitySelector.displayName = "QuantitySelector";
