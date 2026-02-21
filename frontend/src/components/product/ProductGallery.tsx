"use client";

import { useState } from "react";
import Image from "next/image";
import type { ProductImage } from "@/types/product";

interface ProductGalleryProps {
  images: ProductImage[];
  thumbnail?: string | null;
  title: string;
}

/**
 * Галерея изображений товара — основное фото + миниатюры.
 * Поддержка увеличения и переключения.
 */
export function ProductGallery({
  images,
  thumbnail,
  title,
}: ProductGalleryProps) {
  // Собираем все изображения: thumbnail + images
  const allImages = [
    ...(thumbnail ? [{ id: "thumb", url: thumbnail }] : []),
    ...images.filter((img) => img.url !== thumbnail),
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = allImages[activeIndex];

  if (allImages.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-lg bg-gray-100 text-gray-400">
        Нет фото
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Основное изображение */}
      <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
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
    </div>
  );
}
