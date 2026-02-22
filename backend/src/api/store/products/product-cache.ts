/**
 * Общий кеш товаров в Redis.
 * Используется endpoint'ами /sorted и /featured чтобы не дублировать запросы к БД.
 */
import { createClient } from "redis";

/** TTL кеша товаров в секундах */
const CACHE_TTL = 120;
const CACHE_KEY = "store:products:all";

/** Поля для загрузки — только необходимые для каталога */
export const CATALOG_FIELDS = [
  "id",
  "title",
  "subtitle",
  "handle",
  "thumbnail",
  "status",
  "metadata",
  "created_at",
  "images.id",
  "images.url",
  "variants.id",
  "variants.title",
  "variants.prices.amount",
  "variants.prices.currency_code",
  "variants.inventory_quantity",
];

let redisClient: ReturnType<typeof createClient> | null = null;

async function getRedis() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL || "redis://localhost:6379",
    });
    redisClient.on("error", () => {
      /* тихо — fallback без кеша */
    });
    await redisClient.connect().catch(() => {
      redisClient = null;
    });
  }
  return redisClient;
}

/**
 * Загружает все published товары.
 * Если в Redis есть кеш — возвращает из кеша (TTL = 120 сек).
 * Иначе — загружает через query.graph() и кладёт в Redis.
 */
export async function loadAllProducts(query: any): Promise<any[]> {
  const redis = await getRedis();

  // Пробуем из кеша
  if (redis) {
    try {
      const cached = await redis.get(CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {
      /* cache miss */
    }
  }

  // Загружаем из БД
  const { data: products } = await query.graph({
    entity: "product",
    fields: CATALOG_FIELDS,
    filters: {
      status: "published",
    },
  });

  // Кладём в кеш
  if (redis) {
    redis
      .set(CACHE_KEY, JSON.stringify(products), { EX: CACHE_TTL })
      .catch(() => {});
  }

  return products as any[];
}

/**
 * Инвалидировать кеш товаров.
 * Вызывать после создания/обновления/удаления товара.
 */
export async function invalidateProductsCache(): Promise<void> {
  const redis = await getRedis();
  if (redis) {
    await redis.del(CACHE_KEY).catch(() => {});
  }
}
