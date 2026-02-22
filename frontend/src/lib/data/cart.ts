/**
 * Функции для работы с Medusa Cart API.
 * Используются в клиентских компонентах.
 */

const MEDUSA_BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";

const MEDUSA_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (MEDUSA_PUBLISHABLE_KEY) {
    headers["x-publishable-api-key"] = MEDUSA_PUBLISHABLE_KEY;
  }
  return headers;
}

/**
 * Создать новую корзину.
 */
export async function createCart(): Promise<{ cart: MedusaCart }> {
  const res = await fetch(`${MEDUSA_BACKEND_URL}/store/carts`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error(`Create cart failed: ${res.status}`);
  return res.json();
}

/**
 * Получить корзину по ID.
 */
export async function getCart(cartId: string): Promise<{ cart: MedusaCart }> {
  const res = await fetch(`${MEDUSA_BACKEND_URL}/store/carts/${cartId}`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`Get cart failed: ${res.status}`);
  return res.json();
}

/**
 * Добавить товар в корзину.
 * Для тканей (running_meter): quantity=1, реальные метры хранятся в metadata.
 * Для штучных товаров: quantity = кол-во штук.
 */
export async function addLineItem(
  cartId: string,
  variantId: string,
  quantity: number,
  metadata?: Record<string, unknown>
): Promise<{ cart: MedusaCart }> {
  const res = await fetch(
    `${MEDUSA_BACKEND_URL}/store/carts/${cartId}/line-items`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        variant_id: variantId,
        quantity,
        ...(metadata ? { metadata } : {}),
      }),
    }
  );
  if (!res.ok) throw new Error(`Add line item failed: ${res.status}`);
  return res.json();
}

/**
 * Обновить количество / metadata строки в корзине.
 */
export async function updateLineItem(
  cartId: string,
  lineItemId: string,
  quantity: number,
  metadata?: Record<string, unknown>
): Promise<{ cart: MedusaCart }> {
  const res = await fetch(
    `${MEDUSA_BACKEND_URL}/store/carts/${cartId}/line-items/${lineItemId}`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ quantity, ...(metadata ? { metadata } : {}) }),
    }
  );
  if (!res.ok) throw new Error(`Update line item failed: ${res.status}`);
  return res.json();
}

/**
 * Удалить строку из корзины.
 * Medusa v2 DELETE возвращает { id, object, deleted, parent } — не cart.
 * Поэтому после удаления перезапрашиваем корзину.
 */
export async function removeLineItem(
  cartId: string,
  lineItemId: string
): Promise<{ cart: MedusaCart }> {
  const res = await fetch(
    `${MEDUSA_BACKEND_URL}/store/carts/${cartId}/line-items/${lineItemId}`,
    {
      method: "DELETE",
      headers: getHeaders(),
    }
  );
  if (!res.ok) throw new Error(`Remove line item failed: ${res.status}`);
  // После удаления получаем актуальную корзину
  return getCart(cartId);
}

/**
 * Получить URL первого изображения товара по product_id.
 * Используется для обогащения корзины актуальными фото.
 */
export async function fetchProductImage(productId: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${MEDUSA_BACKEND_URL}/store/products/${productId}?fields=thumbnail,*images`,
      { headers: getHeaders() }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const product = data.product;
    return product?.thumbnail || product?.images?.[0]?.url || null;
  } catch {
    return null;
  }
}

// ============================================
// Типы Medusa Cart API (Store)
// ============================================

export interface MedusaCartLineItem {
  id: string;
  title: string;
  variant_id: string;
  product_id: string;
  product_title: string;
  product_handle: string;
  thumbnail: string | null;
  quantity: number;        // Для тканей — в сантиметрах, для штучных — в штуках
  unit_price: number;      // Для тканей — цена за 1 см (копейки), для штучных — за 1 шт.
  subtotal: number;
  total: number;
  metadata?: {
    measurement_unit?: string;   // "running_meter" | "piece"
    [key: string]: unknown;
  } | null;
}

export interface MedusaCart {
  id: string;
  items?: MedusaCartLineItem[];
  subtotal?: number;
  discount_total?: number;
  shipping_total?: number;
  tax_total?: number;
  total?: number;
  item_total?: number;
}
