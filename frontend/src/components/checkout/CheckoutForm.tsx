"use client";

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
            <input placeholder="Имя" className="rounded border px-4 py-2" />
            <input placeholder="Фамилия" className="rounded border px-4 py-2" />
            <input placeholder="Email" type="email" className="rounded border px-4 py-2" />
            <input placeholder="Телефон" type="tel" className="rounded border px-4 py-2" />
          </div>
        </section>

        {/* Шаг 2: Адрес доставки */}
        <section className="rounded-lg border p-6">
          <h2 className="text-lg font-semibold">2. Адрес доставки</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <input placeholder="Город" className="rounded border px-4 py-2" />
            <input placeholder="Индекс" className="rounded border px-4 py-2" />
            <input placeholder="Улица, дом, квартира" className="col-span-full rounded border px-4 py-2" />
          </div>
        </section>

        {/* Шаг 3: Способ оплаты */}
        <section className="rounded-lg border p-6">
          <h2 className="text-lg font-semibold">3. Способ оплаты</h2>
          <p className="mt-2 text-sm text-gray-500">
            Оплата банковской картой через ЮKassa
          </p>
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
