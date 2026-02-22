const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";

/**
 * JSON-LD разметка Organization + LocalBusiness.
 *
 * Выводится на всех страницах (через layout.tsx).
 * — Organization: для Knowledge Panel Google
 * — LocalBusiness: для локального поиска (Яндекс.Карты, Google Maps)
 *
 * @see https://developers.google.com/search/docs/appearance/structured-data/local-business
 */
export function OrganizationJsonLd() {
  const organizationLd = {
    "@context": "https://schema.org",
    "@type": ["Organization", "Store"],
    "@id": `${SITE_URL}/#organization`,
    name: "Трикотажия",
    alternateName: "Trikotazhiya",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description:
      "Интернет-магазин трикотажных тканей с доставкой по всей России. Кулирка, футер, интерлок, кашкорсе, рибана и фурнитура.",
    telephone: "+79952510289",
    email: "admin@trikotazhiya.ru",
    address: {
      "@type": "PostalAddress",
      streetAddress: "ул. Кольцовская, 68",
      addressLocality: "Воронеж",
      addressRegion: "Воронежская область",
      postalCode: "394000",
      addressCountry: "RU",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 51.6683,
      longitude: 39.1919,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "10:00",
        closes: "18:00",
      },
    ],
    sameAs: [
      "https://t.me/trikotazhiya",
      "https://vk.com/trikotazhiya",
      "https://www.avito.ru/brands/cff114170b691efe16204d49f026adf4/all/mebel_i_interer?sellerId=33a3412fa8c101adca4a626cb532ba52",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+79952510289",
      contactType: "customer service",
      availableLanguage: "Russian",
      areaServed: "RU",
    },
    priceRange: "₽₽",
  };

  // WebSite schema — enables Google Sitelinks Search Box
  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: "Трикотажия",
    description: "Интернет-магазин тканей с доставкой по всей России",
    publisher: {
      "@id": `${SITE_URL}/#organization`,
    },
    inLanguage: "ru-RU",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/catalog?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
      />
    </>
  );
}
