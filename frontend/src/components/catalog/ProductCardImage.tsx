"use client";

import { useState, useCallback } from "react";
import Image from "next/image";

interface ProductCardImageProps {
  src: string;
  alt: string;
}

/**
 * Изображение карточки товара с анимированным скелетоном.
 * Пока браузер загружает картинку — показывается pulse-заглушка,
 * после onLoad — плавное появление через opacity transition.
 */
export const ProductCardImage = ({ src, alt }: ProductCardImageProps) => {
  const [loaded, setLoaded] = useState(false);

  const handleLoad = useCallback(() => {
    setLoaded(true);
  }, []);

  return (
    <>
      {/* Скелетон — виден пока изображение не загрузилось */}
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gray-200" />
      )}
      <Image
        src={src}
        alt={alt}
        width={400}
        height={500}
        className={`h-full w-full object-cover transition-all duration-300 group-hover:scale-105 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
        loading="lazy"
        onLoad={handleLoad}
      />
    </>
  );
};
