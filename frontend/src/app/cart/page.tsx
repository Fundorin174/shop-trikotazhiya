import type { Metadata } from "next";
import { CartContent } from "@/components/cart/CartContent";

export const metadata: Metadata = {
  title: "Корзина",
};

export default function CartPage() {
  return (
    <div className="container-shop py-8">
      <h1 className="font-heading text-3xl font-bold text-primary-900">
        Корзина
      </h1>
      <CartContent />
    </div>
  );
}
