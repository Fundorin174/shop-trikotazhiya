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
import { CdekPvzPicker, type SelectedPvz } from "@/components/checkout/CdekPvzPicker";
import { CdekCitySuggest } from "@/components/checkout/CdekCitySuggest";
import type { CdekTariff } from "@/lib/data/cdek";

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

type Step = "contacts" | "delivery" | "payment";
type DeliveryMethod = "cdek" | "vk" | null;

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
  /** Показывать ли ошибки полей (true после первой попытки перейти далее) */
  const [touchedSteps, setTouchedSteps] = useState<Record<Step, boolean>>({
    contacts: false,
    delivery: false,
    payment: false,
  });

  // Способ доставки
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(null);

  // СДЭК ПВЗ
  const [selectedPvz, setSelectedPvz] = useState<SelectedPvz | null>(null);
  const [deliveryTariff, setDeliveryTariff] = useState<CdekTariff | null>(null);
  const [selectedCityCode, setSelectedCityCode] = useState<number | null>(null);

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
  // Валидация полей
  // ----------------------------------------

  const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  const PHONE_RE = /^[+\d\s()\-]*$/;

  /** Ошибки по каждому полю (пустая строка = валидно) */
  const fieldErrors = {
    firstName: !form.firstName.trim() ? "Введите имя" : "",
    lastName: !form.lastName.trim() ? "Введите фамилию" : "",
    email: !form.email.trim()
      ? "Введите email"
      : !EMAIL_RE.test(form.email.trim())
        ? "Некорректный email. Пример: ivan@mail.ru"
        : "",
    phone: form.phone.trim() && !PHONE_RE.test(form.phone.trim())
      ? "Телефон может содержать только цифры, +, пробелы, скобки и дефис"
      : "",
    city: !form.city.trim() ? "Введите город" : "",
    address: "", // адрес заполняется автоматически из ПВЗ
  };

  const isContactsValid =
    !fieldErrors.firstName &&
    !fieldErrors.lastName &&
    !fieldErrors.email &&
    !fieldErrors.phone;

  const isDeliveryValid =
    deliveryMethod === "cdek" && !fieldErrors.city && !!selectedPvz;

  const isFormValid =
    isContactsValid && isDeliveryValid && form.privacyAccepted;

  // ----------------------------------------
  // Переход между шагами
  // ----------------------------------------

  const goToDelivery = () => {
    setTouchedSteps((prev) => ({ ...prev, contacts: true }));
    if (!isContactsValid) {
      setError("Исправьте ошибки в контактных данных");
      return;
    }
    setStep("delivery");
    setError(null);
  };

  const goToPayment = () => {
    setTouchedSteps((prev) => ({ ...prev, delivery: true }));
    if (deliveryMethod !== "cdek") {
      setError("Выберите способ доставки");
      return;
    }
    if (fieldErrors.city) {
      setError("Укажите город доставки");
      return;
    }
    if (!selectedPvz) {
      setError("Выберите пункт выдачи СДЭК");
      return;
    }
    setStep("payment");
    setError(null);
  };

  /** Обработка выбора ПВЗ */
  const handlePvzSelect = useCallback(
    (pvz: SelectedPvz, tariff: CdekTariff | null) => {
      setSelectedPvz(pvz);
      setDeliveryTariff(tariff);
      // Автозаполнение полей формы из ПВЗ
      setForm((prev) => ({
        ...prev,
        address: `ПВЗ СДЭК: ${pvz.name}, ${pvz.address}`,
        zip: pvz.postalCode || prev.zip,
      }));
      setError(null);
    },
    []
  );

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

  /** Подсказка об ошибке под полем */
  const FieldError = ({ error: msg }: { error: string }) =>
    msg ? (
      <p className="mt-1 text-xs text-red-600">{msg}</p>
    ) : null;

  /** CSS-класс поля: красная рамка при ошибке */
  const inputCls = (err: string) =>
    `w-full rounded border px-4 py-2 focus:outline-none focus:ring-1 ${
      err
        ? "border-red-400 focus:border-red-500 focus:ring-red-500"
        : "border-gray-300 focus:border-primary-500 focus:ring-primary-500"
    }`;

  // Показывать ошибки только после попытки перехода на следующий шаг
  const showContactErrors = touchedSteps.contacts;
  const showDeliveryErrors = touchedSteps.delivery;

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
                    className={inputCls(showContactErrors ? fieldErrors.firstName : "")}
                    required
                  />
                  {showContactErrors && <FieldError error={fieldErrors.firstName} />}
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
                    className={inputCls(showContactErrors ? fieldErrors.lastName : "")}
                    required
                  />
                  {showContactErrors && <FieldError error={fieldErrors.lastName} />}
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
                    className={inputCls(showContactErrors ? fieldErrors.email : "")}
                    required
                  />
                  {showContactErrors && <FieldError error={fieldErrors.email} />}
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
                    placeholder="+7 (999) 123-45-67"
                    type="tel"
                    className={inputCls(showContactErrors ? fieldErrors.phone : "")}
                  />
                  {showContactErrors && <FieldError error={fieldErrors.phone} />}
                </div>
              </div>
              <button
                type="button"
                onClick={goToDelivery}
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

        {/* Шаг 2: Доставка */}
        <section
          className={`rounded-lg border p-6 transition-opacity ${
            step !== "delivery" ? "opacity-60" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">2. Доставка</h2>
            {step === "payment" && isDeliveryValid && (
              <button
                type="button"
                onClick={() => setStep("delivery")}
                className="text-sm text-accent-600 hover:underline"
              >
                Изменить
              </button>
            )}
          </div>

          {step === "delivery" ? (
            <div className="mt-4 space-y-4">
              {/* Выбор способа доставки */}
              <div className="grid gap-3 sm:grid-cols-2">
                {/* СДЭК */}
                <button
                  type="button"
                  onClick={() => setDeliveryMethod("cdek")}
                  className={`rounded-lg border-2 p-4 text-left transition-all ${
                    deliveryMethod === "cdek"
                      ? "border-primary-500 bg-primary-50 ring-1 ring-primary-500"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      deliveryMethod === "cdek" ? "bg-primary-100" : "bg-gray-100"
                    }`}>
                      <svg className={`h-5 w-5 ${deliveryMethod === "cdek" ? "text-primary-600" : "text-gray-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 17h1m-1-4h4m5 0h1M5 20h14a2 2 0 002-2V8l-4-4H7a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Доставка СДЭК</p>
                      <p className="text-xs text-gray-500">
                        Пункт выдачи · оплата онлайн
                      </p>
                    </div>
                  </div>
                </button>

                {/* Другой способ — через ВКонтакте */}
                <button
                  type="button"
                  onClick={() => setDeliveryMethod("vk")}
                  className={`rounded-lg border-2 p-4 text-left transition-all ${
                    deliveryMethod === "vk"
                      ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      deliveryMethod === "vk" ? "bg-blue-100" : "bg-gray-100"
                    }`}>
                      <svg className={`h-5 w-5 ${deliveryMethod === "vk" ? "text-blue-600" : "text-gray-500"}`} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M21.579 6.855c.14-.465 0-.806-.662-.806h-2.193c-.558 0-.813.295-.953.619 0 0-1.115 2.719-2.695 4.482-.51.51-.743.673-.02.673-.279 0-.36-.081-.36-.492V6.855c0-.558-.161-.806-.626-.806H10.95c-.348 0-.558.259-.558.504 0 .528.79.65.871 2.138v3.228c0 .707-.128.836-.406.836-.743 0-2.551-2.729-3.624-5.853-.21-.607-.42-.852-.98-.852H4.06c-.627 0-.752.295-.752.619 0 .582.743 3.462 3.461 7.271 1.812 2.601 4.363 4.011 6.687 4.011 1.393 0 1.565-.313 1.565-.852v-1.97c0-.627.132-.752.575-.752.325 0 .883.163 2.183 1.417 1.486 1.486 1.732 2.155 2.568 2.155h2.193c.627 0 .94-.313.76-.93-.198-.615-.907-1.51-1.849-2.569-.51-.604-1.277-1.254-1.51-1.579-.326-.418-.232-.604 0-.976 0 0 2.672-3.761 2.95-5.04z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Другой способ</p>
                      <p className="text-xs text-gray-500">
                        Согласовать в ВКонтакте
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              {/* СДЭК: город + ПВЗ */}
              {deliveryMethod === "cdek" && (
                <div className="space-y-4 rounded-lg border border-gray-100 bg-gray-50/50 p-4">
                  {/* Город */}
                  <div>
                    <label
                      htmlFor="city"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Город <span className="text-red-500">*</span>
                    </label>
                    <CdekCitySuggest
                      id="city"
                      value={form.city}
                      onChange={(v) => updateField("city", v)}
                      onCitySelect={(city) => {
                        setSelectedCityCode(city.code);
                        setSelectedPvz(null);
                        setDeliveryTariff(null);
                      }}
                      onCityClear={() => {
                        setSelectedCityCode(null);
                        setSelectedPvz(null);
                        setDeliveryTariff(null);
                      }}
                      placeholder="Начните вводить город"
                      className={inputCls(showDeliveryErrors && deliveryMethod === "cdek" ? fieldErrors.city : "")}
                      required
                    />
                    {showDeliveryErrors && deliveryMethod === "cdek" && (
                      <FieldError error={fieldErrors.city} />
                    )}
                  </div>

                  {/* Выбор ПВЗ СДЭК */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Пункт выдачи СДЭК <span className="text-red-500">*</span>
                    </label>
                    <CdekPvzPicker
                      cityCode={selectedCityCode}
                      onSelect={handlePvzSelect}
                      selectedCode={selectedPvz?.code}
                    />
                    {showDeliveryErrors && !selectedPvz && (
                      <p className="mt-1 text-xs text-red-600">
                        Выберите пункт выдачи
                      </p>
                    )}
                  </div>

                  {/* Выбранный ПВЗ */}
                  {selectedPvz && (
                    <div className="rounded-lg border border-primary-200 bg-primary-50 px-4 py-3">
                      <p className="text-sm font-medium text-primary-800">
                        Выбран: {selectedPvz.name}
                      </p>
                      <p className="mt-0.5 text-xs text-primary-700">
                        {selectedPvz.address}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ВКонтакте: информация */}
              {deliveryMethod === "vk" && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-5">
                  <div className="flex items-start gap-3">
                    <svg className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-blue-900">
                        Согласуйте доставку и оплату с продавцом
                      </p>
                      <p className="text-sm text-blue-800">
                        Перейдите в нашу группу ВКонтакте, найдите нужный товар и
                        напишите в сообщения сообщества. Мы подберём удобный для вас
                        способ доставки и оплаты.
                      </p>
                      <a
                        href="https://vk.com/trikotazhiya"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
                      >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M21.579 6.855c.14-.465 0-.806-.662-.806h-2.193c-.558 0-.813.295-.953.619 0 0-1.115 2.719-2.695 4.482-.51.51-.743.673-.02.673-.279 0-.36-.081-.36-.492V6.855c0-.558-.161-.806-.626-.806H10.95c-.348 0-.558.259-.558.504 0 .528.79.65.871 2.138v3.228c0 .707-.128.836-.406.836-.743 0-2.551-2.729-3.624-5.853-.21-.607-.42-.852-.98-.852H4.06c-.627 0-.752.295-.752.619 0 .582.743 3.462 3.461 7.271 1.812 2.601 4.363 4.011 6.687 4.011 1.393 0 1.565-.313 1.565-.852v-1.97c0-.627.132-.752.575-.752.325 0 .883.163 2.183 1.417 1.486 1.486 1.732 2.155 2.568 2.155h2.193c.627 0 .94-.313.76-.93-.198-.615-.907-1.51-1.849-2.569-.51-.604-1.277-1.254-1.51-1.579-.326-.418-.232-.604 0-.976 0 0 2.672-3.761 2.95-5.04z" />
                        </svg>
                        Перейти в ВКонтакте
                      </a>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("contacts")}
                  className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Назад
                </button>
                {deliveryMethod === "cdek" && (
                  <button
                    type="button"
                    onClick={goToPayment}
                    className="btn-primary px-6"
                  >
                    Далее
                  </button>
                )}
              </div>
            </div>
          ) : step === "payment" && isDeliveryValid ? (
            <div className="mt-2 text-sm text-gray-500">
              <p>
                {form.city} — ПВЗ {selectedPvz?.name}
              </p>
              {deliveryTariff && (
                <p className="text-xs text-gray-400">
                  {deliveryTariff.delivery_sum} ₽ · {deliveryTariff.period_min}–{deliveryTariff.period_max} дн.
                </p>
              )}
            </div>
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
                onClick={() => setStep("delivery")}
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

            <div className="mt-4 border-t pt-4 space-y-2">
              {deliveryTariff && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Доставка СДЭК</span>
                  <span className="font-medium">{deliveryTariff.delivery_sum} ₽</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold">
                <span>Итого</span>
                <span>
                  {formatPrice(total)}
                  {deliveryTariff ? ` + ${deliveryTariff.delivery_sum} ₽` : ""}
                </span>
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
