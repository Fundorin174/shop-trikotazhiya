/** @type {import('next').NextConfig} */
const nextConfig = {
  // Оптимизация изображений — поддержка WebP/AVIF
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
      },
      {
        // Продакшн: домен вашего Medusa-бэкенда
        protocol: "https",
        hostname: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_HOST || "localhost",
      },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Переменные окружения, доступные на клиенте
  env: {
    NEXT_PUBLIC_MEDUSA_BACKEND_URL:
      process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000",
  },

  // Редиректы и хедеры безопасности
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self'; frame-src 'self' https://widgets.2gis.com https://2gis.ru https://makemap.2gis.ru;",
          },
        ],
      },
    ];
  },

  // Проксирование запросов к Medusa (избегаем CORS в dev)
  async rewrites() {
    return [
      {
        source: "/api/medusa/:path*",
        destination: `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
