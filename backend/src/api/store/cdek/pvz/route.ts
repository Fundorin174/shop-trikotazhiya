import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { getDeliveryPoints } from "../../../../modules/cdek/client";

/**
 * GET /store/cdek/pvz?city_code=44
 *
 * Список пунктов выдачи СДЭК в городе.
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
    const points = await getDeliveryPoints(code);
    return res.json({ points });
  } catch (err) {
    const message = err instanceof Error ? err.message : "CDEK API error";
    console.error("[CDEK pvz]", message);
    return res.status(502).json({ message });
  }
}
