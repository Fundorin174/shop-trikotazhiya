"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import type { MedusaProduct, SortKey, SortDir } from "@/types/admin";

/**
 * Хук для управления списком товаров в админке.
 *
 * Загрузка, сортировка, удаление, inline-редактирование цены и запаса.
 */
export function useProductList(token: string) {
  const [products, setProducts] = useState<MedusaProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Сортировка
  const [sortKey, setSortKey] = useState<SortKey>("sku");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Удаление
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Inline-редактирование цены
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editPriceValue, setEditPriceValue] = useState("");
  const [savingPrice, setSavingPrice] = useState(false);
  const [confirmPriceId, setConfirmPriceId] = useState<string | null>(null);

  // Inline-редактирование запаса
  const [editingInvId, setEditingInvId] = useState<string | null>(null);
  const [editInvValue, setEditInvValue] = useState("");
  const [savingInv, setSavingInv] = useState(false);
  const [confirmInvId, setConfirmInvId] = useState<string | null>(null);

  // ---- Сортировка ----

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedProducts = useMemo(() => {
    const list = [...products];
    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      switch (sortKey) {
        case "sku":
          return dir * a.sku.localeCompare(b.sku, "ru", { numeric: true });
        case "title":
          return dir * a.title.localeCompare(b.title, "ru");
        case "fabric_type":
          return dir * (a.fabric_type || "").localeCompare(b.fabric_type || "", "ru");
        case "price": {
          const pa = a.measurement_unit === "running_meter" ? a.price : a.price / 100;
          const pb = b.measurement_unit === "running_meter" ? b.price : b.price / 100;
          return dir * (pa - pb);
        }
        case "status":
          return dir * a.status.localeCompare(b.status, "ru");
        case "inventory":
          return dir * ((a.inventory ?? -1) - (b.inventory ?? -1));
        case "created_at":
          return dir * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        default:
          return 0;
      }
    });
    return list;
  }, [products, sortKey, sortDir]);

  // ---- Загрузка ----

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/products", {
        headers: { "x-admin-token": token },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка загрузки");
      setProducts(data.products);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ---- Удаление ----

  const handleDelete = async (productId: string) => {
    setDeleting(productId);
    setError("");
    try {
      const res = await fetch("/api/admin/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка удаления");
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setConfirmDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка удаления");
    } finally {
      setDeleting(null);
    }
  };

  // ---- Форматирование цены ----

  const formatPrice = (amount: number, unit: string) => {
    if (unit === "running_meter") {
      return `${((amount * 100) / 100).toLocaleString("ru-RU")} ₽/м`;
    }
    return `${(amount / 100).toLocaleString("ru-RU")} ₽/шт`;
  };

  // ---- Inline-редактирование цены ----

  const startPriceEdit = (p: MedusaProduct) => {
    const displayRub =
      p.measurement_unit === "running_meter" ? p.price : p.price / 100;
    setEditingPriceId(p.id);
    setEditPriceValue(String(displayRub));
    setConfirmPriceId(null);
  };

  const requestPriceConfirm = () => {
    const num = parseFloat(editPriceValue);
    if (isNaN(num) || num < 0) {
      setError("Введите корректную цену");
      return;
    }
    setConfirmPriceId(editingPriceId);
  };

  const savePrice = async () => {
    const product = products.find((p) => p.id === editingPriceId);
    if (!product) return;

    const rubPrice = parseFloat(editPriceValue);
    if (isNaN(rubPrice) || rubPrice < 0) return;

    const amount =
      product.measurement_unit === "running_meter"
        ? Math.round(rubPrice)
        : Math.round(rubPrice * 100);

    setSavingPrice(true);
    setError("");
    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify({
          productId: product.id,
          variantId: product.variantId,
          amount,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка сохранения");

      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, price: amount } : p)),
      );
      setEditingPriceId(null);
      setConfirmPriceId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения цены");
    } finally {
      setSavingPrice(false);
    }
  };

  const cancelPriceEdit = () => {
    setEditingPriceId(null);
    setConfirmPriceId(null);
    setEditPriceValue("");
  };

  // ---- Inline-редактирование запаса ----

  const startInvEdit = (p: MedusaProduct) => {
    if (p.inventory == null) return;
    const display =
      p.measurement_unit === "running_meter" ? p.inventory / 100 : p.inventory;
    setEditingInvId(p.id);
    setEditInvValue(String(display));
    setConfirmInvId(null);
  };

  const requestInvConfirm = () => {
    const num = parseFloat(editInvValue);
    if (isNaN(num) || num < 0) {
      setError("Введите корректное количество");
      return;
    }
    setConfirmInvId(editingInvId);
  };

  const saveInventory = async () => {
    const product = products.find((p) => p.id === editingInvId);
    if (!product) return;

    const userVal = parseFloat(editInvValue);
    if (isNaN(userVal) || userVal < 0) return;

    const rawQty =
      product.measurement_unit === "running_meter"
        ? Math.round(userVal * 100)
        : Math.round(userVal);

    setSavingInv(true);
    setError("");
    try {
      const res = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify({ sku: product.sku, quantity: rawQty }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка сохранения");

      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, inventory: rawQty } : p,
        ),
      );
      setEditingInvId(null);
      setConfirmInvId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения запаса");
    } finally {
      setSavingInv(false);
    }
  };

  const cancelInvEdit = () => {
    setEditingInvId(null);
    setConfirmInvId(null);
    setEditInvValue("");
  };

  return {
    // Данные
    products,
    sortedProducts,
    loading,
    error,
    sortKey,
    sortDir,

    // Действия
    fetchProducts,
    toggleSort,

    // Удаление
    deleting,
    confirmDelete,
    setConfirmDelete,
    handleDelete,

    // Цена
    editingPriceId,
    editPriceValue,
    setEditPriceValue,
    savingPrice,
    confirmPriceId,
    setConfirmPriceId,
    startPriceEdit,
    requestPriceConfirm,
    savePrice,
    cancelPriceEdit,
    formatPrice,

    // Запас
    editingInvId,
    editInvValue,
    setEditInvValue,
    savingInv,
    confirmInvId,
    setConfirmInvId,
    startInvEdit,
    requestInvConfirm,
    saveInventory,
    cancelInvEdit,
  };
}
