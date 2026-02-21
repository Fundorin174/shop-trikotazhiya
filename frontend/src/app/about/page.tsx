import type { Metadata } from "next";
import Link from "next/link";
import {
  Scissors,
  Truck,
  MessageCircle,
  MapPin,
  Clock,
  ShieldCheck,
  Sparkles,
  Heart,
  Send,
} from "lucide-react";

export const metadata: Metadata = {
  title: "О магазине",
  description:
    "Трикотажия — интернет-магазин тканей и трикотажа с доставкой по всей России. Хлопок, футер, интерлок, кулирка, жаккард и уникальные купонные принты.",
};

export default function AboutPage() {
  return (
    <div className="container-shop py-12">
      {/* ── Hero ── */}
      <section className="text-center">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-primary-900 sm:text-5xl">
          Добро пожаловать в{" "}
          <span className="text-accent-600">«Трикотажию»</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
          Интернет-магазин тканей и трикотажа с доставкой по всей России
        </p>
        <p className="mx-auto mt-6 max-w-xl text-base italic text-primary-700">
          Мы&nbsp;— не просто магазин. Это страна, где сшиваются мечты: от
          первого метра хлопка до готового платья, от идеи&nbsp;— к воплощению.
        </p>
      </section>

      {/* ── Что мы предлагаем ── */}
      <section className="mt-16">
        <h2 className="flex items-center gap-2 font-heading text-2xl font-bold text-primary-900">
          <Scissors className="h-6 w-6 text-accent-500" />
          Что мы предлагаем
        </h2>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Карточка 1 */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-gray-900">Премиум-качество</h3>
            <p className="mt-2 text-sm text-gray-600">
              100% хлопок, люрекс, футер, интерлок, кулирка, жаккард, рибана и
              многое другое — только проверенные фабрики России, Турции,
              Узбекистана и Китая.
            </p>
          </div>

          {/* Карточка 2 */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-500">
              <Heart className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-gray-900">Режем от 10 см</h3>
            <p className="mt-2 text-sm text-gray-600">
              Пробуйте, экспериментируйте, шейте без переплат — заказывайте
              ровно столько, сколько нужно для вашего проекта.
            </p>
          </div>

          {/* Карточка 3 */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
              🔥
            </div>
            <h3 className="font-semibold text-gray-900">
              Уникальные купонные принты
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Рокерские, мистические, готические — крупные купоны для взрослых
              с&nbsp;глубоким смыслом и авторской графикой. Такого почти нигде
              нет!
            </p>
          </div>

          {/* Карточка 4 */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-gray-900">
              Подробные описания и фото
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Вы точно знаете, что заказываете — детальные характеристики,
              реальные фотографии и честные описания каждой ткани.
            </p>
          </div>

          {/* Карточка 5 */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
              <MessageCircle className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-gray-900">
              Бесплатные консультации
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Поможем подобрать ткань под ваш проект, рассчитать расход и дадим
              совет по пошиву — просто напишите нам.
            </p>
          </div>
        </div>
      </section>

      {/* ── Доставка и оплата ── */}
      <section className="mt-16">
        <h2 className="flex items-center gap-2 font-heading text-2xl font-bold text-primary-900">
          <Truck className="h-6 w-6 text-accent-500" />
          Доставка и оплата
        </h2>

        <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Доставка */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              🚚 Доставка
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-primary-400">✓</span>
                Отправляем заказы <strong>ежедневно</strong> по всей России
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-primary-400">✓</span>
                Через <strong>СДЭК</strong> и <strong>Ozon</strong>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-gray-400">•</span>
                Доставка оплачивается покупателем при получении в&nbsp;ПВЗ или
                курьеру
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-gray-400">•</span>
                Перед оформлением рекомендуем уточнить стоимость доставки до
                вашего пункта выдачи
              </li>
            </ul>
          </div>

          {/* Оплата */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-900">💳 Оплата</h3>
            <ul className="mt-4 space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-primary-400">✓</span>
                Онлайн по <strong>QR-коду</strong> или банковским реквизитам
                (высылаем после подтверждения заказа)
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-primary-400">✓</span>
                Наличными, картой или по <strong>СБП</strong> — при самовывозе
                из&nbsp;магазина
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── Возврат ── */}
      <section className="mt-16">
        <h2 className="flex items-center gap-2 font-heading text-2xl font-bold text-primary-900">
          <ShieldCheck className="h-6 w-6 text-accent-500" />
          Возврат
        </h2>

        <div className="mt-6 rounded-xl border border-primary-200 bg-primary-50 p-6">
          <p className="text-sm font-medium text-gray-900">
            Возврат оформляется в следующих случаях:
          </p>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="mt-0.5">📦</span>
              Товар повреждён при доставке
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">⚠️</span>
              Полученный товар не соответствует заказанному
            </li>
          </ul>

          <div className="mt-4 rounded-lg border border-primary-300 bg-white p-4">
            <p className="text-sm font-semibold text-primary-800">❗ Важно:</p>
            <ul className="mt-2 space-y-2 text-sm text-gray-700">
              <li>
                Проверка товара обязательно должна проводиться в&nbsp;пункте
                выдачи <strong>под камерами видеонаблюдения</strong>.
              </li>
              <li>
                Возврат денежных средств осуществляется в&nbsp;течение{" "}
                <strong>3&nbsp;рабочих дней</strong> после возврата товара
                в&nbsp;магазин — на тот же счёт, с которого была произведена
                оплата.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── Офлайн-магазин ── */}
      <section className="mt-16">
        <h2 className="flex items-center gap-2 font-heading text-2xl font-bold text-primary-900">
          <MapPin className="h-6 w-6 text-accent-500" />
          Офлайн-магазин в Воронеже
        </h2>

        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <p className="flex items-center gap-2 text-gray-900">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="font-medium">
                  г.&nbsp;Воронеж, ул.&nbsp;Кольцовская,&nbsp;68
                </span>
              </p>
            </div>
            <div>
              <p className="flex items-center gap-2 text-gray-900">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="font-medium">Часы работы:</span>
              </p>
              <ul className="mt-2 space-y-1 pl-6 text-sm text-gray-700">
                <li>Пн–Пт: 10:00–18:00</li>
                <li>Сб, Вс: выходной</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Как сделать заказ ── */}
      <section className="mt-16">
        <h2 className="flex items-center gap-2 font-heading text-2xl font-bold text-primary-900">
          <Send className="h-6 w-6 text-accent-500" />
          Как сделать заказ
        </h2>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Шаг 1 */}
          <div className="relative rounded-xl border border-gray-200 bg-white p-6 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-accent-100 font-bold text-accent-700">
              1
            </div>
            <p className="text-sm text-gray-700">
              Выберите ткани в{" "}
              <Link
                href="/catalog"
                className="font-medium text-accent-600 hover:underline"
              >
                каталоге
              </Link>{" "}
              нашего магазина
            </p>
          </div>

          {/* Шаг 2 */}
          <div className="relative rounded-xl border border-gray-200 bg-white p-6 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-accent-100 font-bold text-accent-700">
              2
            </div>
            <p className="text-sm text-gray-700">
              Нажмите <strong>«В корзину»</strong> или отправьте нам сообщение
            </p>
          </div>

          {/* Шаг 3 */}
          <div className="relative rounded-xl border border-gray-200 bg-white p-6 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-accent-100 font-bold text-accent-700">
              3
            </div>
            <p className="text-sm text-gray-700">
              Или напишите напрямую в{" "}
              <a
                href="https://t.me/+79952510289"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-accent-600 hover:underline"
              >
                Telegram
              </a>
              :{" "}
              <span className="font-medium text-gray-900">
                +7 995 251 0289
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* ── ВКонтакте + Авито ── */}
      <section className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* ВКонтакте */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-lg font-semibold text-gray-900">
            📋 ВКонтакте — каталог и заказ
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
            Полный и подробный каталог с фотографиями, описаниями и актуальными
            ценами доступен в нашей группе. Там же можно{" "}
            <strong>оформить заказ</strong> напрямую!
          </p>
          <a
            href="https://vk.com/trikotazhiya"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary-400 px-8 py-3 font-semibold text-white shadow-md transition-transform hover:scale-105 hover:bg-primary-500"
          >
            VK: vk.com/trikotazhiya
          </a>
        </div>

        {/* Авито */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-lg font-semibold text-gray-900">
            🛒 Мы на Авито
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
            Наши ткани можно заказать с{" "}
            <strong>Авито Доставкой</strong>. Для этого напишите нам сообщение
            на Авито — подберём ткань и оформим отправку.
          </p>
          <a
            href="https://www.avito.ru/brands/cff114170b691efe16204d49f026adf4/all/mebel_i_interer?sellerId=33a3412fa8c101adca4a626cb532ba52"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary-600 px-8 py-3 font-semibold text-white shadow-md transition-transform hover:scale-105 hover:bg-primary-700"
          >
            Наш магазин на Авито
          </a>
        </div>
      </section>

      {/* ── Telegram-канал ── */}
      <section className="mt-8 rounded-2xl bg-gradient-to-r from-primary-400 to-primary-700 p-8 text-center text-white sm:p-12">
        <p className="text-lg font-medium">
          ✨ Подписывайтесь на наш Telegram-канал
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm text-primary-100">
          Первыми узнавайте о новинках, эксклюзивных принтах и вдохновляющих
          идеях
        </p>
        <a
          href="https://t.me/trikotazhiya"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 font-semibold text-primary-700 shadow-md transition-transform hover:scale-105"
        >
          <Send className="h-4 w-4" />
          t.me/trikotazhiya
        </a>
      </section>

      {/* ── Футер-цитата ── */}
      <section className="mt-16 text-center">
        <p className="font-heading text-2xl font-bold text-primary-900">
          🪡 Трикотажия — страна, где сшиваются мечты!
        </p>
        <p className="mt-3 text-gray-600">
          Желаем вам творческого вдохновения, точных строчек и одежды, в которой
          хочется жить! 💖
        </p>
      </section>
    </div>
  );
}
