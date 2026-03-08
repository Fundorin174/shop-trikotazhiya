import { memo } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

interface CartSummaryProps {
  total: number;
}

/**
 * Блок «Итого» + кнопка оформления заказа.
 */
export const CartSummary = memo(({ total }: CartSummaryProps) => {
  return (
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
  );
});

CartSummary.displayName = "CartSummary";
