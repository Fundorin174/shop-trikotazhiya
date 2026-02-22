"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { ShoppingCart, Menu, X, Search } from "lucide-react";
import { useCartStore } from "@/store/cart-store";

/**
 * Шапка сайта — навигация, поиск, корзина.
 * Client Component из-за мобильного меню и счётчика корзины.
 */
export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const itemCount = useCartStore((s) => s.itemCount);
  const refreshCart = useCartStore((s) => s.refreshCart);

  // При загрузке страницы — синхронизировать корзину с сервером
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const navigation = [
    { name: "Каталог", href: "/catalog" },
    { name: "О магазине", href: "/about" },
    { name: "Доставка и оплата", href: "/delivery" },
    { name: "Контакты", href: "/contacts" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-primary-200 bg-white/95 backdrop-blur">
      <div className="container-shop">
        <div className="flex h-16 items-center justify-between">
          {/* Логотип */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 text-primary-800"
          >
            <Image
              src="/logo-64.png"
              alt="Трикотажия"
              width={40}
              height={40}
              className="shrink-0 rounded-full"
              priority
            />
            <span className="hidden font-brand text-2xl font-normal xs:inline">Трикотажия</span>
          </Link>

          {/* Навигация — десктоп */}
          <nav aria-label="Основная навигация" className="hidden items-center gap-8 md:flex">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-gray-700 transition-colors hover:text-primary-700"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Правая часть: поиск + корзина */}
          <div className="flex items-center gap-4">
            <button
              aria-label="Поиск"
              className="rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-primary-700"
            >
              <Search className="h-5 w-5" />
            </button>

            <Link
              href="/cart"
              className="relative rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-primary-700"
              aria-label="Корзина"
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent-600 text-[11px] font-bold text-white">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </Link>

            {/* Бургер — мобильное меню */}
            <button
              className="rounded-md p-2 text-gray-600 md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Меню"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Мобильное меню */}
        {mobileMenuOpen && (
          <nav aria-label="Мобильная навигация" className="border-t border-gray-200 py-4 md:hidden">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block py-2 text-sm font-medium text-gray-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
