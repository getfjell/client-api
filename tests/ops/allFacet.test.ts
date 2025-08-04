import { Item, LocKeyArray } from "@fjell/core";
import { HttpApi } from "@fjell/http-api";
import { getAllFacetOperation } from "../../src/ops/allFacet";
import { ClientApiOptions } from "../../src/ClientApiOptions";
import { Utilities } from "../../src/Utilities";
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Test types
interface TestItem extends Item<"test", "loc1", "loc2"> {
  id: string;
  name: string;
}

describe("getAllFacetOperation", () => {
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

    // Mock ClientApiOptions with writeAuthenticated: true by default
    mockApiOptions = {
      writeAuthenticated: true
    };

    // Mock Utilities
    mockUtilities = {
      verifyLocations: vi.fn(),
      getPath: vi.fn().mockReturnValue("/test/path"),
      processOne: vi.fn().mockImplementation((promise) => promise),
      processArray: vi.fn().mockImplementation((promise) => promise),
      convertDoc: vi.fn().mockImplementation((doc) => doc),
      validatePK: vi.fn().mockImplementation((item) => item)
    } as any;
  });

  describe("allFacet function", () => {
    it("should successfully retrieve all facet data with empty locations", async () => {
      const mockFacetData = [
        { id: "1", name: "Test Item 1" },
        { id: "2", name: "Test Item 2" }
      ];
      const facetName = "status";
      const locations: LocKeyArray<"loc1", "loc2"> | [] = [];

      vi.mocked(mockHttpApi.httpGet).mockResolvedValue(mockFacetData);

      const allFacet = getAllFacetOperation(mockHttpApi, mockApiOptions, mockUtilities);

      const result = await allFacet(facetName, {}, locations);

      expect(result).toBe(mockFacetData);
      expect(mockUtilities.verifyLocations).toHaveBeenCalledWith(locations);
      expect(mockUtilities.getPath).toHaveBeenCalledWith(locations);
      expect(mockHttpApi.httpGet).toHaveBeenCalledWith(
        "/test/path/status",
        {
          isAuthenticated: true,
          params: {}
        }
      );
    });

    it("should successfully retrieve all facet data with provided locations", async () => {
      const mockFacetData = [
        { id: "3", name: "Test Item 3" },
        { id: "4", name: "Test Item 4" },
        { id: "5", name: "Test Item 5" }
      ];
      const facetName = "metadata";
      const locations: LocKeyArray<"loc1", "loc2"> = [
        { kt: "loc1", lk: "location1" },
        { kt: "loc2", lk: "location2" }
      ];

      vi.mocked(mockHttpApi.httpGet).mockResolvedValue(mockFacetData);

      const allFacet = getAllFacetOperation(mockHttpApi, mockApiOptions, mockUtilities);

      const result = await allFacet(facetName, {}, locations);

      expect(result).toBe(mockFacetData);
      expect(mockUtilities.verifyLocations).toHaveBeenCalledWith(locations);
      expect(mockUtilities.getPath).toHaveBeenCalledWith(locations);
      expect(mockHttpApi.httpGet).toHaveBeenCalledWith(
        "/test/path/metadata",
        {
          isAuthenticated: true,
          params: {}
        }
      );
    });

    it("should handle different facet names", async () => {
      const mockFacetData = [{ id: "6", name: "Test Item 6" }];
      const facetName = "permissions";
      const locations: [] = [];

      vi.mocked(mockHttpApi.httpGet).mockResolvedValue(mockFacetData);

      const allFacet = getAllFacetOperation(mockHttpApi, mockApiOptions, mockUtilities);

      await allFacet(facetName, {}, locations);

      expect(mockUtilities.verifyLocations).toHaveBeenCalledWith(locations);
      expect(mockUtilities.getPath).toHaveBeenCalledWith(locations);
      expect(mockHttpApi.httpGet).toHaveBeenCalledWith(
        "/test/path/permissions",
        {
          isAuthenticated: true,
          params: {}
        }
      );
    });

    it("should use default empty object for options when not provided", async () => {
      const mockFacetData = [{ id: "7", name: "Test Item 7" }];
      const facetName = "config";

      vi.mocked(mockHttpApi.httpGet).mockResolvedValue(mockFacetData);

      const allFacet = getAllFacetOperation(mockHttpApi, mockApiOptions, mockUtilities);

      const result = await allFacet(facetName);

      expect(result).toBe(mockFacetData);
      expect(mockUtilities.verifyLocations).toHaveBeenCalledWith([]);
      expect(mockUtilities.getPath).toHaveBeenCalledWith([]);
      expect(mockHttpApi.httpGet).toHaveBeenCalledWith(
        "/test/path/config",
        {
          isAuthenticated: true,
          params: {}
        }
      );
    });

    it("should use default empty array for locations when not provided", async () => {
      const mockFacetData = [{ id: "8", name: "Test Item 8" }];
      const facetName = "settings";

      vi.mocked(mockHttpApi.httpGet).mockResolvedValue(mockFacetData);

      const allFacet = getAllFacetOperation(mockHttpApi, mockApiOptions, mockUtilities);

      const result = await allFacet(facetName);

      expect(result).toBe(mockFacetData);
      expect(mockUtilities.verifyLocations).toHaveBeenCalledWith([]);
      expect(mockUtilities.getPath).toHaveBeenCalledWith([]);
      expect(mockHttpApi.httpGet).toHaveBeenCalledWith(
        "/test/path/settings",
        {
          isAuthenticated: true,
          params: {}
        }
      );
    });

    it("should merge custom options with default options", async () => {
      const mockFacetData = [{ id: "9", name: "Test Item 9" }];
      const facetName = "analytics";

      vi.mocked(mockHttpApi.httpGet).mockResolvedValue(mockFacetData);

      const allFacet = getAllFacetOperation(mockHttpApi, mockApiOptions, mockUtilities);

      await allFacet(facetName);

      expect(mockHttpApi.httpGet).toHaveBeenCalledWith(
        "/test/path/analytics",
        {
          isAuthenticated: true,
          params: {}
        }
      );
    });

    it("should use writeAuthenticated from apiOptions", async () => {
      const mockFacetData = [{ id: "10", name: "Test Item 10" }];
      const facetName = "reports";
      const apiOptionsWithAuth: ClientApiOptions = {
        writeAuthenticated: false
      };

      vi.mocked(mockHttpApi.httpGet).mockResolvedValue(mockFacetData);

      const allFacet = getAllFacetOperation(mockHttpApi, apiOptionsWithAuth, mockUtilities);

      await allFacet(facetName);

      expect(mockHttpApi.httpGet).toHaveBeenCalledWith(
        "/test/path/reports",
        {
          isAuthenticated: false,
          params: {}
        }
      );
    });

    it("should override isAuthenticated from options with writeAuthenticated", async () => {
      const mockFacetData = [{ id: "11", name: "Test Item 11" }];
      const facetName = "audit";

      vi.mocked(mockHttpApi.httpGet).mockResolvedValue(mockFacetData);

      const allFacet = getAllFacetOperation(mockHttpApi, mockApiOptions, mockUtilities);

      await allFacet(facetName);

      expect(mockHttpApi.httpGet).toHaveBeenCalledWith(
        "/test/path/audit",
        {
          isAuthenticated: true,
          params: {}
        }
      );
    });

    it("should handle writeAuthenticated when not explicitly set", async () => {
      const mockFacetData = [{ id: "12", name: "Test Item 12" }];
      const facetName = "logs";
      const apiOptionsWithoutAuth: ClientApiOptions = {};

      vi.mocked(mockHttpApi.httpGet).mockResolvedValue(mockFacetData);

      const allFacet = getAllFacetOperation(mockHttpApi, apiOptionsWithoutAuth, mockUtilities);

      await allFacet(facetName);

      expect(mockHttpApi.httpGet).toHaveBeenCalledWith(
        "/test/path/logs",
        {
          isAuthenticated: void 0,
          params: {}
        }
      );
    });

    it("should propagate HTTP API errors", async () => {
      const error = new Error("Network error");
      const facetName = "failed";

      vi.mocked(mockHttpApi.httpGet).mockRejectedValue(error);

      const allFacet = getAllFacetOperation(mockHttpApi, mockApiOptions, mockUtilities);

      await expect(allFacet(facetName)).rejects.toThrow("Network error");
    });

    it("should propagate utilities.verifyLocations errors", async () => {
      const error = new Error("Invalid locations");
      const facetName = "test";
      const locations: LocKeyArray<"loc1", "loc2"> = [
        { kt: "loc1", lk: "invalid" },
        { kt: "loc2", lk: "invalid2" }
      ];

      vi.mocked(mockUtilities.verifyLocations).mockImplementation(() => {
        throw error;
      });

      const allFacet = getAllFacetOperation(mockHttpApi, mockApiOptions, mockUtilities);

      await expect(allFacet(facetName, {}, locations)).rejects.toThrow("Invalid locations");
    });

    it("should propagate utilities.getPath errors", async () => {
      const error = new Error("Invalid path");
      const facetName = "test";

      vi.mocked(mockUtilities.getPath).mockImplementation(() => {
        throw error;
      });

      const allFacet = getAllFacetOperation(mockHttpApi, mockApiOptions, mockUtilities);

      await expect(allFacet(facetName)).rejects.toThrow("Invalid path");
    });

    it("should handle empty array response", async () => {
      const mockFacetData: TestItem[] = [];
      const facetName = "empty";

      vi.mocked(mockHttpApi.httpGet).mockResolvedValue(mockFacetData);

      const allFacet = getAllFacetOperation(mockHttpApi, mockApiOptions, mockUtilities);

      const result = await allFacet(facetName);

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle null response", async () => {
      const facetName = "null-response";

      vi.mocked(mockHttpApi.httpGet).mockResolvedValue(null);

      const allFacet = getAllFacetOperation(mockHttpApi, mockApiOptions, mockUtilities);

      const result = await allFacet(facetName);

      expect(result).toBeNull();
    });

    it("should handle undefined response", async () => {
      const facetName = "undefined-response";

      vi.mocked(mockHttpApi.httpGet).mockResolvedValue(void 0);

      const allFacet = getAllFacetOperation(mockHttpApi, mockApiOptions, mockUtilities);

      const result = await allFacet(facetName);

      expect(result).toBeUndefined();
    });

    it("should handle facet names with special characters", async () => {
      const mockFacetData = [{ id: "13", name: "Special Item" }];
      const specialFacetName = "facet-with-dashes_and_underscores.dots";

      vi.mocked(mockHttpApi.httpGet).mockResolvedValue(mockFacetData);

      const allFacet = getAllFacetOperation(mockHttpApi, mockApiOptions, mockUtilities);

      const result = await allFacet(specialFacetName);

      expect(result).toBe(mockFacetData);
      expect(mockUtilities.verifyLocations).toHaveBeenCalledWith([]);
    });

    it("should handle complex location arrays", async () => {
      const mockFacetData = [
        { id: "14", name: "Complex Item 1" },
        { id: "15", name: "Complex Item 2" }
      ];
      const facetName = "complex";
      const complexLocations: LocKeyArray<"loc1", "loc2"> = [
        { kt: "loc1", lk: "parent-location" },
        { kt: "loc2", lk: "child-location" }
      ];

      vi.mocked(mockHttpApi.httpGet).mockResolvedValue(mockFacetData);

      const allFacet = getAllFacetOperation(mockHttpApi, mockApiOptions, mockUtilities);

      const result = await allFacet(facetName, {}, complexLocations);

      expect(result).toBe(mockFacetData);
      expect(mockUtilities.verifyLocations).toHaveBeenCalledWith(complexLocations);
      expect(mockUtilities.getPath).toHaveBeenCalledWith(complexLocations);
    });

    it("should handle large arrays of data", async () => {
      const mockFacetData = Array.from({ length: 1000 }, (_, i) => ({
        id: `item-${i}`,
        name: `Test Item ${i}`
      }));
      const facetName = "large-dataset";

      vi.mocked(mockHttpApi.httpGet).mockResolvedValue(mockFacetData);

      const allFacet = getAllFacetOperation(mockHttpApi, mockApiOptions, mockUtilities);

      const result = await allFacet(facetName);

      expect(result).toBe(mockFacetData);
      expect(result).toHaveLength(1000);
    });

    it("should handle complex nested data structures in array", async () => {
      const mockFacetData = [
        {
          id: "complex-1",
          name: "Complex Item",
          metadata: {
            nested: {
              array: [1, 2, 3],
              object: { key: "value" },
              boolean: true,
              nullValue: null
            },
            timestamp: "2023-01-01T00:00:00Z"
          }
        }
      ];
      const facetName = "nested-complex";

      vi.mocked(mockHttpApi.httpGet).mockResolvedValue(mockFacetData);

      const allFacet = getAllFacetOperation(mockHttpApi, mockApiOptions, mockUtilities);

      const result = await allFacet(facetName);

      expect(result).toEqual(mockFacetData);
    });
  });
});
