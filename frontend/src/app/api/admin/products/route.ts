/**
 * GET    /api/admin/products — список товаров (для админки)
 * DELETE /api/admin/products — удаление товара по id
 * PATCH  /api/admin/products — обновить цену товара
 * PUT    /api/admin/products — обновить запас товара
 */

import { NextRequest, NextResponse } from "next/server";

const MEDUSA_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";

async function medusaApi(
  method: string,
  path: string,
  token: string,
  body?: unknown
) {
  const opts: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${MEDUSA_URL}${path}`, opts);
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Medusa ${method} ${path} → ${res.status}: ${text.substring(0, 300)}`);
  }
  return text ? JSON.parse(text) : {};
}

/** GET — получить список товаров */
export async function GET(request: NextRequest) {
  const token = request.headers.get("x-admin-token");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await medusaApi(
      "GET",
      "/admin/products?limit=200&fields=*variants,*variants.prices",
      token
    );

    // Получаем все inventory items с уровнями запасов
    let inventoryMap: Record<string, number> = {};
    try {
      const invData = await medusaApi(
        "GET",
        "/admin/inventory-items?limit=500&fields=*location_levels",
        token
      );
      const invItems = invData?.inventory_items ?? [];
      for (const inv of invItems) {
        if (inv.sku) {
          const total = (inv.location_levels ?? []).reduce(
            (sum: number, lvl: { stocked_quantity?: number }) =>
              sum + (lvl.stocked_quantity ?? 0),
            0
          );
          inventoryMap[inv.sku] = total;
        }
      }
    } catch {
      // Если инвентарь недоступен — не блокируем
    }

    const products = (data.products ?? []).map(
      (p: {
        id: string;
        title: string;
        handle: string;
        status: string;
        created_at: string;
        metadata?: Record<string, unknown>;
        variants?: {
          id?: string;
          sku?: string;
          prices?: { amount: number; currency_code: string }[];
        }[];
      }) => {
        const variant = p.variants?.[0];
        const price = variant?.prices?.[0];
        const sku = variant?.sku || (p.metadata?.sku as string) || "";
        return {
          id: p.id,
          title: p.title,
          handle: p.handle,
          status: p.status,
          sku: sku || "—",
          variantId: variant?.id || "",
          price: price?.amount ?? 0,
          currency: price?.currency_code || "rub",
          fabric_type: (p.metadata?.fabric_type as string) || "",
          measurement_unit: (p.metadata?.measurement_unit as string) || "running_meter",
          inventory: sku ? (inventoryMap[sku] ?? null) : null,
          created_at: p.created_at,
        };
      }
    );

    // Сортировка по SKU
    products.sort((a: { sku: string }, b: { sku: string }) =>
      a.sku.localeCompare(b.sku, "ru", { numeric: true })
    );

    return NextResponse.json({ products, count: products.length });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

/** DELETE — удалить товар */
export async function DELETE(request: NextRequest) {
  const token = request.headers.get("x-admin-token");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { productId } = (await request.json()) as { productId: string };
    if (!productId) {
      return NextResponse.json({ error: "productId обязателен" }, { status: 400 });
    }

    const data = await medusaApi("DELETE", `/admin/products/${productId}`, token);
    return NextResponse.json({ success: true, id: data.id, deleted: data.deleted });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

/** PATCH — обновить цену товара */
export async function PATCH(request: NextRequest) {
  const token = request.headers.get("x-admin-token");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { productId, variantId, amount } = (await request.json()) as {
      productId: string;
      variantId: string;
      amount: number;
    };

    if (!productId || !variantId) {
      return NextResponse.json(
        { error: "productId и variantId обязательны" },
        { status: 400 }
      );
    }
    if (typeof amount !== "number" || amount < 0) {
      return NextResponse.json(
        { error: "amount должен быть неотрицательным числом" },
        { status: 400 }
      );
    }

    const data = await medusaApi(
      "POST",
      `/admin/products/${productId}/variants/${variantId}`,
      token,
      { prices: [{ amount: Math.round(amount), currency_code: "rub" }] }
    );

    return NextResponse.json({ success: true, variant: data.variant });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

/** PUT — обновить запас товара */
export async function PUT(request: NextRequest) {
  const token = request.headers.get("x-admin-token");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { sku, quantity } = (await request.json()) as {
      sku: string;
      quantity: number;
    };

    if (!sku) {
      return NextResponse.json({ error: "sku обязателен" }, { status: 400 });
    }
    if (typeof quantity !== "number" || quantity < 0) {
      return NextResponse.json(
        { error: "quantity должен быть неотрицательным числом" },
        { status: 400 }
      );
    }

    // Найти inventory item по SKU
    const invRes = await medusaApi(
      "GET",
      `/admin/inventory-items?sku=${encodeURIComponent(sku)}&fields=*location_levels`,
      token
    );
    const invItem = invRes?.inventory_items?.[0];
    if (!invItem) {
      return NextResponse.json(
        { error: `Inventory item для SKU "${sku}" не найден` },
        { status: 404 }
      );
    }

    // Найти существующий location level
    const levels = invItem.location_levels ?? [];
    if (levels.length === 0) {
      // Нет ни одного location level — нужно найти stock location
      const slRes = await medusaApi("GET", "/admin/stock-locations?limit=5", token);
      const slId = slRes?.stock_locations?.[0]?.id;
      if (!slId) {
        return NextResponse.json(
          { error: "Не найден stock location" },
          { status: 500 }
        );
      }
      await medusaApi(
        "POST",
        `/admin/inventory-items/${invItem.id}/location-levels`,
        token,
        { location_id: slId, stocked_quantity: Math.round(quantity) }
      );
    } else {
      // Обновляем первый location level
      const level = levels[0];
      await medusaApi(
        "POST",
        `/admin/inventory-items/${invItem.id}/location-levels/${level.location_id}`,
        token,
        { stocked_quantity: Math.round(quantity) }
      );
    }

    return NextResponse.json({ success: true, quantity: Math.round(quantity) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
