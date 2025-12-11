import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getRemoveOperation } from "../../src/ops/remove";
import { ClientApiOptions } from "../../src/ClientApiOptions";

describe("remove operation edge cases", () => {
  let mockApi: any;
  let mockUtilities: any;
  let mockOptions: ClientApiOptions;

  beforeEach(() => {
    mockApi = {
      httpDelete: vi.fn()
    };

    mockUtilities = {
      getPath: vi.fn().mockReturnValue("/test/path"),
      processOne: vi.fn((promise) => promise),
      verifyLocations: vi.fn()
    };

    mockOptions = {
      deleteOptions: {},
      writeAuthenticated: true,
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
    it("should succeed on first attempt with void result", async () => {
      mockApi.httpDelete.mockResolvedValueOnce(undefined);

      const remove = getRemoveOperation(mockApi, mockOptions, mockUtilities);
      const result = await remove({ kt: "test", pk: "1" } as any);

      expect(result).toBeUndefined();
      expect(mockApi.httpDelete).toHaveBeenCalledTimes(1);
    });

    it("should succeed on first attempt with boolean result", async () => {
      mockApi.httpDelete.mockResolvedValueOnce(true);

      const remove = getRemoveOperation(mockApi, mockOptions, mockUtilities);
      const result = await remove({ kt: "test", pk: "1" } as any);

      expect(result).toBeUndefined();
      expect(mockApi.httpDelete).toHaveBeenCalledTimes(1);
    });

    it("should succeed on first attempt and return deleted item", async () => {
      const deletedItem = { key: { kt: "test", pk: "1" }, name: "deleted" };
      mockApi.httpDelete.mockResolvedValueOnce(deletedItem);

      const remove = getRemoveOperation(mockApi, mockOptions, mockUtilities);
      const result = await remove({ kt: "test", pk: "1" } as any);

      expect(result).toEqual(deletedItem);
      expect(mockApi.httpDelete).toHaveBeenCalledTimes(1);
    });
  });

  describe("404 handling (item already deleted)", () => {
    it("should treat 404 as success (idempotent delete)", async () => {
      mockApi.httpDelete.mockRejectedValueOnce({ status: 404, message: "Not Found" });

      const remove = getRemoveOperation(mockApi, mockOptions, mockUtilities);
      const result = await remove({ kt: "test", pk: "1" } as any);

      // Should succeed without throwing - item was already deleted
      expect(result).toBeUndefined();
      expect(mockApi.httpDelete).toHaveBeenCalledTimes(1);
    });

    it("should not retry on 404", async () => {
      mockApi.httpDelete.mockRejectedValueOnce({ status: 404, message: "Not Found" });

      const remove = getRemoveOperation(mockApi, mockOptions, mockUtilities);
      await remove({ kt: "test", pk: "1" } as any);

      // Should not retry - 404 is treated as success
      expect(mockApi.httpDelete).toHaveBeenCalledTimes(1);
    });
  });

  describe("retry behavior", () => {
    it("should retry on 5xx errors and succeed", async () => {
      mockApi.httpDelete
        .mockRejectedValueOnce({ status: 500, message: "Server Error" })
        .mockResolvedValueOnce(undefined);

      const remove = getRemoveOperation(mockApi, mockOptions, mockUtilities);
      const result = await remove({ kt: "test", pk: "1" } as any);

      expect(result).toBeUndefined();
      expect(mockApi.httpDelete).toHaveBeenCalledTimes(2);
    });

    it("should retry on network errors", async () => {
      mockApi.httpDelete
        .mockRejectedValueOnce({ code: "ECONNREFUSED", message: "Connection refused" })
        .mockResolvedValueOnce(undefined);

      const remove = getRemoveOperation(mockApi, mockOptions, mockUtilities);
      const result = await remove({ kt: "test", pk: "1" } as any);

      expect(result).toBeUndefined();
      expect(mockApi.httpDelete).toHaveBeenCalledTimes(2);
    });

    it("should retry on 429 rate limiting", async () => {
      mockApi.httpDelete
        .mockRejectedValueOnce({ status: 429, message: "Rate limited" })
        .mockResolvedValueOnce(undefined);

      const remove = getRemoveOperation(mockApi, mockOptions, mockUtilities);
      const result = await remove({ kt: "test", pk: "1" } as any);

      expect(result).toBeUndefined();
      expect(mockApi.httpDelete).toHaveBeenCalledTimes(2);
    });

    it("should NOT retry on 400 bad request", async () => {
      mockApi.httpDelete.mockRejectedValueOnce({ status: 400, message: "Bad Request" });

      const remove = getRemoveOperation(mockApi, mockOptions, mockUtilities);

      await expect(remove({ kt: "test", pk: "1" } as any))
        .rejects.toMatchObject({ code: 400 });

      expect(mockApi.httpDelete).toHaveBeenCalledTimes(1);
    });

    it("should NOT retry on 401 unauthorized", async () => {
      mockApi.httpDelete.mockRejectedValueOnce({ status: 401, message: "Unauthorized" });

      const remove = getRemoveOperation(mockApi, mockOptions, mockUtilities);

      await expect(remove({ kt: "test", pk: "1" } as any))
        .rejects.toMatchObject({ code: 401 });

      expect(mockApi.httpDelete).toHaveBeenCalledTimes(1);
    });

    it("should NOT retry on 403 forbidden", async () => {
      mockApi.httpDelete.mockRejectedValueOnce({ status: 403, message: "Forbidden" });

      const remove = getRemoveOperation(mockApi, mockOptions, mockUtilities);

      await expect(remove({ kt: "test", pk: "1" } as any))
        .rejects.toMatchObject({ code: 403 });

      expect(mockApi.httpDelete).toHaveBeenCalledTimes(1);
    });

    it("should exhaust retries and throw final error", async () => {
      mockApi.httpDelete.mockRejectedValue({ status: 500, message: "Server Error" });

      const remove = getRemoveOperation(mockApi, mockOptions, mockUtilities);

      await expect(remove({ kt: "test", pk: "1" } as any))
        .rejects.toMatchObject({ code: 500 });
      
      expect(mockApi.httpDelete).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    });
  });

  describe("error handling", () => {
    it("should call custom error handler on final failure", async () => {
      const errorHandler = vi.fn();
      mockOptions.errorHandler = errorHandler;
      
      mockApi.httpDelete.mockRejectedValue({ status: 400, message: "Bad Request" });

      const remove = getRemoveOperation(mockApi, mockOptions, mockUtilities);

      await expect(remove({ kt: "test", pk: "1" } as any))
        .rejects.toBeDefined();

      expect(errorHandler).toHaveBeenCalledTimes(1);
      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({ code: 400 }),
        expect.objectContaining({ operation: "remove" })
      );
    });

    it("should NOT call error handler on 404 (treated as success)", async () => {
      const errorHandler = vi.fn();
      mockOptions.errorHandler = errorHandler;
      
      mockApi.httpDelete.mockRejectedValueOnce({ status: 404, message: "Not Found" });

      const remove = getRemoveOperation(mockApi, mockOptions, mockUtilities);
      await remove({ kt: "test", pk: "1" } as any);

      expect(errorHandler).not.toHaveBeenCalled();
    });

    it("should handle error handler throwing an exception", async () => {
      const errorHandler = vi.fn().mockImplementation(() => {
        throw new Error("Handler error");
      });
      mockOptions.errorHandler = errorHandler;
      
      mockApi.httpDelete.mockRejectedValue({ status: 400, message: "Bad Request" });

      const remove = getRemoveOperation(mockApi, mockOptions, mockUtilities);

      await expect(remove({ kt: "test", pk: "1" } as any))
        .rejects.toMatchObject({ code: 400 });

      expect(errorHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe("edge cases", () => {
    it("should handle ENETUNREACH error", async () => {
      mockApi.httpDelete
        .mockRejectedValueOnce({ code: "ENETUNREACH", message: "Network unreachable" })
        .mockResolvedValueOnce(undefined);

      const remove = getRemoveOperation(mockApi, mockOptions, mockUtilities);
      const result = await remove({ kt: "test", pk: "1" } as any);

      expect(result).toBeUndefined();
      expect(mockApi.httpDelete).toHaveBeenCalledTimes(2);
    });

    it("should handle ENOTFOUND error", async () => {
      mockApi.httpDelete
        .mockRejectedValueOnce({ code: "ENOTFOUND", message: "DNS lookup failed" })
        .mockResolvedValueOnce(undefined);

      const remove = getRemoveOperation(mockApi, mockOptions, mockUtilities);
      const result = await remove({ kt: "test", pk: "1" } as any);

      expect(result).toBeUndefined();
      expect(mockApi.httpDelete).toHaveBeenCalledTimes(2);
    });

    it("should handle timeout message in error", async () => {
      mockApi.httpDelete
        .mockRejectedValueOnce({ message: "Request timeout exceeded" })
        .mockResolvedValueOnce(undefined);

      const remove = getRemoveOperation(mockApi, mockOptions, mockUtilities);
      const result = await remove({ kt: "test", pk: "1" } as any);

      expect(result).toBeUndefined();
      expect(mockApi.httpDelete).toHaveBeenCalledTimes(2);
    });

    it("should handle 503 Service Unavailable", async () => {
      mockApi.httpDelete
        .mockRejectedValueOnce({ status: 503, message: "Service Unavailable" })
        .mockResolvedValueOnce(undefined);

      const remove = getRemoveOperation(mockApi, mockOptions, mockUtilities);
      const result = await remove({ kt: "test", pk: "1" } as any);

      expect(result).toBeUndefined();
      expect(mockApi.httpDelete).toHaveBeenCalledTimes(2);
    });
  });
});
