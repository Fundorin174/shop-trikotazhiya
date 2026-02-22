import { getRelatedProducts } from "@/lib/data/products";
import { formatPrice } from "@/lib/utils";
import { FabricPlaceholder } from "@/components/ui/FabricPlaceholder";
import Link from "next/link";

interface RelatedProductsProps {
  productId: string;
  collectionId?: string | null;
}

/**
 * Блок «Похожие товары» — Server Component.
 */
export async function RelatedProducts({
  productId,
  collectionId,
}: RelatedProductsProps) {
  const related = await getRelatedProducts(productId, collectionId);

  if (related.length === 0) return null;

  return (
    <section>
      <h2 className="font-heading text-2xl font-bold text-primary-900">
        Похожие ткани
      </h2>
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {related.map((product) => {
          const price = product.variants?.[0]?.prices?.[0];
          return (
            <Link
              key={product.id}
              href={`/products/${product.handle}`}
              className="product-card"
            >
              <div className="aspect-[4/5] overflow-hidden bg-gray-100">
                {(product.thumbnail || product.images?.[0]?.url) ? (
                  <img
                    src={product.thumbnail || product.images?.[0]?.url}
                    alt={product.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <FabricPlaceholder />
                )}
              </div>
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                  {product.title}
                </h3>
                {price && (
                  <p className="mt-1 font-semibold text-primary-800">
                    {formatPrice(price.amount, price.currency_code)}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
