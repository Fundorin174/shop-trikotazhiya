import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Заказ оформлен — Трикотажия",
  robots: { index: false, follow: false },
};

/**
 * Страница успеха после оплаты через ЮKassa.
 * ЮKassa перенаправляет покупателя сюда после оплаты.
 */
export default function CheckoutSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl border bg-white p-8 text-center shadow-sm">
        {/* Иконка успеха */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-8 w-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="font-heading text-2xl font-bold text-primary-900">
          Спасибо за заказ!
        </h1>

        <p className="mt-3 text-gray-600">
          Ваш платёж успешно обработан. Мы свяжемся с вами для подтверждения
          деталей доставки в ближайшее время.
        </p>

        <p className="mt-2 text-sm text-gray-500">
          Информация о заказе отправлена на указанный email.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/catalog" className="btn-primary px-6 py-2.5 text-center">
            Продолжить покупки
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-gray-300 px-6 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            На главную
          </Link>
        </div>
      </div>
    </div>
  );
}
