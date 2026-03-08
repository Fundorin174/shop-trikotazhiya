"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/store/cart-store";
import { CartItemRow } from "./CartItemRow";
import { CartSummary } from "./CartSummary";

/**
 * Содержимое страницы корзины.
 *
 * Все суммы в Medusa — в копейках (minor units).
 * Ткани: quantity в БД в сантиметрах, отображается в метрах.
 *        unit_price = копейки/см → отображается цена за 1 метр.
 *        total = unit_price × qty_cm → уже в копейках.
 * Штучные: unit_price = копейки, total = unit_price × qty → копейки.
 */
export const CartContent = () => {
  const { items, total, loading, refreshCart, updateItem, removeItem, productImages } =
    useCartStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const handleUpdate = useCallback(
    async (id: string, qty: number) => {
      setError(null);
      try {
        await updateItem(id, qty);
      } catch {
        setError("Не удалось обновить количество. Попробуйте ещё раз.");
      }
    },
    [updateItem]
  );

  const handleRemove = useCallback(
    async (id: string) => {
      setError(null);
      try {
        await removeItem(id);
      } catch {
        setError("Не удалось удалить товар. Попробуйте ещё раз.");
      }
    },
    [removeItem]
  );

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
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <ul className="divide-y divide-gray-200">
        {items.map((item) => (
          <CartItemRow
            key={item.id}
            item={item}
            productImage={productImages[item.product_id]}
            loading={loading}
            onUpdate={handleUpdate}
            onRemove={handleRemove}
          />
        ))}
      </ul>

      <CartSummary total={total} />
    </div>
  );
};
