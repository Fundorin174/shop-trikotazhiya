import Link from "next/link";
import Image from "next/image";
import { getFeaturedProducts } from "@/lib/data/products";
import { FABRIC_TYPE_LABELS } from "@/types/product";

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
            {featuredProducts.map((product) => (
              <article key={product.id} className="product-card">
                <Link href={`/products/${product.handle}`}>
                  <div className="aspect-[4/5] overflow-hidden bg-gray-100">
                    {(product.thumbnail || product.images?.[0]?.url) && (
                      <img
                        src={product.thumbnail || product.images?.[0]?.url}
                        alt={product.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                      {product.title}
                    </h3>
                    {product.subtitle && (
                      <p className="mt-1 text-xs text-gray-500">
                        {product.subtitle}
                      </p>
                    )}
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
