import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductByHandle, getProductsList } from "@/lib/data/products";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductInfo } from "@/components/product/ProductInfo";
import { ProductTabs } from "@/components/product/ProductTabs";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import { ProductJsonLd } from "@/components/seo/ProductJsonLd";

interface ProductPageProps {
  params: { handle: string };
}

// Генерация статических путей для ISR (Incremental Static Regeneration)
// При отсутствии бэкенда — возвращаем пустой массив (все страницы рендерятся на лету)
export async function generateStaticParams() {
  try {
    const { products } = await getProductsList({ limit: 100 });
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";
  const productUrl = `${siteUrl}/products/${product.handle}`;
  const description = product.metadata?.short_description || product.description || "";
  const images = product.thumbnail
    ? [{ url: product.thumbnail, width: 800, height: 800, alt: product.title }]
    : [];

  return {
    title: product.title,
    description,
    alternates: {
      canonical: `/products/${product.handle}`,
    },
    openGraph: {
      title: `${product.title} — купить в Трикотажии`,
      description,
      url: productUrl,
      images,
      type: "article",
      locale: "ru_RU",
      siteName: "Трикотажия",
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description,
      images: product.thumbnail ? [product.thumbnail] : [],
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
      {/* JSON-LD разметка Schema.org для поисковых систем */}
      <ProductJsonLd product={product} />

      {/* Хлебные крошки */}
      <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/" className="hover:text-primary-600">
              Главная
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/catalog" className="hover:text-primary-600">
              Каталог
            </Link>
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
