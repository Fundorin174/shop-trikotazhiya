"use client";

import { memo } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import type { CdekTariff } from "@/lib/data/cdek";

interface OrderSummaryProps {
  items: Array<{
    id: string;
    product_title?: string;
    title?: string;
    total?: number;
    subtotal?: number;
    unit_price?: number;
    quantity: number;
    metadata?: Record<string, unknown> | null;
  }>;
  total: number;
  deliveryTariff: CdekTariff | null;
  isFormValid: boolean;
  loading: boolean;
  onSubmit: () => void;
}

/**
 * Правая панель — итого по заказу + кнопка оплаты.
 */
export const OrderSummary = memo(({
  items,
  total,
  deliveryTariff,
  isFormValid,
  loading,
  onSubmit,
}: OrderSummaryProps) => {
  const hasItems = items.length > 0;

  const formatItemPrice = (item: OrderSummaryProps["items"][number]) => {
    const itemTotal =
      item.total ?? item.subtotal ?? (item.unit_price ?? 0) * (item.quantity ?? 1);
    return formatPrice(itemTotal);
  };

  return (
    <aside className="h-fit rounded-lg border bg-gray-50 p-6 lg:sticky lg:top-8">
      <h2 className="text-lg font-semibold">Ваш заказ</h2>

      {hasItems ? (
        <>
          <ul className="mt-4 divide-y text-sm">
            {items.map((item) => (
              <li key={item.id} className="flex justify-between py-2">
                <div className="flex-1 pr-4">
                  <p className="font-medium text-gray-900">
                    {item.product_title || item.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.metadata?.measurement_unit === "running_meter"
                      ? `${(item.quantity / 100).toFixed(2)} м`
                      : `${item.quantity} шт.`}
                  </p>
                </div>
                <span className="shrink-0 font-medium">
                  {formatItemPrice(item)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 border-t pt-4 space-y-2">
            {deliveryTariff && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Доставка СДЭК</span>
                <span className="font-medium">
                  {deliveryTariff.delivery_sum} ₽
                </span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold">
              <span>Итого</span>
              <span>
                {formatPrice(total)}
                {deliveryTariff ? ` + ${deliveryTariff.delivery_sum} ₽` : ""}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onSubmit}
            disabled={!isFormValid || loading}
            className="btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="opacity-25"
                  />
                  <path
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    className="opacity-75"
                  />
                </svg>
                Обработка...
              </span>
            ) : (
              `Оплатить ${formatPrice(total)}`
            )}
          </button>
        </>
      ) : (
        <div className="mt-4">
          <p className="text-sm text-gray-500">Корзина пуста</p>
          <Link
            href="/catalog"
            className="mt-4 inline-block text-sm text-accent-600 hover:underline"
          >
            Перейти в каталог
          </Link>
        </div>
      )}
    </aside>
  );
});

OrderSummary.displayName = "OrderSummary";
