"use client";

import type { CheckoutStep } from "@/types/checkout";

interface PaymentStepProps {
  step: CheckoutStep;
  setStep: (s: CheckoutStep) => void;
}

/**
 * Шаг 3 — Способ оплаты (ЮKassa).
 */
export function PaymentStep({ step, setStep }: PaymentStepProps) {
  return (
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
  );
}
