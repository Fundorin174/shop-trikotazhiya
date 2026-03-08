/**
 * Shared helpers for checkout form fields.
 */

/** Подсказка об ошибке под полем */
export function FieldError({ error }: { error: string }) {
  return error ? (
    <p className="mt-1 text-xs text-red-600">{error}</p>
  ) : null;
}

/** CSS-класс поля: красная рамка при ошибке */
export function inputCls(err: string) {
  return `w-full rounded border px-4 py-2 focus:outline-none focus:ring-1 ${
    err
      ? "border-red-400 focus:border-red-500 focus:ring-red-500"
      : "border-gray-300 focus:border-primary-500 focus:ring-primary-500"
  }`;
}
