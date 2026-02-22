/**
 * ============================================
 * YuKassa Payment Provider — Medusa v2
 * ============================================
 *
 * Полная реализация оплаты через ЮKassa (YooKassa).
 * API: https://yookassa.ru/developers/api
 *
 * Модель цен:
 *   Все суммы в Medusa хранятся в копейках (minor units для RUB).
 *   ЮKassa API ожидает суммы в рублях (строка с двумя знаками: "450.00").
 *   Конвертация: копейки ÷ 100 → рубли.
 *
 * Поток:
 * 1. initiatePayment — создаёт платёж в ЮKassa, возвращает confirmation_url
 * 2. Клиент перенаправляется на confirmation_url для оплаты
 * 3. ЮKassa вызывает webhook → getWebhookActionAndData
 * 4. authorizePayment — проверяет статус платежа
 * 5. capturePayment — подтверждает (capture) платёж
 */

import { AbstractPaymentProvider, BigNumber } from "@medusajs/framework/utils";
import type { Logger } from "@medusajs/framework/types";
import type {
  CapturePaymentInput,
  CapturePaymentOutput,
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  ProviderWebhookPayload,
  WebhookActionResult,
  PaymentSessionStatus,
} from "@medusajs/framework/types";
import crypto from "crypto";

// ============================================
// Типы
// ============================================

type YuKassaOptions = {
  shopId: string;
  secretKey: string;
  webhookSecret: string;
  returnUrl: string;
};

/**
 * Статус платежа в ЮKassa API
 * @see https://yookassa.ru/developers/api#payment_object_status
 */
type YuKassaPaymentStatus =
  | "pending"
  | "waiting_for_capture"
  | "succeeded"
  | "canceled";

interface YuKassaPayment {
  id: string;
  status: YuKassaPaymentStatus;
  amount: { value: string; currency: string };
  confirmation?: { type: string; confirmation_url?: string };
  paid: boolean;
  refundable: boolean;
  metadata?: Record<string, string>;
  created_at: string;
  description?: string;
}

interface YuKassaRefund {
  id: string;
  status: string;
  amount: { value: string; currency: string };
  payment_id: string;
  created_at: string;
}

// ============================================
// Провайдер
// ============================================

class YuKassaPaymentProviderService extends AbstractPaymentProvider<YuKassaOptions> {
  static identifier = "yukassa";

  protected logger_: Logger;
  protected options_: YuKassaOptions;

  private apiUrl = "https://api.yookassa.ru/v3";

  constructor(container: Record<string, unknown>, config: YuKassaOptions) {
    super(container, config);

    this.logger_ = container.logger as Logger;
    this.options_ = config;
  }

  /**
   * Валидация options из medusa-config.ts.
   * Не блокируем запуск — в dev-режиме ключей может не быть.
   * Ошибки будут при реальных вызовах API.
   */
  static validateOptions(options: Record<string, unknown>): void {
    if (!options.shopId || !options.secretKey) {
      console.warn(
        "[YuKassa] YUKASSA_SHOP_ID / YUKASSA_SECRET_KEY не заданы. " +
        "Платежи не будут работать до настройки переменных окружения."
      );
    }
  }

  // ----------------------------------------
  // HTTP-клиент для ЮKassa API
  // ----------------------------------------

  private getAuthHeader(): string {
    const credentials = `${this.options_.shopId}:${this.options_.secretKey}`;
    return `Basic ${Buffer.from(credentials).toString("base64")}`;
  }

  /**
   * Копейки → рубли (строка "123.45" для ЮKassa API).
   */
  private kopecksToRubles(kopecks: number): string {
    if (!Number.isFinite(kopecks) || kopecks < 0) {
      throw new Error(`Некорректная сумма: ${kopecks}`);
    }
    return (kopecks / 100).toFixed(2);
  }

  /**
   * Рубли (строка) → копейки (число).
   */
  private rublesToKopecks(rubles: string): number {
    const value = parseFloat(rubles);
    if (!Number.isFinite(value) || value < 0) return 0;
    return Math.round(value * 100);
  }

  /**
   * HTTP-запрос к ЮKassa API.
   * Включает таймаут (30 сек), обработку сетевых ошибок и логирование.
   */
  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>,
    idempotencyKey?: string
  ): Promise<T> {
    // Проверка настроек
    if (!this.options_.shopId || !this.options_.secretKey) {
      throw new Error(
        "YuKassa не настроена: отсутствуют shopId или secretKey. " +
        "Задайте YUKASSA_SHOP_ID и YUKASSA_SECRET_KEY в переменных окружения."
      );
    }

    const headers: Record<string, string> = {
      Authorization: this.getAuthHeader(),
      "Content-Type": "application/json",
    };

    // Idempotence-Key обязателен для POST-запросов в ЮKassa
    if (method === "POST") {
      headers["Idempotence-Key"] = idempotencyKey || crypto.randomUUID();
    }

    const url = `${this.apiUrl}${path}`;

    // Таймаут 30 секунд для API-запросов
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    try {
      const res = await fetch(url, {
        method,
        headers,
        signal: controller.signal,
        ...(body ? { body: JSON.stringify(body) } : {}),
      });

      if (!res.ok) {
        const errorBody = await res.text().catch(() => "");
        const msg = `YuKassa API ${method} ${path} → ${res.status}: ${errorBody}`;
        this.logger_.error(msg);

        // Специфичные ошибки ЮKassa
        if (res.status === 401) {
          throw new Error("YuKassa: неверные учётные данные (shopId/secretKey)");
        }
        if (res.status === 403) {
          throw new Error("YuKassa: доступ запрещён. Проверьте права shopId.");
        }
        if (res.status === 429) {
          throw new Error("YuKassa: превышен лимит запросов. Попробуйте позже.");
        }
        if (res.status >= 500) {
          throw new Error(`YuKassa: сервер недоступен (${res.status}). Повторите попытку.`);
        }

        throw new Error(msg);
      }

      return await res.json() as T;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        this.logger_.error(`YuKassa API: таймаут ${method} ${path}`);
        throw new Error("YuKassa: таймаут запроса (30 сек). Сервис недоступен.");
      }
      // Сетевая ошибка (DNS, TCP и т.д.)
      if (err instanceof TypeError && (err as any).cause) {
        this.logger_.error(`YuKassa API: сетевая ошибка ${method} ${path}: ${err.message}`);
        throw new Error("YuKassa: ошибка сети. Проверьте подключение к интернету.");
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  // ----------------------------------------
  // AbstractPaymentProvider — обязательные методы
  // ----------------------------------------

  /**
   * Инициализация платежа — создаёт Payment в ЮKassa.
   * Возвращает confirmation_url для редиректа клиента.
   *
   * amount приходит от Medusa в копейках (minor units для RUB).
   * ЮKassa API ожидает рубли (строка "450.00").
   */
  async initiatePayment(
    input: InitiatePaymentInput
  ): Promise<InitiatePaymentOutput> {
    const { amount, currency_code, context } = input;

    // Валидация суммы
    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      this.logger_.error(`YuKassa initiatePayment: некорректная сумма: ${amount}`);
      return {
        id: "",
        status: "error" as PaymentSessionStatus,
        data: { error: `Некорректная сумма платежа: ${amount}` },
      };
    }

    // Копейки → рубли для ЮKassa
    const amountRubles = this.kopecksToRubles(amountNum);
    const currency = (currency_code || "RUB").toUpperCase();

    // Минимальный платёж в ЮKassa — 1.00₽ (100 копеек)
    if (amountNum < 100) {
      this.logger_.error(`YuKassa: сумма ${amountRubles}₽ меньше минимальной (1.00₽)`);
      return {
        id: "",
        status: "error" as PaymentSessionStatus,
        data: { error: `Сумма платежа ${amountRubles}₽ меньше минимальной (1.00₽)` },
      };
    }

    const sessionId = context?.idempotency_key || crypto.randomUUID();

    try {
      const payment = await this.request<YuKassaPayment>("POST", "/payments", {
        amount: {
          value: amountRubles,
          currency,
        },
        confirmation: {
          type: "redirect",
          return_url:
            this.options_.returnUrl || "http://localhost:3001/checkout/success",
        },
        capture: true, // Автоматический capture после оплаты
        description: `Заказ Трикотажия #${sessionId.slice(0, 8)}`,
        metadata: {
          session_id: sessionId,
        },
      }, sessionId);

      if (!payment.id) {
        throw new Error("ЮKassa вернула платёж без id");
      }

      this.logger_.info(
        `YuKassa: платёж создан ${payment.id}, сумма: ${amountRubles}₽, статус: ${payment.status}`
      );

      return {
        id: payment.id,
        data: {
          id: payment.id,
          status: payment.status,
          confirmation_url: payment.confirmation?.confirmation_url || "",
          session_id: sessionId,
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger_.error(`YuKassa initiatePayment failed: ${message}`);
      return {
        id: "",
        status: "error" as PaymentSessionStatus,
        data: {
          error: message,
          session_id: sessionId,
        },
      };
    }
  }

  /**
   * Авторизация платежа.
   * Проверяет статус в ЮKassa — если оплачен, возвращает authorized.
   */
  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    const externalId = input.data?.id as string;

    if (!externalId) {
      this.logger_.warn("YuKassa authorizePayment: отсутствует external id");
      return {
        status: "error" as PaymentSessionStatus,
        data: { ...(input.data || {}), error: "Отсутствует id платежа" },
      };
    }

    try {
      const payment = await this.request<YuKassaPayment>(
        "GET",
        `/payments/${externalId}`
      );

      this.logger_.info(
        `YuKassa authorize: ${payment.id} → ${payment.status}`
      );

      // При capture:true ЮKassa сразу отдаёт succeeded.
      // Medusa ожидает "authorized" от authorizePayment чтобы создать заказ.
      const statusMap: Record<YuKassaPaymentStatus, PaymentSessionStatus> = {
        pending: "pending" as PaymentSessionStatus,
        waiting_for_capture: "authorized" as PaymentSessionStatus,
        succeeded: "authorized" as PaymentSessionStatus,
        canceled: "canceled" as PaymentSessionStatus,
      };

      return {
        status: statusMap[payment.status] || ("pending" as PaymentSessionStatus),
        data: {
          id: payment.id,
          status: payment.status,
          paid: payment.paid,
          session_id: payment.metadata?.session_id,
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger_.error(`YuKassa authorizePayment failed for ${externalId}: ${message}`);
      return {
        status: "error" as PaymentSessionStatus,
        data: { ...(input.data || {}), error: message },
      };
    }
  }

  /**
   * Capture платежа (подтверждение).
   * При capture: true платёж подтверждается автоматически в ЮKassa.
   */
  async capturePayment(
    input: CapturePaymentInput
  ): Promise<CapturePaymentOutput> {
    const externalId = input.data?.id as string;

    if (!externalId) {
      this.logger_.warn("YuKassa capturePayment: отсутствует external id");
      return { data: { ...(input.data || {}), error: "Отсутствует id платежа" } };
    }

    try {
      // Проверяем статус — если уже succeeded, подтверждение не нужно
      const payment = await this.request<YuKassaPayment>(
        "GET",
        `/payments/${externalId}`
      );

      if (payment.status === "succeeded") {
        this.logger_.info(`YuKassa capture: ${externalId} уже оплачен`);
        return {
          data: {
            id: payment.id,
            status: payment.status,
            paid: payment.paid,
          },
        };
      }

      if (payment.status === "waiting_for_capture") {
        // Ручной capture
        const captured = await this.request<YuKassaPayment>(
          "POST",
          `/payments/${externalId}/capture`,
          {
            amount: payment.amount,
          }
        );

        this.logger_.info(`YuKassa capture: ${externalId} → ${captured.status}`);
        return {
          data: {
            id: captured.id,
            status: captured.status,
            paid: captured.paid,
          },
        };
      }

      // Платёж в другом статусе — невозможно capture
      this.logger_.warn(
        `YuKassa capture: ${externalId} в статусе ${payment.status}, capture невозможен`
      );
      return {
        data: {
          id: payment.id,
          status: payment.status,
          paid: payment.paid,
          error: `Платёж в статусе ${payment.status}, capture невозможен`,
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger_.error(`YuKassa capturePayment failed for ${externalId}: ${message}`);
      return { data: { ...(input.data || {}), error: message } };
    }
  }

  /**
   * Отмена платежа.
   * Можно отменить только платёж в статусе pending или waiting_for_capture.
   */
  async cancelPayment(
    input: CancelPaymentInput
  ): Promise<CancelPaymentOutput> {
    const externalId = input.data?.id as string;

    if (!externalId) {
      this.logger_.warn("YuKassa cancelPayment: отсутствует external id");
      return { data: { ...(input.data || {}), error: "Отсутствует id платежа" } };
    }

    try {
      // Проверяем текущий статус перед отменой
      const current = await this.request<YuKassaPayment>(
        "GET",
        `/payments/${externalId}`
      );

      // Нельзя отменить уже завершённый или отменённый платёж
      if (current.status === "succeeded") {
        this.logger_.warn(`YuKassa cancel: ${externalId} уже оплачен, используйте refund`);
        return {
          data: {
            id: current.id,
            status: current.status,
            error: "Платёж уже оплачен. Для возврата используйте refund.",
          },
        };
      }

      if (current.status === "canceled") {
        this.logger_.info(`YuKassa cancel: ${externalId} уже отменён`);
        return {
          data: {
            id: current.id,
            status: current.status,
          },
        };
      }

      const canceled = await this.request<YuKassaPayment>(
        "POST",
        `/payments/${externalId}/cancel`
      );

      this.logger_.info(`YuKassa: платёж ${externalId} отменён`);
      return {
        data: {
          id: canceled.id,
          status: canceled.status,
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger_.warn(`YuKassa cancelPayment failed for ${externalId}: ${message}`);
      return { data: { ...(input.data || {}), error: message } };
    }
  }

  /**
   * Удаление платёжной сессии.
   * ЮKassa не поддерживает удаление — просто возвращаем data.
   */
  async deletePayment(
    input: DeletePaymentInput
  ): Promise<DeletePaymentOutput> {
    return { data: input.data || {} };
  }

  /**
   * Получение статуса платежа.
   */
  async getPaymentStatus(
    input: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> {
    const externalId = input.data?.id as string;

    if (!externalId) {
      this.logger_.warn("YuKassa getPaymentStatus: отсутствует external id");
      return { status: "error" as PaymentSessionStatus };
    }

    try {
      const payment = await this.request<YuKassaPayment>(
        "GET",
        `/payments/${externalId}`
      );

      const statusMap: Record<YuKassaPaymentStatus, PaymentSessionStatus> = {
        pending: "pending" as PaymentSessionStatus,
        waiting_for_capture: "authorized" as PaymentSessionStatus,
        succeeded: "captured" as PaymentSessionStatus,
        canceled: "canceled" as PaymentSessionStatus,
      };

      return {
        status: statusMap[payment.status] || ("pending" as PaymentSessionStatus),
        data: {
          id: payment.id,
          status: payment.status,
          paid: payment.paid,
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger_.error(`YuKassa getPaymentStatus failed for ${externalId}: ${message}`);
      return {
        status: "error" as PaymentSessionStatus,
        data: { ...(input.data || {}), error: message },
      };
    }
  }

  /**
   * Возврат средств.
   * Сумма (amount) приходит в копейках, конвертируется в рубли для ЮKassa.
   */
  async refundPayment(
    input: RefundPaymentInput
  ): Promise<RefundPaymentOutput> {
    const externalId = input.data?.id as string;

    if (!externalId) {
      this.logger_.error("YuKassa refundPayment: отсутствует external id");
      throw new Error("Невозможно выполнить возврат: отсутствует id платежа");
    }

    const amountNum = Number(input.amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      this.logger_.error(`YuKassa refundPayment: некорректная сумма: ${input.amount}`);
      throw new Error(`Некорректная сумма возврата: ${input.amount}`);
    }

    const amountRubles = this.kopecksToRubles(amountNum);

    try {
      // Проверяем, что платёж refundable
      const payment = await this.request<YuKassaPayment>(
        "GET",
        `/payments/${externalId}`
      );

      if (!payment.refundable) {
        throw new Error(
          `Платёж ${externalId} не подлежит возврату (статус: ${payment.status})`
        );
      }

      const refund = await this.request<YuKassaRefund>("POST", "/refunds", {
        payment_id: externalId,
        amount: {
          value: amountRubles,
          currency: "RUB",
        },
      });

      this.logger_.info(
        `YuKassa: возврат ${refund.id} на сумму ${amountRubles}₽ (статус: ${refund.status})`
      );

      return {
        data: {
          ...((input.data as Record<string, unknown>) || {}),
          refund_id: refund.id,
          refund_status: refund.status,
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger_.error(`YuKassa refundPayment failed for ${externalId}: ${message}`);
      throw new Error(`Ошибка возврата: ${message}`);
    }
  }

  /**
   * Получение данных платежа.
   */
  async retrievePayment(
    input: RetrievePaymentInput
  ): Promise<RetrievePaymentOutput> {
    const externalId = input.data?.id as string;

    if (!externalId) {
      this.logger_.warn("YuKassa retrievePayment: отсутствует external id");
      return { data: { ...(input.data || {}), error: "Отсутствует id платежа" } };
    }

    try {
      const payment = await this.request<YuKassaPayment>(
        "GET",
        `/payments/${externalId}`
      );

      return {
        data: {
          id: payment.id,
          status: payment.status,
          amount: payment.amount,
          paid: payment.paid,
          created_at: payment.created_at,
          description: payment.description,
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger_.error(`YuKassa retrievePayment failed for ${externalId}: ${message}`);
      return { data: { ...(input.data || {}), error: message } };
    }
  }

  /**
   * Обновление платежа.
   * ЮKassa не поддерживает обновление — отменяем и пересоздаём.
   */
  async updatePayment(
    input: UpdatePaymentInput
  ): Promise<UpdatePaymentOutput> {
    // Отменяем старый платёж (если был)
    if (input.data?.id) {
      try {
        await this.cancelPayment({ data: input.data });
      } catch (err) {
        // Игнорируем — платёж мог уже завершиться или быть отменён
        this.logger_.info(
          `YuKassa updatePayment: не удалось отменить ${input.data.id}: ${err}`
        );
      }
    }

    // Создаём новый платёж
    try {
      const result = await this.initiatePayment({
        amount: input.amount,
        currency_code: input.currency_code,
        context: input.context || {},
      });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger_.error(`YuKassa updatePayment failed: ${message}`);
      return {
        data: { ...(input.data || {}), error: message },
      };
    }
  }

  /**
   * Обработка webhook от ЮKassa.
   *
   * ЮKassa отправляет POST с JSON:
   * {
   *   type: "notification",
   *   event: "payment.succeeded" | "payment.waiting_for_capture" | "payment.canceled" | "refund.succeeded",
   *   object: { ...payment data... }
   * }
   *
   * Сумма в webhook приходит в РУБЛЯХ (строка "450.00"),
   * конвертируем обратно в копейки для Medusa.
   */
  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    try {
      const { data } = payload;

      const event = (data as Record<string, unknown>)?.event as string;
      const paymentObj = (data as Record<string, unknown>)
        ?.object as YuKassaPayment;

      if (!event || !paymentObj) {
        this.logger_.warn(
          `YuKassa webhook: невалидные данные (event=${!!event}, object=${!!paymentObj})`
        );
        return {
          action: "not_supported",
          data: {
            session_id: "",
            amount: new BigNumber(0),
          },
        };
      }

      if (!paymentObj.id) {
        this.logger_.warn("YuKassa webhook: отсутствует payment id");
        return {
          action: "not_supported",
          data: {
            session_id: "",
            amount: new BigNumber(0),
          },
        };
      }

      const sessionId = paymentObj.metadata?.session_id || "";
      const amountKopecks = this.rublesToKopecks(paymentObj.amount?.value || "0");

      if (!sessionId) {
        this.logger_.warn(
          `YuKassa webhook: отсутствует session_id в metadata для платежа ${paymentObj.id}`
        );
      }

      this.logger_.info(
        `YuKassa webhook: ${event}, payment=${paymentObj.id}, ` +
        `session=${sessionId}, amount=${amountKopecks} коп.`
      );

      switch (event) {
        case "payment.succeeded":
          return {
            action: "captured",
            data: {
              session_id: sessionId,
              amount: new BigNumber(amountKopecks),
            },
          };

        case "payment.waiting_for_capture":
          return {
            action: "authorized",
            data: {
              session_id: sessionId,
              amount: new BigNumber(amountKopecks),
            },
          };

        case "payment.canceled":
          return {
            action: "failed",
            data: {
              session_id: sessionId,
              amount: new BigNumber(amountKopecks),
            },
          };

        case "refund.succeeded":
          this.logger_.info(
            `YuKassa webhook: возврат выполнен для платежа ${paymentObj.id}`
          );
          return {
            action: "not_supported",
            data: {
              session_id: sessionId,
              amount: new BigNumber(amountKopecks),
            },
          };

        default:
          this.logger_.warn(`YuKassa webhook: неизвестное событие: ${event}`);
          return {
            action: "not_supported",
            data: {
              session_id: sessionId,
              amount: new BigNumber(0),
            },
          };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger_.error(`YuKassa webhook processing failed: ${message}`);
      return {
        action: "not_supported",
        data: {
          session_id: "",
          amount: new BigNumber(0),
        },
      };
    }
  }
}

export default YuKassaPaymentProviderService;
