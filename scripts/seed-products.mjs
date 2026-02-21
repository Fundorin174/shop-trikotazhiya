/**
 * ============================================
 * Seed-скрипт: создание тестовых товаров
 * ============================================
 *
 * Запуск:  node scripts/seed-products.mjs
 *
 * Требования:
 *   - Medusa бэкенд запущен на http://localhost:9000
 *   - Админ-пользователь создан (admin@trikotazhiya.ru / __ADMIN_PASSWORD__)
 *
 * Что делает:
 *   1. Добавляет валюту RUB в Store
 *   2. Создаёт регион "Россия" (RUB)
 *   3. Создаёт 12 тестовых товаров — по одному на каждый тип ткани
 *   4. Привязывает к Sales Channel "Trikotazhiya Storefront"
 *   5. Публикует все товары (status: published)
 */

const BASE_URL = "http://localhost:9000";
const ADMIN_EMAIL = "admin@trikotazhiya.ru";
const ADMIN_PASSWORD = "__ADMIN_PASSWORD__";
const SALES_CHANNEL_ID = "sc_01KJ04YBSSYPNWPJD73QP6H8YK";
const STORE_ID = "store_01KJ04HZAANBA9DEENBR5PVGDN";

// ===== Утилиты =====

let authToken = "";

async function api(method, path, body) {
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  const text = await res.text();
  if (!res.ok) {
    console.error(`❌ ${method} ${path} → ${res.status}`);
    console.error(text.substring(0, 500));
    return null;
  }
  return text ? JSON.parse(text) : {};
}

async function authenticate() {
  const res = await fetch(`${BASE_URL}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const data = await res.json();
  authToken = data.token;
  console.log("✅ Авторизация успешна");
}

// ===== Настройка Store, валюты, региона =====

async function setupStoreAndRegion() {
  // Добавить RUB в поддерживаемые валюты
  console.log("\n📦 Настройка магазина...");
  const storeRes = await api("POST", `/admin/stores/${STORE_ID}`, {
    supported_currencies: [
      { currency_code: "rub", is_default: true },
      { currency_code: "eur", is_default: false },
    ],
  });
  if (storeRes) console.log("✅ Валюта RUB добавлена в магазин");

  // Проверить существующие регионы
  const regionsRes = await api("GET", "/admin/regions");
  if (regionsRes && regionsRes.regions.length > 0) {
    const existing = regionsRes.regions.find((r) => r.currency_code === "rub");
    if (existing) {
      console.log(`✅ Регион «${existing.name}» уже существует: ${existing.id}`);
      return existing.id;
    }
  }

  // Создать регион Россия
  const region = await api("POST", "/admin/regions", {
    name: "Россия",
    currency_code: "rub",
    countries: ["ru"],
    automatic_taxes: false,
  });
  if (!region) throw new Error("Не удалось создать регион");
  console.log(`✅ Регион «Россия» создан: ${region.region.id}`);
  return region.region.id;
}

// ===== Товары =====

const PRODUCTS = [
  {
    title: "Кулирка с лайкрой «Пенье»",
    handle: "kulirka-s-lajkroj-pene",
    subtitle: "92% хлопок, 8% эластан, 180 г/м²",
    description:
      "Высококачественная кулирная гладь с добавлением эластана. Пенье — из длинноволокнистого хлопка. Не скатывается, не деформируется после стирки. Идеальна для футболок, платьев, детской одежды.",
    status: "published",
    metadata: {
      sku: "TK-KUL-001",
      fabric_type: "kulirka",
      composition: "92% хлопок, 8% эластан, 180 г/м²",
      quality: "Пенье",
      width_cm: 180,
      measurement_unit: "running_meter",
      min_order: 0.5,
      order_step: 0.1,
      country: "Турция",
      collection_name: "Трикотаж базовый",
      color: "Тёмно-синий",
      color_hex: "#1B1B6F",
    },
    price: 45000, // 450 ₽
    sku: "TK-KUL-001",
    inventory: 300,
  },
  {
    title: "Футер 3-нитка с начёсом",
    handle: "futer-3-nitka-s-nachyosom",
    subtitle: "80% хлопок, 20% полиэстер, 320 г/м²",
    description:
      "Плотный тёплый футер с мягким начёсом на изнанке. Идеален для худи, свитшотов, спортивных костюмов. Не вытягивается, сохраняет форму.",
    status: "published",
    metadata: {
      sku: "TK-FTR-002",
      fabric_type: "footer",
      composition: "80% хлопок, 20% полиэстер, 320 г/м²",
      quality: "Первый сорт",
      width_cm: 185,
      measurement_unit: "running_meter",
      min_order: 0.5,
      order_step: 0.1,
      country: "Узбекистан",
      collection_name: "Футер коллекция",
      color: "Серый меланж",
      color_hex: "#B0B0B0",
    },
    price: 55000,
    sku: "TK-FTR-002",
    inventory: 200,
  },
  {
    title: "Капитоний стёганый",
    handle: "kapitoniy-styoganyj",
    subtitle: "100% хлопок, 240 г/м²",
    description:
      "Стёганая трикотажная ткань с ромбовидным рисунком. Мягкая, тёплая, объёмная. Используется для детской одежды, жилетов, кардиганов.",
    status: "published",
    metadata: {
      sku: "TK-KAP-003",
      fabric_type: "kapitoniy",
      composition: "100% хлопок, 240 г/м²",
      quality: "Пенье",
      width_cm: 150,
      measurement_unit: "running_meter",
      min_order: 0.5,
      order_step: 0.1,
      country: "Турция",
      collection_name: "Капитоний",
      color: "Молочный",
      color_hex: "#FFFDD0",
    },
    price: 65000,
    sku: "TK-KAP-003",
    inventory: 150,
  },
  {
    title: "Кашкорсе с лайкрой",
    handle: "kashkorse-s-lajkroj",
    subtitle: "95% хлопок, 5% эластан, 220 г/м²",
    description:
      "Эластичное трикотажное полотно в «резинку». Используется как основная ткань и для манжет, горловин, поясов. Хорошо тянется и восстанавливает форму.",
    status: "published",
    metadata: {
      sku: "TK-KSH-004",
      fabric_type: "kashkorse",
      composition: "95% хлопок, 5% эластан, 220 г/м²",
      quality: "Пенье",
      width_cm: 135,
      measurement_unit: "running_meter",
      min_order: 0.5,
      order_step: 0.1,
      country: "Турция",
      collection_name: "Трикотаж базовый",
      color: "Чёрный",
      color_hex: "#000000",
    },
    price: 42000,
    sku: "TK-KSH-004",
    inventory: 250,
  },
  {
    title: "Пике хлопковое",
    handle: "pike-khlopkovoe",
    subtitle: "100% хлопок, 200 г/м²",
    description:
      "Структурная ткань с характерной «вафельной» текстурой. Классический материал для поло, спортивной одежды. Дышащая, прочная, не мнётся.",
    status: "published",
    metadata: {
      sku: "TK-PIK-005",
      fabric_type: "pike",
      composition: "100% хлопок, 200 г/м²",
      quality: "Первый сорт",
      width_cm: 180,
      measurement_unit: "running_meter",
      min_order: 0.5,
      order_step: 0.1,
      country: "Узбекистан",
      collection_name: "Поло стиль",
      color: "Белый",
      color_hex: "#FFFFFF",
    },
    price: 38000,
    sku: "TK-PIK-005",
    inventory: 180,
  },
  {
    title: "Рибана с лайкрой",
    handle: "ribana-s-lajkroj",
    subtitle: "93% хлопок, 7% эластан, 190 г/м²",
    description:
      "Мягкое трикотажное полотно с поперечной резинкой. Применяется для манжет, горловин, водолазок, шапочек. Отличная эластичность.",
    status: "published",
    metadata: {
      sku: "TK-RIB-006",
      fabric_type: "ribana",
      composition: "93% хлопок, 7% эластан, 190 г/м²",
      quality: "Пенье",
      width_cm: 60,
      measurement_unit: "running_meter",
      min_order: 0.5,
      order_step: 0.1,
      country: "Турция",
      collection_name: "Трикотаж базовый",
      color: "Пудровый",
      color_hex: "#E8C4C4",
    },
    price: 35000,
    sku: "TK-RIB-006",
    inventory: 400,
  },
  {
    title: "Интерлок хлопковый",
    handle: "interlok-khlopkovyj",
    subtitle: "100% хлопок, 210 г/м²",
    description:
      "Двусторонняя гладкая трикотажная ткань. Обе стороны лицевые. Плотная, мягкая, не закручивается. Для детской одежды, пижам, домашнего текстиля.",
    status: "published",
    metadata: {
      sku: "TK-INT-007",
      fabric_type: "interlok",
      composition: "100% хлопок, 210 г/м²",
      quality: "Пенье",
      width_cm: 150,
      measurement_unit: "running_meter",
      min_order: 0.5,
      order_step: 0.1,
      country: "Узбекистан",
      collection_name: "Детская коллекция",
      color: "Мятный",
      color_hex: "#98FF98",
    },
    price: 48000,
    sku: "TK-INT-007",
    inventory: 220,
  },
  {
    title: "Купон с принтом «Розы»",
    handle: "kupon-s-printom-rozy",
    subtitle: "95% хлопок, 5% эластан, 180 г/м²",
    description:
      "Трикотажное полотно с крупным печатным рисунком (купон). Принт «Розы» — элегантный цветочный дизайн. Для платьев, юбок, туник.",
    status: "published",
    metadata: {
      sku: "TK-KUP-008",
      fabric_type: "kupony",
      composition: "95% хлопок, 5% эластан, 180 г/м²",
      quality: "Первый сорт",
      width_cm: 180,
      measurement_unit: "piece",
      min_order: 1,
      order_step: 1,
      country: "Китай",
      collection_name: "Принты 2026",
      color: "Мультиколор",
      color_hex: "#FF69B4",
      discount_percent: 15,
    },
    price: 52000,
    sku: "TK-KUP-008",
    inventory: 80,
  },
  {
    title: "Трикотажная вязка косами",
    handle: "trikotazhnaya-vyazka-kosami",
    subtitle: "50% шерсть, 50% акрил, 280 г/м²",
    description:
      "Тёплое полотно машинной вязки с узором «косы». Для свитеров, кардиганов, зимних аксессуаров. Мягкая, не колется.",
    status: "published",
    metadata: {
      sku: "TK-VYA-009",
      fabric_type: "trikotazh_vyazka",
      composition: "50% шерсть, 50% акрил, 280 г/м²",
      quality: "Первый сорт",
      width_cm: 150,
      measurement_unit: "running_meter",
      min_order: 0.5,
      order_step: 0.1,
      country: "Италия",
      collection_name: "Зима 2026",
      color: "Бежевый",
      color_hex: "#F5F5DC",
    },
    price: 95000,
    sku: "TK-VYA-009",
    inventory: 60,
  },
  {
    title: "Термополотно флисовое",
    handle: "termopolotno-flisovoe",
    subtitle: "100% полиэстер, 250 г/м²",
    description:
      "Мягкое ворсовое полотно с теплоизоляционными свойствами. Для спортивной одежды, толстовок, подкладок. Быстро сохнет, лёгкое.",
    status: "published",
    metadata: {
      sku: "TK-TRM-010",
      fabric_type: "termopolotno",
      composition: "100% полиэстер, 250 г/м²",
      quality: "Первый сорт",
      width_cm: 150,
      measurement_unit: "running_meter",
      min_order: 0.5,
      order_step: 0.1,
      country: "Китай",
      collection_name: "Спорт",
      color: "Графитовый",
      color_hex: "#383838",
    },
    price: 32000,
    sku: "TK-TRM-010",
    inventory: 350,
  },
  {
    title: "Джерси вискозный",
    handle: "dzhersi-viskoznyj",
    subtitle: "95% вискоза, 5% эластан, 170 г/м²",
    description:
      "Лёгкое струящееся трикотажное полотно. Хорошо драпируется, приятно к телу. Для платьев, блузок, юбок. Нежная и шелковистая текстура.",
    status: "published",
    metadata: {
      sku: "TK-DZH-011",
      fabric_type: "dzhersi",
      composition: "95% вискоза, 5% эластан, 170 г/м²",
      quality: "Премиум",
      width_cm: 150,
      measurement_unit: "running_meter",
      min_order: 0.5,
      order_step: 0.1,
      country: "Италия",
      collection_name: "Премиум коллекция",
      color: "Изумрудный",
      color_hex: "#50C878",
    },
    price: 78000,
    sku: "TK-DZH-011",
    inventory: 90,
  },
  {
    title: "Фурнитура: набор кнопок 10 мм",
    handle: "furnitura-nabor-knopok-10mm",
    subtitle: "Металл, никелированные, 100 шт.",
    description:
      "Кнопки трикотажные «Джерси» 10 мм — универсальная металлическая фурнитура для детской одежды, боди, комбинезонов. Не ржавеют, легко застёгиваются.",
    status: "published",
    metadata: {
      sku: "TK-FUR-012",
      fabric_type: "furnitura",
      composition: "Металл, никелированные",
      quality: "Стандарт",
      width_cm: 0,
      measurement_unit: "piece",
      min_order: 1,
      order_step: 1,
      country: "Китай",
      collection_name: "Фурнитура",
      color: "Серебристый",
      color_hex: "#C0C0C0",
    },
    price: 15000,
    sku: "TK-FUR-012",
    inventory: 500,
  },
];

// ===== Создание товаров =====

async function createProduct(product, regionId) {
  // 1. Создать продукт
  const productData = {
    title: product.title,
    handle: product.handle,
    subtitle: product.subtitle,
    description: product.description,
    status: "published",
    is_giftcard: false,
    metadata: product.metadata,
    sales_channels: [{ id: SALES_CHANNEL_ID }],
    options: [
      { title: "Единица", values: ["1 метр"] },
    ],
    variants: [
      {
        title: "По метражу",
        sku: product.sku,
        manage_inventory: true,
        prices: [
          {
            amount: product.price,
            currency_code: "rub",
          },
        ],
        options: {
          "Единица": "1 метр",
        },
      },
    ],
  };

  const res = await api("POST", "/admin/products", productData);
  if (!res) {
    console.error(`  ❌ Не удалось создать "${product.title}"`);
    return null;
  }

  const p = res.product;
  console.log(`  ✅ ${p.title} → ${p.id}`);
  return p;
}

// ===== MAIN =====

async function main() {
  console.log("🚀 Seed-скрипт: создание тестовых товаров\n");

  // 1. Авторизация
  await authenticate();

  // 2. Настройка Store + Регион
  const regionId = await setupStoreAndRegion();

  // 3. Проверка существующих товаров
  const existing = await api("GET", "/admin/products?limit=100");
  if (existing && existing.count > 0) {
    console.log(`\n⚠️  В базе уже есть ${existing.count} товаров.`);
    const existingHandles = new Set(existing.products.map((p) => p.handle));
    var toCreate = PRODUCTS.filter((p) => !existingHandles.has(p.handle));
    console.log(`   Новых для создания: ${toCreate.length}`);
    if (toCreate.length === 0) {
      console.log("   Все товары уже существуют. Пропускаем.\n");
      return;
    }
  } else {
    var toCreate = PRODUCTS;
  }

  // 4. Создание товаров
  console.log(`\n🏭 Создаю ${toCreate.length} товаров...\n`);

  let created = 0;
  for (const product of toCreate) {
    const result = await createProduct(product, regionId);
    if (result) created++;
    // Пауза между запросами (Medusa rate limit)
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\n✅ Готово! Создано ${created} из ${toCreate.length} товаров.`);
  console.log("🌐 Откройте http://localhost:3001/catalog для просмотра.\n");
}

main().catch((err) => {
  console.error("💥 Ошибка:", err);
  process.exit(1);
});
