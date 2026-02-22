import Link from "next/link";
import Image from "next/image";
import { getProductsList } from "@/lib/data/products";
import { formatPrice, pricePerCmToPerMeter, originalPrice } from "@/lib/utils";
import { FabricPlaceholder } from "@/components/ui/FabricPlaceholder";
import type { ProductFilters } from "@/types/product";
import { FABRIC_TYPE_LABELS, type FabricType } from "@/types/product";

interface CatalogGridProps {
  filters: ProductFilters;
}

/**
 * Формирует URL для страницы пагинации, сохраняя текущие фильтры.
 */
function buildPageUrl(filters: ProductFilters, targetPage: number): string {
  const params = new URLSearchParams();
  if (filters.type) params.set("type", filters.type);
  if (filters.color) params.set("color", filters.color);
  if (filters.min_price) params.set("min_price", filters.min_price);
  if (filters.max_price) params.set("max_price", filters.max_price);
  if (filters.collection) params.set("collection", filters.collection);
  if (filters.sort) params.set("sort", filters.sort);
  if (targetPage > 1) params.set("page", String(targetPage));
  const qs = params.toString();
  return `/catalog${qs ? `?${qs}` : ""}`;
}

/**
 * Сетка товаров каталога.
 * Server Component — данные загружаются на сервере (SSR).
 */
export async function CatalogGrid({ filters }: CatalogGridProps) {
  const page = Number(filters.page) || 1;
  const { products, total, page: currentPage, totalPages } =
    await getProductsList(filters, page);

  if (products.length === 0) {
    return (
      <div className="py-20 text-center text-gray-500">
        <p className="text-lg">Товары не найдены</p>
        <p className="mt-2 text-sm">
          Попробуйте изменить фильтры или{" "}
          <Link href="/catalog" className="text-accent-600 hover:underline">
            сбросить их
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Заголовок активного фильтра */}
      {filters.type && (
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-xl font-semibold text-gray-900">
            {FABRIC_TYPE_LABELS[filters.type as FabricType] ?? filters.type}
          </h2>
          <Link
            href="/catalog"
            className="rounded-md bg-gray-100 px-3 py-1 text-sm text-accent-600 transition-colors hover:bg-gray-200"
          >
            Показать все
          </Link>
        </div>
      )}

      {/* Количество результатов */}
      <p className="mb-4 text-sm text-gray-500">
        Найдено: {total} товаров
      </p>

      {/* Сетка карточек */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => {
          const variant = product.variants?.[0];
          const price = variant?.prices?.[0];
          const meta = product.metadata;
          const imgSrc = product.thumbnail || product.images?.[0]?.url;
          const discount = Number(meta?.discount_percent) || 0;

          return (
            <article key={product.id} className="product-card">
              {/* Бейдж скидки */}
              {discount > 0 && (
                <span className="badge-discount">-{discount}%</span>
              )}

              <Link href={`/products/${product.handle}`}>
                {/* Изображение */}
                <div className="aspect-[4/5] overflow-hidden bg-gray-100">
                  {imgSrc ? (
                    <Image
                      src={imgSrc}
                      alt={product.title}
                      width={400}
                      height={500}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    />
                  ) : (
                    <FabricPlaceholder />
                  )}
                </div>

                {/* Информация */}
                <div className="p-4">
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                    {product.title}
                  </h3>

                  {/* Состав */}
                  {meta?.composition && (
                    <p className="mt-1 text-xs text-gray-500">
                      {meta.composition}
                    </p>
                  )}

                  {/* Ширина */}
                  {meta?.width_cm && (
                    <p className="mt-1 text-xs text-gray-500">
                      Ширина: {meta.width_cm} см
                    </p>
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

      {/* Пагинация */}
      {totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Навигация по страницам">
          {/* Назад */}
          {currentPage > 1 ? (
            <Link
              href={buildPageUrl(filters, currentPage - 1)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
            >
              ← Назад
            </Link>
          ) : (
            <span className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-300">
              ← Назад
            </span>
          )}

          {/* Номера страниц */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={buildPageUrl(filters, p)}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                p === currentPage
                  ? "bg-primary-700 text-white"
                  : "border border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
            >
              {p}
            </Link>
          ))}

          {/* Вперёд */}
          {currentPage < totalPages ? (
            <Link
              href={buildPageUrl(filters, currentPage + 1)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
            >
              Вперёд →
            </Link>
          ) : (
            <span className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-300">
              Вперёд →
            </span>
          )}
        </nav>
      )}
    </div>
  );
}
