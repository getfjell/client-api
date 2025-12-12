import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getFindOperation } from "../../src/ops/find";
import { ClientApiOptions } from "../../src/ClientApiOptions";

describe("find operation edge cases", () => {
  let mockApi: any;
  let mockUtilities: any;
  let mockOptions: ClientApiOptions;

  beforeEach(() => {
    mockApi = {
      httpGet: vi.fn()
    };

    mockUtilities = {
      getPath: vi.fn().mockReturnValue("/test/path"),
      processArray: vi.fn((promise) => promise),
      verifyLocations: vi.fn()
    };

    mockOptions = {
      getOptions: {},
      allAuthenticated: true,
      retryConfig: {
        maxRetries: 2,
        initialDelayMs: 1,
        maxDelayMs: 5,
        backoffMultiplier: 1
      }
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("success scenarios", () => {
    it("should succeed on first attempt with valid response", async () => {
      const items = [{ key: { kt: "test", pk: "1" }, name: "item" }];
      const response = {
        items,
        metadata: { total: 1, returned: 1, offset: 0, hasMore: false }
      };
      mockApi.httpGet.mockResolvedValueOnce(response);
      mockUtilities.processArray.mockResolvedValueOnce(items);

      const find = getFindOperation(mockApi, mockOptions, mockUtilities);
      const result = await find("testFinder", {}, []);

      expect(result.items).toEqual(items);
      expect(result.metadata).toEqual(response.metadata);
      expect(mockApi.httpGet).toHaveBeenCalledTimes(1);
    });

    it("should handle empty results", async () => {
      const response = {
        items: [],
        metadata: { total: 0, returned: 0, offset: 0, hasMore: false }
      };
      mockApi.httpGet.mockResolvedValueOnce(response);
      mockUtilities.processArray.mockResolvedValueOnce([]);

      const find = getFindOperation(mockApi, mockOptions, mockUtilities);
      const result = await find("testFinder", {}, []);

      expect(result.items).toEqual([]);
      expect(result.metadata.total).toBe(0);
    });
  });

  describe("response validation", () => {
    it("should handle response with undefined items", async () => {
      const response = {
        metadata: { total: 0, returned: 0, offset: 0, hasMore: false }
      };
      mockApi.httpGet.mockResolvedValueOnce(response);
      mockUtilities.processArray.mockResolvedValueOnce([]);

      const find = getFindOperation(mockApi, mockOptions, mockUtilities);
      const result = await find("testFinder", {}, []);

      expect(result.items).toEqual([]);
    });

    it("should throw on null response", async () => {
      mockApi.httpGet.mockResolvedValueOnce(null);

      const find = getFindOperation(mockApi, mockOptions, mockUtilities);

      await expect(find("testFinder", {}, []))
        .rejects.toThrow(/Invalid response.*expected FindOperationResult/);
    });

    it("should throw on non-object response", async () => {
      mockApi.httpGet.mockResolvedValueOnce("invalid string response");

      const find = getFindOperation(mockApi, mockOptions, mockUtilities);

      await expect(find("testFinder", {}, []))
        .rejects.toThrow(/Invalid response.*expected FindOperationResult/);
    });

    it("should throw when items is not an array", async () => {
      mockApi.httpGet.mockResolvedValueOnce({
        items: "not an array",
        metadata: { total: 0 }
      });

      const find = getFindOperation(mockApi, mockOptions, mockUtilities);

      // Items being a non-array string causes the response object check to fail
      await expect(find("testFinder", {}, []))
        .rejects.toThrow();
    });

    it("should provide default metadata when missing", async () => {
      const items = [{ key: { kt: "test", pk: "1" }, name: "item" }];
      const response = { items };
      mockApi.httpGet.mockResolvedValueOnce(response);
      mockUtilities.processArray.mockResolvedValueOnce(items);

      const find = getFindOperation(mockApi, mockOptions, mockUtilities);
      const result = await find("testFinder", {}, [], { limit: 10, offset: 5 });

      expect(result.metadata).toEqual({
        total: 1,
        returned: 1,
        offset: 5,
        limit: 10,
        hasMore: false
      });
    });
  });

  describe("retry behavior", () => {
    it("should retry on 5xx errors and succeed", async () => {
      const items = [{ key: { kt: "test", pk: "1" }, name: "item" }];
      const response = {
        items,
        metadata: { total: 1, returned: 1, offset: 0, hasMore: false }
      };
      
      mockApi.httpGet
        .mockRejectedValueOnce({ status: 500, message: "Server Error" })
        .mockResolvedValueOnce(response);
      mockUtilities.processArray.mockResolvedValue(items);

      const find = getFindOperation(mockApi, mockOptions, mockUtilities);
      const result = await find("testFinder", {}, []);

      expect(result.items).toEqual(items);
      expect(mockApi.httpGet).toHaveBeenCalledTimes(2);
    });

    it("should retry on network errors", async () => {
      const items = [{ key: { kt: "test", pk: "1" }, name: "item" }];
      const response = {
        items,
        metadata: { total: 1, returned: 1, offset: 0, hasMore: false }
      };
      
      mockApi.httpGet
        .mockRejectedValueOnce({ code: "ECONNREFUSED", message: "Connection refused" })
        .mockResolvedValueOnce(response);
      mockUtilities.processArray.mockResolvedValue(items);

      const find = getFindOperation(mockApi, mockOptions, mockUtilities);
      const result = await find("testFinder", {}, []);

      expect(result.items).toEqual(items);
      expect(mockApi.httpGet).toHaveBeenCalledTimes(2);
    });

    it("should retry on 429 rate limiting", async () => {
      const items = [{ key: { kt: "test", pk: "1" }, name: "item" }];
      const response = {
        items,
        metadata: { total: 1, returned: 1, offset: 0, hasMore: false }
      };
      
      mockApi.httpGet
        .mockRejectedValueOnce({ status: 429, message: "Rate limited" })
        .mockResolvedValueOnce(response);
      mockUtilities.processArray.mockResolvedValue(items);

      const find = getFindOperation(mockApi, mockOptions, mockUtilities);
      const result = await find("testFinder", {}, []);

      expect(result.items).toEqual(items);
      expect(mockApi.httpGet).toHaveBeenCalledTimes(2);
    });

    it("should NOT retry on 400 bad request", async () => {
      mockApi.httpGet.mockRejectedValueOnce({ status: 400, message: "Bad Request" });

      const find = getFindOperation(mockApi, mockOptions, mockUtilities);

      await expect(find("testFinder", {}, []))
        .rejects.toMatchObject({ code: 400 });

      expect(mockApi.httpGet).toHaveBeenCalledTimes(1);
    });

    it("should NOT retry on 401 unauthorized", async () => {
      mockApi.httpGet.mockRejectedValueOnce({ status: 401, message: "Unauthorized" });

      const find = getFindOperation(mockApi, mockOptions, mockUtilities);

      await expect(find("testFinder", {}, []))
        .rejects.toMatchObject({ code: 401 });

      expect(mockApi.httpGet).toHaveBeenCalledTimes(1);
    });

    it("should exhaust retries and throw final error", async () => {
      mockApi.httpGet.mockRejectedValue({ status: 500, message: "Server Error" });

      const find = getFindOperation(mockApi, mockOptions, mockUtilities);

      await expect(find("testFinder", {}, []))
        .rejects.toMatchObject({ code: 500 });

      expect(mockApi.httpGet).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    });
  });

  describe("parameter handling", () => {
    it("should pass finder params to API", async () => {
      const response = {
        items: [],
        metadata: { total: 0, returned: 0, offset: 0, hasMore: false }
      };
      mockApi.httpGet.mockResolvedValueOnce(response);
      mockUtilities.processArray.mockResolvedValueOnce([]);

      const find = getFindOperation(mockApi, mockOptions, mockUtilities);
      await find("testFinder", { status: "active", count: 5 }, []);

      // finderToParams serializes the params as JSON under finderParams key
      expect(mockApi.httpGet).toHaveBeenCalledWith(
        "/test/path",
        expect.objectContaining({
          params: expect.objectContaining({
            finder: "testFinder"
          })
        })
      );
    });

    it("should include pagination options in params", async () => {
      const response = {
        items: [],
        metadata: { total: 0, returned: 0, offset: 0, hasMore: false }
      };
      mockApi.httpGet.mockResolvedValueOnce(response);
      mockUtilities.processArray.mockResolvedValueOnce([]);

      const find = getFindOperation(mockApi, mockOptions, mockUtilities);
      await find("testFinder", {}, [], { limit: 10, offset: 20 });

      expect(mockApi.httpGet).toHaveBeenCalledWith(
        "/test/path",
        expect.objectContaining({
          params: expect.objectContaining({
            limit: "10",
            offset: "20"
          })
        })
      );
    });

    it("should handle Date parameters", async () => {
      const response = {
        items: [],
        metadata: { total: 0, returned: 0, offset: 0, hasMore: false }
      };
      mockApi.httpGet.mockResolvedValueOnce(response);
      mockUtilities.processArray.mockResolvedValueOnce([]);

      const testDate = new Date("2024-01-01T00:00:00Z");
      
      const find = getFindOperation(mockApi, mockOptions, mockUtilities);
      await expect(find("testFinder", { createdAfter: testDate }, []))
        .resolves.toBeDefined();
    });

    it("should handle array parameters", async () => {
      const response = {
        items: [],
        metadata: { total: 0, returned: 0, offset: 0, hasMore: false }
      };
      mockApi.httpGet.mockResolvedValueOnce(response);
      mockUtilities.processArray.mockResolvedValueOnce([]);

      const find = getFindOperation(mockApi, mockOptions, mockUtilities);
      await expect(find("testFinder", { ids: [1, 2, 3] }, []))
        .resolves.toBeDefined();
    });

    it("should handle boolean parameters", async () => {
      const response = {
        items: [],
        metadata: { total: 0, returned: 0, offset: 0, hasMore: false }
      };
      mockApi.httpGet.mockResolvedValueOnce(response);
      mockUtilities.processArray.mockResolvedValueOnce([]);

      const find = getFindOperation(mockApi, mockOptions, mockUtilities);
      await expect(find("testFinder", { isActive: true, isDeleted: false }, []))
        .resolves.toBeDefined();
    });
  });

  describe("error handling", () => {
    it("should call custom error handler on final failure", async () => {
      const errorHandler = vi.fn();
      mockOptions.errorHandler = errorHandler;
      
      mockApi.httpGet.mockRejectedValue({ status: 400, message: "Bad Request" });

      const find = getFindOperation(mockApi, mockOptions, mockUtilities);

      await expect(find("testFinder", {}, []))
        .rejects.toBeDefined();

      expect(errorHandler).toHaveBeenCalledTimes(1);
      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({ code: 400 }),
        expect.objectContaining({ operation: "find", finder: "testFinder" })
      );
    });

    it("should handle error handler throwing an exception", async () => {
      const errorHandler = vi.fn().mockImplementation(() => {
        throw new Error("Handler error");
      });
      mockOptions.errorHandler = errorHandler;
      
      mockApi.httpGet.mockRejectedValue({ status: 400, message: "Bad Request" });

      const find = getFindOperation(mockApi, mockOptions, mockUtilities);

      await expect(find("testFinder", {}, []))
        .rejects.toMatchObject({ code: 400 });

      expect(errorHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe("timeout handling", () => {
    it("should handle timeout errors as retryable", async () => {
      const items = [{ key: { kt: "test", pk: "1" }, name: "item" }];
      const response = {
        items,
        metadata: { total: 1, returned: 1, offset: 0, hasMore: false }
      };
      
      mockApi.httpGet
        .mockRejectedValueOnce({ message: "Request timeout exceeded" })
        .mockResolvedValueOnce(response);
      mockUtilities.processArray.mockResolvedValue(items);

      const find = getFindOperation(mockApi, mockOptions, mockUtilities);
      const result = await find("testFinder", {}, []);

      expect(result.items).toEqual(items);
      expect(mockApi.httpGet).toHaveBeenCalledTimes(2);
    });

    it("should handle network timeout errors", async () => {
      const items = [{ key: { kt: "test", pk: "1" }, name: "item" }];
      const response = {
        items,
        metadata: { total: 1, returned: 1, offset: 0, hasMore: false }
      };
      
      mockApi.httpGet
        .mockRejectedValueOnce({ message: "network timeout at: /api/endpoint" })
        .mockResolvedValueOnce(response);
      mockUtilities.processArray.mockResolvedValue(items);

      const find = getFindOperation(mockApi, mockOptions, mockUtilities);
      const result = await find("testFinder", {}, []);

      expect(result.items).toEqual(items);
      expect(mockApi.httpGet).toHaveBeenCalledTimes(2);
    });
  });
});
