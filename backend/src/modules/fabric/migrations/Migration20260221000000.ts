/**
 * ============================================
 * SQL-миграция: Создание таблиц для модуля fabric
 * ============================================
 *
 * Файл: backend/src/modules/fabric/migrations/Migration20260221000000.ts
 *
 * ⚠️ ВАЖНО:
 * В Medusa v2 миграции генерируются автоматически через команду:
 *   npx medusa db:generate fabric
 *
 * Этот файл показывает ИТОГОВУЮ структуру таблиц для справки
 * и ручного контроля. При запуске `medusa db:migrate` Medusa
 * применяет миграции из модулей автоматически.
 *
 * Если вы хотите создать таблицы вручную (без Medusa CLI),
 * выполните SQL ниже напрямую в PostgreSQL.
 */

import { Migration } from "@mikro-orm/migrations";

export class Migration20260221000000 extends Migration {
  async up(): Promise<void> {
    // ──────────────────────────────────────
    // Таблица 1: fabric_attribute (ПУБЛИЧНАЯ)
    // ──────────────────────────────────────
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "fabric_attribute" (
        -- Первичный ключ
        "id"                  VARCHAR(255)    NOT NULL PRIMARY KEY,

        -- ── Основная информация ──
        "sku"                 VARCHAR(255)    NOT NULL UNIQUE,
        "name"                VARCHAR(255)    NOT NULL,
        "fabric_type"         VARCHAR(50)     NOT NULL
                              CHECK ("fabric_type" IN (
                                'cotton', 'silk', 'wool', 'linen', 'knit',
                                'synthetic', 'blend', 'viscose', 'polyester', 'other'
                              )),
        "composition"         TEXT            NOT NULL,
        "quality"             TEXT            NULL,
        "width_cm"            REAL            NOT NULL,
        "unit_price"          NUMERIC(20, 0)  NOT NULL,
        "measurement_unit"    VARCHAR(50)     NOT NULL DEFAULT 'meter'
                              CHECK ("measurement_unit" IN (
                                'meter', 'running_meter', 'roll', 'cut'
                              )),
        "stock_quantity"      INTEGER         NOT NULL DEFAULT 0,
        "country"             VARCHAR(255)    NULL,
        "collection_name"     VARCHAR(255)    NULL,
        "color"               VARCHAR(255)    NULL,
        "color_hex"           VARCHAR(7)      NULL,

        -- ── Контент ──
        "full_description"    TEXT            NULL,
        "short_description"   TEXT            NULL,
        "extra_photos"        JSONB           NULL,
        "video_url"           TEXT            NULL,

        -- ── Скидки ──
        "discount_percent"    REAL            NULL,
        "discount_amount"     NUMERIC(20, 0)  NULL,

        -- ── Timestamps ──
        "created_at"          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
        "updated_at"          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
      );
    `);

    // Индекс по артикулу (уже UNIQUE, но явный индекс для поиска)
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "idx_fabric_attribute_sku"
      ON "fabric_attribute" ("sku");
    `);

    // Индекс по типу ткани (для фильтрации в каталоге)
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "idx_fabric_attribute_fabric_type"
      ON "fabric_attribute" ("fabric_type");
    `);

    // Индекс по коллекции
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "idx_fabric_attribute_collection"
      ON "fabric_attribute" ("collection_name");
    `);

    // Составной индекс для фильтрации: тип + ширина
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "idx_fabric_attribute_type_width"
      ON "fabric_attribute" ("fabric_type", "width_cm");
    `);

    // ──────────────────────────────────────
    // Таблица 2: fabric_supplier_data (ПРИВАТНАЯ)
    // ──────────────────────────────────────
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "fabric_supplier_data" (
        "id"                    VARCHAR(255)    NOT NULL PRIMARY KEY,

        -- ── Финансы (скрытые) ──
        "purchase_price"        NUMERIC(20, 0)  NOT NULL,

        -- ── Поставщик (скрытые) ──
        "supplier_name"         VARCHAR(255)    NULL,
        "supplier_website"      TEXT            NULL,
        "supplier_contacts"     TEXT            NULL,
        "internal_notes"        TEXT            NULL,

        -- ── Связь с fabric_attribute ──
        "fabric_attribute_id"   VARCHAR(255)    NOT NULL
                                REFERENCES "fabric_attribute"("id")
                                ON DELETE CASCADE,

        -- ── Timestamps ──
        "created_at"            TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
        "updated_at"            TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

        -- Один поставщик на одну ткань
        CONSTRAINT "uq_fabric_supplier_fabric_attr"
          UNIQUE ("fabric_attribute_id")
      );
    `);

    // Индекс по поставщику (для отчётов в админке)
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "idx_fabric_supplier_name"
      ON "fabric_supplier_data" ("supplier_name");
    `);
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "fabric_supplier_data" CASCADE;`);
    this.addSql(`DROP TABLE IF EXISTS "fabric_attribute" CASCADE;`);
  }
}
