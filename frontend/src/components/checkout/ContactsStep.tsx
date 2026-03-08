"use client";

import type { CheckoutFormData, CheckoutStep } from "@/types/checkout";
import { FieldError, inputCls } from "./FieldHelpers";

interface ContactsStepProps {
  form: CheckoutFormData;
  updateField: (field: keyof CheckoutFormData, value: string | boolean) => void;
  fieldErrors: Record<string, string>;
  step: CheckoutStep;
  setStep: (s: CheckoutStep) => void;
  isContactsValid: boolean;
  showErrors: boolean;
  goToDelivery: () => void;
}

/**
 * Шаг 1 — Контактные данные (имя, фамилия, email, телефон).
 */
export function ContactsStep({
  form,
  updateField,
  fieldErrors,
  step,
  setStep,
  isContactsValid,
  showErrors,
  goToDelivery,
}: ContactsStepProps) {
  return (
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
                className={inputCls(showErrors ? fieldErrors.firstName : "")}
                required
              />
              {showErrors && <FieldError error={fieldErrors.firstName} />}
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
                className={inputCls(showErrors ? fieldErrors.lastName : "")}
                required
              />
              {showErrors && <FieldError error={fieldErrors.lastName} />}
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
                className={inputCls(showErrors ? fieldErrors.email : "")}
                required
              />
              {showErrors && <FieldError error={fieldErrors.email} />}
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
                className={inputCls(showErrors ? fieldErrors.phone : "")}
              />
              {showErrors && <FieldError error={fieldErrors.phone} />}
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
  );
}
