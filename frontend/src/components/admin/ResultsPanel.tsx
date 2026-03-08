import type { ImportResult } from "@/types/admin";

interface ResultsPanelProps {
  results: ImportResult[];
}

/** Панель результатов импорта (успех / ошибки) */
export function ResultsPanel({ results }: ResultsPanelProps) {
  const success = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="flex-1 rounded-xl bg-green-50 p-4 text-center">
          <div className="text-2xl font-bold text-green-700">
            {success.length}
          </div>
          <div className="text-sm text-green-600">Создано</div>
        </div>
        <div className="flex-1 rounded-xl bg-red-50 p-4 text-center">
          <div className="text-2xl font-bold text-red-700">
            {failed.length}
          </div>
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
            <span className="mt-0.5 text-lg">
              {r.success ? "✅" : "❌"}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-gray-500">
                  {r.sku}
                </span>
                <span className="truncate font-medium text-gray-900">
                  {r.title}
                </span>
              </div>
              <div
                className={`text-xs ${r.success ? "text-green-600" : "text-red-600"}`}
              >
                {r.message}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
