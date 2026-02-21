import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductByHandle, getProductsList } from "@/lib/data/products";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductInfo } from "@/components/product/ProductInfo";
import { ProductTabs } from "@/components/product/ProductTabs";
import { RelatedProducts } from "@/components/product/RelatedProducts";

interface ProductPageProps {
  params: { handle: string };
}

// Генерация статических путей для ISR (Incremental Static Regeneration)
// При отсутствии бэкенда — возвращаем пустой массив (все страницы рендерятся на лету)
export async function generateStaticParams() {
  try {
    const products = await getProductsList({ limit: 100 });
    return products.map((p) => ({ handle: p.handle }));
  } catch {
    return [];
  }
}

// Динамические метаданные для SEO — каждая страница товара уникальна
export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const product = await getProductByHandle(params.handle);
  if (!product) return { title: "Товар не найден" };

  return {
    title: product.title,
    description:
      product.metadata?.short_description || product.description || "",
    openGraph: {
      title: product.title,
      description: product.description || "",
      images: product.thumbnail ? [{ url: product.thumbnail }] : [],
      type: "website",
    },
  };
}

// SSR-страница товара
export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProductByHandle(params.handle);

  if (!product) {
    notFound();
  }

  // Извлекаем кастомные поля ткани из metadata
  const fabricData = product.metadata as Record<string, unknown> | null;

  return (
    <div className="container-shop py-8">
      {/* Хлебные крошки */}
      <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li>
            <a href="/" className="hover:text-primary-600">
              Главная
            </a>
          </li>
          <li>/</li>
          <li>
            <a href="/catalog" className="hover:text-primary-600">
              Каталог
            </a>
          </li>
          <li>/</li>
          <li className="text-gray-900">{product.title}</li>
        </ol>
      </nav>

      {/* Основная карточка: галерея + информация */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <ProductGallery
          images={product.images || []}
          thumbnail={product.thumbnail}
          title={product.title}
        />
        <ProductInfo product={product} fabricData={fabricData} />
      </div>

      {/* Вкладки: описание, характеристики, отзывы */}
      <div className="mt-12">
        <ProductTabs product={product} fabricData={fabricData} />
      </div>

      {/* Похожие товары */}
      <div className="mt-16">
        <RelatedProducts
          productId={product.id}
          collectionId={product.collection_id}
        />
      </div>
    </div>
  );
}
