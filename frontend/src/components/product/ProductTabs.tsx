"use client";

import { useState } from "react";
import type { Product, FabricMetadata } from "@/types/product";

interface ProductTabsProps {
  product: Product;
  fabricData: Record<string, unknown> | null;
}

/**
 * Вкладки карточки товара: Описание, Характеристики, Отзывы.
 */
export function ProductTabs({ product, fabricData }: ProductTabsProps) {
  const meta = fabricData as FabricMetadata | null;
  const [activeTab, setActiveTab] = useState<"description" | "specs" | "reviews">(
    "description"
  );

  const tabs = [
    { id: "description" as const, label: "Описание" },
    { id: "specs" as const, label: "Характеристики" },
    { id: "reviews" as const, label: "Отзывы" },
  ];

  return (
    <div>
      {/* Табы */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-primary-600 text-primary-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Контент */}
      <div className="py-6">
        {activeTab === "description" && (
          <div className="prose max-w-none text-gray-700">
            {meta?.full_description || product.description || (
              <p className="text-gray-400">Описание отсутствует</p>
            )}

            {/* Видео */}
            {meta?.video_url && (
              <div className="mt-6">
                <h3>Видео</h3>
                <a
                  href={meta.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-600 hover:underline"
                >
                  Смотреть видео о ткани →
                </a>
              </div>
            )}
          </div>
        )}

        {activeTab === "specs" && (
          <div className="text-sm text-gray-700">
            <p>Подробные характеристики ткани — см. блок выше.</p>
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="text-sm text-gray-500">
            <p>Отзывов пока нет. Будьте первым!</p>
            {/* TODO: система отзывов */}
          </div>
        )}
      </div>
    </div>
  );
}
