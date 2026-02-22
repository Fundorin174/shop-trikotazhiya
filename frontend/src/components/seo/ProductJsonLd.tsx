import type { Product } from "@/types/product";
import { pricePerCmToPerMeter, originalPrice } from "@/lib/utils";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";

/**
 * JSON-LD разметка Schema.org «Product» для SEO.
 *
 * Помогает Google показывать rich snippets:
 * — название, цену, наличие, изображение
 * — breadcrumbs в выдаче
 * — характеристики ткани (состав, ширина, цвет)
 *
 * @see https://developers.google.com/search/docs/appearance/structured-data/product
 */
export function ProductJsonLd({ product }: { product: Product }) {
  const variant = product.variants?.[0];
  const priceRaw = variant?.prices?.[0]?.amount;
  const currency = variant?.prices?.[0]?.currency_code?.toUpperCase() || "RUB";
  const discount = product.metadata?.discount_percent;
  const isInStock =
    variant && (!variant.manage_inventory || variant.inventory_quantity > 0);
  const meta = product.metadata;

  // Цена за метр (или за штуку), в рублях
  const price = priceRaw ? pricePerCmToPerMeter(priceRaw) / 100 : undefined;
  const oldPrice =
    price && discount ? originalPrice(pricePerCmToPerMeter(priceRaw!), discount) / 100 : undefined;

  // Дополнительные свойства ткани
  const additionalProperties = [];
  if (meta?.composition) {
    additionalProperties.push({
      "@type": "PropertyValue",
      name: "Состав",
      value: meta.composition,
    });
  }
  if (meta?.width_cm) {
    additionalProperties.push({
      "@type": "PropertyValue",
      name: "Ширина",
      value: `${meta.width_cm} см`,
    });
  }
  if (meta?.color) {
    additionalProperties.push({
      "@type": "PropertyValue",
      name: "Цвет",
      value: meta.color,
    });
  }
  if (meta?.country) {
    additionalProperties.push({
      "@type": "PropertyValue",
      name: "Страна производства",
      value: meta.country,
    });
  }

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description:
      meta?.short_description ||
      product.description ||
      undefined,
    image: product.images?.length
      ? product.images.map((img) => img.url)
      : product.thumbnail
        ? [product.thumbnail]
        : undefined,
    sku: meta?.sku || product.id,
    brand: {
      "@type": "Brand",
      name: "Трикотажия",
    },
    ...(meta?.color && { color: meta.color }),
    ...(meta?.composition && { material: meta.composition }),
    ...(additionalProperties.length > 0 && {
      additionalProperty: additionalProperties,
    }),
  };

  if (price) {
    const offer: Record<string, unknown> = {
      "@type": "Offer",
      url: `${SITE_URL}/products/${product.handle}`,
      priceCurrency: currency,
      price: price.toFixed(2),
      availability: isInStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "Трикотажия",
      },
      itemCondition: "https://schema.org/NewCondition",
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "RU",
        },
      },
    };

    // Единица измерения цены
    if (meta?.measurement_unit === "running_meter") {
      offer.unitPricingMeasure = "1 MTR";
      offer.unitPricingBaseMeasure = "1 MTR";
    }

    // Перечёркнутая цена для Google
    if (oldPrice && oldPrice > price) {
      offer.priceValidUntil = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString().split("T")[0];
      offer.highPrice = oldPrice.toFixed(2);
    }

    jsonLd.offers = offer;
  }

  // Breadcrumb JSON-LD
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Главная",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Каталог",
        item: `${SITE_URL}/catalog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.title,
        item: `${SITE_URL}/products/${product.handle}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
    </>
  );
}
