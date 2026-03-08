/**
 * Тесты утилитных функций: форматирование цены, slugify, truncate, конвертация единиц.
 */
import {
  cn,
  formatPrice,
  formatWidth,
  slugify,
  truncate,
  metersToCm,
  cmToMeters,
  pricePerCmToPerMeter,
  pricePerMeterToPerCm,
  originalPrice,
  CM_PER_METER,
  MIN_CUT_METERS,
  CUT_STEP_METERS,
  MEASUREMENT_UNITS,
  MEASUREMENT_UNITS_FULL,
} from "@/lib/utils";

// ============================================
// cn (clsx wrapper)
// ============================================
describe("cn", () => {
  it("объединяет строки классов", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("игнорирует falsy-значения", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });

  it("поддерживает условные классы", () => {
    expect(cn("base", { active: true, disabled: false })).toBe("base active");
  });

  it("возвращает пустую строку для пустых аргументов", () => {
    expect(cn()).toBe("");
  });
});

// ============================================
// formatPrice
// ============================================
describe("formatPrice", () => {
  it("форматирует целое число копеек в рубли", () => {
    const result = formatPrice(52000);
    // 52000 копеек = 520 ₽
    expect(result).toMatch(/520/);
    expect(result).toMatch(/₽/);
  });

  it("форматирует дробные суммы", () => {
    const result = formatPrice(12345);
    // 12345 копеек = 123.45 ₽
    expect(result).toMatch(/123/);
  });

  it("форматирует 0", () => {
    const result = formatPrice(0);
    expect(result).toMatch(/0/);
  });

  it("форматирует крупные суммы с разделителями", () => {
    const result = formatPrice(1000000);
    // 10 000 ₽
    expect(result).toMatch(/10/);
    expect(result).toMatch(/000/);
  });
});

// ============================================
// formatWidth
// ============================================
describe("formatWidth", () => {
  it("форматирует ширину в сантиметрах", () => {
    expect(formatWidth(150)).toBe("150 см");
  });

  it("форматирует ноль", () => {
    expect(formatWidth(0)).toBe("0 см");
  });
});

// ============================================
// slugify (транслитерация)
// ============================================
describe("slugify", () => {
  it("транслитерирует кириллицу", () => {
    expect(slugify("Кулирка")).toBe("kulirka");
  });

  it("заменяет пробелы на дефисы", () => {
    expect(slugify("Красная ткань")).toBe("krasnaya-tkan");
  });

  it("убирает специальные символы", () => {
    expect(slugify("Цена: 100₽!")).toBe("tsena-100");
  });

  it("обрабатывает английские символы", () => {
    expect(slugify("hello world")).toBe("hello-world");
  });

  it("убирает лидирующие и трейлинговые дефисы", () => {
    expect(slugify("—привет—")).toBe("privet");
  });

  it("транслитерирует все буквы алфавита", () => {
    const result = slugify("абвгдеёжзийклмнопрстуфхцчшщъыьэюя");
    expect(result).toBe("abvgdeyozhziyklmnoprstufkhtschshshch-y-eyuya");
  });
});

// ============================================
// truncate
// ============================================
describe("truncate", () => {
  it("не обрезает короткий текст", () => {
    expect(truncate("Привет", 20)).toBe("Привет");
  });

  it("обрезает длинный текст с многоточием", () => {
    const result = truncate("Очень длинное описание ткани высокого качества", 20);
    expect(result.length).toBeLessThanOrEqual(25); // включая символ …
    expect(result).toContain("…");
  });

  it("обрезает по границе слова", () => {
    const result = truncate("Один два три четыре пять", 15);
    // Должен обрезать, не разрывая слово
    expect(result).not.toMatch(/\s…$/);
    expect(result.endsWith("…")).toBe(true);
  });

  it("возвращает текст как есть при равной длине", () => {
    expect(truncate("12345", 5)).toBe("12345");
  });
});

// ============================================
// Конвертация: метры ↔ сантиметры
// ============================================
describe("metersToCm", () => {
  it("переводит метры в сантиметры", () => {
    expect(metersToCm(1)).toBe(100);
    expect(metersToCm(0.5)).toBe(50);
    expect(metersToCm(2.5)).toBe(250);
  });

  it("округляет до целых", () => {
    expect(metersToCm(0.333)).toBe(33);
  });
});

describe("cmToMeters", () => {
  it("переводит сантиметры в метры", () => {
    expect(cmToMeters(100)).toBe(1);
    expect(cmToMeters(50)).toBe(0.5);
    expect(cmToMeters(250)).toBe(2.5);
  });

  it("округляет до 1 знака после запятой", () => {
    expect(cmToMeters(33)).toBe(0.3);
  });
});

// ============================================
// Конвертация цен: /см ↔ /м
// ============================================
describe("pricePerCmToPerMeter", () => {
  it("конвертирует цену за см в цену за метр", () => {
    // 450 коп/см × 100 = 45000 коп/м
    expect(pricePerCmToPerMeter(450)).toBe(45000);
  });
});

describe("pricePerMeterToPerCm", () => {
  it("конвертирует цену за метр в цену за см", () => {
    expect(pricePerMeterToPerCm(45000)).toBe(450);
  });

  it("округляет до целых копеек", () => {
    expect(pricePerMeterToPerCm(999)).toBe(10);
  });
});

// ============================================
// originalPrice (расчёт цены без скидки)
// ============================================
describe("originalPrice", () => {
  it("рассчитывает оригинальную цену при скидке 20%", () => {
    // 800 / (1 - 0.20) = 1000
    expect(originalPrice(800, 20)).toBe(1000);
  });

  it("возвращает ту же цену при скидке 0%", () => {
    expect(originalPrice(1000, 0)).toBe(1000);
  });

  it("возвращает ту же цену при отрицательной скидке", () => {
    expect(originalPrice(1000, -10)).toBe(1000);
  });

  it("возвращает ту же цену при скидке 100%", () => {
    expect(originalPrice(1000, 100)).toBe(1000);
  });

  it("округляет до целых", () => {
    // 700 / (1 - 0.15) = 823.529... → 824
    expect(originalPrice(700, 15)).toBe(824);
  });
});

// ============================================
// Константы
// ============================================
describe("Константы", () => {
  it("CM_PER_METER = 100", () => {
    expect(CM_PER_METER).toBe(100);
  });

  it("MIN_CUT_METERS = 0.5", () => {
    expect(MIN_CUT_METERS).toBe(0.5);
  });

  it("CUT_STEP_METERS = 0.1", () => {
    expect(CUT_STEP_METERS).toBe(0.1);
  });

  it("MEASUREMENT_UNITS содержит единицы", () => {
    expect(MEASUREMENT_UNITS.running_meter).toBe("пог. м");
    expect(MEASUREMENT_UNITS.piece).toBe("шт.");
  });

  it("MEASUREMENT_UNITS_FULL содержит полные названия", () => {
    expect(MEASUREMENT_UNITS_FULL.running_meter).toBe("метр погонный");
    expect(MEASUREMENT_UNITS_FULL.piece).toBe("штука");
  });
});
