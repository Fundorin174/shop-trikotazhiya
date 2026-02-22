# Интеграция ЮKassa (YooKassa)

## Обзор

Платёжная интеграция реализована через **Medusa v2 Payment Provider** — `AbstractPaymentProvider`.
ЮKassa используется для приёма платежей банковскими картами.

## Архитектура

```
Покупатель → Checkout Form → Medusa Cart API → Payment Collection → ЮKassa API
                                                                        ↓
                                                              confirmation_url
                                                                        ↓
                                                            Страница ЮKassa
                                                                        ↓
                                                            Webhook → Medusa
                                                                        ↓
                                                            /checkout/success
```

## Файлы

### Backend

| Файл | Назначение |
|------|-----------|
| `backend/src/modules/yukassa/service.ts` | Провайдер платежей (extends `AbstractPaymentProvider`) |
| `backend/src/modules/yukassa/index.ts` | Регистрация модуля через `ModuleProvider` |
| `backend/src/api/store/yukassa/webhook/route.ts` | Webhook-эндпоинт для уведомлений ЮKassa |
| `backend/medusa-config.ts` | Конфигурация модуля с креденшалами |

### Frontend

| Файл | Назначение |
|------|-----------|
| `frontend/src/lib/data/checkout.ts` | API-клиент для Medusa Checkout |
| `frontend/src/components/checkout/CheckoutForm.tsx` | Многошаговая форма оформления |
| `frontend/src/app/checkout/success/page.tsx` | Страница успешной оплаты |

## Переменные окружения

```env
# .env / docker-compose.yml
YUKASSA_SHOP_ID=123456          # ID магазина в ЮKassa
YUKASSA_SECRET_KEY=test_xxx     # Секретный ключ API
YUKASSA_WEBHOOK_SECRET=xxx      # Секрет для валидации webhook (опционально)
YUKASSA_RETURN_URL=https://trikotazhiya.ru/checkout/success  # URL возврата
```

## Настройка ЮKassa

### 1. Получение креденшалов

1. Зарегистрируйтесь на [yookassa.ru](https://yookassa.ru)
2. Создайте магазин
3. В разделе **Настройки → Ключи API** получите:
   - `shopId` — ID магазина
   - `Секретный ключ` — для API-запросов

### 2. Настройка Webhook

В личном кабинете ЮKassa → **Настройки → HTTP-уведомления**:

- URL: `https://your-domain.com/store/yukassa/webhook`
- События:
  - `payment.succeeded` — платёж успешен
  - `payment.waiting_for_capture` — ожидает подтверждения
  - `payment.canceled` — платёж отменён
  - `refund.succeeded` — возврат выполнен

### 3. Тестовый режим

Для тестирования используйте тестовые ключи ЮKassa (префикс `test_`).
Тестовые карты: [документация ЮKassa](https://yookassa.ru/developers/payment-acceptance/testing-and-going-live/testing#test-bank-card-data)

## Поток оплаты

### Шаги оформления

1. **Контактные данные** — имя, email, телефон
2. **Адрес доставки** — город, индекс, адрес
3. **Способ оплаты** — банковская карта (ЮKassa)
4. **Подтверждение** — нажатие «Оплатить»

### API-вызовы при оформлении

```
POST /store/carts/:id            → обновить email
POST /store/carts/:id            → обновить адрес
POST /store/payment-collections  → создать платёжную коллекцию
POST /store/payment-collections/:id/payment-sessions → инициировать ЮKassa
→ redirect на confirmation_url ЮKassa
```

### После оплаты

1. ЮKassa вызывает webhook: `POST /store/yukassa/webhook`
2. Medusa обновляет статус платежа
3. Покупатель перенаправляется на `/checkout/success`

## Методы провайдера

| Метод | Описание |
|-------|----------|
| `initiatePayment` | Создаёт платёж в ЮKassa, возвращает `confirmation_url` |
| `authorizePayment` | Проверяет статус платежа |
| `capturePayment` | Подтверждает платёж (auto-capture по умолчанию) |
| `cancelPayment` | Отменяет платёж |
| `refundPayment` | Возврат средств |
| `getPaymentStatus` | Запрашивает текущий статус |
| `retrievePayment` | Получает данные платежа |
| `updatePayment` | Пересоздаёт платёж с новыми параметрами |
| `deletePayment` | Noop (ЮKassa не поддерживает) |
| `getWebhookActionAndData` | Обработка webhook-уведомлений |

## Безопасность

- Все API-ключи хранятся в переменных окружения
- Webhook-эндпоинт возвращает 200 OK даже при ошибках (чтобы ЮKassa не повторяла)
- `confirmation_url` передаётся через `data` на фронтенд для redirect
- Конфиденциальные данные НЕ хранятся в `PaymentSession.data` (они публичны)
