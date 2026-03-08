/**
 * Тесты функций получения данных о товарах.
 * Мокаем medusaFetch, проверяем параметры запросов и обработку ошибок.
 */
import {
  getProductsList,
  getProductByHandle,
  getFeaturedProducts,
  getRelatedProducts,
} from "@/lib/data/products";

// Мокаем medusaFetch
const mockMedusaFetch = jest.fn();

jest.mock("@/lib/medusa-client", () => ({
  medusaFetch: (...args: unknown[]) => mockMedusaFetch(...args),
}));

describe("products data layer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Подавляем console.error для тестов обработки ошибок
  const originalError = console.error;
  beforeAll(() => { console.error = jest.fn(); });
  afterAll(() => { console.error = originalError; });

  // ============================================
  // getProductsList
  // ============================================
  describe("getProductsList", () => {
    it("запрашивает /store/products/sorted с дефолтными параметрами", async () => {
      mockMedusaFetch.mockResolvedValue({
        products: [],
        count: 0,
        page: 1,
        totalPages: 1,
        limit: 20,
      });

      await getProductsList();

      expect(mockMedusaFetch).toHaveBeenCalledTimes(1);
      const url = mockMedusaFetch.mock.calls[0][0] as string;
      expect(url).toContain("/store/products/sorted");
      expect(url).toContain("limit=20");
      expect(url).toContain("page=1");
      expect(url).toContain("sort=created_at_desc");
    });

    it("передаёт фильтры в URL-параметры", async () => {
      mockMedusaFetch.mockResolvedValue({
        products: [],
        count: 0,
        page: 1,
        totalPages: 1,
        limit: 12,
      });

      await getProductsList(
        {
          type: "kulirka",
          color: "Белый",
          sort: "price_asc",
          min_price: "100",
          max_price: "500",
          limit: "12",
        },
        2
      );

      const url = mockMedusaFetch.mock.calls[0][0] as string;
      expect(url).toContain("type=kulirka");
      expect(url).toContain("sort=price_asc");
      expect(url).toContain("min_price=100");
      expect(url).toContain("max_price=500");
      expect(url).toContain("limit=12");
      expect(url).toContain("page=2");
    });

    it("возвращает структуру PaginatedProducts", async () => {
      const mockProduct = { id: "prod_1", title: "Кулирка", handle: "kulirka" };
      mockMedusaFetch.mockResolvedValue({
        products: [mockProduct],
        count: 1,
        page: 1,
        totalPages: 1,
        limit: 20,
      });

      const result = await getProductsList();
      expect(result).toEqual({
        products: [mockProduct],
        total: 1,
        page: 1,
        totalPages: 1,
        limit: 20,
      });
    });

    it("возвращает пустой результат при ошибке", async () => {
      mockMedusaFetch.mockRejectedValue(new Error("Network error"));

      const result = await getProductsList();
      expect(result).toEqual({
        products: [],
        total: 0,
        page: 1,
        totalPages: 1,
        limit: 20,
      });
    });
  });

  // ============================================
  // getProductByHandle
  // ============================================
  describe("getProductByHandle", () => {
    it("запрашивает товар по handle", async () => {
      const product = { id: "prod_1", title: "Кулирка", handle: "kulirka" };
      mockMedusaFetch.mockResolvedValue({ products: [product] });

      const result = await getProductByHandle("kulirka");
      expect(result).toEqual(product);

      const url = mockMedusaFetch.mock.calls[0][0] as string;
      expect(url).toContain("handle=kulirka");
      expect(url).toContain("limit=1");
    });

    it("возвращает null для несуществующего товара", async () => {
      mockMedusaFetch.mockResolvedValue({ products: [] });

      const result = await getProductByHandle("non-existent");
      expect(result).toBeNull();
    });

    it("возвращает null при ошибке сети", async () => {
      mockMedusaFetch.mockRejectedValue(new Error("Timeout"));

      const result = await getProductByHandle("some-product");
      expect(result).toBeNull();
    });
  });

  // ============================================
  // getFeaturedProducts
  // ============================================
  describe("getFeaturedProducts", () => {
    it("запрашивает /store/products/featured?limit=8", async () => {
      mockMedusaFetch.mockResolvedValue({ products: [] });

      await getFeaturedProducts();
      const url = mockMedusaFetch.mock.calls[0][0] as string;
      expect(url).toContain("/store/products/featured");
      expect(url).toContain("limit=8");
    });

    it("возвращает массив товаров", async () => {
      const products = [{ id: "1" }, { id: "2" }];
      mockMedusaFetch.mockResolvedValue({ products });

      const result = await getFeaturedProducts();
      expect(result).toEqual(products);
    });

    it("возвращает пустой массив при ошибке", async () => {
      mockMedusaFetch.mockRejectedValue(new Error("err"));

      const result = await getFeaturedProducts();
      expect(result).toEqual([]);
    });
  });

  // ============================================
  // getRelatedProducts
  // ============================================
  describe("getRelatedProducts", () => {
    it("возвращает пустой массив без collectionId", async () => {
      const result = await getRelatedProducts("prod_1");
      expect(result).toEqual([]);
      expect(mockMedusaFetch).not.toHaveBeenCalled();
    });

    it("исключает текущий товар из результатов", async () => {
      const products = [
        { id: "prod_1", title: "Сам" },
        { id: "prod_2", title: "Связанный" },
      ];
      mockMedusaFetch.mockResolvedValue({ products });

      const result = await getRelatedProducts("prod_1", "col_1");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("prod_2");
    });

    it("запрашивает товары по collection_id", async () => {
      mockMedusaFetch.mockResolvedValue({ products: [] });

      await getRelatedProducts("prod_1", "col_xyz");
      const url = mockMedusaFetch.mock.calls[0][0] as string;
      expect(url).toContain("collection_id=col_xyz");
      expect(url).toContain("limit=4");
    });

    it("возвращает пустой массив при ошибке", async () => {
      mockMedusaFetch.mockRejectedValue(new Error("err"));

      const result = await getRelatedProducts("prod_1", "col_1");
      expect(result).toEqual([]);
    });
  });
});
