import Link from "next/link";
import { getProductsList } from "@/lib/data/products";
import { formatPrice, pricePerCmToPerMeter } from "@/lib/utils";
import type { ProductFilters } from "@/types/product";

interface CatalogGridProps {
  filters: ProductFilters;
}

/**
 * Сетка товаров каталога.
 * Server Component — данные загружаются на сервере (SSR).
 */
export async function CatalogGrid({ filters }: CatalogGridProps) {
  const page = Number(filters.page) || 1;
  const products = await getProductsList(filters, page);

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
      {/* Количество результатов */}
      <p className="mb-4 text-sm text-gray-500">
        Найдено: {products.length} товаров
      </p>

      {/* Сетка карточек */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => {
          const variant = product.variants?.[0];
          const price = variant?.prices?.[0];
          const meta = product.metadata;
          const imgSrc = product.thumbnail || product.images?.[0]?.url;

          return (
            <article key={product.id} className="product-card">
              {/* Бейдж скидки */}
              {meta?.discount_percent && meta.discount_percent > 0 && (
                <span className="badge-discount">
                  -{meta.discount_percent}%
                </span>
              )}

              <Link href={`/products/${product.handle}`}>
                {/* Изображение */}
                <div className="aspect-[4/5] overflow-hidden bg-gray-100">
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={product.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-400">
                      Нет фото
                    </div>
                  )}
                </div>

                {/* Информация */}
                <div className="p-4">
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                    {product.title}
                  </h3>

                  {/* Тип ткани + состав */}
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
                  {price && (
                    <p className="mt-2 text-base font-semibold text-primary-800">
                      {formatPrice(
                        pricePerCmToPerMeter(price.amount),
                        price.currency_code
                      )}
                      <span className="ml-1 text-xs font-normal text-gray-500">
                        / {meta?.measurement_unit === "running_meter" ? "пог. м" : "шт."}
                      </span>
                    </p>
                  )}
                </div>
              </Link>
            </article>
          );
        })}
      </div>

      {/* TODO: пагинация */}
    </div>
  );
}
