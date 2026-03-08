"use client";

import Link from "next/link";
import { useCheckoutForm } from "@/hooks/useCheckoutForm";
import { ContactsStep } from "./ContactsStep";
import { DeliveryStep } from "./DeliveryStep";
import { PaymentStep } from "./PaymentStep";
import { OrderSummary } from "./OrderSummary";

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
  const checkout = useCheckoutForm();

  return (
    <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_400px]">
      {/* Левая часть — шаги */}
      <div className="space-y-8">
        {/* Ошибка */}
        {checkout.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {checkout.error}
          </div>
        )}

        {/* Шаг 1: Контактные данные */}
        <ContactsStep
          form={checkout.form}
          updateField={checkout.updateField}
          fieldErrors={checkout.fieldErrors}
          step={checkout.step}
          setStep={checkout.setStep}
          isContactsValid={checkout.isContactsValid}
          showErrors={checkout.touchedSteps.contacts}
          goToDelivery={checkout.goToDelivery}
        />

        {/* Шаг 2: Доставка */}
        <DeliveryStep
          form={checkout.form}
          updateField={checkout.updateField}
          fieldErrors={checkout.fieldErrors}
          step={checkout.step}
          setStep={checkout.setStep}
          isDeliveryValid={checkout.isDeliveryValid}
          showErrors={checkout.touchedSteps.delivery}
          deliveryMethod={checkout.deliveryMethod}
          setDeliveryMethod={checkout.setDeliveryMethod}
          selectedPvz={checkout.selectedPvz}
          deliveryTariff={checkout.deliveryTariff}
          selectedCityCode={checkout.selectedCityCode}
          handlePvzSelect={checkout.handlePvzSelect}
          handleCitySelect={checkout.handleCitySelect}
          handleCityClear={checkout.handleCityClear}
          goToPayment={checkout.goToPayment}
        />

        {/* Шаг 3: Способ оплаты */}
        <PaymentStep step={checkout.step} setStep={checkout.setStep} />

        {/* Согласие на обработку ПД — 152-ФЗ */}
        <section className="rounded-lg border border-primary-200 bg-primary-50 p-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={checkout.form.privacyAccepted}
              onChange={(e) =>
                checkout.updateField("privacyAccepted", e.target.checked)
              }
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
      <OrderSummary
        items={checkout.items}
        total={checkout.total}
        deliveryTariff={checkout.deliveryTariff}
        isFormValid={checkout.isFormValid}
        loading={checkout.loading}
        onSubmit={checkout.handleSubmit}
      />
    </div>
  );
}
