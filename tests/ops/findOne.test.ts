import { Item, LocKeyArray, QueryParams } from "@fjell/core";
import { HttpApi } from "@fjell/http-api";
import { getFindOneOperation } from "../../src/ops/findOne";
import { finderToParams } from "../../src/AItemAPI";
import { ClientApiOptions } from "../../src/ClientApiOptions";
import { Utilities } from "../../src/Utilities";
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies
vi.mock("../../src/AItemAPI", () => ({
  finderToParams: vi.fn()
}));

// Test types
interface TestItem extends Item<"test", "loc1", "loc2"> {
  id: string;
  name: string;
}

describe("getFindOneOperation", () => {
  let mockHttpApi: HttpApi;
  let mockApiOptions: ClientApiOptions;
  let mockUtilities: Utilities<TestItem, "test", "loc1", "loc2">;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Mock HttpApi
    mockHttpApi = {
      httpGet: vi.fn(),
      httpPost: vi.fn(),
      httpPut: vi.fn(),
      httpDelete: vi.fn(),
      httpPostFile: vi.fn(),
      uploadAsync: vi.fn()
    } as unknown as HttpApi;

    // Mock ClientApiOptions
    mockApiOptions = {
      allAuthenticated: true
    };

    // Mock Utilities
    mockUtilities = {
      verifyLocations: vi.fn(),
      getPath: vi.fn().mockReturnValue("/test/path"),
      processArray: vi.fn().mockImplementation((promise) => promise),
      validatePK: vi.fn().mockImplementation((arr) => arr)
    } as any;

    // Setup finderToParams mock
    vi.mocked(finderToParams).mockReturnValue({ finder: "test" });
  });

  describe("findOne function", () => {
    it("should successfully find one item", async () => {
      const mockItem: TestItem = { id: "1", name: "Test Item" } as TestItem;
      const mockResponse = [mockItem];

      vi.mocked(mockHttpApi.httpGet).mockResolvedValue(mockResponse);
      vi.mocked(mockUtilities.processArray).mockResolvedValue(mockResponse);
      vi.mocked(mockUtilities.validatePK).mockReturnValue(mockResponse);

      const findOne = getFindOneOperation(mockHttpApi, mockApiOptions, mockUtilities);

      const result = await findOne("byId", { id: "1" });

      expect(result).toBe(mockItem);
      expect(mockUtilities.verifyLocations).toHaveBeenCalledWith([]);
      expect(finderToParams).toHaveBeenCalledWith("byId", { id: "1" });
      expect(mockHttpApi.httpGet).toHaveBeenCalledWith(
        "/test/path",
        {
          isAuthenticated: true,
          params: { finder: "test", one: true }
        }
      );
    });

    it("should handle locations parameter", async () => {
      const mockItem: TestItem = { id: "1", name: "Test Item" } as TestItem;
      const mockResponse = [mockItem];
      const locations: LocKeyArray<"loc1", "loc2"> = [] as any;

      vi.mocked(mockHttpApi.httpGet).mockResolvedValue(mockResponse);
      vi.mocked(mockUtilities.processArray).mockResolvedValue(mockResponse);
      vi.mocked(mockUtilities.validatePK).mockReturnValue(mockResponse);

      const findOne = getFindOneOperation(mockHttpApi, mockApiOptions, mockUtilities);

      await findOne("byId", { id: "1" }, locations);

      expect(mockUtilities.verifyLocations).toHaveBeenCalledWith(locations);
      expect(mockUtilities.getPath).toHaveBeenCalledWith(locations);
    });

    it("should merge options correctly", async () => {
      const mockItem: TestItem = { id: "1", name: "Test Item" } as TestItem;
      const mockResponse = [mockItem];

      vi.mocked(mockHttpApi.httpGet).mockResolvedValue(mockResponse);
      vi.mocked(mockUtilities.processArray).mockResolvedValue(mockResponse);
      vi.mocked(mockUtilities.validatePK).mockReturnValue(mockResponse);

      const findOne = getFindOneOperation(mockHttpApi, mockApiOptions, mockUtilities);

      await findOne("byId", { id: "1" });

      expect(mockHttpApi.httpGet).toHaveBeenCalledWith(
        "/test/path",
        {
          isAuthenticated: true,
          params: { finder: "test", one: true }
        }
      );
    });

    it("should handle complex finder parameters", async () => {
      const mockItem: TestItem = { id: "1", name: "Test Item" } as TestItem;
      const mockResponse = [mockItem];
      const complexParams = {
        id: "1",
        count: 5,
        active: true,
        createdAt: new Date("2023-01-01"),
        tags: ["tag1", "tag2", "tag3"]
      };

      vi.mocked(mockHttpApi.httpGet).mockResolvedValue(mockResponse);
      vi.mocked(mockUtilities.processArray).mockResolvedValue(mockResponse);
      vi.mocked(mockUtilities.validatePK).mockReturnValue(mockResponse);

      const findOne = getFindOneOperation(mockHttpApi, mockApiOptions, mockUtilities);

      await findOne("complex", complexParams);

      expect(finderToParams).toHaveBeenCalledWith("complex", complexParams);
    });

    it("should set one parameter to true", async () => {
      const mockItem: TestItem = { id: "1", name: "Test Item" } as TestItem;
      const mockResponse = [mockItem];
      const mockParams: QueryParams = { finder: "test", existing: "param" };

      vi.mocked(finderToParams).mockReturnValue(mockParams);
      vi.mocked(mockHttpApi.httpGet).mockResolvedValue(mockResponse);
      vi.mocked(mockUtilities.processArray).mockResolvedValue(mockResponse);
      vi.mocked(mockUtilities.validatePK).mockReturnValue(mockResponse);

      const findOne = getFindOneOperation(mockHttpApi, mockApiOptions, mockUtilities);

      await findOne("byId", { id: "1" });

      expect(mockHttpApi.httpGet).toHaveBeenCalledWith(
        "/test/path",
        expect.objectContaining({
          params: { finder: "test", existing: "param", one: true }
        })
      );
    });

    it("should handle unauthenticated API options", async () => {
      const mockItem: TestItem = { id: "1", name: "Test Item" } as TestItem;
      const mockResponse = [mockItem];
      const unauthenticatedOptions: ClientApiOptions = { allAuthenticated: false };

      vi.mocked(mockHttpApi.httpGet).mockResolvedValue(mockResponse);
      vi.mocked(mockUtilities.processArray).mockResolvedValue(mockResponse);
      vi.mocked(mockUtilities.validatePK).mockReturnValue(mockResponse);

      const findOne = getFindOneOperation(mockHttpApi, unauthenticatedOptions, mockUtilities);

      await findOne("byId", { id: "1" });

      expect(mockHttpApi.httpGet).toHaveBeenCalledWith(
        "/test/path",
        expect.objectContaining({
          isAuthenticated: false
        })
      );
    });

    it("should propagate HTTP API errors", async () => {
      const error = new Error("Network error");
      vi.mocked(mockHttpApi.httpGet).mockRejectedValue(error);

      const findOne = getFindOneOperation(mockHttpApi, mockApiOptions, mockUtilities);

      await expect(findOne("byId", { id: "1" })).rejects.toThrow("Network error");
    });

    it("should propagate utilities.processArray errors", async () => {
      const mockResponse = [{ id: "1", name: "Test" } as TestItem];
      const error = new Error("Processing error");

      vi.mocked(mockHttpApi.httpGet).mockResolvedValue(mockResponse);
      vi.mocked(mockUtilities.processArray).mockRejectedValue(error);

      const findOne = getFindOneOperation(mockHttpApi, mockApiOptions, mockUtilities);

      await expect(findOne("byId", { id: "1" })).rejects.toThrow("Processing error");
    });

    it("should propagate utilities.validatePK errors", async () => {
      const mockResponse = [{ id: "1", name: "Test" } as TestItem];
      const error = new Error("Validation error");

      vi.mocked(mockHttpApi.httpGet).mockResolvedValue(mockResponse);
      vi.mocked(mockUtilities.processArray).mockResolvedValue(mockResponse);
      vi.mocked(mockUtilities.validatePK).mockImplementation(() => {
        throw error;
      });

      const findOne = getFindOneOperation(mockHttpApi, mockApiOptions, mockUtilities);

      await expect(findOne("byId", { id: "1" })).rejects.toThrow("Validation error");
    });

    it("should propagate utilities.verifyLocations errors", async () => {
      const error = new Error("Invalid locations");
      vi.mocked(mockUtilities.verifyLocations).mockImplementation(() => {
        throw error;
      });

      const findOne = getFindOneOperation(mockHttpApi, mockApiOptions, mockUtilities);

      await expect(findOne("byId", { id: "1" })).rejects.toThrow("Invalid locations");
    });

    it("should handle empty response array", async () => {
      const mockResponse: TestItem[] = [];

      vi.mocked(mockHttpApi.httpGet).mockResolvedValue(mockResponse);
      vi.mocked(mockUtilities.processArray).mockResolvedValue(mockResponse);
      vi.mocked(mockUtilities.validatePK).mockReturnValue(mockResponse);

      const findOne = getFindOneOperation(mockHttpApi, mockApiOptions, mockUtilities);

      const result = await findOne("byId", { id: "1" });

      expect(result).toBeUndefined();
    });

    it("should return first item when multiple items returned", async () => {
      const mockItems: TestItem[] = [
        { id: "1", name: "First Item" } as TestItem,
        { id: "2", name: "Second Item" } as TestItem
      ];

      vi.mocked(mockHttpApi.httpGet).mockResolvedValue(mockItems);
      vi.mocked(mockUtilities.processArray).mockResolvedValue(mockItems);
      vi.mocked(mockUtilities.validatePK).mockReturnValue(mockItems);

      const findOne = getFindOneOperation(mockHttpApi, mockApiOptions, mockUtilities);

      const result = await findOne("byId", { id: "1" });

      expect(result).toBe(mockItems[0]);
      expect(result.name).toBe("First Item");
    });
  });
});
