/**
 * Функции для работы с Medusa Checkout / Payment API.
 * Используются в клиентских компонентах при оформлении заказа.
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

// ============================================
// Типы
// ============================================

export interface CheckoutAddress {
  first_name: string;
  last_name: string;
  phone?: string;
  city: string;
  postal_code?: string;
  address_1: string;
  country_code: string;
}

export interface PaymentSession {
  id: string;
  provider_id: string;
  status: string;
  data: {
    id?: string;
    confirmation_url?: string;
    status?: string;
    session_id?: string;
    [key: string]: unknown;
  };
}

export interface CartWithPayment {
  id: string;
  email?: string;
  payment_collection?: {
    id: string;
    status: string;
    payment_sessions?: PaymentSession[];
  };
  items?: unknown[];
  total?: number;
  subtotal?: number;
}

export interface OrderResult {
  type: string;
  order?: {
    id: string;
    display_id: number;
    status: string;
    total: number;
  };
  cart?: CartWithPayment;
  error?: {
    message: string;
    [key: string]: unknown;
  };
}

// ============================================
// API функции
// ============================================

/**
 * Шаг 1: Добавить email к корзине.
 */
export async function updateCartEmail(
  cartId: string,
  email: string
): Promise<{ cart: CartWithPayment }> {
  const res = await fetch(`${MEDUSA_BACKEND_URL}/store/carts/${cartId}`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Не удалось обновить email: ${err}`);
  }
  return res.json();
}

/**
 * Шаг 2: Добавить адрес доставки к корзине.
 */
export async function updateCartAddress(
  cartId: string,
  shippingAddress: CheckoutAddress,
  billingAddress?: CheckoutAddress
): Promise<{ cart: CartWithPayment }> {
  const res = await fetch(`${MEDUSA_BACKEND_URL}/store/carts/${cartId}`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      shipping_address: shippingAddress,
      billing_address: billingAddress || shippingAddress,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Не удалось обновить адрес: ${err}`);
  }
  return res.json();
}

/**
 * Шаг 3: Инициализировать платёжную коллекцию.
 * Medusa v2: POST /store/payment-collections
 */
export async function initPaymentCollection(
  cartId: string
): Promise<{ payment_collection: { id: string } }> {
  const res = await fetch(
    `${MEDUSA_BACKEND_URL}/store/payment-collections`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ cart_id: cartId }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Не удалось создать платёжную коллекцию: ${err}`);
  }
  return res.json();
}

/**
 * Шаг 4: Инициализировать платёжную сессию (выбор провайдера).
 * Medusa v2: POST /store/payment-collections/:id/payment-sessions
 */
export async function initPaymentSession(
  paymentCollectionId: string,
  providerId: string
): Promise<{ payment_collection: { id: string; payment_sessions: PaymentSession[] } }> {
  const res = await fetch(
    `${MEDUSA_BACKEND_URL}/store/payment-collections/${paymentCollectionId}/payment-sessions`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        provider_id: providerId,
      }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Не удалось инициализировать платёж: ${err}`);
  }
  return res.json();
}

/**
 * Шаг 5: Завершить корзину → создать заказ.
 * Medusa v2: POST /store/carts/:id/complete
 */
export async function completeCart(
  cartId: string
): Promise<OrderResult> {
  const res = await fetch(
    `${MEDUSA_BACKEND_URL}/store/carts/${cartId}/complete`,
    {
      method: "POST",
      headers: getHeaders(),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Не удалось завершить заказ: ${err}`);
  }
  return res.json();
}

/**
 * Получить данные о заказе (для страницы успеха).
 */
export async function getOrder(
  orderId: string
): Promise<{ order: OrderResult["order"] }> {
  const res = await fetch(
    `${MEDUSA_BACKEND_URL}/store/orders/${orderId}`,
    {
      headers: getHeaders(),
    }
  );
  if (!res.ok) {
    throw new Error(`Не удалось получить заказ: ${res.status}`);
  }
  return res.json();
}
