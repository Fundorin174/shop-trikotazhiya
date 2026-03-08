"use client";

import { useState, useCallback, useRef } from "react";
import type { ImportProduct, ImportResult, ImportResponse } from "@/types/admin";
import { validateProducts } from "@/lib/admin/validation";

/**
 * Хук для управления импортом товаров из JSON-файла.
 */
export function useImport(token: string) {
  const [products, setProducts] = useState<ImportProduct[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState("");
  const [results, setResults] = useState<ImportResult[] | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** Обработка выбора файла */
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setError("");
      setResults(null);
      setValidationErrors([]);
      setFileName(file.name);

      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const text = ev.target?.result as string;
          const data = JSON.parse(text);

          const arr: ImportProduct[] = Array.isArray(data)
            ? data
            : data.products;
          if (!Array.isArray(arr)) {
            throw new Error(
              'JSON должен содержать массив товаров (ключ "products" или массив на верхнем уровне)',
            );
          }

          const errors = validateProducts(arr);
          setValidationErrors(errors);
          setProducts(arr);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Ошибка чтения файла",
          );
          setProducts(null);
        }
      };
      reader.readAsText(file, "utf-8");
    },
    [],
  );

  /** Запуск импорта */
  const handleImport = useCallback(async () => {
    if (!products || !token) return;

    setImporting(true);
    setProgress("Отправка данных на сервер...");
    setError("");
    setResults(null);

    try {
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, products }),
      });

      const data: ImportResponse = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Ошибка сервера: ${res.status}`);
      }

      setResults(data.results);
      setProgress(
        `Готово! Создано: ${data.summary.created}, ошибок: ${data.summary.failed}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка импорта");
      setProgress("");
    } finally {
      setImporting(false);
    }
  }, [products, token]);

  /** Сброс состояния */
  const handleReset = () => {
    setProducts(null);
    setFileName("");
    setValidationErrors([]);
    setResults(null);
    setError("");
    setProgress("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /** Скачать шаблон JSON */
  const downloadTemplate = () => {
    const template = {
      products: [
        {
          title: 'Кулирка с лайкрой «Пенье»',
          subtitle: "92% хлопок, 8% эластан, 180 г/м²",
          description:
            "Высококачественная кулирная гладь с добавлением эластана. Пенье — из длинноволокнистого хлопка.",
          sku: "TK-KUL-101",
          price: 450,
          inventory: 300,
          fabric_type: "kulirka",
          composition: "92% хлопок, 8% эластан, 180 г/м²",
          quality: "Пенье",
          width_cm: 180,
          measurement_unit: "running_meter",
          min_order: 0.5,
          order_step: 0.1,
          country: "Турция",
          collection_name: "Трикотаж базовый",
          color: "Тёмно-синий",
          color_hex: "#1B1B6F",
          short_description: "Кулирка с лайкрой, Пенье, Турция",
          full_description:
            "Высококачественная кулирная гладь с добавлением эластана.",
          video_url: "",
          discount_percent: 0,
        },
      ],
    };

    const blob = new Blob([JSON.stringify(template, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "product-template.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return {
    products,
    fileName,
    validationErrors,
    importing,
    progress,
    results,
    error,
    fileInputRef,
    handleFileSelect,
    handleImport,
    handleReset,
    downloadTemplate,
  };
}
