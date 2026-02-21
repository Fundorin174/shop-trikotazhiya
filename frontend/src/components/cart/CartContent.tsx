"use client";

/**
 * Содержимое страницы корзины.
 * Client Component — управляет состоянием корзины.
 */
export function CartContent() {
  // TODO: подключить к Medusa Cart API через zustand store
  return (
    <div className="mt-8">
      <p className="text-gray-500">Корзина пуста</p>
      <a href="/catalog" className="mt-4 inline-block text-accent-600 hover:underline">
        Перейти в каталог →
      </a>
    </div>
  );
}
