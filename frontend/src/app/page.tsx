import Link from "next/link";
import Image from "next/image";
import { getFeaturedProducts } from "@/lib/data/products";
import { FABRIC_TYPE_LABELS } from "@/types/product";
import { formatPrice, pricePerCmToPerMeter, originalPrice } from "@/lib/utils";
import { SafeHtml } from "@/components/ui/SafeHtml";

// SSR — главная страница рендерится на сервере для SEO
export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts();

  return (
    <>
      {/* Hero-секция */}
      <section className="relative bg-primary-50 py-20">
        <div className="container-shop">
          <div className="flex items-center gap-8">
            <div className="max-w-2xl">
              <h1 className="font-heading text-4xl font-bold tracking-tight text-primary-900 sm:text-5xl lg:text-6xl">
                Ткани для вашего вдохновения
              </h1>
              <p className="mt-6 text-lg text-primary-700">
                Широкий ассортимент натуральных и синтетических тканей. Все виды трикотажных тканей — с доставкой по всей России.
              </p>
              <div className="mt-8 flex gap-4">
                <Link href="/catalog" className="btn-primary">
                  Перейти в каталог
                </Link>
                <Link href="/about" className="btn-secondary">
                  О магазине
                </Link>
              </div>
            </div>
            <div className="hidden lg:block">
              <Image
                src="/logo.png"
                alt="Трикотажия"
                width={160}
                height={160}
                className="drop-shadow-lg"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Слоган */}
      <section className="relative overflow-hidden bg-gradient-to-r from-primary-700 via-primary-600 to-accent-600 py-10">
        {/* Декоративные элементы */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white" />
          <div className="absolute -bottom-8 right-1/4 h-32 w-32 rounded-full bg-white" />
          <div className="absolute -right-6 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full bg-white" />
        </div>

        <div className="container-shop relative text-center">
          <p className="font-heading text-2xl italic tracking-wide text-white sm:text-3xl lg:text-4xl">
            <span className="opacity-70">✦</span>
            <span className="mx-3" ><span className="font-brand text-[1.3em] not-italic font-normal">Трикотажия</span><span className="font-semibold"> — страна, где сшиваются мечты!</span></span>
            <span className="opacity-70">✦</span>
          </p>
        </div>
      </section>

      {/* Категории тканей */}
      <section className="py-16">
        <div className="container-shop">
          <h2 className="font-heading text-3xl font-bold text-primary-900">
            Категории тканей
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
            {Object.entries(FABRIC_TYPE_LABELS).map(([key, label]) => (
              <Link
                key={key}
                href={`/catalog?type=${encodeURIComponent(key)}`}
                className="flex flex-col items-center justify-center rounded-lg border border-gray-200 p-6 text-center transition-shadow hover:shadow-md"
              >
                <span className="text-lg font-medium text-primary-800">
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Популярные товары */}
      <section className="bg-gray-50 py-16">
        <div className="container-shop">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-3xl font-bold text-primary-900">
              Популярные ткани
            </h2>
            <Link
              href="/catalog"
              className="text-sm font-medium text-accent-600 hover:text-accent-700"
            >
              Смотреть все →
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => {
              const variant = product.variants?.[0];
              const price = variant?.prices?.[0];
              const meta = product.metadata;
              const discount = Number(meta?.discount_percent) || 0;

              return (
                <article key={product.id} className="product-card">
                  {/* Бейдж скидки */}
                  {discount > 0 && (
                    <span className="badge-discount">-{discount}%</span>
                  )}

                  <Link href={`/products/${product.handle}`}>
                    <div className="aspect-[4/5] overflow-hidden bg-gray-100">
                      {(product.thumbnail || product.images?.[0]?.url) && (
                        <Image
                          src={product.thumbnail || product.images![0]!.url}
                          alt={product.title}
                          width={400}
                          height={500}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                        {product.title}
                      </h3>
                      {product.subtitle && (
                        <SafeHtml
                          html={product.subtitle}
                          as="p"
                          className="mt-1 text-xs text-gray-500"
                        />
                      )}

                      {/* Цена */}
                      {price && (() => {
                        const currentPrice = pricePerCmToPerMeter(price.amount);
                        return (
                          <p className="mt-2 text-base font-semibold text-primary-800">
                            {discount > 0 && (
                              <span className="mr-2 text-sm font-normal text-gray-400 line-through">
                                {formatPrice(originalPrice(currentPrice, discount), price.currency_code)}
                              </span>
                            )}
                            {formatPrice(currentPrice, price.currency_code)}
                            <span className="ml-1 text-xs font-normal text-gray-500">
                              / {meta?.measurement_unit === "running_meter" ? "пог. м" : "шт."}
                            </span>
                          </p>
                        );
                      })()}
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
