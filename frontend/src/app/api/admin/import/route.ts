/**
 * POST /api/admin/import
 *
 * Серверный роут для импорта товаров в Medusa.
 * Принимает JSON с массивом товаров + токен авторизации.
 *
 * Логика:
 *  1. Аутентификация через переданный JWT-токен
 *  2. Получение sales channel и stock location
 *  3. Создание каждого товара через Medusa Admin API
 *  4. Настройка инвентаря (stocked_quantity)
 *  5. Возврат результатов по каждому товару
 */

import { NextRequest, NextResponse } from "next/server";
import { medusaApi, transliterate } from "@/lib/admin/medusa-api";
import type { ImportProduct, ImportResult } from "@/types/admin";

// ============================================
// POST handler
// ============================================

export async function POST(request: NextRequest) {
  try {
    const { token, products, salesChannelId, stockLocationId } =
      (await request.json()) as {
        token: string;
        products: ImportProduct[];
        salesChannelId?: string;
        stockLocationId?: string;
      };

    if (!token) {
      return NextResponse.json(
        { error: "Не передан токен авторизации" },
        { status: 401 }
      );
    }

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: "Массив products пуст или отсутствует" },
        { status: 400 }
      );
    }

    // ---- Определяем Sales Channel ----
    let scId = salesChannelId;
    if (!scId) {
      const scRes = await medusaApi("GET", "/admin/sales-channels?limit=10", token);
      // Ищем Trikotazhiya Storefront, иначе берём первый не-default канал
      const channels = scRes?.sales_channels ?? [];
      const storefront = channels.find(
        (sc: { name: string }) =>
          sc.name.toLowerCase().includes("trikotazhiya") ||
          sc.name.toLowerCase().includes("storefront")
      );
      scId = storefront?.id || channels[0]?.id;
      if (!scId) {
        return NextResponse.json(
          { error: "Sales Channel не найден. Создайте его в Medusa Admin." },
          { status: 400 }
        );
      }
    }

    // ---- Определяем Stock Location ----
    let slId = stockLocationId;
    if (!slId) {
      const slRes = await medusaApi("GET", "/admin/stock-locations?limit=1", token);
      slId = slRes?.stock_locations?.[0]?.id;
      if (!slId) {
        return NextResponse.json(
          { error: "Stock Location не найден. Создайте склад в Medusa Admin." },
          { status: 400 }
        );
      }
    }

    // ---- Проверяем существующие handle (идемпотентность) ----
    const existingRes = await medusaApi("GET", "/admin/products?limit=200", token);
    const existingHandles = new Set(
      (existingRes?.products ?? []).map((p: { handle: string }) => p.handle)
    );

    // ---- Импортируем товары ----
    const results: ImportResult[] = [];

    for (const item of products) {
      const handle = item.handle || transliterate(item.title);

      // Проверка дубликата
      if (existingHandles.has(handle)) {
        results.push({
          sku: item.sku,
          title: item.title,
          success: false,
          message: `Товар с handle «${handle}» уже существует. Пропущен.`,
        });
        continue;
      }

      try {
        const unit = item.measurement_unit || "running_meter";
        // Цена: Medusa хранит цену за 1 СМ в КОПЕЙКАХ (minor units)
        // Фронт при отображении умножает на 100 (pricePerCmToPerMeter)
        // Пользователь в файле указывает цену за МЕТР в РУБЛЯХ
        // Конвертируем: рубли → копейки (*100), метр → 1 см (/100)
        // Итого: price_kopecks_per_cm = price_rub * 100 / 100 = price_rub
        const priceKopecks =
          unit === "running_meter"
            ? Math.round(item.price) // цена за 1 см в копейках = цена за метр в рублях
            : Math.round(item.price * 100); // штучная цена в копейках

        // Подготовка metadata
        const metadata: Record<string, unknown> = {
          sku: item.sku,
          fabric_type: item.fabric_type,
          composition: item.composition,
          quality: item.quality || "",
          width_cm: item.width_cm,
          measurement_unit: unit,
          min_order: item.min_order ?? (unit === "running_meter" ? 0.5 : 1),
          order_step: item.order_step ?? (unit === "running_meter" ? 0.1 : 1),
          country: item.country || "",
          collection_name: item.collection_name || "",
          color: item.color || "",
          color_hex: item.color_hex || "",
          short_description: item.short_description || "",
          full_description: item.full_description || item.description || "",
        };
        if (item.video_url) metadata.video_url = item.video_url;
        if (item.discount_percent) metadata.discount_percent = item.discount_percent;
        if (item.discount_amount) metadata.discount_amount = item.discount_amount;

        // Подготовка данных для Medusa
        const variantTitle =
          unit === "running_meter" ? "По метражу" : "Штука";
        const optionValue =
          unit === "running_meter" ? "1 метр" : "1 шт.";

        const productData: Record<string, unknown> = {
          title: item.title,
          handle,
          subtitle: item.subtitle || "",
          description: item.description || "",
          status: "published",
          is_giftcard: false,
          metadata,
          sales_channels: [{ id: scId }],
          options: [{ title: "Единица", values: [optionValue] }],
          variants: [
            {
              title: variantTitle,
              sku: item.sku,
              manage_inventory: true,
              prices: [{ amount: priceKopecks, currency_code: "rub" }],
              options: { Единица: optionValue },
            },
          ],
        };

        if (item.thumbnail) {
          productData.thumbnail = item.thumbnail;
        }
        if (item.images && item.images.length > 0) {
          productData.images = item.images.map((url) => ({ url }));
        }

        // Создаём продукт
        const createRes = await medusaApi("POST", "/admin/products", token, productData);
        const product = createRes.product;

        // Настройка инвентаря
        if (item.inventory != null && item.inventory > 0) {
          const variant = product.variants?.[0];
          if (variant) {
            const invRes = await medusaApi(
              "GET",
              `/admin/inventory-items?sku=${encodeURIComponent(variant.sku)}`,
              token
            );
            const invItem = invRes?.inventory_items?.[0];
            if (invItem) {
              const levelsRes = await medusaApi(
                "GET",
                `/admin/inventory-items/${invItem.id}/location-levels`,
                token
              );
              const existing = levelsRes?.inventory_levels?.find(
                (l: { location_id: string }) => l.location_id === slId
              );

              if (existing) {
                await medusaApi(
                  "POST",
                  `/admin/inventory-items/${invItem.id}/location-levels/${existing.id}`,
                  token,
                  { stocked_quantity: item.inventory }
                );
              } else {
                await medusaApi(
                  "POST",
                  `/admin/inventory-items/${invItem.id}/location-levels`,
                  token,
                  { location_id: slId, stocked_quantity: item.inventory }
                );
              }
            }
          }
        }

        existingHandles.add(handle);
        results.push({
          sku: item.sku,
          title: item.title,
          success: true,
          message: "Создан успешно",
          productId: product.id,
        });
      } catch (err) {
        results.push({
          sku: item.sku,
          title: item.title,
          success: false,
          message: err instanceof Error ? err.message : String(err),
        });
      }

      // Пауза между запросами (rate limit)
      await new Promise((r) => setTimeout(r, 400));
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      summary: { total: products.length, created: successCount, failed: failCount },
      results,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
