/**
 * Отдельный layout для /admin — без магазинного Header/Footer.
 * Сохраняет шрифты и базовые стили, но убирает навигацию, корзину и т.д.
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Админ-панель | Трикотажия",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
