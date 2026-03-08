/**
 * Тесты компонента ProductGallery.
 * Проверяем: отображение фото, миниатюры, лайтбокс, клавиатурная навигация.
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductGallery } from "@/components/product/ProductGallery";
import type { ProductImage } from "@/types/product";

// Мокаем FabricPlaceholder
jest.mock("@/components/ui/FabricPlaceholder", () => ({
  FabricPlaceholder: () =>
    React.createElement("div", { "data-testid": "fabric-placeholder" }, "placeholder"),
}));

const images: ProductImage[] = [
  { id: "img_1", url: "https://example.com/1.jpg" },
  { id: "img_2", url: "https://example.com/2.jpg" },
  { id: "img_3", url: "https://example.com/3.jpg" },
];

describe("ProductGallery", () => {
  describe("пустое состояние", () => {
    it("показывает placeholder при пустых images и без thumbnail", () => {
      render(<ProductGallery images={[]} title="Тест" />);
      expect(screen.getByTestId("fabric-placeholder")).toBeInTheDocument();
    });
  });

  describe("одно изображение (только thumbnail)", () => {
    it("показывает основное фото", () => {
      render(
        <ProductGallery
          images={[]}
          thumbnail="https://example.com/thumb.jpg"
          title="Кулирка"
        />
      );
      const img = screen.getByAltText("Кулирка — фото 1");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "https://example.com/thumb.jpg");
    });

    it("не показывает миниатюры для одного изображения", () => {
      render(
        <ProductGallery
          images={[]}
          thumbnail="https://example.com/thumb.jpg"
          title="Кулирка"
        />
      );
      expect(screen.queryByAltText("Кулирка — миниатюра 1")).not.toBeInTheDocument();
    });
  });

  describe("множество изображений", () => {
    it("показывает миниатюры", () => {
      render(
        <ProductGallery
          images={images}
          thumbnail="https://example.com/1.jpg"
          title="Ткань"
        />
      );
      expect(screen.getByAltText("Ткань — миниатюра 1")).toBeInTheDocument();
      expect(screen.getByAltText("Ткань — миниатюра 2")).toBeInTheDocument();
      expect(screen.getByAltText("Ткань — миниатюра 3")).toBeInTheDocument();
    });

    it("переключает активное фото при клике на миниатюру", async () => {
      const user = userEvent.setup();
      render(
        <ProductGallery images={images} thumbnail="https://example.com/1.jpg" title="Ткань" />
      );

      const thumb2 = screen.getByAltText("Ткань — миниатюра 2");
      await user.click(thumb2.closest("button")!);

      const mainImg = screen.getByAltText("Ткань — фото 2");
      expect(mainImg).toHaveAttribute("src", "https://example.com/2.jpg");
    });
  });

  describe("лайтбокс", () => {
    it("открывается при клике по основному фото", async () => {
      const user = userEvent.setup();
      render(
        <ProductGallery images={images} thumbnail="https://example.com/1.jpg" title="Ткань" />
      );

      const mainImageContainer = screen.getByAltText("Ткань — фото 1").closest("div[class*='cursor-zoom-in']");
      await user.click(mainImageContainer!);

      expect(screen.getByLabelText("Закрыть")).toBeInTheDocument();
    });

    it("показывает стрелки навигации при нескольких фото", async () => {
      const user = userEvent.setup();
      render(
        <ProductGallery images={images} thumbnail="https://example.com/1.jpg" title="Ткань" />
      );

      const mainContainer = screen.getByAltText("Ткань — фото 1").closest("div[class*='cursor-zoom-in']");
      await user.click(mainContainer!);

      expect(screen.getByLabelText("Предыдущее фото")).toBeInTheDocument();
      expect(screen.getByLabelText("Следующее фото")).toBeInTheDocument();
    });

    it("показывает счётчик изображений", async () => {
      const user = userEvent.setup();
      render(
        <ProductGallery images={images} thumbnail="https://example.com/1.jpg" title="Ткань" />
      );

      const mainContainer = screen.getByAltText("Ткань — фото 1").closest("div[class*='cursor-zoom-in']");
      await user.click(mainContainer!);

      expect(screen.getByText("1 / 3")).toBeInTheDocument();
    });

    it("закрывается по кнопке ✕", async () => {
      const user = userEvent.setup();
      render(
        <ProductGallery images={images} thumbnail="https://example.com/1.jpg" title="Ткань" />
      );

      const mainContainer2 = screen.getByAltText("Ткань — фото 1").closest("div[class*='cursor-zoom-in']");
      await user.click(mainContainer2!);
      await user.click(screen.getByLabelText("Закрыть"));

      expect(screen.queryByLabelText("Закрыть")).not.toBeInTheDocument();
    });

    it("закрывается по Escape", async () => {
      const user = userEvent.setup();
      render(
        <ProductGallery images={images} thumbnail="https://example.com/1.jpg" title="Ткань" />
      );

      const mainContainer3 = screen.getByAltText("Ткань — фото 1").closest("div[class*='cursor-zoom-in']");
      await user.click(mainContainer3!);
      expect(screen.getByLabelText("Закрыть")).toBeInTheDocument();

      await user.keyboard("{Escape}");
      expect(screen.queryByLabelText("Закрыть")).not.toBeInTheDocument();
    });

    it("переключает фото стрелкой ArrowRight", async () => {
      const user = userEvent.setup();
      render(
        <ProductGallery images={images} thumbnail="https://example.com/1.jpg" title="Ткань" />
      );

      const mainContainer4 = screen.getByAltText("Ткань — фото 1").closest("div[class*='cursor-zoom-in']");
      await user.click(mainContainer4!);

      expect(screen.getByText("1 / 3")).toBeInTheDocument();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByText("2 / 3")).toBeInTheDocument();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByText("3 / 3")).toBeInTheDocument();
    });

    it("переключает фото стрелкой ArrowLeft (цикличность)", async () => {
      const user = userEvent.setup();
      render(
        <ProductGallery images={images} thumbnail="https://example.com/1.jpg" title="Ткань" />
      );

      const mainContainer5 = screen.getByAltText("Ткань — фото 1").closest("div[class*='cursor-zoom-in']");
      await user.click(mainContainer5!);
      await user.keyboard("{ArrowLeft}");
      expect(screen.getByText("3 / 3")).toBeInTheDocument();
    });

    it("блокирует скролл body при открытом лайтбоксе", async () => {
      const user = userEvent.setup();
      render(
        <ProductGallery images={images} thumbnail="https://example.com/1.jpg" title="Ткань" />
      );

      const mainContainer6 = screen.getByAltText("Ткань — фото 1").closest("div[class*='cursor-zoom-in']");
      await user.click(mainContainer6!);
      expect(document.body.style.overflow).toBe("hidden");

      await user.keyboard("{Escape}");
      expect(document.body.style.overflow).toBe("");
    });
  });

  describe("дедупликация thumbnail", () => {
    it("не дублирует thumbnail если он есть среди images", () => {
      render(
        <ProductGallery images={images} thumbnail="https://example.com/1.jpg" title="Ткань" />
      );
      const thumbs = screen.getAllByAltText(/миниатюра/);
      expect(thumbs).toHaveLength(3);
    });

    it("добавляет thumbnail как первое изображение если url уникальный", () => {
      render(
        <ProductGallery images={images} thumbnail="https://example.com/unique-thumb.jpg" title="Ткань" />
      );
      const thumbs = screen.getAllByAltText(/миниатюра/);
      expect(thumbs).toHaveLength(4);
    });
  });
});
