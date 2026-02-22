import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import type { IPaymentModuleService } from "@medusajs/framework/types";

/**
 * ============================================
 * Webhook: POST /store/yukassa/webhook
 * ============================================
 *
 * Принимает уведомления от ЮKassa о статусе платежей
 * и передаёт их в Medusa Payment Module для обработки.
 *
 * ЮKassa присылает события:
 *   - payment.succeeded — платёж успешен
 *   - payment.waiting_for_capture — ожидает подтверждения
 *   - payment.canceled — платёж отменён
 *   - refund.succeeded — возврат выполнен
 *
 * ВАЖНО: Всегда возвращаем 200 OK, иначе ЮKassa будет повторять запрос.
 *
 * @see https://yookassa.ru/developers/using-api/webhooks
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger") as {
    info: (msg: string) => void;
    warn: (msg: string) => void;
    error: (msg: string) => void;
  };

  try {
    const body = req.body as Record<string, unknown>;

    // Валидация payload
    if (!body || typeof body !== "object") {
      logger.warn("YuKassa webhook: пустое или невалидное тело запроса");
      res.status(200).json({ received: true, error: "empty_body" });
      return;
    }

    if (!body.event || typeof body.event !== "string") {
      logger.warn("YuKassa webhook: отсутствует поле event");
      res.status(200).json({ received: true, error: "missing_event" });
      return;
    }

    if (!body.object || typeof body.object !== "object") {
      logger.warn("YuKassa webhook: отсутствует поле object");
      res.status(200).json({ received: true, error: "missing_object" });
      return;
    }

    const paymentId = (body.object as Record<string, unknown>)?.id;
    logger.info(
      `YuKassa webhook: event=${body.event}, payment=${paymentId}`
    );

    // Передаём webhook в Medusa Payment Module.
    // getWebhookActionAndData вызовет наш провайдер и вернёт action.
    const paymentModule = req.scope.resolve(
      Modules.PAYMENT
    ) as IPaymentModuleService;

    const result = await paymentModule.getWebhookActionAndData({
      provider: "yukassa",
      payload: {
        data: body,
        rawData: JSON.stringify(body),
        headers: req.headers as Record<string, unknown>,
      },
    });

    logger.info(
      `YuKassa webhook result: action=${result.action}, ` +
      `session=${result.data?.session_id}, payment=${paymentId}`
    );

    res.status(200).json({ received: true, action: result.action });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`YuKassa webhook processing error: ${message}`);
    // Всегда 200, чтобы ЮKassa не повторяла
    res.status(200).json({ received: true, error: "processing_error" });
  }
}
