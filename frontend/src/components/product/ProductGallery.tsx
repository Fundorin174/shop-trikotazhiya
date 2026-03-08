"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import type { ProductImage } from "@/types/product";
import { FabricPlaceholder } from "@/components/ui/FabricPlaceholder";

interface ProductGalleryProps {
  images: ProductImage[];
  thumbnail?: string | null;
  title: string;
}

/**
 * Галерея изображений товара — основное фото + миниатюры.
 * Клик по основному фото открывает полноэкранный слайдер.
 */
export const ProductGallery = ({
  images,
  thumbnail,
  title,
}: ProductGalleryProps) => {
  // Собираем все изображения: thumbnail + images
  const allImages = [
    ...(thumbnail ? [{ id: "thumb", url: thumbnail }] : []),
    ...images.filter((img) => img.url !== thumbnail),
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const activeImage = allImages[activeIndex];

  const openLightbox = useCallback((idx: number) => {
    setActiveIndex(idx);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % allImages.length);
  }, [allImages.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  }, [allImages.length]);

  // Клавиатурная навигация в лайтбоксе
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    document.addEventListener("keydown", handleKey);
    // Блокируем скролл body
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [lightboxOpen, goNext, goPrev, closeLightbox]);

  if (allImages.length === 0) {
    return (
      <div className="aspect-square overflow-hidden rounded-lg">
        <FabricPlaceholder />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Основное изображение */}
      <div
        className="relative aspect-square cursor-zoom-in overflow-hidden rounded-lg bg-gray-100"
        onClick={() => openLightbox(activeIndex)}
      >
        <Image
          src={activeImage.url}
          alt={`${title} — фото ${activeIndex + 1}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={activeIndex === 0}
        />
      </div>

      {/* Миниатюры */}
      {allImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto">
          {allImages.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setActiveIndex(idx)}
              className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
                idx === activeIndex
                  ? "border-primary-600"
                  : "border-transparent hover:border-gray-300"
              }`}
            >
              <Image
                src={img.url}
                alt={`${title} — миниатюра ${idx + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Полноэкранный лайтбокс */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
          onClick={closeLightbox}
        >
          {/* Кнопка закрытия */}
          <button
            onClick={closeLightbox}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white backdrop-blur transition-colors hover:bg-white/20"
            aria-label="Закрыть"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Счётчик */}
          {allImages.length > 1 && (
            <div className="absolute left-4 top-4 rounded-full bg-white/10 px-3 py-1 text-sm text-white backdrop-blur">
              {activeIndex + 1} / {allImages.length}
            </div>
          )}

          {/* Стрелка влево */}
          {allImages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur transition-colors hover:bg-white/20 sm:left-4"
              aria-label="Предыдущее фото"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Изображение */}
          <div
            className="relative h-[85vh] w-[90vw] max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={allImages[activeIndex].url}
              alt={`${title} — фото ${activeIndex + 1}`}
              fill
              className="object-contain"
              sizes="90vw"
              priority
            />
          </div>

          {/* Стрелка вправо */}
          {allImages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur transition-colors hover:bg-white/20 sm:right-4"
              aria-label="Следующее фото"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Миниатюры внизу */}
          {allImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 overflow-x-auto rounded-lg bg-white/10 p-2 backdrop-blur">
              {allImages.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={(e) => { e.stopPropagation(); setActiveIndex(idx); }}
                  className={`relative h-12 w-12 flex-shrink-0 overflow-hidden rounded border-2 transition-colors ${
                    idx === activeIndex
                      ? "border-white"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={img.url}
                    alt={`${title} — миниатюра ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
