"use client";

import type { CheckoutFormData, CheckoutStep, DeliveryMethod } from "@/types/checkout";
import type { SelectedPvz } from "@/components/checkout/CdekPvzPicker";
import type { CdekTariff } from "@/lib/data/cdek";
import { CdekPvzPicker } from "@/components/checkout/CdekPvzPicker";
import { CdekCitySuggest } from "@/components/checkout/CdekCitySuggest";
import { FieldError, inputCls } from "./FieldHelpers";

interface DeliveryStepProps {
  form: CheckoutFormData;
  updateField: (field: keyof CheckoutFormData, value: string | boolean) => void;
  fieldErrors: Record<string, string>;
  step: CheckoutStep;
  setStep: (s: CheckoutStep) => void;
  isDeliveryValid: boolean;
  showErrors: boolean;
  deliveryMethod: DeliveryMethod;
  setDeliveryMethod: (m: DeliveryMethod) => void;
  selectedPvz: SelectedPvz | null;
  deliveryTariff: CdekTariff | null;
  selectedCityCode: number | null;
  handlePvzSelect: (pvz: SelectedPvz, tariff: CdekTariff | null) => void;
  handleCitySelect: (city: { code: number }) => void;
  handleCityClear: () => void;
  goToPayment: () => void;
}

/**
 * Шаг 2 — Доставка (СДЭК ПВЗ / ВКонтакте).
 */
export const DeliveryStep = ({
  form,
  updateField,
  fieldErrors,
  step,
  setStep,
  isDeliveryValid,
  showErrors,
  deliveryMethod,
  setDeliveryMethod,
  selectedPvz,
  deliveryTariff,
  selectedCityCode,
  handlePvzSelect,
  handleCitySelect,
  handleCityClear,
  goToPayment,
}: DeliveryStepProps) => {
  return (
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
            <DeliveryOption
              active={deliveryMethod === "cdek"}
              onClick={() => setDeliveryMethod("cdek")}
              icon={<CdekIcon active={deliveryMethod === "cdek"} />}
              title="Доставка СДЭК"
              subtitle="Пункт выдачи · оплата онлайн"
              activeColor="primary"
            />
            <DeliveryOption
              active={deliveryMethod === "vk"}
              onClick={() => setDeliveryMethod("vk")}
              icon={<VkIcon active={deliveryMethod === "vk"} />}
              title="Другой способ"
              subtitle="Согласовать в ВКонтакте"
              activeColor="blue"
            />
          </div>

          {/* СДЭК: город + ПВЗ */}
          {deliveryMethod === "cdek" && (
            <CdekSection
              form={form}
              updateField={updateField}
              fieldErrors={fieldErrors}
              showErrors={showErrors}
              selectedCityCode={selectedCityCode}
              selectedPvz={selectedPvz}
              handlePvzSelect={handlePvzSelect}
              handleCitySelect={handleCitySelect}
              handleCityClear={handleCityClear}
            />
          )}

          {/* ВКонтакте: информация */}
          {deliveryMethod === "vk" && <VkDeliveryInfo />}

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
              {deliveryTariff.delivery_sum} ₽ · {deliveryTariff.period_min}–
              {deliveryTariff.period_max} дн.
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
};

// ============================================
// Sub-components
// ============================================

const DeliveryOption = ({
  active,
  onClick,
  icon,
  title,
  subtitle,
  activeColor,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  activeColor: "primary" | "blue";
}) => {
  const colors = active
    ? activeColor === "primary"
      ? "border-primary-500 bg-primary-50 ring-1 ring-primary-500"
      : "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border-2 p-4 text-left transition-all ${colors}`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>
    </button>
  );
};

const CdekIcon = ({ active }: { active: boolean }) => {
  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
        active ? "bg-primary-100" : "bg-gray-100"
      }`}
    >
      <svg
        className={`h-5 w-5 ${active ? "text-primary-600" : "text-gray-500"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M8 17h1m-1-4h4m5 0h1M5 20h14a2 2 0 002-2V8l-4-4H7a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    </div>
  );
};

const VkIcon = ({ active }: { active: boolean }) => {
  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
        active ? "bg-blue-100" : "bg-gray-100"
      }`}
    >
      <svg
        className={`h-5 w-5 ${active ? "text-blue-600" : "text-gray-500"}`}
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M21.579 6.855c.14-.465 0-.806-.662-.806h-2.193c-.558 0-.813.295-.953.619 0 0-1.115 2.719-2.695 4.482-.51.51-.743.673-.02.673-.279 0-.36-.081-.36-.492V6.855c0-.558-.161-.806-.626-.806H10.95c-.348 0-.558.259-.558.504 0 .528.79.65.871 2.138v3.228c0 .707-.128.836-.406.836-.743 0-2.551-2.729-3.624-5.853-.21-.607-.42-.852-.98-.852H4.06c-.627 0-.752.295-.752.619 0 .582.743 3.462 3.461 7.271 1.812 2.601 4.363 4.011 6.687 4.011 1.393 0 1.565-.313 1.565-.852v-1.97c0-.627.132-.752.575-.752.325 0 .883.163 2.183 1.417 1.486 1.486 1.732 2.155 2.568 2.155h2.193c.627 0 .94-.313.76-.93-.198-.615-.907-1.51-1.849-2.569-.51-.604-1.277-1.254-1.51-1.579-.326-.418-.232-.604 0-.976 0 0 2.672-3.761 2.95-5.04z" />
      </svg>
    </div>
  );
};

const CdekSection = ({
  form,
  updateField,
  fieldErrors,
  showErrors,
  selectedCityCode,
  selectedPvz,
  handlePvzSelect,
  handleCitySelect,
  handleCityClear,
}: {
  form: CheckoutFormData;
  updateField: (field: keyof CheckoutFormData, value: string | boolean) => void;
  fieldErrors: Record<string, string>;
  showErrors: boolean;
  selectedCityCode: number | null;
  selectedPvz: SelectedPvz | null;
  handlePvzSelect: (pvz: SelectedPvz, tariff: CdekTariff | null) => void;
  handleCitySelect: (city: { code: number }) => void;
  handleCityClear: () => void;
}) => {
  return (
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
          onCitySelect={handleCitySelect}
          onCityClear={handleCityClear}
          placeholder="Начните вводить город"
          className={inputCls(showErrors ? fieldErrors.city : "")}
          required
        />
        {showErrors && <FieldError error={fieldErrors.city} />}
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
        {showErrors && !selectedPvz && (
          <p className="mt-1 text-xs text-red-600">Выберите пункт выдачи</p>
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
  );
};

const VkDeliveryInfo = () => {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-5">
      <div className="flex items-start gap-3">
        <svg
          className="mt-0.5 h-5 w-5 shrink-0 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="space-y-2">
          <p className="text-sm font-medium text-blue-900">
            Согласуйте доставку и оплату с продавцом
          </p>
          <p className="text-sm text-blue-800">
            Перейдите в нашу группу ВКонтакте, найдите нужный товар и напишите в
            сообщения сообщества. Мы подберём удобный для вас способ доставки и
            оплаты.
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
  );
};
