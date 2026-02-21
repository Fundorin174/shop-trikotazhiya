-- ============================================
-- SQL-миграция: Таблицы модуля fabric
-- ============================================
--
-- Выполнять ПОСЛЕ стандартных миграций Medusa:
--   npx medusa db:migrate
--
-- Для ручного применения:
--   psql -U medusa -d medusa_trikotazhiya -f migrations/001_create_fabric_tables.sql
--
-- ⚠️ В Medusa v2 миграции из модулей применяются автоматически.
--    Этот файл — для справки и ручного контроля.
-- ============================================

BEGIN;

-- ──────────────────────────────────────
-- Таблица 1: fabric_attribute (ПУБЛИЧНАЯ)
-- Данные, отображаемые на витрине магазина.
-- ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS "fabric_attribute" (
    -- Первичный ключ (формат Medusa: "fabattr_xxxxx")
    "id"                  VARCHAR(255)    NOT NULL PRIMARY KEY,

    -- ─── ОСНОВНАЯ ИНФОРМАЦИЯ ───

    -- Артикул (уникальный). Пример: "TK-COT-001"
    "sku"                 VARCHAR(255)    NOT NULL,

    -- Название ткани. Пример: "Бязь отбелённая ГОСТ"
    "name"                VARCHAR(255)    NOT NULL,

    -- Тип ткани (enum)
    "fabric_type"         VARCHAR(50)     NOT NULL
                          CONSTRAINT "chk_fabric_type" CHECK ("fabric_type" IN (
                            'cotton', 'silk', 'wool', 'linen', 'knit',
                            'synthetic', 'blend', 'viscose', 'polyester', 'other'
                          )),

    -- Состав. Пример: "100% хлопок, 200г/м²"
    "composition"         TEXT            NOT NULL,

    -- Качество ткани (описание)
    "quality"             TEXT            NULL,

    -- Ширина в сантиметрах. Пример: 150.0
    "width_cm"            REAL            NOT NULL,

    -- Цена за единицу в КОПЕЙКАХ. Пример: 45000 = 450.00 ₽
    "unit_price"          NUMERIC(20, 0)  NOT NULL,

    -- Единица измерения
    "measurement_unit"    VARCHAR(50)     NOT NULL DEFAULT 'meter'
                          CONSTRAINT "chk_measurement_unit" CHECK ("measurement_unit" IN (
                            'meter', 'running_meter', 'roll', 'cut'
                          )),

    -- Складской остаток
    "stock_quantity"      INTEGER         NOT NULL DEFAULT 0,

    -- Страна производства. Пример: "Россия"
    "country"             VARCHAR(255)    NULL,

    -- Коллекция. Пример: "Весна 2026"
    "collection_name"     VARCHAR(255)    NULL,

    -- Цвет — текстовое название. Пример: "Бордовый"
    "color"               VARCHAR(255)    NULL,

    -- Цвет — hex code. Пример: "#8B0000"
    "color_hex"           VARCHAR(7)      NULL,

    -- ─── КОНТЕНТ ───

    -- Полное описание (SEO, карточка товара)
    "full_description"    TEXT            NULL,

    -- Краткое описание (каталог, превью)
    "short_description"   TEXT            NULL,

    -- Дополнительные фото (JSON массив URL)
    -- Пример: ["https://cdn.example.com/photo1.webp", "..."]
    "extra_photos"        JSONB           NULL,

    -- Видео URL (YouTube / Yandex Disk)
    "video_url"           TEXT            NULL,

    -- ─── СКИДКИ ───

    -- Процент скидки. Пример: 15.0
    "discount_percent"    REAL            NULL,

    -- Абсолютный размер скидки в копейках
    "discount_amount"     NUMERIC(20, 0)  NULL,

    -- ─── TIMESTAMPS ───
    "created_at"          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    "updated_at"          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    -- ─── CONSTRAINTS ───
    CONSTRAINT "uq_fabric_attribute_sku" UNIQUE ("sku")
);

-- Индексы для быстрого поиска и фильтрации
CREATE INDEX IF NOT EXISTS "idx_fabric_attribute_sku"
    ON "fabric_attribute" ("sku");

CREATE INDEX IF NOT EXISTS "idx_fabric_attribute_fabric_type"
    ON "fabric_attribute" ("fabric_type");

CREATE INDEX IF NOT EXISTS "idx_fabric_attribute_collection"
    ON "fabric_attribute" ("collection_name");

CREATE INDEX IF NOT EXISTS "idx_fabric_attr_type_width"
    ON "fabric_attribute" ("fabric_type", "width_cm");

CREATE INDEX IF NOT EXISTS "idx_fabric_attr_price"
    ON "fabric_attribute" ("unit_price");

COMMENT ON TABLE  "fabric_attribute"                    IS 'Публичные атрибуты ткани (витрина)';
COMMENT ON COLUMN "fabric_attribute"."sku"              IS 'Артикул (уникальный код товара)';
COMMENT ON COLUMN "fabric_attribute"."unit_price"       IS 'Цена за единицу в копейках (50000 = 500₽)';
COMMENT ON COLUMN "fabric_attribute"."width_cm"         IS 'Ширина ткани в сантиметрах';
COMMENT ON COLUMN "fabric_attribute"."extra_photos"     IS 'Доп. фото — JSON массив URL';
COMMENT ON COLUMN "fabric_attribute"."measurement_unit" IS 'meter | running_meter | roll | cut';

-- ──────────────────────────────────────
-- Таблица 2: fabric_supplier_data (ПРИВАТНАЯ)
-- Данные о закупке и поставщике.
-- Видны ТОЛЬКО в админке. НЕ отдаются через Store API.
-- ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS "fabric_supplier_data" (
    "id"                    VARCHAR(255)    NOT NULL PRIMARY KEY,

    -- Закупочная цена в копейках (СКРЫТАЯ!)
    "purchase_price"        NUMERIC(20, 0)  NOT NULL,

    -- Данные поставщика (СКРЫТЫЕ!)
    "supplier_name"         VARCHAR(255)    NULL,
    "supplier_website"      TEXT            NULL,
    "supplier_contacts"     TEXT            NULL,

    -- Внутренние заметки
    "internal_notes"        TEXT            NULL,

    -- Связь с fabric_attribute (1:1)
    "fabric_attribute_id"   VARCHAR(255)    NOT NULL
                            REFERENCES "fabric_attribute"("id")
                            ON DELETE CASCADE,

    -- Timestamps
    "created_at"            TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    "updated_at"            TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    -- Один набор данных поставщика на одну ткань
    CONSTRAINT "uq_fabric_supplier_fabric_attr"
        UNIQUE ("fabric_attribute_id")
);

CREATE INDEX IF NOT EXISTS "idx_fabric_supplier_name"
    ON "fabric_supplier_data" ("supplier_name");

COMMENT ON TABLE  "fabric_supplier_data"                       IS 'Приватные данные (закупка, поставщик). Только для админки!';
COMMENT ON COLUMN "fabric_supplier_data"."purchase_price"      IS 'Закупочная цена в копейках (СКРЫТА от витрины)';
COMMENT ON COLUMN "fabric_supplier_data"."supplier_contacts"   IS 'Контакты: телефон, email, имя менеджера';

COMMIT;
