import type { Metadata } from "next";
import { MapPin, Clock, Send } from "lucide-react";
import { Map2gis } from "@/components/contacts/Map2gis";

export const metadata: Metadata = {
    title: "Контакты",
    description: "Магазин тканей Трикотажия: г. Воронеж, ул. Кольцовская, 68. Telegram: +7 995 251 0289.",
    alternates: {
        canonical: "/contacts",
    },
};

export default function ContactsPage() {
    return (
        <div className="container-shop py-12">
            <h1 className="font-heading text-3xl font-bold text-primary-900">
                Контакты
            </h1>
            <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
                <div>
                    <h2 className="flex items-center gap-2 text-xl font-semibold">
                        <Send className="h-5 w-5 text-accent-500" />
                        Связаться с нами
                    </h2>
                    <ul className="mt-4 space-y-3 text-gray-700">
                        <li>
                            Telegram:{" "}
                            <a
                                href="https://t.me/+79952510289"
                                target="_blank"
                                rel="noopener noreferrer nofollow"
                                className="font-medium text-accent-600 hover:underline"
                            >
                                +7 995 251 0289
                            </a>
                        </li>
                        <li>
                            Канал:{" "}
                            <a
                                href="https://t.me/trikotazhiya"
                                target="_blank"
                                rel="noopener noreferrer nofollow"
                                className="font-medium text-accent-600 hover:underline"
                            >
                                t.me/trikotazhiya
                            </a>
                        </li>
                        <li>
                            ВКонтакте:{" "}
                            <a
                                href="https://vk.com/trikotazhiya"
                                target="_blank"
                                rel="noopener noreferrer nofollow"
                                className="font-medium text-accent-600 hover:underline"
                            >
                                vk.com/trikotazhiya
                            </a>
                            <span className="ml-1 text-sm text-gray-500">(каталог + заказ)</span>
                        </li>
                        <li>
                            Авито:{" "}
                            <a
                                href="https://www.avito.ru/brands/cff114170b691efe16204d49f026adf4/all/mebel_i_interer?sellerId=33a3412fa8c101adca4a626cb532ba52"
                                target="_blank"
                                rel="noopener noreferrer nofollow"
                                className="font-medium text-accent-600 hover:underline"
                            >
                                Трикотажия на Авито
                            </a>
                            <span className="ml-1 text-sm text-gray-500">(заказ с Авито Доставкой)</span>
                        </li>
                    </ul>
                </div>
                <div>
                    <h2 className="flex items-center gap-2 text-xl font-semibold">
                        <MapPin className="h-5 w-5 text-accent-500" />
                        Офлайн-магазин
                    </h2>
                    <ul className="mt-4 space-y-2 text-gray-700">
                        <li className="font-medium">г. Воронеж, ул. Кольцовская, 68</li>
                    </ul>
                    <h3 className="mt-4 flex items-center gap-2 font-medium text-gray-900">
                        <Clock className="h-4 w-4 text-gray-400" />
                        Режим работы
                    </h3>
                    <ul className="mt-2 space-y-1 text-gray-700">
                        <li>Пн–Пт: 10:00–18:00</li>
                        <li>Сб, Вс: выходной</li>
                    </ul>
                </div>
            </div>

            {/* Карта 2ГИС */}
            <div className="mt-10">
                <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                    <MapPin className="h-5 w-5 text-accent-500" />
                    Мы на карте
                </h2>
                <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                    <Map2gis />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                    г. Воронеж, ул. Кольцовская, 68 —{" "}
                    <a
                        href="https://2gis.ru/voronezh/firm/70000001104133513"
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="font-medium text-accent-600 hover:underline"
                    >
                        открыть в 2ГИС
                    </a>
                </p>
            </div>
        </div>
    );
}
