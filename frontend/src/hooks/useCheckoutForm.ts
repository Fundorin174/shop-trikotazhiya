"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart-store";
import {
  updateCartEmail,
  updateCartAddress,
  initPaymentCollection,
  initPaymentSession,
  completeCart,
} from "@/lib/data/checkout";
import type { SelectedPvz } from "@/components/checkout/CdekPvzPicker";
import type { CdekTariff } from "@/lib/data/cdek";
import {
  EMPTY_CHECKOUT_FORM,
  YUKASSA_PROVIDER_ID,
  type CheckoutFormData,
  type CheckoutStep,
  type DeliveryMethod,
} from "@/types/checkout";

// ============================================
// Валидация
// ============================================

const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
const PHONE_RE = /^[+\d\s()\-]*$/;

function computeFieldErrors(form: CheckoutFormData) {
  return {
    firstName: !form.firstName.trim() ? "Введите имя" : "",
    lastName: !form.lastName.trim() ? "Введите фамилию" : "",
    email: !form.email.trim()
      ? "Введите email"
      : !EMAIL_RE.test(form.email.trim())
        ? "Некорректный email. Пример: ivan@mail.ru"
        : "",
    phone:
      form.phone.trim() && !PHONE_RE.test(form.phone.trim())
        ? "Телефон может содержать только цифры, +, пробелы, скобки и дефис"
        : "",
    city: !form.city.trim() ? "Введите город" : "",
    address: "",
  };
}

// ============================================
// Хук
// ============================================

/**
 * Логика формы оформления заказа:
 * - состояние полей, шаги, валидация
 * - выбор доставки (СДЭК / ВК)
 * - сабмит → Medusa → ЮKassa
 */
export function useCheckoutForm() {
  const router = useRouter();
  const { cartId, items, total, refreshCart, reset } = useCartStore();

  const [form, setForm] = useState<CheckoutFormData>(EMPTY_CHECKOUT_FORM);
  const [step, setStep] = useState<CheckoutStep>("contacts");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touchedSteps, setTouchedSteps] = useState<Record<CheckoutStep, boolean>>({
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
    (field: keyof CheckoutFormData, value: string | boolean) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setError(null);
    },
    [],
  );

  // Валидация
  const fieldErrors = computeFieldErrors(form);

  const isContactsValid =
    !fieldErrors.firstName &&
    !fieldErrors.lastName &&
    !fieldErrors.email &&
    !fieldErrors.phone;

  const isDeliveryValid =
    deliveryMethod === "cdek" && !fieldErrors.city && !!selectedPvz;

  const isFormValid =
    isContactsValid && isDeliveryValid && form.privacyAccepted;

  // Шаги
  const goToDelivery = useCallback(() => {
    setTouchedSteps((prev) => ({ ...prev, contacts: true }));
    if (!isContactsValid) {
      setError("Исправьте ошибки в контактных данных");
      return;
    }
    setStep("delivery");
    setError(null);
  }, [isContactsValid]);

  const goToPayment = useCallback(() => {
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
  }, [deliveryMethod, fieldErrors.city, selectedPvz]);

  /** Обработка выбора ПВЗ */
  const handlePvzSelect = useCallback(
    (pvz: SelectedPvz, tariff: CdekTariff | null) => {
      setSelectedPvz(pvz);
      setDeliveryTariff(tariff);
      setForm((prev) => ({
        ...prev,
        address: `ПВЗ СДЭК: ${pvz.name}, ${pvz.address}`,
        zip: pvz.postalCode || prev.zip,
      }));
      setError(null);
    },
    [],
  );

  const handleCitySelect = useCallback((city: { code: number }) => {
    setSelectedCityCode(city.code);
    setSelectedPvz(null);
    setDeliveryTariff(null);
  }, []);

  const handleCityClear = useCallback(() => {
    setSelectedCityCode(null);
    setSelectedPvz(null);
    setDeliveryTariff(null);
  }, []);

  // Оформление заказа
  const handleSubmit = useCallback(async () => {
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
      } catch {
        throw new Error(
          "Не удалось создать платёжную коллекцию. Попробуйте обновить страницу.",
        );
      }

      // 4. Инициализировать платёжную сессию (ЮKassa)
      let updatedCollection;
      try {
        const result = await initPaymentSession(
          paymentCollectionId,
          YUKASSA_PROVIDER_ID,
        );
        updatedCollection = result.payment_collection;
      } catch {
        throw new Error(
          "Ошибка инициализации платежа. Платёжная система временно недоступна.",
        );
      }

      // 5. Получить confirmation_url от ЮKassa
      const session = updatedCollection.payment_sessions?.[0];
      if (!session) {
        throw new Error(
          "Платёжная сессия не создана. Проверьте настройки ЮKassa.",
        );
      }
      if (session.data?.error) {
        throw new Error(`Ошибка платёжной системы: ${session.data.error}`);
      }

      const confirmationUrl = session.data?.confirmation_url;
      if (confirmationUrl) {
        window.location.href = confirmationUrl;
        return;
      }

      // Если нет confirmation_url — попробуем завершить корзину напрямую
      const result = await completeCart(cartId);
      if (result.type === "order" && result.order) {
        reset();
        router.push("/checkout/success");
      } else {
        throw new Error(
          result.error?.message || "Не удалось завершить заказ. Попробуйте ещё раз.",
        );
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Произошла ошибка при оплате";
      setError(message);
      setLoading(false);
    }
  }, [cartId, isFormValid, items, form, reset, router]);

  return {
    // Форма
    form,
    updateField,
    fieldErrors,
    // Шаги
    step,
    setStep,
    touchedSteps,
    goToDelivery,
    goToPayment,
    // Валидация
    isContactsValid,
    isDeliveryValid,
    isFormValid,
    // Доставка
    deliveryMethod,
    setDeliveryMethod,
    selectedPvz,
    deliveryTariff,
    selectedCityCode,
    handlePvzSelect,
    handleCitySelect,
    handleCityClear,
    // Корзина
    items,
    total,
    hasItems: items.length > 0,
    // Сабмит
    handleSubmit,
    loading,
    error,
  };
}
