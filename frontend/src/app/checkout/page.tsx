import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export const metadata: Metadata = {
  title: "Оформление заказа",
  // Страницу оформления не индексируем
  robots: { index: false, follow: false },
};

// Checkout НЕ использует общий Header/Footer — свой минимальный layout
export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-shop py-8">
        <h1 className="font-heading text-2xl font-bold text-primary-900">
          Оформление заказа
        </h1>
        <CheckoutForm />
      </div>
    </div>
  );
}
