/**
 * Функции для работы с СДЭК API через бэкенд.
 */

const MEDUSA_BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";

const PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";

function getHeaders(): Record<string, string> {
  const h: Record<string, string> = {};
  if (PUBLISHABLE_KEY) h["x-publishable-api-key"] = PUBLISHABLE_KEY;
  return h;
}

// ============================================
// Типы
// ============================================

export interface CdekCity {
  code: number;
  city: string;
  region: string;
  country_code: string;
  sub_region?: string;
}

export interface CdekPvzPoint {
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
  have_cashless: boolean;
  have_cash: boolean;
  is_dressing_room: boolean;
}

export interface CdekTariff {
  tariff_code: number;
  tariff_name: string;
  delivery_sum: number;
  period_min: number;
  period_max: number;
}

// ============================================
// API
// ============================================

/**
 * Поиск городов СДЭК.
 */
export async function fetchCdekCities(name: string): Promise<CdekCity[]> {
  const res = await fetch(
    `${MEDUSA_BACKEND_URL}/store/cdek/cities?name=${encodeURIComponent(name)}`,
    { headers: getHeaders() }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.cities ?? [];
}

/**
 * Получение ПВЗ по коду города.
 */
export async function fetchCdekPvz(cityCode: number): Promise<CdekPvzPoint[]> {
  const res = await fetch(
    `${MEDUSA_BACKEND_URL}/store/cdek/pvz?city_code=${cityCode}`,
    { headers: getHeaders() }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.points ?? [];
}

/**
 * Расчёт стоимости доставки.
 */
export async function fetchCdekCalculation(
  cityCode: number
): Promise<CdekTariff[]> {
  const res = await fetch(
    `${MEDUSA_BACKEND_URL}/store/cdek/calculate?city_code=${cityCode}`,
    { headers: getHeaders() }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.tariffs ?? [];
}
