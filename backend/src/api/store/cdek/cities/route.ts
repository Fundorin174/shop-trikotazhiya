import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { searchCities } from "../../../../modules/cdek/client";

/**
 * GET /store/cdek/cities?name=Москва
 *
 * Поиск городов СДЭК по названию.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { name } = req.query as Record<string, string>;

  if (!name || name.length < 2) {
    return res.status(400).json({ message: "Укажите параметр name (мин. 2 символа)" });
  }

  try {
    const cities = await searchCities(name);
    return res.json({ cities });
  } catch (err) {
    const message = err instanceof Error ? err.message : "CDEK API error";
    console.error("[CDEK cities]", message);
    return res.status(502).json({ message });
  }
}
