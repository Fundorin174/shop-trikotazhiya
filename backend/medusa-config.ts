import { defineConfig, loadEnv } from "@medusajs/framework/utils";

// Загрузка переменных окружения
loadEnv(process.env.NODE_ENV || "development", process.cwd());

module.exports = defineConfig({
  admin: {
    // Добавляем @medusajs/admin-sdk в оптимизацию Vite,
    // чтобы draft-order и другие модули могли его импортировать
    vite: () => ({
      optimizeDeps: {
        include: ["@medusajs/admin-sdk"],
      },
    }),
  },
  projectConfig: {
    // База данных PostgreSQL
    databaseUrl:
      process.env.DATABASE_URL ||
      "postgres://medusa:medusa_password@localhost:5432/medusa_trikotazhiya",

    // Redis для кеша, сессий и очередей
    redisUrl: process.env.REDIS_URL || "redis://localhost:6379",

    // Настройки HTTP
    http: {
      storeCors: process.env.STORE_CORS || "http://localhost:3001",
      adminCors: process.env.ADMIN_CORS || "http://localhost:3001,http://localhost:9000",
      authCors: process.env.AUTH_CORS || "http://localhost:3001,http://localhost:9000",
      jwtSecret: process.env.JWT_SECRET || "supersecret-dev-only",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret-cookie-dev-only",
    },
  },

  // Подключённые модули
  modules: [
    // Кастомный модуль данных о тканях
    {
      resolve: "./src/modules/fabric",
    },
    // Payment Module с провайдером ЮKassa
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "./src/modules/yukassa",
            id: "yukassa",
            options: {
              shopId: process.env.YUKASSA_SHOP_ID || "",
              secretKey: process.env.YUKASSA_SECRET_KEY || "",
              webhookSecret: process.env.YUKASSA_WEBHOOK_SECRET || "",
              returnUrl:
                process.env.YUKASSA_RETURN_URL ||
                "http://localhost:3001/checkout/success",
            },
          },
        ],
      },
    },
  ],
});
