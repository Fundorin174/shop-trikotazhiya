import { Suspense } from "react";
import { CatalogGrid } from "@/components/catalog/CatalogGrid";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";
import { MobileFilterPanel } from "@/components/catalog/MobileFilterPanel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Каталог тканей",
  description:
    "Каталог тканей: кулирка, футер, интерлок, кашкорсе, рибана, капитоний. Фильтры по типу, цвету и цене. Доставка по России.",
  alternates: {
    canonical: "/catalog",
  },
};

// searchParams передаются через пропсы в App Router
interface CatalogPageProps {
  searchParams: {
    type?: string;
    color?: string;
    min_price?: string;
    max_price?: string;
    collection?: string;
    sort?: string;
    page?: string;
  };
}

export default function CatalogPage({ searchParams }: CatalogPageProps) {
  const hasActiveFilters = !!(
    searchParams.type ||
    searchParams.color ||
    searchParams.min_price ||
    searchParams.max_price ||
    searchParams.sort
  );

  return (
    <div className="container-shop py-8">
      <h1 className="font-heading text-3xl font-bold text-primary-900">
        Каталог тканей
      </h1>

      {/* Кнопка фильтров — мобильная, sticky, вне grid */}
      <MobileFilterPanel hasActiveFilters={hasActiveFilters}>
        <CatalogFilters currentFilters={searchParams} />
      </MobileFilterPanel>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        {/* Боковая панель фильтров — только десктоп */}
        <aside className="hidden lg:block">
          <CatalogFilters currentFilters={searchParams} />
        </aside>

        {/* Сетка товаров */}
        <section>
          <Suspense fallback={<CatalogSkeleton />}>
            <CatalogGrid filters={searchParams} />
          </Suspense>
        </section>
      </div>
    </div>
  );
}
