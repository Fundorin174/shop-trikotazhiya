/**
 * ============================================
 * Модуль: yukassa (ЮKassa Payment Provider)
 * ============================================
 *
 * Интеграция с ЮKassa (YooKassa) для приёма платежей.
 * Регистрируется как Payment Provider в Medusa v2.
 *
 * API: https://yookassa.ru/developers/api
 *
 * Поток оплаты:
 * 1. initiatePayment → создаёт платёж в ЮKassa → confirmation_url
 * 2. Покупатель переходит на ЮKassa для ввода карты
 * 3. ЮKassa вызывает webhook → getWebhookActionAndData
 * 4. Medusa завершает корзину → создаёт заказ
 */

import { ModuleProvider, Modules } from "@medusajs/framework/utils";
import YuKassaPaymentProviderService from "./service";

export default ModuleProvider(Modules.PAYMENT, {
  services: [YuKassaPaymentProviderService],
});
