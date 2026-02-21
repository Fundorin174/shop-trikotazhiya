/**
 * Zustand-хранилище корзины.
 * Синхронизируется с Medusa Cart API.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CartState {
  cartId: string | null;
  itemCount: number;
  setCartId: (id: string) => void;
  setItemCount: (count: number) => void;
  reset: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      cartId: null,
      itemCount: 0,
      setCartId: (id: string) => set({ cartId: id }),
      setItemCount: (count: number) => set({ itemCount: count }),
      reset: () => set({ cartId: null, itemCount: 0 }),
    }),
    {
      name: "trikotazhiya-cart", // localStorage key
    }
  )
);
