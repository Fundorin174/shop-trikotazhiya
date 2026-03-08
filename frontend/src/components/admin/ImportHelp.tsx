import { VALID_FABRIC_TYPES, FABRIC_LABELS } from "@/lib/admin/constants";

/** Справка по импорту (формат файла, обязательные поля, типы тканей) */
export function ImportHelp() {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-gray-900">Справка</h2>
      <div className="space-y-3 text-sm text-gray-600">
        <div>
          <h3 className="font-medium text-gray-800">Формат файла</h3>
          <p>
            JSON-файл с ключом{" "}
            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">
              products
            </code>{" "}
            (массив) или просто массив товаров.
          </p>
        </div>
        <div>
          <h3 className="font-medium text-gray-800">Обязательные поля</h3>
          <p>
            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">
              title
            </code>
            ,{" "}
            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">
              sku
            </code>
            ,{" "}
            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">
              price
            </code>{" "}
            (₽/м или ₽/шт),{" "}
            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">
              fabric_type
            </code>
            ,{" "}
            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">
              composition
            </code>
            ,{" "}
            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">
              width_cm
            </code>
          </p>
        </div>
        <div>
          <h3 className="font-medium text-gray-800">
            Типы тканей (fabric_type)
          </h3>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {VALID_FABRIC_TYPES.map((t) => (
              <span
                key={t}
                className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
              >
                {t} — {FABRIC_LABELS[t]}
              </span>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-medium text-gray-800">Цена</h3>
          <p>
            Указывайте цену в <strong>рублях</strong>. Для метровых товаров —
            цена за 1 метр. Для штучных — цена за 1 штуку. Конвертация в
            копейки выполняется автоматически.
          </p>
        </div>
        <div>
          <h3 className="font-medium text-gray-800">Запас (inventory)</h3>
          <p>
            Для метровых товаров — количество в{" "}
            <strong>сантиметрах</strong> (300 метров = 30000). Для штучных —
            количество штук.
          </p>
        </div>
        <div>
          <h3 className="font-medium text-gray-800">Дубликаты</h3>
          <p>
            Товары с уже существующим handle будут пропущены (идемпотентность).
          </p>
        </div>
      </div>
    </div>
  );
}
