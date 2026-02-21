"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

/**
 * Баннер согласия на использование файлов cookie.
 * Требование 152-ФЗ: уведомление об использовании cookie + ссылка на политику конфиденциальности.
 * Согласие сохраняется в localStorage.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Уведомление об использовании cookie"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-primary-200 bg-white px-4 py-4 shadow-lg sm:px-6"
    >
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-700">
          Мы используем файлы cookie для корректной работы сайта и улучшения
          качества обслуживания. Продолжая использование сайта, вы соглашаетесь с{" "}
          <Link
            href="/privacy"
            className="font-medium text-accent-600 underline hover:text-accent-700"
          >
            политикой конфиденциальности
          </Link>
          .
        </p>
        <button
          onClick={accept}
          className="shrink-0 rounded-md bg-primary-400 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2"
        >
          Принять
        </button>
      </div>
    </div>
  );
}
