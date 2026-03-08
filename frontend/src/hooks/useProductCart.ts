"use client";

import { useState, useEffect, useCallback } from "react";
import { useCartStore } from "@/store/cart-store";
import { cmToMeters, metersToCm } from "@/lib/utils";

interface UseProductCartOptions {
  variantId: string | undefined;
  isFabric: boolean;
  min: number;
  step: number;
  maxQtyMeters: number;
}

/**
 * Хук для управления количеством товара и интеграции с корзиной.
 *
 * Ответственности:
 * - Состояние количества (quantity) с учётом min/step/max
 * - Определение «товар уже в корзине»
 * - Добавление / обновление в корзине
 * - Индикация «добавлено» / «обновлено»
 */
export function useProductCart({
  variantId,
  isFabric,
  min,
  step,
  maxQtyMeters,
}: UseProductCartOptions) {
  const items = useCartStore((s) => s.items);
  const addToCart = useCartStore((s) => s.addToCart);
  const updateItem = useCartStore((s) => s.updateItem);
  const refreshCart = useCartStore((s) => s.refreshCart);

  // Найти позицию корзины для этого варианта
  const cartItem = variantId
    ? items.find((i) => i.variant_id === variantId)
    : null;
  const isInCart = !!cartItem;

  // Количество в корзине (в метрах для тканей, в штуках для штучных)
  const cartQty = cartItem
    ? isFabric
      ? cmToMeters(cartItem.quantity)
      : cartItem.quantity
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

  const handleAddToCart = useCallback(async () => {
    if (!variantId) return;
    setAdding(true);
    try {
      if (isFabric) {
        await addToCart(variantId, metersToCm(quantity), {
          measurement_unit: "running_meter",
        });
      } else {
        await addToCart(variantId, quantity);
      }
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error("Ошибка добавления в корзину:", err);
    } finally {
      setAdding(false);
    }
  }, [variantId, isFabric, quantity, addToCart]);

  const handleUpdateCart = useCallback(async () => {
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
  }, [cartItem, isFabric, quantity, updateItem]);

  // Проверить, изменилось ли количество относительно корзины
  const qtyChanged = isInCart && Math.abs(quantity - cartQty) >= step * 0.5;

  const decrease = useCallback(() => {
    setQuantity((q) => {
      const next = Math.round((q - step) * 10) / 10;
      return next >= min ? next : q;
    });
  }, [step, min]);

  const increase = useCallback(() => {
    setQuantity((q) => {
      const next = Math.round((q + step) * 10) / 10;
      return next <= maxQtyMeters ? next : q;
    });
  }, [step, maxQtyMeters]);

  return {
    quantity,
    setQuantity,
    adding,
    added,
    updated,
    isInCart,
    qtyChanged,
    decrease,
    increase,
    handleAddToCart,
    handleUpdateCart,
  };
}
