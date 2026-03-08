"use client";

import { useState, useRef, useCallback } from "react";
import type { ImportProduct, ImportResponse } from "@/types/admin";
import {
  VALID_FABRIC_TYPES,
  FABRIC_LABELS,
  EMPTY_FORM,
  MAX_IMAGE_SIZE,
} from "@/lib/admin/constants";

interface AddProductFormProps {
  token: string;
  onCreated?: () => void;
}

interface DuplicateInfo {
  id: string;
  title: string;
  handle: string;
  sku: string;
}

/** Форма ручного добавления товара */
export const AddProductForm = ({ token, onCreated }: AddProductFormProps) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCompressHint, setShowCompressHint] = useState(false);
  const [duplicateProduct, setDuplicateProduct] = useState<DuplicateInfo | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const imgInputRef = useRef<HTMLInputElement>(null);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const tooBig = files.filter((f) => f.size > MAX_IMAGE_SIZE);
    if (tooBig.length > 0) {
      const names = tooBig
        .map((f) => `«${f.name}» (${(f.size / 1024).toFixed(0)} КБ)`)
        .join(", ");
      setError(
        `Файлы превышают 300 КБ: ${names}. Сожмите их на сервисе iloveimg.com и попробуйте снова.`,
      );
      setShowCompressHint(true);
      if (e.target) e.target.value = "";
      return;
    }

    setShowCompressHint(false);
    const newImages = [...images, ...files];
    setImages(newImages);
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (idx: number) => {
    URL.revokeObjectURL(imagePreviews[idx]);
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    imagePreviews.forEach((u) => URL.revokeObjectURL(u));
    setImages([]);
    setImagePreviews([]);
    setError("");
    setSuccess("");
    setShowCompressHint(false);
    if (imgInputRef.current) imgInputRef.current.value = "";
  };

  // Валидация полей формы
  const validateForm = (): boolean => {
    if (!form.title.trim()) {
      setError("Укажите название");
      return false;
    }
    if (!form.sku.trim()) {
      setError("Укажите SKU");
      return false;
    }
    if (!form.price || parseFloat(form.price) <= 0) {
      setError("Укажите корректную цену");
      return false;
    }
    if (!form.fabric_type) {
      setError("Выберите тип ткани");
      return false;
    }
    if (!form.composition.trim()) {
      setError("Укажите состав");
      return false;
    }
    if (!form.width_cm || parseFloat(form.width_cm) <= 0) {
      setError("Укажите ширину");
      return false;
    }
    return true;
  };

  // Отправка товара на сервер (с опциональной перезаписью)
  const submitProduct = useCallback(async (overwrite = false) => {
    setSubmitting(true);
    setShowDuplicateModal(false);
    setDuplicateProduct(null);

    try {
      // 1. Загружаем изображения
      let imageUrls: string[] = [];
      if (images.length > 0) {
        setUploading(true);
        const fd = new FormData();
        images.forEach((f) => fd.append("files", f));
        const uploadRes = await fetch("/api/admin/upload", {
          method: "POST",
          headers: { "x-admin-token": token },
          body: fd,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok)
          throw new Error(uploadData.error || "Ошибка загрузки изображений");
        imageUrls = uploadData.urls || [];
        setUploading(false);
      }

      // 2. Формируем JSON товара
      const product: ImportProduct = {
        title: form.title.trim(),
        sku: form.sku.trim(),
        price: parseFloat(form.price),
        fabric_type: form.fabric_type,
        composition: form.composition.trim(),
        width_cm: parseFloat(form.width_cm),
        measurement_unit: form.measurement_unit,
      };
      if (form.inventory) product.inventory = parseFloat(form.inventory);
      if (form.handle.trim()) product.handle = form.handle.trim();
      if (form.description.trim())
        product.description = form.description.trim();
      if (form.subtitle.trim()) product.subtitle = form.subtitle.trim();
      if (form.color.trim()) product.color = form.color.trim();
      if (form.color_hex.trim()) product.color_hex = form.color_hex.trim();
      if (form.country.trim()) product.country = form.country.trim();
      if (form.quality.trim()) product.quality = form.quality.trim();
      if (form.collection_name.trim())
        product.collection_name = form.collection_name.trim();
      if (form.video_url.trim()) product.video_url = form.video_url.trim();
      if (form.short_description.trim())
        product.short_description = form.short_description.trim();
      if (form.full_description.trim())
        product.full_description = form.full_description.trim();
      if (form.min_order) product.min_order = parseFloat(form.min_order);
      if (form.order_step) product.order_step = parseFloat(form.order_step);
      if (form.discount_percent)
        product.discount_percent = parseFloat(form.discount_percent);
      if (form.discount_amount)
        product.discount_amount = parseFloat(form.discount_amount);
      if (imageUrls.length > 0) {
        product.thumbnail = imageUrls[0];
        product.images = imageUrls;
      }

      // 3. Отправляем через существующий import API
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, products: [product], overwrite }),
      });
      const data: ImportResponse = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка создания");

      const result = data.results?.[0];
      if (result && !result.success) {
        throw new Error(result.message);
      }

      setSuccess(
        overwrite
          ? `Товар «${form.title}» успешно перезаписан!`
          : `Товар «${form.title}» успешно создан!`,
      );
      resetForm();
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка создания товара");
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  }, [form, images, token, onCreated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) return;

    // Проверяем, существует ли товар с таким SKU
    try {
      setSubmitting(true);
      const checkRes = await fetch(
        `/api/admin/check-sku?sku=${encodeURIComponent(form.sku.trim())}`,
        { headers: { "x-admin-token": token } },
      );
      const checkData = await checkRes.json();

      if (checkData.exists) {
        // Товар с таким SKU уже есть — показываем модалку
        setDuplicateProduct(checkData.product);
        setShowDuplicateModal(true);
        setSubmitting(false);
        return;
      }
    } catch {
      // Если проверка не удалась — продолжаем создание
    }

    // SKU свободен — создаём как обычно
    setSubmitting(false);
    await submitProduct(false);
  };

  const inputCls =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
  const labelCls = "mb-1 block text-xs font-medium text-gray-600";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Модалка подтверждения перезаписи дубликата */}
      {showDuplicateModal && duplicateProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Товар уже существует
              </h3>
            </div>

            <p className="mb-2 text-sm text-gray-600">
              В базе данных уже есть товар с SKU <span className="font-mono font-semibold text-gray-900">{duplicateProduct.sku}</span>:
            </p>
            <div className="mb-4 rounded-lg bg-gray-50 p-3">
              <p className="text-sm font-medium text-gray-900">{duplicateProduct.title}</p>
              <p className="mt-0.5 text-xs text-gray-500">handle: {duplicateProduct.handle}</p>
            </div>
            <p className="mb-5 text-sm text-gray-600">
              Хотите перезаписать существующий товар новыми данными? Старый товар будет удалён и создан заново.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDuplicateModal(false);
                  setDuplicateProduct(null);
                }}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => submitProduct(true)}
                className="flex-1 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-amber-700"
              >
                Перезаписать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Основные поля */}
      <div className="rounded-xl border border-gray-200 p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-800">
          Основное *
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Название *</label>
            <input
              className={inputCls}
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="Кулирка пенье серый меланж"
            />
          </div>
          <div>
            <label className={labelCls}>SKU *</label>
            <input
              className={inputCls}
              value={form.sku}
              onChange={(e) => updateField("sku", e.target.value)}
              placeholder="00301"
            />
          </div>
          <div>
            <label className={labelCls}>Тип ткани *</label>
            <select
              className={inputCls}
              value={form.fabric_type}
              onChange={(e) => updateField("fabric_type", e.target.value)}
            >
              <option value="">Выберите...</option>
              {VALID_FABRIC_TYPES.map((t) => (
                <option key={t} value={t}>
                  {FABRIC_LABELS[t] || t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Состав *</label>
            <input
              className={inputCls}
              value={form.composition}
              onChange={(e) => updateField("composition", e.target.value)}
              placeholder="100% хлопок"
            />
          </div>
          <div>
            <label className={labelCls}>Ширина (см) *</label>
            <input
              type="number"
              min="1"
              className={inputCls}
              value={form.width_cm}
              onChange={(e) => updateField("width_cm", e.target.value)}
              placeholder="180"
            />
          </div>
          <div>
            <label className={labelCls}>Единица измерения</label>
            <select
              className={inputCls}
              value={form.measurement_unit}
              onChange={(e) => updateField("measurement_unit", e.target.value)}
            >
              <option value="running_meter">Метры (погонный метр)</option>
              <option value="piece">Штуки</option>
            </select>
          </div>
        </div>
      </div>

      {/* Цена и запас */}
      <div className="rounded-xl border border-gray-200 p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-800">
          Цена и запас
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls}>
              Цена (₽) *{" "}
              {form.measurement_unit === "running_meter"
                ? "за 1 метр"
                : "за штуку"}
            </label>
            <input
              type="number"
              min="0"
              step="1"
              className={inputCls}
              value={form.price}
              onChange={(e) => updateField("price", e.target.value)}
              placeholder="1100"
            />
          </div>
          <div>
            <label className={labelCls}>
              Запас{" "}
              {form.measurement_unit === "running_meter"
                ? "(в см, напр. 30000 = 300м)"
                : "(штук)"}
            </label>
            <input
              type="number"
              min="0"
              className={inputCls}
              value={form.inventory}
              onChange={(e) => updateField("inventory", e.target.value)}
              placeholder={
                form.measurement_unit === "running_meter" ? "30000" : "100"
              }
            />
          </div>
        </div>
      </div>

      {/* Скидка */}
      <div className="rounded-xl border border-gray-200 p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-800">Скидка</h3>
        <p className="mb-2 text-xs text-gray-500">
          Укажите процент или фиксированную сумму (или оба). Оставьте пустым,
          если скидки нет.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Скидка (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              className={inputCls}
              value={form.discount_percent}
              onChange={(e) => updateField("discount_percent", e.target.value)}
              placeholder="10"
            />
          </div>
          <div>
            <label className={labelCls}>Скидка (₽)</label>
            <input
              type="number"
              min="0"
              step="1"
              className={inputCls}
              value={form.discount_amount}
              onChange={(e) => updateField("discount_amount", e.target.value)}
              placeholder="100"
            />
          </div>
        </div>
      </div>

      {/* Изображения */}
      <div className="rounded-xl border border-gray-200 p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-800">
          Изображения
        </h3>
        <p className="mb-2 text-xs text-gray-500">
          Первое изображение станет обложкой (thumbnail). Рекомендуемое
          разрешение: 800×600 px, макс. размер: 300 КБ.
        </p>

        {showCompressHint && (
          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Фото превышает 300 КБ. Сожмите его с помощью сервиса:{" "}
            <a
              href="https://www.iloveimg.com/ru/compress-image"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-amber-900 underline hover:text-amber-700"
            >
              iLoveIMG — Сжать изображение ↗
            </a>
          </div>
        )}

        {imagePreviews.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {imagePreviews.map((src, idx) => (
              <div key={idx} className="group relative">
                <img
                  src={src}
                  alt={`Фото ${idx + 1}`}
                  className={`h-20 w-20 rounded-lg border-2 object-cover ${
                    idx === 0 ? "border-blue-500" : "border-gray-200"
                  }`}
                />
                {idx === 0 && (
                  <span className="absolute -top-1.5 left-1 rounded bg-blue-500 px-1 text-[9px] font-bold text-white">
                    Обложка
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute -right-1.5 -top-1.5 hidden rounded-full bg-red-500 p-0.5 text-white shadow group-hover:block"
                >
                  <svg
                    className="h-3 w-3"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-500 transition-colors hover:border-blue-400 hover:bg-blue-50/30">
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Добавить фото
          <input
            ref={imgInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />
        </label>
      </div>

      {/* Дополнительные поля */}
      <details className="rounded-xl border border-gray-200">
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-gray-800">
          Дополнительно
        </summary>
        <div className="grid gap-3 px-4 pb-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Handle (URL-слаг)</label>
            <input
              className={inputCls}
              value={form.handle}
              onChange={(e) => updateField("handle", e.target.value)}
              placeholder="Автоматически из названия"
            />
          </div>
          <div>
            <label className={labelCls}>Подзаголовок</label>
            <input
              className={inputCls}
              value={form.subtitle}
              onChange={(e) => updateField("subtitle", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Цвет</label>
            <input
              className={inputCls}
              value={form.color}
              onChange={(e) => updateField("color", e.target.value)}
              placeholder="Серый меланж"
            />
          </div>
          <div>
            <label className={labelCls}>Цвет (HEX)</label>
            <input
              className={inputCls}
              value={form.color_hex}
              onChange={(e) => updateField("color_hex", e.target.value)}
              placeholder="#808080"
            />
          </div>
          <div>
            <label className={labelCls}>Качество</label>
            <input
              className={inputCls}
              value={form.quality}
              onChange={(e) => updateField("quality", e.target.value)}
              placeholder="Пенье"
            />
          </div>
          <div>
            <label className={labelCls}>Страна</label>
            <input
              className={inputCls}
              value={form.country}
              onChange={(e) => updateField("country", e.target.value)}
              placeholder="Турция"
            />
          </div>
          <div>
            <label className={labelCls}>Коллекция</label>
            <input
              className={inputCls}
              value={form.collection_name}
              onChange={(e) => updateField("collection_name", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>URL видео</label>
            <input
              className={inputCls}
              value={form.video_url}
              onChange={(e) => updateField("video_url", e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div>
            <label className={labelCls}>
              Мин. заказ{" "}
              {form.measurement_unit === "running_meter" ? "(м)" : "(шт)"}
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              className={inputCls}
              value={form.min_order}
              onChange={(e) => updateField("min_order", e.target.value)}
              placeholder={
                form.measurement_unit === "running_meter" ? "0.5" : "1"
              }
            />
          </div>
          <div>
            <label className={labelCls}>
              Шаг заказа{" "}
              {form.measurement_unit === "running_meter" ? "(м)" : "(шт)"}
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              className={inputCls}
              value={form.order_step}
              onChange={(e) => updateField("order_step", e.target.value)}
              placeholder={
                form.measurement_unit === "running_meter" ? "0.1" : "1"
              }
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Краткое описание</label>
            <input
              className={inputCls}
              value={form.short_description}
              onChange={(e) => updateField("short_description", e.target.value)}
              placeholder="Короткое описание для карточки"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Описание</label>
            <textarea
              className={inputCls + " min-h-[80px] resize-y"}
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Подробное описание товара..."
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Полное описание (HTML)</label>
            <textarea
              className={inputCls + " min-h-[80px] resize-y"}
              value={form.full_description}
              onChange={(e) => updateField("full_description", e.target.value)}
              placeholder="Расширенное описание с HTML-разметкой..."
            />
          </div>
        </div>
      </details>

      {/* Кнопки */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:bg-blue-400"
        >
          {uploading
            ? "Загрузка фото..."
            : submitting
              ? "Создание..."
              : "Создать товар"}
        </button>
        <button
          type="button"
          onClick={resetForm}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-100"
        >
          Очистить
        </button>
      </div>
    </form>
  );
};
