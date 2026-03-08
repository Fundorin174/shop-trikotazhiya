"use client";

import { useProductList } from "@/hooks/useProductList";
import type { SortKey } from "@/types/admin";
import { FABRIC_LABELS } from "@/lib/admin/constants";

interface ExistingProductsListProps {
  token: string;
}

/** Список существующих товаров с сортировкой, inline-редактированием и удалением */
export const ExistingProductsList = ({ token }: ExistingProductsListProps) => {
  const {
    products,
    sortedProducts,
    loading,
    error,
    sortKey,
    sortDir,
    fetchProducts,
    toggleSort,
    deleting,
    confirmDelete,
    setConfirmDelete,
    handleDelete,
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
  } = useProductList(token);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <span className="ml-1 text-gray-300">↕</span>;
    return <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <svg
          className="h-6 w-6 animate-spin text-blue-500"
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
        <span className="ml-2 text-sm text-gray-500">Загрузка товаров...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Шапка списка */}
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Всего:{" "}
          <strong className="text-gray-900">{products.length}</strong> товаров
        </div>
        <button
          onClick={fetchProducts}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100"
        >
          ↻ Обновить
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Таблица */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <th
                className="cursor-pointer select-none px-4 py-3 hover:text-gray-700"
                onClick={() => toggleSort("sku")}
              >
                SKU
                <SortIcon col="sku" />
              </th>
              <th
                className="cursor-pointer select-none px-4 py-3 hover:text-gray-700"
                onClick={() => toggleSort("title")}
              >
                Название
                <SortIcon col="title" />
              </th>
              <th
                className="cursor-pointer select-none px-4 py-3 hover:text-gray-700"
                onClick={() => toggleSort("fabric_type")}
              >
                Тип
                <SortIcon col="fabric_type" />
              </th>
              <th
                className="cursor-pointer select-none px-4 py-3 hover:text-gray-700"
                onClick={() => toggleSort("price")}
              >
                Цена
                <SortIcon col="price" />
              </th>
              <th
                className="cursor-pointer select-none px-4 py-3 hover:text-gray-700"
                onClick={() => toggleSort("status")}
              >
                Статус
                <SortIcon col="status" />
              </th>
              <th
                className="cursor-pointer select-none px-4 py-3 hover:text-gray-700"
                onClick={() => toggleSort("inventory")}
              >
                Запас
                <SortIcon col="inventory" />
              </th>
              <th
                className="cursor-pointer select-none px-4 py-3 hover:text-gray-700"
                onClick={() => toggleSort("created_at")}
              >
                Дата
                <SortIcon col="created_at" />
              </th>
              <th className="px-4 py-3 text-right">Действие</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedProducts.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 font-mono text-xs font-medium">
                  {p.sku}
                </td>
                <td className="max-w-[250px] truncate px-4 py-2.5">
                  <a
                    href={`/products/${p.handle}`}
                    target="_blank"
                    className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {p.title}
                  </a>
                </td>
                <td className="px-4 py-2.5">
                  {p.fabric_type && (
                    <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                      {FABRIC_LABELS[p.fabric_type] || p.fabric_type}
                    </span>
                  )}
                </td>

                {/* Цена (inline edit) */}
                <td className="px-4 py-2.5 font-medium">
                  {editingPriceId === p.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={editPriceValue}
                        onChange={(e) => setEditPriceValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") requestPriceConfirm();
                          if (e.key === "Escape") cancelPriceEdit();
                        }}
                        autoFocus
                        className="w-24 rounded border border-blue-300 px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                      <span className="text-xs text-gray-400">
                        {p.measurement_unit === "running_meter"
                          ? "₽/м"
                          : "₽/шт"}
                      </span>
                      {confirmPriceId === p.id ? (
                        <>
                          <span className="text-xs text-orange-600">
                            Сохранить?
                          </span>
                          <button
                            onClick={savePrice}
                            disabled={savingPrice}
                            className="rounded bg-green-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-green-700 disabled:bg-green-400"
                          >
                            {savingPrice ? "…" : "Да"}
                          </button>
                          <button
                            onClick={() => setConfirmPriceId(null)}
                            className="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-700 hover:bg-gray-300"
                          >
                            Нет
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={requestPriceConfirm}
                            className="rounded bg-blue-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-blue-700"
                          >
                            ✓
                          </button>
                          <button
                            onClick={cancelPriceEdit}
                            className="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-700 hover:bg-gray-300"
                          >
                            ✕
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <span
                      onDoubleClick={() => startPriceEdit(p)}
                      className="cursor-pointer rounded px-1 py-0.5 transition-colors hover:bg-blue-50"
                      title="Двойной клик для редактирования"
                    >
                      {formatPrice(p.price, p.measurement_unit)}
                    </span>
                  )}
                </td>

                {/* Статус */}
                <td className="px-4 py-2.5">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.status === "published"
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {p.status === "published" ? "Опубликован" : p.status}
                  </span>
                </td>

                {/* Запас (inline edit) */}
                <td className="px-4 py-2.5 text-right text-xs tabular-nums">
                  {editingInvId === p.id ? (
                    <div className="flex items-center justify-end gap-1.5">
                      <input
                        type="number"
                        min="0"
                        step={
                          p.measurement_unit === "running_meter" ? "0.5" : "1"
                        }
                        value={editInvValue}
                        onChange={(e) => setEditInvValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") requestInvConfirm();
                          if (e.key === "Escape") cancelInvEdit();
                        }}
                        autoFocus
                        className="w-20 rounded border border-blue-300 px-2 py-1 text-right text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                      <span className="text-xs text-gray-400">
                        {p.measurement_unit === "running_meter" ? "м" : "шт"}
                      </span>
                      {confirmInvId === p.id ? (
                        <>
                          <span className="text-xs text-orange-600">
                            Сохр.?
                          </span>
                          <button
                            onClick={saveInventory}
                            disabled={savingInv}
                            className="rounded bg-green-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-green-700 disabled:bg-green-400"
                          >
                            {savingInv ? "…" : "Да"}
                          </button>
                          <button
                            onClick={() => setConfirmInvId(null)}
                            className="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-700 hover:bg-gray-300"
                          >
                            Нет
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={requestInvConfirm}
                            className="rounded bg-blue-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-blue-700"
                          >
                            ✓
                          </button>
                          <button
                            onClick={cancelInvEdit}
                            className="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-700 hover:bg-gray-300"
                          >
                            ✕
                          </button>
                        </>
                      )}
                    </div>
                  ) : p.inventory != null ? (
                    <span
                      onDoubleClick={() => startInvEdit(p)}
                      className={`cursor-pointer rounded px-1 py-0.5 transition-colors hover:bg-blue-50 ${
                        p.inventory === 0
                          ? "font-medium text-red-500"
                          : "text-gray-700"
                      }`}
                      title="Двойной клик для редактирования"
                    >
                      {p.measurement_unit === "running_meter"
                        ? `${(p.inventory / 100).toLocaleString("ru-RU")} м`
                        : `${p.inventory.toLocaleString("ru-RU")} шт`}
                    </span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>

                {/* Дата */}
                <td className="px-4 py-2.5 text-xs text-gray-500">
                  {new Date(p.created_at).toLocaleDateString("ru-RU")}
                </td>

                {/* Действие */}
                <td className="px-4 py-2.5 text-right">
                  {confirmDelete === p.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-xs text-red-600">Удалить?</span>
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={deleting === p.id}
                        className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:bg-red-400"
                      >
                        {deleting === p.id ? "..." : "Да"}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="rounded bg-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-300"
                      >
                        Нет
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(p.id)}
                      className="rounded px-2 py-1 text-xs text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
                    >
                      Удалить
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-8 text-center text-sm text-gray-400"
                >
                  Товары не найдены
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
