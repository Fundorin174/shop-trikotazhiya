/**
 * Тесты Zustand-хранилища корзины.
 * Мокаем API-вызовы cart.ts, тестируем логику стейта.
 */
import { act } from "@testing-library/react";
import { useCartStore } from "@/store/cart-store";
import type { MedusaCart, MedusaCartLineItem } from "@/lib/data/cart";

// ============================================
// Мокаем модуль cart API
// ============================================
jest.mock("@/lib/data/cart", () => ({
  createCart: jest.fn(),
  getCart: jest.fn(),
  addLineItem: jest.fn(),
  updateLineItem: jest.fn(),
  removeLineItem: jest.fn(),
  fetchProductImage: jest.fn(),
}));

import {
  createCart,
  getCart,
  addLineItem,
  updateLineItem,
  removeLineItem,
  fetchProductImage,
} from "@/lib/data/cart";

const mockCreateCart = createCart as jest.MockedFunction<typeof createCart>;
const mockGetCart = getCart as jest.MockedFunction<typeof getCart>;
const mockAddLineItem = addLineItem as jest.MockedFunction<typeof addLineItem>;
const mockUpdateLineItem = updateLineItem as jest.MockedFunction<typeof updateLineItem>;
const mockRemoveLineItem = removeLineItem as jest.MockedFunction<typeof removeLineItem>;
const mockFetchProductImage = fetchProductImage as jest.MockedFunction<typeof fetchProductImage>;

// ============================================
// Хелперы для тестовых данных
// ============================================
const makeLineItem = (overrides: Partial<MedusaCartLineItem> = {}): MedusaCartLineItem => ({
  id: "li_1",
  title: "Кулирка Нежная",
  variant_id: "var_1",
  product_id: "prod_1",
  product_title: "Кулирка Нежная",
  product_handle: "kulirka-nezhnaya",
  thumbnail: null,
  quantity: 100,
  unit_price: 450,
  subtotal: 45000,
  total: 45000,
  metadata: { measurement_unit: "running_meter" },
  ...overrides,
});

const makeCart = (items: MedusaCartLineItem[] = []): MedusaCart => ({
  id: "cart_test",
  items,
  subtotal: items.reduce((sum, i) => sum + (i.subtotal ?? 0), 0),
  total: items.reduce((sum, i) => sum + (i.total ?? 0), 0),
});

// ============================================
// Тесты
// ============================================
describe("useCartStore", () => {
  beforeEach(() => {
    // Сбрасываем стейт перед каждым тестом
    act(() => {
      useCartStore.getState().reset();
    });
    jest.clearAllMocks();
  });

  describe("начальное состояние", () => {
    it("cartId = null, items пустой, total = 0", () => {
      const state = useCartStore.getState();
      expect(state.cartId).toBeNull();
      expect(state.items).toEqual([]);
      expect(state.itemCount).toBe(0);
      expect(state.total).toBe(0);
      expect(state.loading).toBe(false);
    });
  });

  describe("ensureCart", () => {
    it("создаёт корзину при первом вызове", async () => {
      const cart = makeCart();
      mockCreateCart.mockResolvedValue({ cart });

      let id: string;
      await act(async () => {
        id = await useCartStore.getState().ensureCart();
      });

      expect(mockCreateCart).toHaveBeenCalledTimes(1);
      expect(id!).toBe("cart_test");
      expect(useCartStore.getState().cartId).toBe("cart_test");
    });

    it("не создаёт повторно, если cartId уже есть", async () => {
      // Первый вызов — создаём
      mockCreateCart.mockResolvedValue({ cart: makeCart() });
      await act(async () => {
        await useCartStore.getState().ensureCart();
      });

      // Второй вызов — не создаём
      await act(async () => {
        const id = await useCartStore.getState().ensureCart();
        expect(id).toBe("cart_test");
      });

      expect(mockCreateCart).toHaveBeenCalledTimes(1);
    });
  });

  describe("addToCart", () => {
    it("добавляет товар и обновляет items/total", async () => {
      const item = makeLineItem();
      const cartEmpty = makeCart();
      const cartWithItem = makeCart([item]);

      mockCreateCart.mockResolvedValue({ cart: cartEmpty });
      mockAddLineItem.mockResolvedValue({ cart: cartWithItem });

      await act(async () => {
        await useCartStore.getState().addToCart("var_1", 100, {
          measurement_unit: "running_meter",
        });
      });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].variant_id).toBe("var_1");
      expect(state.total).toBe(45000);
      expect(state.loading).toBe(false);
    });

    it("сбрасывает loading при ошибке", async () => {
      mockCreateCart.mockResolvedValue({ cart: makeCart() });
      mockAddLineItem.mockRejectedValue(new Error("Network error"));

      await act(async () => {
        await expect(
          useCartStore.getState().addToCart("var_1", 1)
        ).rejects.toThrow("Network error");
      });

      expect(useCartStore.getState().loading).toBe(false);
    });
  });

  describe("updateItem", () => {
    it("обновляет количество позиции", async () => {
      const item = makeLineItem();
      const updatedItem = makeLineItem({ quantity: 200, total: 90000, subtotal: 90000 });

      // Устанавливаем начальное состояние
      mockCreateCart.mockResolvedValue({ cart: makeCart([item]) });
      await act(async () => {
        await useCartStore.getState().ensureCart();
      });

      mockUpdateLineItem.mockResolvedValue({ cart: makeCart([updatedItem]) });
      await act(async () => {
        await useCartStore.getState().updateItem("li_1", 200);
      });

      expect(useCartStore.getState().total).toBe(90000);
      expect(mockUpdateLineItem).toHaveBeenCalledWith("cart_test", "li_1", 200, undefined);
    });

    it("ничего не делает без cartId", async () => {
      await act(async () => {
        await useCartStore.getState().updateItem("li_1", 2);
      });
      expect(mockUpdateLineItem).not.toHaveBeenCalled();
    });
  });

  describe("removeItem", () => {
    it("удаляет позицию из корзины", async () => {
      const item = makeLineItem();
      mockCreateCart.mockResolvedValue({ cart: makeCart([item]) });
      await act(async () => {
        await useCartStore.getState().ensureCart();
      });

      mockRemoveLineItem.mockResolvedValue({ cart: makeCart([]) });
      await act(async () => {
        await useCartStore.getState().removeItem("li_1");
      });

      expect(useCartStore.getState().items).toHaveLength(0);
      expect(useCartStore.getState().total).toBe(0);
    });
  });

  describe("refreshCart", () => {
    it("обновляет данные корзины с сервера", async () => {
      const item = makeLineItem();
      mockCreateCart.mockResolvedValue({ cart: makeCart() });
      await act(async () => {
        await useCartStore.getState().ensureCart();
      });

      mockGetCart.mockResolvedValue({ cart: makeCart([item]) });
      await act(async () => {
        await useCartStore.getState().refreshCart();
      });

      expect(useCartStore.getState().items).toHaveLength(1);
      expect(useCartStore.getState().total).toBe(45000);
    });

    it("сбрасывает корзину при ошибке (устарела)", async () => {
      mockCreateCart.mockResolvedValue({ cart: makeCart() });
      await act(async () => {
        await useCartStore.getState().ensureCart();
      });

      mockGetCart.mockRejectedValue(new Error("Not found"));
      await act(async () => {
        await useCartStore.getState().refreshCart();
      });

      expect(useCartStore.getState().cartId).toBeNull();
      expect(useCartStore.getState().items).toEqual([]);
    });

    it("подтягивает фото для позиций без thumbnail", async () => {
      const item = makeLineItem({ thumbnail: null });
      mockCreateCart.mockResolvedValue({ cart: makeCart() });
      await act(async () => {
        await useCartStore.getState().ensureCart();
      });

      mockGetCart.mockResolvedValue({ cart: makeCart([item]) });
      mockFetchProductImage.mockResolvedValue("https://example.com/photo.jpg");

      await act(async () => {
        await useCartStore.getState().refreshCart();
      });

      expect(useCartStore.getState().productImages["prod_1"]).toBe(
        "https://example.com/photo.jpg"
      );
    });

    it("ничего не делает без cartId", async () => {
      await act(async () => {
        await useCartStore.getState().refreshCart();
      });
      expect(mockGetCart).not.toHaveBeenCalled();
    });
  });

  describe("reset", () => {
    it("полностью сбрасывает состояние", async () => {
      mockCreateCart.mockResolvedValue({
        cart: makeCart([makeLineItem()]),
      });
      await act(async () => {
        await useCartStore.getState().ensureCart();
      });

      act(() => {
        useCartStore.getState().reset();
      });

      const state = useCartStore.getState();
      expect(state.cartId).toBeNull();
      expect(state.items).toEqual([]);
      expect(state.total).toBe(0);
      expect(state.loading).toBe(false);
      expect(state.productImages).toEqual({});
    });
  });

  describe("cartToState (внутренняя логика)", () => {
    it("правильно суммирует total из нескольких позиций", async () => {
      const items = [
        makeLineItem({ id: "li_1", total: 10000 }),
        makeLineItem({ id: "li_2", total: 20000, product_id: "prod_2" }),
      ];
      mockCreateCart.mockResolvedValue({ cart: makeCart(items) });

      await act(async () => {
        await useCartStore.getState().ensureCart();
      });

      expect(useCartStore.getState().total).toBe(30000);
      expect(useCartStore.getState().itemCount).toBe(2);
    });

    it("использует subtotal если total не задан", async () => {
      const item = makeLineItem({
        total: undefined as unknown as number,
        subtotal: 5000,
      });
      const cart: MedusaCart = { id: "cart_test", items: [item] };
      mockCreateCart.mockResolvedValue({ cart });

      await act(async () => {
        await useCartStore.getState().ensureCart();
      });

      expect(useCartStore.getState().total).toBe(5000);
    });
  });
});
