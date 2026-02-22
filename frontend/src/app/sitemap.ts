import { MetadataRoute } from "next";
import { medusaFetch } from "@/lib/medusa-client";
import type { Product, ProductListResponse } from "@/types/product";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";

/**
 * Динамическая sitemap.xml для поисковых систем.
 *
 * Включает:
 * - Статические страницы (главная, каталог, о нас и т.д.)
 * - Все опубликованные товары из Medusa
 *
 * Next.js автоматически отдаёт по адресу /sitemap.xml
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ── Статические страницы ────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/catalog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/delivery`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/contacts`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // ── Динамические страницы товаров ───────────
  let productPages: MetadataRoute.Sitemap = [];

  try {
    const data = await medusaFetch<ProductListResponse>(
      `/store/products?limit=1000&fields=handle,updated_at`
    );

    productPages = data.products.map((product: Product) => ({
      url: `${SITE_URL}/products/${product.handle}`,
      lastModified: new Date(product.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error("[sitemap] Failed to fetch products:", error);
  }

  return [...staticPages, ...productPages];
}
