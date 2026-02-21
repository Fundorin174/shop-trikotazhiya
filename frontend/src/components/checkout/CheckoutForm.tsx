"use client";

import Link from "next/link";

/**
 * Форма оформления заказа.
 * Client Component — многошаговая форма.
 */
export function CheckoutForm() {
  // TODO: интеграция с Medusa Checkout API + ЮKassa
  return (
    <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_400px]">
      {/* Левая часть — шаги */}
      <div className="space-y-8">
        {/* Шаг 1: Контактные данные */}
        <section className="rounded-lg border p-6">
          <h2 className="text-lg font-semibold">1. Контактные данные</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="mb-1 block text-sm font-medium text-gray-700">Имя</label>
              <input id="firstName" placeholder="Имя" className="w-full rounded border px-4 py-2" required />
            </div>
            <div>
              <label htmlFor="lastName" className="mb-1 block text-sm font-medium text-gray-700">Фамилия</label>
              <input id="lastName" placeholder="Фамилия" className="w-full rounded border px-4 py-2" required />
            </div>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input id="email" placeholder="Email" type="email" className="w-full rounded border px-4 py-2" required />
            </div>
            <div>
              <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">Телефон</label>
              <input id="phone" placeholder="+7 (___) ___-__-__" type="tel" className="w-full rounded border px-4 py-2" required />
            </div>
          </div>
        </section>

        {/* Шаг 2: Адрес доставки */}
        <section className="rounded-lg border p-6">
          <h2 className="text-lg font-semibold">2. Адрес доставки</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="city" className="mb-1 block text-sm font-medium text-gray-700">Город</label>
              <input id="city" placeholder="Город" className="w-full rounded border px-4 py-2" required />
            </div>
            <div>
              <label htmlFor="zip" className="mb-1 block text-sm font-medium text-gray-700">Индекс</label>
              <input id="zip" placeholder="Индекс" className="w-full rounded border px-4 py-2" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="address" className="mb-1 block text-sm font-medium text-gray-700">Адрес</label>
              <input id="address" placeholder="Улица, дом, квартира" className="w-full rounded border px-4 py-2" required />
            </div>
          </div>
        </section>

        {/* Шаг 3: Способ оплаты */}
        <section className="rounded-lg border p-6">
          <h2 className="text-lg font-semibold">3. Способ оплаты</h2>
          <p className="mt-2 text-sm text-gray-500">
            Оплата банковской картой через ЮKassa
          </p>
        </section>

        {/* Согласие на обработку ПД — требование 152-ФЗ */}
        <section className="rounded-lg border border-primary-200 bg-primary-50 p-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 text-primary-600 accent-primary-600"
              required
            />
            <span className="text-sm text-gray-700">
              Я согласен(-на) на обработку персональных данных в соответствии с{" "}
              <Link
                href="/privacy"
                target="_blank"
                className="font-medium text-accent-600 underline hover:text-accent-700"
              >
                политикой конфиденциальности
              </Link>
            </span>
          </label>
        </section>
      </div>

      {/* Правая часть — итого */}
      <aside className="h-fit rounded-lg border bg-gray-50 p-6">
        <h2 className="text-lg font-semibold">Ваш заказ</h2>
        <p className="mt-4 text-sm text-gray-500">Корзина пуста</p>
        <button className="btn-primary mt-6 w-full" disabled>
          Оплатить
        </button>
      </aside>
    </div>
  );
}
