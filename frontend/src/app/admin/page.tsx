"use client";

import { useState } from "react";
import type { AdminTab } from "@/types/admin";
import { useImport } from "@/hooks/useImport";
import { LoginForm } from "@/components/admin/LoginForm";
import { ExistingProductsList } from "@/components/admin/ExistingProductsList";
import { AddProductForm } from "@/components/admin/AddProductForm";
import { ProductPreviewTable } from "@/components/admin/ProductPreviewTable";
import { ResultsPanel } from "@/components/admin/ResultsPanel";
import { ImportHelp } from "@/components/admin/ImportHelp";

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>("products");

  // Не авторизован — показываем логин
  if (!token) {
    return <LoginForm onLogin={setToken} />;
  }

  return <AdminDashboard token={token} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => setToken(null)} />;
}

// ============================================
// Основная панель (авторизованный пользователь)
// ============================================

function AdminDashboard({
  token,
  activeTab,
  setActiveTab,
  onLogout,
}: {
  token: string;
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  onLogout: () => void;
}) {
  const {
    products,
    fileName,
    validationErrors,
    importing,
    progress,
    results,
    error,
    fileInputRef,
    handleFileSelect,
    handleImport,
    handleReset,
    downloadTemplate,
  } = useImport(token);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Шапка */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Админ-панель</h1>
          <p className="mt-1 text-sm text-gray-500">
            Управление товарами магазина
          </p>
        </div>
        <button
          onClick={onLogout}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100"
        >
          Выйти
        </button>
      </div>

      {/* Табы */}
      <div className="mb-6 flex gap-1 rounded-xl bg-gray-100 p-1">
        {(
          [
            { key: "products", label: "Товары" },
            { key: "import", label: "Импорт" },
            { key: "add", label: "+ Добавить" },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* === Таб: Товары === */}
      {activeTab === "products" && (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Список товаров
          </h2>
          <ExistingProductsList token={token} />
        </div>
      )}

      {/* === Таб: Импорт === */}
      {activeTab === "import" && (
        <>
          {/* Шаг 1: Загрузка файла */}
          <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                1. Выберите файл
              </h2>
              <button
                onClick={downloadTemplate}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Скачать шаблон JSON ↓
              </button>
            </div>

            <div className="mt-4">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 transition-colors hover:border-blue-400 hover:bg-blue-50/30">
                <svg
                  className="mb-3 h-10 w-10 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <span className="text-sm font-medium text-gray-600">
                  {fileName || "Нажмите для выбора JSON-файла"}
                </span>
                <span className="mt-1 text-xs text-gray-400">
                  Формат: .json
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>

            {fileName && (
              <div className="mt-3 flex items-center gap-2 text-sm">
                <span className="text-gray-500">Файл:</span>
                <span className="font-medium text-gray-900">{fileName}</span>
                <button
                  onClick={handleReset}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  ✕ Очистить
                </button>
              </div>
            )}
          </div>

          {/* Ошибки */}
          {error && (
            <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
              <strong>Ошибка:</strong> {error}
            </div>
          )}

          {/* Ошибки валидации */}
          {validationErrors.length > 0 && (
            <div className="mb-6 rounded-xl bg-amber-50 p-4">
              <h3 className="mb-2 font-semibold text-amber-800">
                Найдены проблемы ({validationErrors.length}):
              </h3>
              <ul className="ml-4 list-disc space-y-1 text-sm text-amber-700">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Шаг 2: Предпросмотр */}
          {products && products.length > 0 && (
            <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                2. Предпросмотр ({products.length} товаров)
              </h2>
              <ProductPreviewTable products={products} />
            </div>
          )}

          {/* Шаг 3: Импорт */}
          {products &&
            products.length > 0 &&
            validationErrors.length === 0 && (
              <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  3. Импорт
                </h2>

                {!results && (
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleImport}
                      disabled={importing}
                      className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-400"
                    >
                      {importing
                        ? "Импорт..."
                        : `Импортировать ${products.length} товаров`}
                    </button>
                    {importing && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
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
                        {progress}
                      </div>
                    )}
                  </div>
                )}

                {/* Результат */}
                {results && (
                  <div className="mt-4">
                    <ResultsPanel results={results} />
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={handleReset}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100"
                      >
                        Загрузить новый файл
                      </button>
                      <a
                        href="/catalog"
                        target="_blank"
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                      >
                        Открыть каталог →
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

          {/* Справка */}
          <ImportHelp />
        </>
      )}

      {/* === Таб: Добавить === */}
      {activeTab === "add" && (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Добавить товар
          </h2>
          <AddProductForm
            token={token}
            onCreated={() => setActiveTab("products")}
          />
        </div>
      )}
    </div>
  );
}
