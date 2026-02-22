/**
 * Одноразовый скрипт: создание inventory levels для всех товаров.
 *
 * Запуск:  node scripts/fix-inventory.mjs
 *
 * Проблема: seed-products.mjs создавал товары с manage_inventory: true,
 * но не создавал inventory levels (stocked_quantity).
 * Этот скрипт находит все inventory items и устанавливает
 * stocked_quantity на основе SKU.
 */

const BASE_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@trikotazhiya.ru";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const STOCK_LOCATION_ID = process.env.STOCK_LOCATION_ID || "sloc_01KJ0C2S3ETR2JNVB7HFD3D2ZN";

if (!ADMIN_PASSWORD) {
  console.error("❌ Задайте ADMIN_PASSWORD через переменную окружения!");
  console.error("   Пример: ADMIN_PASSWORD=your_password node scripts/fix-inventory.mjs");
  process.exit(1);
}

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
    console.error(text.substring(0, 300));
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
  console.log("✅ Авторизация успешна\n");
}

// Соответствие SKU → стоковое количество
// Ткани: в сантиметрах (метры × 100)
// Штучные: в штуках
const SKU_INVENTORY = {
  "TK-KUL-001": 30000,  // 300 м
  "TK-FTR-002": 20000,  // 200 м
  "00184":      20000,  // 200 м (Футер — SKU изменён вручную)
  "TK-KAP-003": 15000,  // 150 м (в БД как TK-KAP-003)
  "TK-KPT-003": 15000,  // 150 м (в сиде как TK-KPT-003)
  "TK-KSH-004": 25000,  // 250 м
  "TK-PIK-005": 18000,  // 180 м
  "TK-RIB-006": 40000,  // 400 м
  "TK-INT-007": 22000,  // 220 м
  "TK-KUP-008": 80,     // 80 шт.
  "TK-VYA-009": 6000,   // 60 м (в БД как TK-VYA-009)
  "TK-VYZ-009": 6000,   // 60 м (в сиде как TK-VYZ-009)
  "TK-TRM-010": 35000,  // 350 м
  "TK-DZH-011": 9000,   // 90 м
  "TK-FUR-012": 500,    // 500 шт.
};

async function main() {
  console.log("🔧 Скрипт исправления инвентаря\n");
  await authenticate();

  // 1. Проверить, что склад существует
  const locRes = await api("GET", `/admin/stock-locations/${STOCK_LOCATION_ID}`);
  if (!locRes) {
    console.error(`❌ Склад ${STOCK_LOCATION_ID} не найден!`);
    process.exit(1);
  }
  console.log(`📍 Склад: ${locRes.stock_location.name}\n`);

  // 2. Получить все продукты с вариантами
  const prodRes = await api("GET", "/admin/products?limit=100");
  const products = prodRes?.products || [];
  console.log(`🛍️  Товаров в базе: ${products.length}`);

  // 3. Получить все inventory items
  const invRes = await api("GET", "/admin/inventory-items?limit=100");
  if (!invRes) {
    console.error("❌ Не удалось получить inventory items");
    process.exit(1);
  }

  const invItems = invRes.inventory_items || [];
  const invBySku = {};
  for (const item of invItems) {
    if (item.sku) invBySku[item.sku] = item;
  }
  console.log(`📦 Inventory items: ${invItems.length}\n`);

  let fixed = 0;
  let created = 0;

  // 4. Для каждого продукта проверить/создать инвентарь
  for (const product of products) {
    const variant = product.variants?.[0];
    if (!variant) continue;

    const sku = variant.sku || "—";
    const targetQty = SKU_INVENTORY[sku];

    if (targetQty == null) {
      console.log(`  ⏭️  ${sku} — не в списке, пропускаю`);
      continue;
    }

    let invItem = invBySku[sku];

    // Если нет inventory item — создать
    if (!invItem) {
      console.log(`  ⚠️  ${sku}: нет inventory item, создаю...`);
      const newInv = await api("POST", "/admin/inventory-items", {
        sku: sku,
        title: product.title,
        requires_shipping: true,
      });
      if (!newInv) {
        console.error(`  ❌ Не удалось создать inventory item для ${sku}`);
        continue;
      }
      invItem = newInv.inventory_item;
      console.log(`  ✅ Inventory item создан: ${invItem.id}`);

      // Привязать к варианту
      const linkBody = { inventory_item_id: invItem.id, required_quantity: 1 };
      const linkRes = await api("POST", `/admin/inventory-items/${invItem.id}/location-levels`, {
        location_id: STOCK_LOCATION_ID,
        stocked_quantity: targetQty,
      });
      if (linkRes) {
        console.log(`  📦 Location level создан: stocked_quantity = ${targetQty}`);
      }
      created++;
      await new Promise((r) => setTimeout(r, 300));
      continue;
    }

    // Проверить location levels
    const levelsRes = await api("GET", `/admin/inventory-items/${invItem.id}/location-levels`);
    const levels = levelsRes?.inventory_levels ?? [];
    const existing = levels.find((l) => l.location_id === STOCK_LOCATION_ID);

    if (existing) {
      if (existing.stocked_quantity === targetQty) {
        console.log(`  ✅ ${sku}: уже ${targetQty}, ОК`);
        continue;
      }
      // Обновить — используем batch endpoint
      const upd = await api("POST", `/admin/inventory-items/${invItem.id}/location-levels/batch`, {
        update: [{ location_id: STOCK_LOCATION_ID, stocked_quantity: targetQty }],
      });
      if (upd) {
        console.log(`  📦 ${sku}: обновлён ${existing.stocked_quantity} → ${targetQty}`);
        fixed++;
      } else {
        // Fallback: delete + create
        await api("DELETE", `/admin/inventory-items/${invItem.id}/location-levels/${STOCK_LOCATION_ID}`);
        await api("POST", `/admin/inventory-items/${invItem.id}/location-levels`, {
          location_id: STOCK_LOCATION_ID,
          stocked_quantity: targetQty,
        });
        console.log(`  📦 ${sku}: пересоздан level, stocked_quantity = ${targetQty}`);
        fixed++;
      }
    } else {
      // Создать level
      const cr = await api("POST", `/admin/inventory-items/${invItem.id}/location-levels`, {
        location_id: STOCK_LOCATION_ID,
        stocked_quantity: targetQty,
      });
      if (cr) {
        console.log(`  📦 ${sku}: создан level, stocked_quantity = ${targetQty}`);
        created++;
      }
    }

    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\n✅ Готово! Создано: ${created}, обновлено: ${fixed}`);
}

main().catch((err) => {
  console.error("💥 Ошибка:", err);
  process.exit(1);
});
