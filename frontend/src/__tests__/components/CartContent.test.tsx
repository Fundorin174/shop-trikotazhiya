/**
 * Тесты компонента CartContent.
 * Проверяем: пустая корзина, список позиций, refreshCart.
 */
import React from "react";
import { render, screen } from "@testing-library/react";

// Мокаем дочерние компоненты
jest.mock("@/components/cart/CartItemRow", () => ({
  CartItemRow: (props: { item: { id: string; product_title: string } }) =>
    React.createElement("li", { "data-testid": `cart-item-${props.item.id}` }, props.item.product_title),
}));

jest.mock("@/components/cart/CartSummary", () => ({
  CartSummary: (props: { total: number }) =>
    React.createElement("div", { "data-testid": "cart-summary" }, `Итого: ${props.total}`),
}));

// Мокаем zustand store
const mockRefreshCart = jest.fn();
const mockUpdateItem = jest.fn();
const mockRemoveItem = jest.fn();

let mockItems: Array<{
  id: string;
  product_title: string;
  product_id: string;
  thumbnail: string | null;
}> = [];
let mockTotal = 0;

jest.mock("@/store/cart-store", () => ({
  useCartStore: () => ({
    items: mockItems,
    total: mockTotal,
    loading: false,
    refreshCart: mockRefreshCart,
    updateItem: mockUpdateItem,
    removeItem: mockRemoveItem,
    productImages: {},
  }),
}));

import { CartContent } from "@/components/cart/CartContent";

describe("CartContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockItems = [];
    mockTotal = 0;
  });

  it("вызывает refreshCart при монтировании", () => {
    render(<CartContent />);
    expect(mockRefreshCart).toHaveBeenCalled();
  });

  describe("пустая корзина", () => {
    it("показывает сообщение 'Корзина пуста'", () => {
      render(<CartContent />);
      expect(screen.getByText("Корзина пуста")).toBeInTheDocument();
    });

    it("показывает ссылку на каталог", () => {
      render(<CartContent />);
      const link = screen.getByText(/Перейти в каталог/);
      expect(link).toHaveAttribute("href", "/catalog");
    });
  });

  describe("корзина с товарами", () => {
    beforeEach(() => {
      mockItems = [
        { id: "li_1", product_title: "Кулирка Нежная", product_id: "p1", thumbnail: null },
        { id: "li_2", product_title: "Футер Мягкий", product_id: "p2", thumbnail: null },
      ];
      mockTotal = 90000;
    });

    it("рендерит все позиции", () => {
      render(<CartContent />);
      expect(screen.getByTestId("cart-item-li_1")).toBeInTheDocument();
      expect(screen.getByTestId("cart-item-li_2")).toBeInTheDocument();
    });

    it("рендерит итого", () => {
      render(<CartContent />);
      expect(screen.getByTestId("cart-summary")).toHaveTextContent("90000");
    });

    it("не показывает 'Корзина пуста'", () => {
      render(<CartContent />);
      expect(screen.queryByText("Корзина пуста")).not.toBeInTheDocument();
    });
  });
});
