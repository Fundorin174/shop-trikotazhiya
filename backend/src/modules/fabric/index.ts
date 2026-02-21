/**
 * ============================================
 * МОДУЛЬ: fabric
 * ============================================
 *
 * Расширение данных товара для специфики тканей.
 *
 * Архитектурное решение:
 * В Medusa v2 кастомные данные хранятся через отдельные модули (Modules),
 * которые связываются с Product через Links (ссылки между модулями).
 *
 * Две таблицы:
 * 1. fabric_attribute — ПУБЛИЧНЫЕ поля (видны на витрине)
 *    Артикул, тип, состав, ширина, цвет, описания, и т.д.
 *
 * 2. fabric_supplier_data — ПРИВАТНЫЕ поля (только админка)
 *    Цена закупки, поставщик, контакты.
 *
 * Связь: Product → fabric_attribute (1:1) через Medusa Link
 *        fabric_attribute → fabric_supplier_data (1:1)
 */

import { Module } from "@medusajs/framework/utils";
import FabricModuleService from "./service";

export const FABRIC_MODULE = "fabric";

export default Module(FABRIC_MODULE, {
  service: FabricModuleService,
});
