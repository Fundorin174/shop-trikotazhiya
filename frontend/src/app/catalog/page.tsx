import { Suspense } from "react";
import { CatalogGrid } from "@/components/catalog/CatalogGrid";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Каталог тканей",
  description:
    "Каталог тканей: хлопок, шёлк, шерсть, лён, трикотаж. Фильтры по типу, цвету, ширине и цене.",
};

// searchParams передаются через пропсы в App Router
interface CatalogPageProps {
  searchParams: {
    type?: string;
    color?: string;
    min_price?: string;
    max_price?: string;
    width_min?: string;
    width_max?: string;
    collection?: string;
    sort?: string;
    page?: string;
  };
}

export default function CatalogPage({ searchParams }: CatalogPageProps) {
  return (
    <div className="container-shop py-8">
      <h1 className="font-heading text-3xl font-bold text-primary-900">
        Каталог тканей
      </h1>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        {/* Боковая панель фильтров */}
        <aside>
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
