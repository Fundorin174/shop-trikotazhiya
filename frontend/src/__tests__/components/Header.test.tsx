/**
 * Тесты компонента Header.
 * Проверяем: навигация, корзина, мобильное меню.
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Мокаем lucide-react (используется ShoppingCart, Menu, X)
jest.mock("lucide-react", () => ({
  ShoppingCart: (props: Record<string, unknown>) =>
    React.createElement("svg", { ...props, "data-testid": "icon-cart" }),
  Menu: (props: Record<string, unknown>) =>
    React.createElement("svg", { ...props, "data-testid": "icon-menu" }),
  X: (props: Record<string, unknown>) =>
    React.createElement("svg", { ...props, "data-testid": "icon-x" }),
}));

// Мокаем zustand store
const mockRefreshCart = jest.fn();
jest.mock("@/store/cart-store", () => ({
  useCartStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      itemCount: 3,
      refreshCart: mockRefreshCart,
    }),
}));

import { Header } from "@/components/layout/Header";

describe("Header", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("рендерит логотип", () => {
    render(<Header />);
    const logo = screen.getByAltText("Трикотажия");
    expect(logo).toBeInTheDocument();
  });

  it("рендерит все навигационные ссылки", () => {
    render(<Header />);
    expect(screen.getByText("Каталог")).toBeInTheDocument();
    expect(screen.getByText("О магазине")).toBeInTheDocument();
    expect(screen.getByText("Доставка и оплата")).toBeInTheDocument();
    expect(screen.getByText("Контакты")).toBeInTheDocument();
  });

  it("ссылки ведут на правильные URL", () => {
    render(<Header />);
    expect(screen.getByText("Каталог").closest("a")).toHaveAttribute("href", "/catalog");
    expect(screen.getByText("О магазине").closest("a")).toHaveAttribute("href", "/about");
    expect(screen.getByText("Доставка и оплата").closest("a")).toHaveAttribute("href", "/delivery");
    expect(screen.getByText("Контакты").closest("a")).toHaveAttribute("href", "/contacts");
  });

  it("показывает счётчик корзины", () => {
    render(<Header />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("ссылка корзины ведёт на /cart", () => {
    render(<Header />);
    const cartLink = screen.getByLabelText("Корзина");
    expect(cartLink).toHaveAttribute("href", "/cart");
  });

  it("вызывает refreshCart при монтировании", () => {
    render(<Header />);
    expect(mockRefreshCart).toHaveBeenCalled();
  });

  describe("мобильное меню", () => {
    it("открывается по кнопке Меню", async () => {
      const user = userEvent.setup();
      render(<Header />);

      const menuBtn = screen.getByLabelText("Меню");
      await user.click(menuBtn);

      const mobileNav = screen.getByLabelText("Мобильная навигация");
      expect(mobileNav).toBeInTheDocument();
    });

    it("закрывается по повторному нажатию", async () => {
      const user = userEvent.setup();
      render(<Header />);

      const menuBtn = screen.getByLabelText("Меню");
      await user.click(menuBtn);
      await user.click(menuBtn);

      expect(screen.queryByLabelText("Мобильная навигация")).not.toBeInTheDocument();
    });
  });
});
