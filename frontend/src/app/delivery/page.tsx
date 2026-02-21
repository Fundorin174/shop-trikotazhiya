import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Доставка и оплата",
  description: "Доставка по всей России через СДЭК и Ozon. Оплата по QR-коду, реквизитам, СБП или наличными при самовывозе.",
};

export default function DeliveryPage() {
  return (
    <div className="container-shop py-12">
      <h1 className="font-heading text-3xl font-bold text-primary-900">
        Доставка и оплата
      </h1>
      <div className="mt-8 max-w-3xl space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-gray-900">🚚 Доставка</h2>
          <ul className="mt-4 space-y-3 text-gray-700">
            <li>Отправляем заказы <strong>ежедневно</strong> по всей России</li>
            <li>Способы: <strong>СДЭК</strong> и <strong>Ozon</strong></li>
            <li>Доставка оплачивается покупателем при получении в ПВЗ или курьеру</li>
            <li>Перед оформлением заказа рекомендуем уточнить стоимость доставки до вашего пункта выдачи</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">💳 Оплата</h2>
          <ul className="mt-4 space-y-3 text-gray-700">
            <li>Онлайн по <strong>QR-коду</strong> или банковским реквизитам (высылаем после подтверждения заказа)</li>
            <li>Наличными, картой или по <strong>СБП</strong> — при самовывозе из магазина</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
