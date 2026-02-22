import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { calculateDelivery } from "../../../../modules/cdek/client";

/**
 * GET /store/cdek/calculate?city_code=44
 *
 * Расчёт стоимости доставки СДЭК до города (тариф склад-склад).
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { city_code } = req.query as Record<string, string>;

  if (!city_code) {
    return res.status(400).json({ message: "Укажите параметр city_code" });
  }

  const code = parseInt(city_code, 10);
  if (isNaN(code)) {
    return res.status(400).json({ message: "city_code должен быть числом" });
  }

  try {
    const tariffs = await calculateDelivery(code);
    return res.json({ tariffs });
  } catch (err) {
    const message = err instanceof Error ? err.message : "CDEK API error";
    console.error("[CDEK calculate]", message);
    return res.status(502).json({ message });
  }
}
