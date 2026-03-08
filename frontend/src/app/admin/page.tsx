"use client";

import { useState, useCallback, useRef } from "react";

// ============================================
// Типы
// ============================================

interface ImportProduct {
  title: string;
  handle?: string;
  subtitle?: string;
  description?: string;
  price: number;
  sku: string;
  inventory?: number;
  fabric_type: string;
  composition: string;
  quality?: string;
  width_cm: number;
  measurement_unit?: "running_meter" | "piece";
  min_order?: number;
  order_step?: number;
  country?: string;
  collection_name?: string;
  color?: string;
  color_hex?: string;
  short_description?: string;
  full_description?: string;
  video_url?: string;
  discount_percent?: number;
  discount_amount?: number;
}

interface ImportResult {
  sku: string;
  title: string;
  success: boolean;
  message: string;
  productId?: string;
}

interface ImportResponse {
  success: boolean;
  summary: { total: number; created: number; failed: number };
  results: ImportResult[];
  error?: string;
}

// ============================================
// Валидация
// ============================================

const REQUIRED_FIELDS = ["title", "sku", "price", "fabric_type", "composition", "width_cm"] as const;
const VALID_FABRIC_TYPES = [
  "kulirka", "footer", "kapitoniy", "kashkorse", "pike", "ribana",
  "interlok", "kupony", "trikotazh_vyazka", "termopolotno", "dzhersi", "furnitura",
];
const FABRIC_LABELS: Record<string, string> = {
  kulirka: "Кулирка", footer: "Футер", kapitoniy: "Капитоний", kashkorse: "Кашкорсе",
  pike: "Пике", ribana: "Рибана", interlok: "Интерлок", kupony: "Купоны с принтом",
  trikotazh_vyazka: "Трикотажная вязка", termopolotno: "Термополотно",
  dzhersi: "Джерси", furnitura: "Фурнитура",
};

function validateProducts(products: ImportProduct[]): string[] {
  const errors: string[] = [];
  const skus = new Set<string>();

  products.forEach((p, i) => {
    const n = i + 1;
    for (const field of REQUIRED_FIELDS) {
      if (p[field] == null || p[field] === "") {
        errors.push(`Товар #${n} («${p.title || "?"}»): отсутствует поле «${field}»`);
      }
    }
    if (p.price != null && (typeof p.price !== "number" || p.price <= 0)) {
      errors.push(`Товар #${n}: цена должна быть положительным числом`);
    }
    if (p.fabric_type && !VALID_FABRIC_TYPES.includes(p.fabric_type)) {
      errors.push(`Товар #${n}: неизвестный тип ткани «${p.fabric_type}». Допустимые: ${VALID_FABRIC_TYPES.join(", ")}`);
    }
    if (p.sku) {
      if (skus.has(p.sku)) {
        errors.push(`Товар #${n}: дублирующийся SKU «${p.sku}»`);
      }
      skus.add(p.sku);
    }
    if (p.measurement_unit && !["running_meter", "piece"].includes(p.measurement_unit)) {
      errors.push(`Товар #${n}: единица измерения должна быть «running_meter» или «piece»`);
    }
  });

  return errors;
}

// ============================================
// Компоненты
// ============================================

function LoginForm({ onLogin }: { onLogin: (token: string) => void }) {
  const [email, setEmail] = useState("admin@trikotazhiya.ru");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const medusaUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";
      const res = await fetch(`${medusaUrl}/auth/user/emailpass`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text.includes("Unauthorized") ? "Неверный email или пароль" : `Ошибка: ${res.status}`);
      }

      const data = await res.json();
      if (!data.token) throw new Error("Токен не получен");
      onLogin(data.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка авторизации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Трикотажия</h1>
            <p className="mt-1 text-sm text-gray-500">Админ-панель</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
            >
              {loading ? "Вход..." : "Войти"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function ProductPreviewTable({ products }: { products: ImportProduct[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">SKU</th>
            <th className="px-4 py-3">Название</th>
            <th className="px-4 py-3">Тип ткани</th>
            <th className="px-4 py-3">Состав</th>
            <th className="px-4 py-3">Ширина</th>
            <th className="px-4 py-3">Цена</th>
            <th className="px-4 py-3">Ед.</th>
            <th className="px-4 py-3">Запас</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {products.map((p, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-4 py-2.5 text-gray-500">{i + 1}</td>
              <td className="px-4 py-2.5 font-mono text-xs">{p.sku}</td>
              <td className="max-w-[200px] truncate px-4 py-2.5 font-medium">{p.title}</td>
              <td className="px-4 py-2.5">
                <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                  {FABRIC_LABELS[p.fabric_type] || p.fabric_type}
                </span>
              </td>
              <td className="max-w-[160px] truncate px-4 py-2.5 text-gray-600">{p.composition}</td>
              <td className="px-4 py-2.5 text-right">{p.width_cm} см</td>
              <td className="px-4 py-2.5 text-right font-medium">
                {p.price} ₽
              </td>
              <td className="px-4 py-2.5">
                {(p.measurement_unit || "running_meter") === "running_meter" ? "/м" : "/шт"}
              </td>
              <td className="px-4 py-2.5 text-right">{p.inventory ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResultsPanel({ results }: { results: ImportResult[] }) {
  const success = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="flex-1 rounded-xl bg-green-50 p-4 text-center">
          <div className="text-2xl font-bold text-green-700">{success.length}</div>
          <div className="text-sm text-green-600">Создано</div>
        </div>
        <div className="flex-1 rounded-xl bg-red-50 p-4 text-center">
          <div className="text-2xl font-bold text-red-700">{failed.length}</div>
          <div className="text-sm text-red-600">Ошибки</div>
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white">
        {results.map((r, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 border-b border-gray-100 px-4 py-3 last:border-0 ${
              r.success ? "bg-green-50/30" : "bg-red-50/30"
            }`}
          >
            <span className="mt-0.5 text-lg">{r.success ? "✅" : "❌"}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-gray-500">{r.sku}</span>
                <span className="truncate font-medium text-gray-900">{r.title}</span>
              </div>
              <div className={`text-xs ${r.success ? "text-green-600" : "text-red-600"}`}>
                {r.message}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Основной компонент
// ============================================

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [products, setProducts] = useState<ImportProduct[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState("");
  const [results, setResults] = useState<ImportResult[] | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- Обработка файла ----
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setResults(null);
    setValidationErrors([]);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const data = JSON.parse(text);

        // Поддерживаем и { products: [...] } и просто [...]
        const arr: ImportProduct[] = Array.isArray(data) ? data : data.products;
        if (!Array.isArray(arr)) {
          throw new Error('JSON должен содержать массив товаров (ключ "products" или массив на верхнем уровне)');
        }

        const errors = validateProducts(arr);
        setValidationErrors(errors);
        setProducts(arr);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка чтения файла");
        setProducts(null);
      }
    };
    reader.readAsText(file, "utf-8");
  }, []);

  // ---- Импорт ----
  const handleImport = useCallback(async () => {
    if (!products || !token) return;

    setImporting(true);
    setProgress("Отправка данных на сервер...");
    setError("");
    setResults(null);

    try {
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, products }),
      });

      const data: ImportResponse = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Ошибка сервера: ${res.status}`);
      }

      setResults(data.results);
      setProgress(
        `Готово! Создано: ${data.summary.created}, ошибок: ${data.summary.failed}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка импорта");
      setProgress("");
    } finally {
      setImporting(false);
    }
  }, [products, token]);

  // ---- Сброс ----
  const handleReset = () => {
    setProducts(null);
    setFileName("");
    setValidationErrors([]);
    setResults(null);
    setError("");
    setProgress("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ---- Скачать шаблон ----
  const downloadTemplate = () => {
    const template = {
      products: [
        {
          title: "Кулирка с лайкрой «Пенье»",
          subtitle: "92% хлопок, 8% эластан, 180 г/м²",
          description: "Высококачественная кулирная гладь с добавлением эластана. Пенье — из длинноволокнистого хлопка.",
          sku: "TK-KUL-101",
          price: 450,
          inventory: 300,
          fabric_type: "kulirka",
          composition: "92% хлопок, 8% эластан, 180 г/м²",
          quality: "Пенье",
          width_cm: 180,
          measurement_unit: "running_meter",
          min_order: 0.5,
          order_step: 0.1,
          country: "Турция",
          collection_name: "Трикотаж базовый",
          color: "Тёмно-синий",
          color_hex: "#1B1B6F",
          short_description: "Кулирка с лайкрой, Пенье, Турция",
          full_description: "Высококачественная кулирная гладь с добавлением эластана.",
          video_url: "",
          discount_percent: 0,
        },
      ],
    };

    const blob = new Blob([JSON.stringify(template, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "product-template.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---- Не авторизован — показываем логин ----
  if (!token) {
    return <LoginForm onLogin={setToken} />;
  }

  // ---- Авторизован — основной интерфейс ----
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Шапка */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Импорт товаров</h1>
          <p className="mt-1 text-sm text-gray-500">
            Загрузите JSON-файл с товарами для импорта в каталог
          </p>
        </div>
        <button
          onClick={() => setToken(null)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100"
        >
          Выйти
        </button>
      </div>

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
            <svg className="mb-3 h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="text-sm font-medium text-gray-600">
              {fileName || "Нажмите для выбора JSON-файла"}
            </span>
            <span className="mt-1 text-xs text-gray-400">Формат: .json</span>
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
            <button onClick={handleReset} className="ml-2 text-red-500 hover:text-red-700">
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
      {products && products.length > 0 && validationErrors.length === 0 && (
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
                {importing ? "Импорт..." : `Импортировать ${products.length} товаров`}
              </button>
              {importing && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
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
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Справка</h2>
        <div className="space-y-3 text-sm text-gray-600">
          <div>
            <h3 className="font-medium text-gray-800">Формат файла</h3>
            <p>JSON-файл с ключом <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">products</code> (массив) или просто массив товаров.</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-800">Обязательные поля</h3>
            <p><code className="rounded bg-gray-100 px-1 py-0.5 text-xs">title</code>, <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">sku</code>, <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">price</code> (₽/м или ₽/шт), <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">fabric_type</code>, <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">composition</code>, <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">width_cm</code></p>
          </div>
          <div>
            <h3 className="font-medium text-gray-800">Типы тканей (fabric_type)</h3>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {VALID_FABRIC_TYPES.map((t) => (
                <span key={t} className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                  {t} — {FABRIC_LABELS[t]}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-medium text-gray-800">Цена</h3>
            <p>Указывайте цену в <strong>рублях</strong>. Для метровых товаров — цена за 1 метр. Для штучных — цена за 1 штуку. Конвертация в копейки выполняется автоматически.</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-800">Запас (inventory)</h3>
            <p>Для метровых товаров — количество в <strong>сантиметрах</strong> (300 метров = 30000). Для штучных — количество штук.</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-800">Дубликаты</h3>
            <p>Товары с уже существующим handle будут пропущены (идемпотентность).</p>
          </div>
        </div>
      </div>
    </div>
  );
}
