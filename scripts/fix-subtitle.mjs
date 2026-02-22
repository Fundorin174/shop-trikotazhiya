/**
 * Обновляет subtitle Футера с эмодзи и HTML-форматированием.
 */

const BACKEND_URL = "http://localhost:9000";
const PRODUCT_ID = "prod_01KJ092KQR8143JVFQNTMX1GYK";

const subtitle = [
  "🪡 Состав: 80% хлопок, 20% полиэстер",
  "📏 Плотность: 320 г/м²",
  "↔️ Ширина: 185 см",
  "↕️ Длина: любая — от 10 см!",
  "🇹🇷 Производство: Турция",
  "🧵 Качество: Compact Piqué (Компакт Пенье)",
].join("<br>");

async function run() {
  // Логин
  const loginResp = await fetch(`${BACKEND_URL}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@trikotazhiya.ru", password: "GfhjkM174" }),
  });
  const { token } = await loginResp.json();

  // Обновление subtitle
  const resp = await fetch(`${BACKEND_URL}/admin/products/${PRODUCT_ID}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ subtitle }),
  });
  const data = await resp.json();
  
  // Проверяем наличие эмодзи
  const saved = data.product.subtitle;
  console.log("Subtitle saved:", saved);
  console.log("Has emojis:", /🪡/.test(saved) && /📏/.test(saved) && /🧵/.test(saved));
  console.log("Has <br>:", saved.includes("<br>"));
  
  // Hex-dump первых 50 символов для проверки
  const codes = [...saved].slice(0, 10).map(c => `U+${c.codePointAt(0).toString(16).toUpperCase()}`);
  console.log("First 10 chars codepoints:", codes.join(", "));
}

run().catch(console.error);
