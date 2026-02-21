import Link from "next/link";
import Image from "next/image";

/**
 * Подвал сайта — навигация, контакты, копирайт.
 * Server Component — не требует клиентского JS.
 */
export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-primary-200 bg-primary-50">
      <div className="container-shop py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
          {/* О магазине */}
          <div>
            <div className="flex items-center gap-3">
              <Image
                src="/logo-64.png"
                alt="Трикотажия"
                width={48}
                height={48}
                className="rounded-full"
              />
              <h3 className="font-heading text-lg font-bold text-primary-800">
                Трикотажия
              </h3>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              Интернет-магазин качественных тканей с доставкой по всей России.
            </p>
          </div>

          {/* Каталог */}
          <div className="md:col-span-2">
            <h4 className="text-sm font-semibold text-gray-900">Каталог</h4>
            <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2">
              {["Кулирка", "Футер", "Капитоний", "Кашкорсе", "Пике", "Рибана", "Интерлок", "Купоны с принтом", "Трикотажная вязка", "Термополотно", "Джерси", "Фурнитура"].map((t) => (
                <li key={t}>
                  <Link
                    href={`/catalog?type=${encodeURIComponent(t)}`}
                    className="text-sm text-gray-600 hover:text-primary-700"
                  >
                    {t}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Информация */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Информация</h4>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/about" className="text-sm text-gray-600 hover:text-primary-700">
                  О магазине
                </Link>
              </li>
              <li>
                <Link href="/delivery" className="text-sm text-gray-600 hover:text-primary-700">
                  Доставка и оплата
                </Link>
              </li>
              <li>
                <Link href="/contacts" className="text-sm text-gray-600 hover:text-primary-700">
                  Контакты
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-gray-600 hover:text-primary-700">
                  Политика конфиденциальности
                </Link>
              </li>
            </ul>
          </div>

          {/* Контакты */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Контакты</h4>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li>
                <a href="https://t.me/+79952510289" target="_blank" rel="noopener noreferrer" className="hover:text-primary-700">
                  Telegram: +7 995 251 0289
                </a>
              </li>
              <li>
                <a href="https://vk.com/trikotazhiya" target="_blank" rel="noopener noreferrer" className="hover:text-primary-700">
                  VK: vk.com/trikotazhiya
                </a>
              </li>
              <li>
                <a href="https://www.avito.ru/brands/cff114170b691efe16204d49f026adf4/all/mebel_i_interer?sellerId=33a3412fa8c101adca4a626cb532ba52" target="_blank" rel="noopener noreferrer" className="hover:text-primary-700">
                  Авито: Трикотажия
                </a>
              </li>
              <li>Пн–Пт: 10:00–18:00</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-200 pt-6">
          <div className="text-center text-xs text-gray-500 space-y-1">
            <p>© {currentYear} Трикотажия. Все права защищены.</p>
            <p>
              ИП Сенькевич Людмила Викторовна &middot; ИНН: 366109122621
            </p>
            <p>
              394036, г.&nbsp;Воронеж, ул.&nbsp;Кольцовская, д.&nbsp;68
            </p>
            <p className="mt-2">
              <Link href="/privacy" className="text-gray-500 underline hover:text-primary-700">
                Политика конфиденциальности
              </Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
