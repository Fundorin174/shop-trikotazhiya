"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart-store";
import { formatPrice } from "@/lib/utils";
import {
  updateCartEmail,
  updateCartAddress,
  initPaymentCollection,
  initPaymentSession,
  completeCart,
} from "@/lib/data/checkout";

/**
 * Провайдер ЮKassa — identifier как задан в static identifier класса.
 * Medusa v2 использует identifier напрямую при инициализации payment session.
 */
const YUKASSA_PROVIDER_ID = "yukassa";

// ============================================
// Типы
// ============================================

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  zip: string;
  address: string;
  privacyAccepted: boolean;
}

type Step = "contacts" | "address" | "payment";

/**
 * Форма оформления заказа.
 * Многошаговая форма с интеграцией Medusa Checkout API + ЮKassa.
 *
 * Поток:
 * 1. Покупатель заполняет контакты и адрес
 * 2. Создаётся payment collection → payment session (ЮKassa)
 * 3. Покупатель перенаправляется на ЮKassa для оплаты
 * 4. После оплаты — redirect на /checkout/success
 */
export function CheckoutForm() {
  const router = useRouter();
  const { cartId, items, total, refreshCart, reset } = useCartStore();

  const [form, setForm] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    zip: "",
    address: "",
    privacyAccepted: false,
  });

  const [step, setStep] = useState<Step>("contacts");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refresh cart on mount
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // Обновление поля формы
  const updateField = useCallback(
    (field: keyof FormData, value: string | boolean) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setError(null);
    },
    []
  );

  // ----------------------------------------
  // Валидация шагов
  // ----------------------------------------

  const isContactsValid =
    form.firstName.trim() !== "" &&
    form.lastName.trim() !== "" &&
    form.email.trim() !== "" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);

  const isAddressValid =
    form.city.trim() !== "" && form.address.trim() !== "";

  const isFormValid =
    isContactsValid && isAddressValid && form.privacyAccepted;

  // ----------------------------------------
  // Переход между шагами
  // ----------------------------------------

  const goToAddress = () => {
    if (!isContactsValid) {
      setError("Заполните все контактные данные");
      return;
    }
    setStep("address");
    setError(null);
  };

  const goToPayment = () => {
    if (!isAddressValid) {
      setError("Заполните адрес доставки");
      return;
    }
    setStep("payment");
    setError(null);
  };

  // ----------------------------------------
  // Оформление заказа
  // ----------------------------------------

  const handleSubmit = async () => {
    if (!cartId) {
      setError("Корзина не найдена");
      return;
    }

    if (!isFormValid) {
      setError("Заполните все обязательные поля и примите соглашение");
      return;
    }

    if (items.length === 0) {
      setError("Корзина пуста");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Обновить email
      await updateCartEmail(cartId, form.email);

      // 2. Обновить адрес
      await updateCartAddress(cartId, {
        first_name: form.firstName,
        last_name: form.lastName,
        phone: form.phone || undefined,
        city: form.city,
        postal_code: form.zip || undefined,
        address_1: form.address,
        country_code: "ru",
      });

      // 3. Создать payment collection
      let paymentCollectionId: string;
      try {
        const { payment_collection } = await initPaymentCollection(cartId);
        paymentCollectionId = payment_collection.id;
      } catch (err) {
        throw new Error(
          "Не удалось создать платёжную коллекцию. Попробуйте обновить страницу."
        );
      }

      // 4. Инициализировать платёжную сессию (ЮKassa)
      let updatedCollection;
      try {
        const result = await initPaymentSession(
          paymentCollectionId,
          YUKASSA_PROVIDER_ID
        );
        updatedCollection = result.payment_collection;
      } catch (err) {
        throw new Error(
          "Ошибка инициализации платежа. Платёжная система временно недоступна."
        );
      }

      // 5. Получить confirmation_url от ЮKassa
      const session = updatedCollection.payment_sessions?.[0];

      if (!session) {
        throw new Error(
          "Платёжная сессия не создана. Проверьте настройки ЮKassa."
        );
      }

      // Проверить ошибку от провайдера
      if (session.data?.error) {
        throw new Error(
          `Ошибка платёжной системы: ${session.data.error}`
        );
      }

      const confirmationUrl = session.data?.confirmation_url;

      if (confirmationUrl) {
        // Перенаправляем на ЮKassa для оплаты
        window.location.href = confirmationUrl;
        return;
      }

      // Если нет confirmation_url — попробуем завершить корзину напрямую
      const result = await completeCart(cartId);

      if (result.type === "order" && result.order) {
        // Заказ создан — очищаем корзину, перенаправляем на успех
        reset();
        router.push("/checkout/success");
      } else {
        throw new Error(
          result.error?.message || "Не удалось завершить заказ. Попробуйте ещё раз."
        );
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Произошла ошибка при оплате";
      setError(message);
      setLoading(false);
    }
  };

  // ----------------------------------------
  // Расчёт для отображения
  // ----------------------------------------

  const formatItemPrice = (item: (typeof items)[0]) => {
    const itemTotal = item.total ?? item.subtotal ?? (item.unit_price ?? 0) * (item.quantity ?? 1);
    return formatPrice(itemTotal);
  };

  const hasItems = items.length > 0;

  // ============================================
  // Рендер
  // ============================================

  return (
    <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_400px]">
      {/* Левая часть — шаги */}
      <div className="space-y-8">
        {/* Ошибка */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Шаг 1: Контактные данные */}
        <section
          className={`rounded-lg border p-6 transition-opacity ${
            step !== "contacts" ? "opacity-60" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">1. Контактные данные</h2>
            {step !== "contacts" && isContactsValid && (
              <button
                type="button"
                onClick={() => setStep("contacts")}
                className="text-sm text-accent-600 hover:underline"
              >
                Изменить
              </button>
            )}
          </div>

          {step === "contacts" ? (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="firstName"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Имя <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="firstName"
                    value={form.firstName}
                    onChange={(e) => updateField("firstName", e.target.value)}
                    placeholder="Имя"
                    className="w-full rounded border px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Фамилия <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="lastName"
                    value={form.lastName}
                    onChange={(e) => updateField("lastName", e.target.value)}
                    placeholder="Фамилия"
                    className="w-full rounded border px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="email@example.com"
                    type="email"
                    className="w-full rounded border px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="phone"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Телефон
                  </label>
                  <input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="+7 (___) ___-__-__"
                    type="tel"
                    className="w-full rounded border px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={goToAddress}
                className="btn-primary mt-2 px-6"
              >
                Далее
              </button>
            </div>
          ) : (
            isContactsValid && (
              <p className="mt-2 text-sm text-gray-500">
                {form.firstName} {form.lastName} — {form.email}
                {form.phone ? ` — ${form.phone}` : ""}
              </p>
            )
          )}
        </section>

        {/* Шаг 2: Адрес доставки */}
        <section
          className={`rounded-lg border p-6 transition-opacity ${
            step !== "address" ? "opacity-60" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">2. Адрес доставки</h2>
            {step === "payment" && isAddressValid && (
              <button
                type="button"
                onClick={() => setStep("address")}
                className="text-sm text-accent-600 hover:underline"
              >
                Изменить
              </button>
            )}
          </div>

          {step === "address" ? (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="city"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Город <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="city"
                    value={form.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    placeholder="Город"
                    className="w-full rounded border px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="zip"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Индекс
                  </label>
                  <input
                    id="zip"
                    value={form.zip}
                    onChange={(e) => updateField("zip", e.target.value)}
                    placeholder="Индекс"
                    className="w-full rounded border px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label
                    htmlFor="address"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Адрес <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="address"
                    value={form.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    placeholder="Улица, дом, квартира"
                    className="w-full rounded border px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("contacts")}
                  className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Назад
                </button>
                <button
                  type="button"
                  onClick={goToPayment}
                  className="btn-primary px-6"
                >
                  Далее
                </button>
              </div>
            </div>
          ) : step === "payment" && isAddressValid ? (
            <p className="mt-2 text-sm text-gray-500">
              {form.city}
              {form.zip ? `, ${form.zip}` : ""}, {form.address}
            </p>
          ) : null}
        </section>

        {/* Шаг 3: Способ оплаты */}
        <section
          className={`rounded-lg border p-6 transition-opacity ${
            step !== "payment" ? "opacity-60" : ""
          }`}
        >
          <h2 className="text-lg font-semibold">3. Способ оплаты</h2>
          {step === "payment" ? (
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-primary-200 bg-primary-50 px-4 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                  <svg
                    className="h-6 w-6 text-primary-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Банковская карта
                  </p>
                  <p className="text-xs text-gray-500">
                    Безопасная оплата через ЮKassa
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep("address")}
                className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Назад
              </button>
            </div>
          ) : (
            <p className="mt-2 text-sm text-gray-500">
              Оплата банковской картой через ЮKassa
            </p>
          )}
        </section>

        {/* Согласие на обработку ПД — 152-ФЗ */}
        <section className="rounded-lg border border-primary-200 bg-primary-50 p-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.privacyAccepted}
              onChange={(e) => updateField("privacyAccepted", e.target.checked)}
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
      <aside className="h-fit rounded-lg border bg-gray-50 p-6 lg:sticky lg:top-8">
        <h2 className="text-lg font-semibold">Ваш заказ</h2>

        {hasItems ? (
          <>
            <ul className="mt-4 divide-y text-sm">
              {items.map((item) => (
                <li key={item.id} className="flex justify-between py-2">
                  <div className="flex-1 pr-4">
                    <p className="font-medium text-gray-900">
                      {item.product_title || item.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.metadata?.measurement_unit === "running_meter"
                        ? `${(item.quantity / 100).toFixed(2)} м`
                        : `${item.quantity} шт.`}
                    </p>
                  </div>
                  <span className="shrink-0 font-medium">
                    {formatItemPrice(item)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-4 border-t pt-4">
              <div className="flex justify-between text-base font-bold">
                <span>Итого</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isFormValid || loading}
              className="btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
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
                  Обработка...
                </span>
              ) : (
                `Оплатить ${formatPrice(total)}`
              )}
            </button>
          </>
        ) : (
          <div className="mt-4">
            <p className="text-sm text-gray-500">Корзина пуста</p>
            <Link
              href="/catalog"
              className="mt-4 inline-block text-sm text-accent-600 hover:underline"
            >
              Перейти в каталог
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}
