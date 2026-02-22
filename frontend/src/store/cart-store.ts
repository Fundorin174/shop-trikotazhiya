/**
 * Zustand-хранилище корзины.
 * Синхронизируется с Medusa Cart API.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  createCart,
  getCart,
  addLineItem,
  updateLineItem,
  removeLineItem,
  fetchProductImage,
  type MedusaCart,
  type MedusaCartLineItem,
} from "@/lib/data/cart";

interface CartState {
  cartId: string | null;
  items: MedusaCartLineItem[];
  itemCount: number;
  total: number;
  loading: boolean;
  /** Карта product_id → URL актуального изображения */
  productImages: Record<string, string>;

  // Действия
  ensureCart: () => Promise<string>;
  addToCart: (variantId: string, quantity: number, metadata?: Record<string, unknown>) => Promise<void>;
  updateItem: (lineItemId: string, quantity: number, metadata?: Record<string, unknown>) => Promise<void>;
  removeItem: (lineItemId: string) => Promise<void>;
  refreshCart: () => Promise<void>;
  reset: () => void;
}

function cartToState(cart: MedusaCart) {
  const items = cart.items ?? [];
  // В админке ВСЕ цены в рублях. Для formatPrice() нужны копейки.
  // Ткани: Medusa total = price_руб × qty_см → уже в копейках (рубли × 100).
  // Штучные: Medusa total = price_руб × qty_шт → в рублях → нужно ×100.
  let total = 0;
  for (const item of items) {
    const lt = item.total ?? item.subtotal ?? (item.unit_price ?? 0) * (item.quantity ?? 1);
    const isFabric = item.metadata?.measurement_unit === "running_meter";
    total += isFabric ? lt : lt * 100;
  }
  return {
    items,
    itemCount: items.length,
    total,
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cartId: null,
      items: [],
      itemCount: 0,
      total: 0,
      loading: false,
      productImages: {},

      /**
       * Получить cartId — если нет, создать новую корзину.
       */
      ensureCart: async () => {
        const { cartId } = get();
        if (cartId) return cartId;

        const { cart } = await createCart();
        set({ cartId: cart.id, ...cartToState(cart) });
        return cart.id;
      },

      /**
       * Добавить товар (вариант) в корзину.
       * Для тканей: quantity=1, реальные метры в metadata.
       */
      addToCart: async (variantId: string, quantity: number, metadata?: Record<string, unknown>) => {
        set({ loading: true });
        try {
          const id = await get().ensureCart();
          const { cart } = await addLineItem(id, variantId, quantity, metadata);
          set({ ...cartToState(cart), loading: false });
        } catch (err) {
          set({ loading: false });
          throw err;
        }
      },

      /**
       * Обновить количество позиции (или метры через metadata).
       */
      updateItem: async (lineItemId: string, quantity: number, metadata?: Record<string, unknown>) => {
        const { cartId } = get();
        if (!cartId) return;

        set({ loading: true });
        try {
          const { cart } = await updateLineItem(cartId, lineItemId, quantity, metadata);
          set({ ...cartToState(cart), loading: false });
        } catch (err) {
          set({ loading: false });
          throw err;
        }
      },

      /**
       * Удалить позицию из корзины.
       */
      removeItem: async (lineItemId: string) => {
        const { cartId } = get();
        if (!cartId) return;

        set({ loading: true });
        try {
          const { cart } = await removeLineItem(cartId, lineItemId);
          set({ ...cartToState(cart), loading: false });
        } catch (err) {
          set({ loading: false });
          throw err;
        }
      },

      /**
       * Обновить данные корзины с сервера.
       * После загрузки подтягивает актуальные фото товаров.
       */
      refreshCart: async () => {
        const { cartId } = get();
        if (!cartId) return;

        try {
          const { cart } = await getCart(cartId);
          const state = cartToState(cart);
          set(state);

          // Подтянуть актуальные фото для позиций без thumbnail
          const items = state.items;
          const existing = get().productImages;
          const missing = items.filter(
            (i) => !i.thumbnail && !existing[i.product_id]
          );
          if (missing.length > 0) {
            const uniqueIds = [...new Set(missing.map((i) => i.product_id))];
            const results = await Promise.all(
              uniqueIds.map(async (pid) => [pid, await fetchProductImage(pid)] as const)
            );
            const newImages: Record<string, string> = { ...existing };
            for (const [pid, url] of results) {
              if (url) newImages[pid] = url;
            }
            set({ productImages: newImages });
          }
        } catch {
          // Корзина не найдена или устарела — сбросить
          set({ cartId: null, items: [], itemCount: 0, total: 0 });
        }
      },

      reset: () => set({ cartId: null, items: [], itemCount: 0, total: 0, loading: false, productImages: {} }),
    }),
    {
      name: "trikotazhiya-cart",
      partialize: (state) => ({
        cartId: state.cartId,
      }),
    }
  )
);
