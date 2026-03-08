import { getRelatedProducts } from "@/lib/data/products";
import { FabricPlaceholder } from "@/components/ui/FabricPlaceholder";
import { ProductCardImage } from "@/components/catalog/ProductCardImage";
import { ProductCardPrice } from "@/components/catalog/ProductCardPrice";
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
          const variant = product.variants?.[0];
          const meta = product.metadata;
          const discount = Number(meta?.discount_percent) || 0;
          const imgSrc = product.thumbnail || product.images?.[0]?.url;

          return (
            <Link
              key={product.id}
              href={`/products/${product.handle}`}
              className="product-card"
            >
              <div className="aspect-[4/5] overflow-hidden bg-gray-100">
                {imgSrc ? (
                  <ProductCardImage src={imgSrc} alt={product.title} />
                ) : (
                  <FabricPlaceholder />
                )}
              </div>
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                  {product.title}
                </h3>
                {variant && (
                  <ProductCardPrice variant={variant} meta={meta} discount={discount} />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
