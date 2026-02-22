/**
 * ============================================
 * СДЭК API v2 Client
 * ============================================
 *
 * Клиент для работы с CDEK API v2 (OAuth 2.0).
 * Документация: https://api-docs.cdek.ru/29923741.html
 *
 * Env:
 *   CDEK_CLIENT_ID     — идентификатор клиента
 *   CDEK_CLIENT_SECRET — секрет клиента
 *   CDEK_BASE_URL      — https://api.edu.cdek.ru/v2 (тест) / https://api.cdek.ru/v2 (прод)
 *   CDEK_FROM_CITY_CODE — код города отправления (по умолч. 44 = Москва)
 */

// ============================================
// Типы
// ============================================

export interface CdekCity {
  code: number;
  city: string;
  fias_guid?: string;
  country_code: string;
  region: string;
  sub_region?: string;
}

export interface CdekDeliveryPoint {
  code: string;
  name: string;
  location: {
    country_code: string;
    region_code: number;
    region: string;
    city_code: number;
    city: string;
    postal_code?: string;
    address: string;
    address_full: string;
    latitude: number;
    longitude: number;
  };
  work_time: string;
  phones?: Array<{ number: string }>;
  type: "PVZ" | "POSTAMAT";
  owner_code: string;
  nearest_station?: string;
  nearest_metro_station?: string;
  have_cashless: boolean;
  have_cash: boolean;
  is_dressing_room: boolean;
  dimensions?: Array<{ width: number; height: number; depth: number }>;
}

export interface CdekTariff {
  tariff_code: number;
  tariff_name: string;
  tariff_description?: string;
  delivery_mode: number;
  delivery_sum: number;
  period_min: number;
  period_max: number;
  calendar_min?: number;
  calendar_max?: number;
}

export interface CdekCalculateResult {
  tariff_codes: CdekTariff[];
}

/** Ответ СДЭК OAuth2 /oauth/token */
interface CdekOAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  jti: string;
}

// ============================================
// Конфигурация
// ============================================

const CDEK_BASE_URL =
  process.env.CDEK_BASE_URL || "https://api.edu.cdek.ru/v2";
const CDEK_CLIENT_ID = process.env.CDEK_CLIENT_ID || "";
const CDEK_CLIENT_SECRET = process.env.CDEK_CLIENT_SECRET || "";

/** Код города отправления (по умолчанию 44 = Москва) */
const FROM_CITY_CODE = parseInt(process.env.CDEK_FROM_CITY_CODE || "44", 10);

if (!CDEK_CLIENT_ID || !CDEK_CLIENT_SECRET) {
  console.warn(
    "[CDEK] CDEK_CLIENT_ID / CDEK_CLIENT_SECRET не заданы. " +
    "Доставка СДЭК не будет работать. " +
    "Зарегистрируйтесь на https://lk.cdek.ru и укажите ключи в .env"
  );
}

// ============================================
// OAuth2 Token Management
// ============================================

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getToken(): Promise<string> {
  if (!CDEK_CLIENT_ID || !CDEK_CLIENT_SECRET) {
    throw new Error(
      "Ключи СДЭК не настроены. Укажите CDEK_CLIENT_ID и CDEK_CLIENT_SECRET в переменных окружения"
    );
  }

  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: CDEK_CLIENT_ID,
    client_secret: CDEK_CLIENT_SECRET,
  });

  const res = await fetch(`${CDEK_BASE_URL}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`CDEK OAuth error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as CdekOAuthResponse;
  cachedToken = data.access_token;
  tokenExpiresAt = now + data.expires_in * 1000;
  return cachedToken!;
}

// ============================================
// HTTP helpers
// ============================================

async function cdekGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const token = await getToken();
  const url = new URL(`${CDEK_BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`CDEK GET ${path} → ${res.status}: ${text}`);
  }

  return (await res.json()) as T;
}

async function cdekPost<T>(path: string, body: unknown): Promise<T> {
  const token = await getToken();

  const res = await fetch(`${CDEK_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`CDEK POST ${path} → ${res.status}: ${text}`);
  }

  return (await res.json()) as T;
}

// ============================================
// Public API
// ============================================

/**
 * Поиск городов СДЭК по названию.
 */
export async function searchCities(name: string): Promise<CdekCity[]> {
  return cdekGet<CdekCity[]>("/location/cities", {
    city: name,
    country_codes: "RU",
    size: "10",
  });
}

/**
 * Получение списка ПВЗ по коду города.
 */
export async function getDeliveryPoints(
  cityCode: number
): Promise<CdekDeliveryPoint[]> {
  return cdekGet<CdekDeliveryPoint[]>("/deliverypoints", {
    city_code: String(cityCode),
    type: "PVZ",
    is_handout: "true",
  });
}

/**
 * Расчёт стоимости доставки (тарифы «склад-склад» для ПВЗ).
 *
 * Тарифы:
 *   136 — Посылка склад-склад
 *   234 — Экономичная посылка склад-склад
 */
export async function calculateDelivery(
  toCityCode: number,
  packages?: Array<{ weight: number; length: number; width: number; height: number }>
): Promise<CdekTariff[]> {
  const defaultPackage = { weight: 1000, length: 30, width: 20, height: 10 };

  const body = {
    from_location: { code: FROM_CITY_CODE },
    to_location: { code: toCityCode },
    packages: packages && packages.length > 0 ? packages : [defaultPackage],
    tariff_code: 136,
  };

  // Пробуем основной тариф 136, если нет — 234
  try {
    const result = await cdekPost<{
      delivery_sum: number;
      period_min: number;
      period_max: number;
      currency: string;
      total_sum: number;
    }>("/calculator/tariff", body);

    return [
      {
        tariff_code: 136,
        tariff_name: "Посылка",
        delivery_mode: 2,
        delivery_sum: result.total_sum ?? result.delivery_sum,
        period_min: result.period_min,
        period_max: result.period_max,
      },
    ];
  } catch {
    // Пробуем экономичный тариф
    try {
      const result = await cdekPost<{
        delivery_sum: number;
        period_min: number;
        period_max: number;
        currency: string;
        total_sum: number;
      }>("/calculator/tariff", { ...body, tariff_code: 234 });

      return [
        {
          tariff_code: 234,
          tariff_name: "Экономичная посылка",
          delivery_mode: 2,
          delivery_sum: result.total_sum ?? result.delivery_sum,
          period_min: result.period_min,
          period_max: result.period_max,
        },
      ];
    } catch {
      return [];
    }
  }
}

/**
 * Код города отправления (для информации на фронтенде).
 */
export function getFromCityCode(): number {
  return FROM_CITY_CODE;
}
