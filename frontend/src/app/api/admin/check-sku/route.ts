/**
 * GET /api/admin/check-sku?sku=XXX
 *
 * Проверяет, существует ли товар с указанным SKU.
 * Возвращает данные найденного товара или { exists: false }.
 */

import { NextRequest, NextResponse } from "next/server";
import { medusaApi } from "@/lib/admin/medusa-api";

export async function GET(request: NextRequest) {
  const token = request.headers.get("x-admin-token");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sku = request.nextUrl.searchParams.get("sku")?.trim();
  if (!sku) {
    return NextResponse.json({ error: "sku обязателен" }, { status: 400 });
  }

  try {
    // Ищем товар через inventory items по SKU
    const invRes = await medusaApi(
      "GET",
      `/admin/inventory-items?sku=${encodeURIComponent(sku)}`,
      token,
    );
    const invItem = invRes?.inventory_items?.[0];

    if (!invItem) {
      return NextResponse.json({ exists: false });
    }

    // Находим product по variant SKU
    const productsRes = await medusaApi(
      "GET",
      `/admin/products?limit=200&fields=*variants,*variants.prices`,
      token,
    );
    const products = productsRes?.products ?? [];
    const found = products.find(
      (p: { variants?: { sku?: string }[] }) =>
        p.variants?.some((v: { sku?: string }) => v.sku === sku),
    );

    if (!found) {
      return NextResponse.json({ exists: false });
    }

    return NextResponse.json({
      exists: true,
      product: {
        id: found.id,
        title: found.title,
        handle: found.handle,
        sku,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
