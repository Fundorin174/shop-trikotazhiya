/**
 * ============================================
 * Seed-скрипт: тестовые данные тканей
 * ============================================
 *
 * Запуск: npx medusa db:seed
 * или:   npx ts-node src/scripts/seed-fabrics.ts
 *
 * Создаёт несколько тестовых товаров-тканей для проверки каталога.
 */

// Тестовые данные тканей
const SEED_FABRICS = [
  {
    // Публичные данные (витрина)
    public: {
      sku: "TK-COT-001",
      name: "Бязь отбелённая ГОСТ",
      fabric_type: "cotton",
      composition: "100% хлопок, 142 г/м²",
      quality: "Первый сорт, ГОСТ 29298-2005",
      width_cm: 150,
      unit_price: 25000, // 250 ₽ за метр
      measurement_unit: "meter",
      stock_quantity: 500,
      country: "Россия",
      collection_name: "Базовые ткани",
      color: "Белый",
      color_hex: "#FFFFFF",
      short_description: "Натуральная хлопковая бязь для постельного белья и пошива одежды.",
      full_description:
        "Бязь отбелённая ГОСТ — плотная хлопчатобумажная ткань полотняного переплетения. " +
        "Идеально подходит для пошива постельного белья, наволочек, простыней, детской одежды. " +
        "Плотность 142 г/м², ширина 150 см. Россия.",
    },
    // Приватные данные (админка)
    supplier: {
      purchase_price: 12000, // 120 ₽ — закупочная цена
      supplier_name: "ООО «ТканьОпт»",
      supplier_website: "https://tkanopt.ru",
      supplier_contacts: "Иванов И.И., +7 (495) 123-45-67, zakaz@tkanopt.ru",
      internal_notes: "Минимальный заказ — 100 метров. Срок поставки 5-7 дней.",
    },
  },
  {
    public: {
      sku: "TK-SLK-002",
      name: "Шёлк натуральный Армани",
      fabric_type: "silk",
      composition: "100% шёлк, 90 г/м²",
      quality: "Премиум",
      width_cm: 140,
      unit_price: 180000, // 1800 ₽
      measurement_unit: "meter",
      stock_quantity: 50,
      country: "Италия",
      collection_name: "Премиум коллекция",
      color: "Бордовый",
      color_hex: "#8B0000",
      short_description: "Итальянский натуральный шёлк для вечерних нарядов.",
      full_description:
        "Роскошный натуральный шёлк из Италии. Нежная, гладкая текстура с благородным блеском. " +
        "Подходит для пошива вечерних платьев, блузок и элегантных аксессуаров.",
    },
    supplier: {
      purchase_price: 95000,
      supplier_name: "Tessuti Italiani S.r.l.",
      supplier_website: "https://tessutitaliani.it",
      supplier_contacts: "Marco Rossi, marco@tessutitaliani.it",
    },
  },
  {
    public: {
      sku: "TK-KNT-003",
      name: "Кулирка с лайкрой",
      fabric_type: "knit",
      composition: "92% хлопок, 8% эластан, 180 г/м²",
      quality: "Премиум, пенье",
      width_cm: 180,
      unit_price: 45000, // 450 ₽
      measurement_unit: "meter",
      stock_quantity: 300,
      country: "Турция",
      collection_name: "Трикотаж",
      color: "Тёмно-синий",
      color_hex: "#1B1B6F",
      discount_percent: 10,
      short_description: "Мягкая кулирка с лайкрой для футболок и детской одежды.",
      full_description:
        "Высококачественная кулирная гладь с добавлением эластана. Пенье — из длинноволокнистого хлопка. " +
        "Не скатывается, не деформируется после стирки. Идеальна для футболок, платьев, детской одежды.",
    },
    supplier: {
      purchase_price: 22000,
      supplier_name: "Kumaş Tekstil A.Ş.",
      supplier_website: "https://kumastekstil.com.tr",
      supplier_contacts: "Ahmet Yılmaz, +90 212 555 12 34",
    },
  },
  {
    public: {
      sku: "TK-LIN-004",
      name: "Лён костюмный",
      fabric_type: "linen",
      composition: "100% лён, 200 г/м²",
      quality: "Первый сорт",
      width_cm: 150,
      unit_price: 85000, // 850 ₽
      measurement_unit: "meter",
      stock_quantity: 120,
      country: "Беларусь",
      collection_name: "Лён & Хлопок",
      color: "Натуральный",
      color_hex: "#C8B89A",
      short_description: "Натуральный белорусский лён для костюмов и рубашек.",
      full_description:
        "Плотный льняной материал из Беларуси. Идеален для пошива летних костюмов, рубашек и брюк. " +
        "Натуральная терморегуляция — прохладно в жару, тепло в прохладу. Ширина 150 см.",
      video_url: "https://youtube.com/watch?v=example",
    },
    supplier: {
      purchase_price: 42000,
      supplier_name: "Оршанский льнокомбинат",
      supplier_website: "https://linen.by",
      supplier_contacts: "Отдел продаж, +375 216 51-24-10",
    },
  },
  {
    public: {
      sku: "TK-WOL-005",
      name: "Шерсть костюмная итальянская",
      fabric_type: "wool",
      composition: "95% шерсть, 5% эластан, 260 г/м²",
      quality: "Super 120s",
      width_cm: 155,
      unit_price: 250000, // 2500 ₽
      measurement_unit: "meter",
      stock_quantity: 30,
      country: "Италия",
      collection_name: "Премиум коллекция",
      color: "Графит",
      color_hex: "#383838",
      short_description: "Итальянская костюмная шерсть Super 120s.",
      full_description:
        "Шерстяная ткань категории Super 120s — из тончайших волокон мериноса. " +
        "С лёгким добавлением эластана для комфорта. Для пошива мужских и женских костюмов премиум-класса.",
    },
    supplier: {
      purchase_price: 135000,
      supplier_name: "Lanificio Fratelli Cerruti",
      supplier_website: "https://cerruti.it",
      supplier_contacts: "export@cerruti.it",
      internal_notes: "Минимальный заказ 50 метров. Предоплата 100%.",
    },
  },
];

export default SEED_FABRICS;
