/**
 * GET /api/admin/products/[id] — получить полные данные товара для редактирования
 *
 * Возвращает товар в формате, совместимом с формой AddProductForm.
 */

import { NextRequest, NextResponse } from "next/server";
import { medusaApi } from "@/lib/admin/medusa-api";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const token = request.headers.get("x-admin-token");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: "id обязателен" }, { status: 400 });
  }

  try {
    // Получаем продукт с вариантами, ценами и изображениями
    const data = await medusaApi(
      "GET",
      `/admin/products/${id}?fields=*variants,*variants.prices,*images`,
      token,
    );

    const product = data.product;
    if (!product) {
      return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
    }

    const variant = product.variants?.[0];
    const price = variant?.prices?.[0];
    const meta = product.metadata ?? {};
    const unit = (meta.measurement_unit as string) || "running_meter";

    // Конвертируем цену обратно в рубли за метр/штуку
    let priceRub = 0;
    if (price?.amount) {
      priceRub =
        unit === "running_meter" ? price.amount : price.amount / 100;
    }

    // Получаем запас (inventory) по SKU
    let inventory: number | null = null;
    const sku = variant?.sku || (meta.sku as string) || "";
    if (sku) {
      try {
        const invRes = await medusaApi(
          "GET",
          `/admin/inventory-items?sku=${encodeURIComponent(sku)}&fields=*location_levels`,
          token,
        );
        const invItem = invRes?.inventory_items?.[0];
        if (invItem) {
          inventory = (invItem.location_levels ?? []).reduce(
            (sum: number, lvl: { stocked_quantity?: number }) =>
              sum + (lvl.stocked_quantity ?? 0),
            0,
          );
        }
      } catch {
        // Если инвентарь недоступен — не блокируем
      }
    }

    // Формируем ответ в формате, совместимом с EMPTY_FORM
    const formData = {
      title: product.title || "",
      sku,
      handle: product.handle || "",
      price: String(priceRub),
      fabric_type: (meta.fabric_type as string) || "",
      composition: (meta.composition as string) || "",
      width_cm: meta.width_cm != null ? String(meta.width_cm) : "",
      measurement_unit: unit as "running_meter" | "piece",
      inventory: inventory != null ? String(inventory) : "",
      description: product.description || "",
      subtitle: product.subtitle || "",
      color: (meta.color as string) || "",
      color_hex: (meta.color_hex as string) || "",
      country: (meta.country as string) || "",
      quality: (meta.quality as string) || "",
      collection_name: (meta.collection_name as string) || "",
      video_url: (meta.video_url as string) || "",
      min_order: meta.min_order != null ? String(meta.min_order) : "",
      order_step: meta.order_step != null ? String(meta.order_step) : "",
      short_description: (meta.short_description as string) || "",
      full_description: (meta.full_description as string) || "",
      discount_percent:
        meta.discount_percent != null ? String(meta.discount_percent) : "",
      discount_amount:
        meta.discount_amount != null ? String(meta.discount_amount) : "",
    };

    // Собираем URL изображений
    const imageUrls: string[] = [];
    if (product.thumbnail) imageUrls.push(product.thumbnail);
    for (const img of product.images ?? []) {
      if (img.url && !imageUrls.includes(img.url)) {
        imageUrls.push(img.url);
      }
    }

    return NextResponse.json({
      product: formData,
      imageUrls,
      productId: product.id,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
