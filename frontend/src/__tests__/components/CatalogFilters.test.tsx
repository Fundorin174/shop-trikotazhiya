/**
 * Тесты компонента CatalogFilters.
 * Проверяем: фильтр по типу, цена, сортировка, сброс.
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Мокаем хук фильтров
const mockUpdateFilter = jest.fn();
const mockResetFilters = jest.fn();
let mockMinPrice = "";
let mockMaxPrice = "";
const mockSetMinPrice = jest.fn((v: string) => { mockMinPrice = v; });
const mockSetMaxPrice = jest.fn((v: string) => { mockMaxPrice = v; });

jest.mock("@/hooks/useCatalogFilters", () => ({
  useCatalogFilters: () => ({
    minPrice: mockMinPrice,
    setMinPrice: mockSetMinPrice,
    maxPrice: mockMaxPrice,
    setMaxPrice: mockSetMaxPrice,
    updateFilter: mockUpdateFilter,
    resetFilters: mockResetFilters,
  }),
}));

// Мокаем ColorDropdown
jest.mock("@/components/catalog/ColorDropdown", () => ({
  ColorDropdown: (props: { currentColor?: string; onSelect: (c: string | null) => void }) =>
    React.createElement(
      "select",
      {
        "data-testid": "color-dropdown",
        value: props.currentColor || "",
        onChange: (e: React.ChangeEvent<HTMLSelectElement>) =>
          props.onSelect(e.target.value || null),
      },
      React.createElement("option", { value: "" }, "Все цвета"),
      React.createElement("option", { value: "Белый" }, "Белый"),
    ),
}));

import { CatalogFilters } from "@/components/catalog/CatalogFilters";

describe("CatalogFilters", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMinPrice = "";
    mockMaxPrice = "";
  });

  it("рендерит заголовок и кнопку сброса", () => {
    render(<CatalogFilters currentFilters={{}} />);
    expect(screen.getByText("Фильтры")).toBeInTheDocument();
    expect(screen.getByText("Сбросить")).toBeInTheDocument();
  });

  it("рендерит все типы тканей", () => {
    render(<CatalogFilters currentFilters={{}} />);
    expect(screen.getByText("Кулирка")).toBeInTheDocument();
    expect(screen.getByText("Футер")).toBeInTheDocument();
    expect(screen.getByText("Капитоний")).toBeInTheDocument();
    expect(screen.getByText("Кашкорсе")).toBeInTheDocument();
    expect(screen.getByText("Интерлок")).toBeInTheDocument();
    expect(screen.getByText("Фурнитура")).toBeInTheDocument();
  });

  it("выделяет активный тип ткани", () => {
    render(<CatalogFilters currentFilters={{ type: "kulirka" }} />);
    const btn = screen.getByText("Кулирка");
    expect(btn.className).toContain("bg-primary-500");
  });

  it("вызывает updateFilter при клике на тип ткани", async () => {
    const user = userEvent.setup();
    render(<CatalogFilters currentFilters={{}} />);

    await user.click(screen.getByText("Футер"));
    expect(mockUpdateFilter).toHaveBeenCalledWith("type", "footer");
  });

  it("снимает фильтр при повторном клике на активный тип", async () => {
    const user = userEvent.setup();
    render(<CatalogFilters currentFilters={{ type: "footer" }} />);

    await user.click(screen.getByText("Футер"));
    expect(mockUpdateFilter).toHaveBeenCalledWith("type", null);
  });

  it("вызывает resetFilters при клике на Сбросить", async () => {
    const user = userEvent.setup();
    render(<CatalogFilters currentFilters={{ type: "kulirka" }} />);

    await user.click(screen.getByText("Сбросить"));
    expect(mockResetFilters).toHaveBeenCalled();
  });

  describe("фильтр цены", () => {
    it("рендерит поля ввода цены", () => {
      render(<CatalogFilters currentFilters={{}} />);
      expect(screen.getByPlaceholderText("от")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("до")).toBeInTheDocument();
    });

    it("вызывает setMinPrice при вводе цены", async () => {
      const user = userEvent.setup();
      render(<CatalogFilters currentFilters={{}} />);

      const minInput = screen.getByPlaceholderText("от");
      await user.type(minInput, "100");

      // setMinPrice вызывается на каждое нажатие
      expect(mockSetMinPrice).toHaveBeenCalled();
    });
  });

  describe("сортировка", () => {
    it("рендерит select с опциями сортировки", () => {
      render(<CatalogFilters currentFilters={{}} />);
      const select = screen.getByDisplayValue("Новинки");
      expect(select).toBeInTheDocument();
    });

    it("показывает текущую сортировку", () => {
      render(<CatalogFilters currentFilters={{ sort: "price_asc" }} />);
      const select = screen.getByDisplayValue("Цена: по возрастанию");
      expect(select).toBeInTheDocument();
    });

    it("вызывает updateFilter при изменении сортировки", async () => {
      const user = userEvent.setup();
      render(<CatalogFilters currentFilters={{}} />);

      const select = screen.getByDisplayValue("Новинки");
      await user.selectOptions(select, "price_asc");
      expect(mockUpdateFilter).toHaveBeenCalledWith("sort", "price_asc");
    });
  });
});
