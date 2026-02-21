import { defineConfig, loadEnv } from "@medusajs/framework/utils";

// Загрузка переменных окружения
loadEnv(process.env.NODE_ENV || "development", process.cwd());

module.exports = defineConfig({
  projectConfig: {
    // URL бэкенда
    backendUrl: process.env.MEDUSA_BACKEND_URL || "http://localhost:9000",

    // База данных PostgreSQL
    databaseUrl:
      process.env.DATABASE_URL ||
      "postgres://medusa:medusa@localhost:5432/medusa_trikotazhiya",

    // Redis для кеша, сессий и очередей
    redisUrl: process.env.REDIS_URL || "redis://localhost:6379",

    // Настройки HTTP
    http: {
      storeCors: process.env.STORE_CORS || "http://localhost:3000",
      adminCors: process.env.ADMIN_CORS || "http://localhost:3000,http://localhost:9000",
      authCors: process.env.AUTH_CORS || "http://localhost:3000,http://localhost:9000",
    },

    // JWT-секрет для авторизации
    jwtSecret: process.env.JWT_SECRET || "supersecret-dev-only",
    cookieSecret: process.env.COOKIE_SECRET || "supersecret-cookie-dev-only",
  },

  // Подключённые модули
  modules: [
    // Кастомный модуль данных о тканях
    {
      resolve: "./src/modules/fabric",
    },
    // Кастомный платёжный провайдер ЮKassa (Пункт 4)
    {
      resolve: "./src/modules/yukassa",
    },
  ],
});
