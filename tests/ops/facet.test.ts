import { ComKey, Item, PriKey } from "@fjell/core";
import { HttpApi } from "@fjell/http-api";
import { getFacetOperation } from "../../src/ops/facet";
import { ClientApiOptions } from "../../src/ClientApiOptions";
import { Utilities } from "../../src/Utilities";
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Test types
interface TestItem extends Item<"test", "loc1", "loc2"> {
  id: string;
  name: string;
}

describe("getFacetOperation", () => {
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

  describe("facet function", () => {
    it("should successfully retrieve facet data with primary key", async () => {
      const mockFacetData = { status: "active", count: 42 };
      const primaryKey: PriKey<"test"> = { kt: "test", pk: "test-123" };

      vi.mocked(mockHttpApi.httpGet).mockResolvedValue(mockFacetData);

      const facet = getFacetOperation(mockHttpApi, mockApiOptions, mockUtilities);

      const result = await facet(primaryKey, "status");

      expect(result).toBe(mockFacetData);
      expect(mockUtilities.getPath).toHaveBeenCalledWith(primaryKey);
      expect(mockHttpApi.httpGet).toHaveBeenCalledWith(
        "/test/path/status",
        {
          isAuthenticated: true,
          params: {}
        }
      );
    });

    it("should successfully retrieve facet data with composite key", async () => {
      const mockFacetData = { metadata: { version: "1.0" } };
      const compositeKey: ComKey<"test", "loc1", "loc2"> = {
        kt: "test",
        pk: "test-456",
        loc: [{ kt: "loc1", lk: "location1" }, { kt: "loc2", lk: "location2" }]
      };

      vi.mocked(mockHttpApi.httpGet).mockResolvedValue(mockFacetData);

      const facet = getFacetOperation(mockHttpApi, mockApiOptions, mockUtilities);

      const result = await facet(compositeKey, "metadata");

      expect(result).toBe(mockFacetData);
      expect(mockUtilities.getPath).toHaveBeenCalledWith(compositeKey);
      expect(mockHttpApi.httpGet).toHaveBeenCalledWith(
        "/test/path/metadata",
        {
          isAuthenticated: true,
          params: {}
        }
      );
    });

    it("should handle different facet names", async () => {
      const mockFacetData = { permissions: ["read", "write"] };
      const primaryKey: PriKey<"test"> = { kt: "test", pk: "test-789" };
      const facetName = "permissions";

      vi.mocked(mockHttpApi.httpGet).mockResolvedValue(mockFacetData);

      const facet = getFacetOperation(mockHttpApi, mockApiOptions, mockUtilities);

      await facet(primaryKey, facetName);

      expect(mockHttpApi.httpGet).toHaveBeenCalledWith(
        "/test/path/permissions",
        {
          isAuthenticated: true,
          params: {}
        }
      );
    });

    it("should merge custom options with default options", async () => {
      const mockFacetData = { config: { theme: "dark" } };
      const primaryKey: PriKey<"test"> = { kt: "test", pk: "test-custom" };

      vi.mocked(mockHttpApi.httpGet).mockResolvedValue(mockFacetData);

      const facet = getFacetOperation(mockHttpApi, mockApiOptions, mockUtilities);

      await facet(primaryKey, "config");

      expect(mockHttpApi.httpGet).toHaveBeenCalledWith(
        "/test/path/config",
        {
          isAuthenticated: true,
          params: {}
        }
      );
    });

    it("should use writeAuthenticated from apiOptions", async () => {
      const mockFacetData = { data: "test" };
      const primaryKey: PriKey<"test"> = { kt: "test", pk: "test-auth" };
      const apiOptionsWithAuth: ClientApiOptions = {
        writeAuthenticated: false
      };

      vi.mocked(mockHttpApi.httpGet).mockResolvedValue(mockFacetData);

      const facet = getFacetOperation(mockHttpApi, apiOptionsWithAuth, mockUtilities);

      await facet(primaryKey, "info");

      expect(mockHttpApi.httpGet).toHaveBeenCalledWith(
        "/test/path/info",
        {
          isAuthenticated: false,
          params: {}
        }
      );
    });

    it("should override isAuthenticated from options with writeAuthenticated", async () => {
      const mockFacetData = { value: 123 };
      const primaryKey: PriKey<"test"> = { kt: "test", pk: "test-override" };

      vi.mocked(mockHttpApi.httpGet).mockResolvedValue(mockFacetData);

      const facet = getFacetOperation(mockHttpApi, mockApiOptions, mockUtilities);

      await facet(primaryKey, "stats");

      expect(mockHttpApi.httpGet).toHaveBeenCalledWith(
        "/test/path/stats",
        {
          isAuthenticated: true,
          params: {}
        }
      );
    });

    it("should handle writeAuthenticated when not explicitly set", async () => {
      const mockFacetData = { result: true };
      const primaryKey: PriKey<"test"> = { kt: "test", pk: "test-undefined" };
      const apiOptionsWithoutAuth: ClientApiOptions = {};

      vi.mocked(mockHttpApi.httpGet).mockResolvedValue(mockFacetData);

      const facet = getFacetOperation(mockHttpApi, apiOptionsWithoutAuth, mockUtilities);

      await facet(primaryKey, "validation");

      expect(mockHttpApi.httpGet).toHaveBeenCalledWith(
        "/test/path/validation",
        {
          isAuthenticated: void 0,
          params: {}
        }
      );
    });

    it("should propagate HTTP API errors", async () => {
      const error = new Error("Network error");
      const primaryKey: PriKey<"test"> = { kt: "test", pk: "test-error" };

      vi.mocked(mockHttpApi.httpGet).mockRejectedValue(error);

      const facet = getFacetOperation(mockHttpApi, mockApiOptions, mockUtilities);

      await expect(facet(primaryKey, "status")).rejects.toThrow("Network error");
    });

    it("should propagate utilities.getPath errors", async () => {
      const error = new Error("Invalid path");
      const primaryKey: PriKey<"test"> = { kt: "test", pk: "test-path-error" };

      vi.mocked(mockUtilities.getPath).mockImplementation(() => {
        throw error;
      });

      const facet = getFacetOperation(mockHttpApi, mockApiOptions, mockUtilities);

      await expect(facet(primaryKey, "status")).rejects.toThrow("Invalid path");
    });

    it("should handle empty options object", async () => {
      const mockFacetData = { empty: "options" };
      const primaryKey: PriKey<"test"> = { kt: "test", pk: "test-empty" };

      vi.mocked(mockHttpApi.httpGet).mockResolvedValue(mockFacetData);

      const facet = getFacetOperation(mockHttpApi, mockApiOptions, mockUtilities);

      await facet(primaryKey, "test", {});

      expect(mockHttpApi.httpGet).toHaveBeenCalledWith(
        "/test/path/test",
        {
          isAuthenticated: true,
          params: {}
        }
      );
    });

    it("should handle facet names with special characters", async () => {
      const mockFacetData = { special: "data" };
      const primaryKey: PriKey<"test"> = { kt: "test", pk: "test-special" };
      const specialFacetName = "facet-with-dashes_and_underscores";

      vi.mocked(mockHttpApi.httpGet).mockResolvedValue(mockFacetData);

      const facet = getFacetOperation(mockHttpApi, mockApiOptions, mockUtilities);

      await facet(primaryKey, specialFacetName);

      expect(mockHttpApi.httpGet).toHaveBeenCalledWith(
        `/test/path/${specialFacetName}`,
        {
          isAuthenticated: true,
          params: {}
        }
      );
    });

    it("should handle null and undefined facet data responses", async () => {
      const primaryKey: PriKey<"test"> = { kt: "test", pk: "test-null" };

      // Test null response
      vi.mocked(mockHttpApi.httpGet).mockResolvedValue(null);
      const facet = getFacetOperation(mockHttpApi, mockApiOptions, mockUtilities);

      let result = await facet(primaryKey, "null-data");
      expect(result).toBeNull();

      // Test undefined response
      vi.mocked(mockHttpApi.httpGet).mockResolvedValue(void 0);
      result = await facet(primaryKey, "undefined-data");
      expect(result).toBeUndefined();
    });

    it("should handle complex facet data structures", async () => {
      const complexFacetData = {
        nested: {
          array: [1, 2, 3],
          object: { key: "value" },
          boolean: true,
          nullValue: null
        },
        timestamp: "2023-01-01T00:00:00Z",
        numbers: [1.5, 2.7, 3.14]
      };
      const primaryKey: PriKey<"test"> = { kt: "test", pk: "test-complex" };

      vi.mocked(mockHttpApi.httpGet).mockResolvedValue(complexFacetData);

      const facet = getFacetOperation(mockHttpApi, mockApiOptions, mockUtilities);

      const result = await facet(primaryKey, "complex");

      expect(result).toEqual(complexFacetData);
    });
  });
});
