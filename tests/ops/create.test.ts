import { Item, LocKeyArray } from "@fjell/core";
import { HttpApi } from "@fjell/http-api";
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getCreateOperation } from "../../src/ops/create";
import { ClientApiOptions } from "../../src/ClientApiOptions";
import { Utilities } from "../../src/Utilities";
import * as errorHandling from "../../src/ops/errorHandling";

// Mock the error handling module
vi.mock("../../src/ops/errorHandling", () => ({
  shouldRetryError: vi.fn(),
  calculateRetryDelay: vi.fn(),
  enhanceError: vi.fn(),
}));

// Test types
interface TestItem extends Item<"test", "loc1", "loc2"> {
  id: string;
  name: string;
  data?: any;
}

describe("getCreateOperation", () => {
  let mockHttpApi: HttpApi;
  let mockApiOptions: ClientApiOptions;
  let mockUtilities: Utilities<TestItem, "test", "loc1", "loc2">;
  let createOperation: ReturnType<typeof getCreateOperation<TestItem, "test", "loc1", "loc2">>;

  const mockItem: Partial<TestItem> = {
    name: "Test Item",
    data: { value: 123 }
  };

  const mockCreatedItem: TestItem = {
    id: "test-123",
    name: "Test Item",
    data: { value: 123 }
  };

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
      writeAuthenticated: true,
      postOptions: { timeout: 5000 },
      retryConfig: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 30000,
        backoffMultiplier: 2
      }
    };

    // Mock Utilities
    mockUtilities = {
      verifyLocations: vi.fn(),
      getPath: vi.fn().mockReturnValue("/test/path"),
      processOne: vi.fn().mockImplementation((promise) => promise),
      validatePK: vi.fn().mockImplementation((item) => item),
      processArray: vi.fn(),
      convertDoc: vi.fn()
    } as any;

    // Setup default mock implementations
    vi.mocked(errorHandling.shouldRetryError).mockReturnValue(false);
    vi.mocked(errorHandling.calculateRetryDelay).mockReturnValue(1000);
    vi.mocked(errorHandling.enhanceError).mockImplementation((error) => error);

    createOperation = getCreateOperation(mockHttpApi, mockApiOptions, mockUtilities);
  });

  describe("successful creation", () => {
    it("should successfully create an item without locations", async () => {
      // Setup
      mockHttpApi.httpPost = vi.fn().mockResolvedValue(mockCreatedItem);

      // Execute
      const result = await createOperation(mockItem);

      // Verify
      expect(result).toEqual(mockCreatedItem);
      expect(mockUtilities.verifyLocations).toHaveBeenCalledWith([]);
      expect(mockUtilities.getPath).toHaveBeenCalledWith([]);
      expect(mockHttpApi.httpPost).toHaveBeenCalledWith(
        "/test/path",
        mockItem,
        expect.objectContaining({
          timeout: 5000,
          isAuthenticated: true
        })
      );
      expect(mockUtilities.processOne).toHaveBeenCalled();
      expect(mockUtilities.validatePK).toHaveBeenCalledWith(mockCreatedItem);
    });

    it("should successfully create an item with locations", async () => {
      // Setup
      const locations: LocKeyArray<"loc1", "loc2"> = ["location1", "location2"];
      mockHttpApi.httpPost = vi.fn().mockResolvedValue(mockCreatedItem);

      // Execute
      const result = await createOperation(mockItem, locations);

      // Verify
      expect(result).toEqual(mockCreatedItem);
      expect(mockUtilities.verifyLocations).toHaveBeenCalledWith(locations);
      expect(mockUtilities.getPath).toHaveBeenCalledWith(locations);
      expect(mockHttpApi.httpPost).toHaveBeenCalledWith(
        "/test/path",
        mockItem,
        expect.objectContaining({
          timeout: 5000,
          isAuthenticated: true
        })
      );
    });

    it("should merge apiOptions.postOptions with default options", async () => {
      // Setup
      mockApiOptions.postOptions = { timeout: 10000, headers: { "Custom": "header" } };
      mockHttpApi.httpPost = vi.fn().mockResolvedValue(mockCreatedItem);
      const operation = getCreateOperation(mockHttpApi, mockApiOptions, mockUtilities);

      // Execute
      await operation(mockItem);

      // Verify
      expect(mockHttpApi.httpPost).toHaveBeenCalledWith(
        "/test/path",
        mockItem,
        expect.objectContaining({
          timeout: 10000,
          headers: { "Custom": "header" },
          isAuthenticated: true
        })
      );
    });
  });

  describe("error handling and retries", () => {
    it("should not retry on non-retryable errors", async () => {
      // Setup
      const clientError = new Error("Client error");
      (clientError as any).status = 400;
      mockHttpApi.httpPost = vi.fn().mockRejectedValue(clientError);
      vi.mocked(errorHandling.shouldRetryError).mockReturnValue(false);
      vi.mocked(errorHandling.enhanceError).mockReturnValue(clientError);

      // Execute & Verify
      await expect(createOperation(mockItem)).rejects.toThrow("Client error");
      expect(mockHttpApi.httpPost).toHaveBeenCalledTimes(1);
      expect(errorHandling.shouldRetryError).toHaveBeenCalledWith(clientError);
      expect(errorHandling.enhanceError).toHaveBeenCalledWith(
        clientError,
        expect.objectContaining({
          operation: 'create',
          path: '/test/path',
          itemType: 'object',
          hasLocations: false
        })
      );
    });

    it("should retry on retryable errors and eventually succeed", async () => {
      // Setup
      const retryableError = new Error("Network error");
      (retryableError as any).code = 'ECONNREFUSED';

      mockHttpApi.httpPost = vi.fn()
        .mockRejectedValueOnce(retryableError)
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValueOnce(mockCreatedItem);

      vi.mocked(errorHandling.shouldRetryError).mockReturnValue(true);
      vi.mocked(errorHandling.calculateRetryDelay).mockReturnValue(100);

      // Mock setTimeout to avoid actual delays in tests
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = vi.fn().mockImplementation((fn) => fn()) as any;

      // Execute
      const result = await createOperation(mockItem);

      // Verify
      expect(result).toEqual(mockCreatedItem);
      expect(mockHttpApi.httpPost).toHaveBeenCalledTimes(3);
      expect(errorHandling.shouldRetryError).toHaveBeenCalledTimes(2);
      expect(errorHandling.calculateRetryDelay).toHaveBeenCalledTimes(2);

      // Restore setTimeout
      global.setTimeout = originalSetTimeout;
    });

    it("should fail after max retries", async () => {
      // Setup
      const retryableError = new Error("Persistent error");
      (retryableError as any).status = 500;

      mockHttpApi.httpPost = vi.fn().mockRejectedValue(retryableError);
      vi.mocked(errorHandling.shouldRetryError).mockReturnValue(true);
      vi.mocked(errorHandling.calculateRetryDelay).mockReturnValue(100);
      vi.mocked(errorHandling.enhanceError).mockReturnValue(retryableError);

      // Mock setTimeout
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = vi.fn().mockImplementation((fn) => fn()) as any;

      // Execute & Verify
      await expect(createOperation(mockItem)).rejects.toThrow("Persistent error");
      expect(mockHttpApi.httpPost).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
      expect(errorHandling.enhanceError).toHaveBeenCalled();

      // Restore setTimeout
      global.setTimeout = originalSetTimeout;
    });

    it("should use custom retry configuration", async () => {
      // Setup
      const customApiOptions: ClientApiOptions = {
        ...mockApiOptions,
        retryConfig: {
          maxRetries: 2,
          initialDelayMs: 500,
          maxDelayMs: 10000,
          backoffMultiplier: 3
        }
      };

      const error = new Error("Custom retry test");
      mockHttpApi.httpPost = vi.fn().mockRejectedValue(error);
      vi.mocked(errorHandling.shouldRetryError).mockReturnValue(true);
      vi.mocked(errorHandling.calculateRetryDelay).mockReturnValue(500);
      vi.mocked(errorHandling.enhanceError).mockReturnValue(error);

      const operation = getCreateOperation(mockHttpApi, customApiOptions, mockUtilities);

      // Mock setTimeout
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = vi.fn().mockImplementation((fn) => fn()) as any;

      // Execute & Verify
      await expect(operation(mockItem)).rejects.toThrow("Custom retry test");
      expect(mockHttpApi.httpPost).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
      expect(errorHandling.calculateRetryDelay).toHaveBeenCalledWith(
        expect.any(Number),
        expect.objectContaining({
          maxRetries: 2,
          initialDelayMs: 500,
          maxDelayMs: 10000,
          backoffMultiplier: 3
        })
      );

      // Restore setTimeout
      global.setTimeout = originalSetTimeout;
    });
  });

  describe("custom error handler", () => {
    it("should call custom error handler on failure", async () => {
      // Setup
      const customErrorHandler = vi.fn();
      const apiOptionsWithHandler: ClientApiOptions = {
        ...mockApiOptions,
        errorHandler: customErrorHandler
      };

      const error = new Error("Test error");
      mockHttpApi.httpPost = vi.fn().mockRejectedValue(error);
      vi.mocked(errorHandling.shouldRetryError).mockReturnValue(false);
      vi.mocked(errorHandling.enhanceError).mockReturnValue(error);

      const operation = getCreateOperation(mockHttpApi, apiOptionsWithHandler, mockUtilities);

      // Execute & Verify
      await expect(operation(mockItem)).rejects.toThrow("Test error");
      expect(customErrorHandler).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          operation: 'create',
          path: '/test/path',
          itemType: 'object',
          hasLocations: false
        })
      );
    });

    it("should handle custom error handler exceptions gracefully", async () => {
      // Setup
      const faultyErrorHandler = vi.fn().mockImplementation(() => {
        throw new Error("Handler error");
      });
      const apiOptionsWithHandler: ClientApiOptions = {
        ...mockApiOptions,
        errorHandler: faultyErrorHandler
      };

      const error = new Error("Original error");
      mockHttpApi.httpPost = vi.fn().mockRejectedValue(error);
      vi.mocked(errorHandling.shouldRetryError).mockReturnValue(false);
      vi.mocked(errorHandling.enhanceError).mockReturnValue(error);

      const operation = getCreateOperation(mockHttpApi, apiOptionsWithHandler, mockUtilities);

      // Execute & Verify - should still throw original error, not handler error
      await expect(operation(mockItem)).rejects.toThrow("Original error");
      expect(faultyErrorHandler).toHaveBeenCalled();
    });
  });

  describe("validation and processing", () => {
    it("should call utilities.verifyLocations with provided locations", async () => {
      // Setup
      const locations: LocKeyArray<"loc1", "loc2"> = ["loc1", "loc2"];
      mockHttpApi.httpPost = vi.fn().mockResolvedValue(mockCreatedItem);

      // Execute
      await createOperation(mockItem, locations);

      // Verify
      expect(mockUtilities.verifyLocations).toHaveBeenCalledWith(locations);
    });

    it("should process the HTTP response through utilities.processOne", async () => {
      // Setup
      const rawResponse = { ...mockCreatedItem, rawField: "should be processed" };
      const processedResponse = { ...mockCreatedItem };

      mockHttpApi.httpPost = vi.fn().mockResolvedValue(rawResponse);
      mockUtilities.processOne = vi.fn().mockResolvedValue(processedResponse);

      // Execute
      const result = await createOperation(mockItem);

      // Verify
      expect(mockUtilities.processOne).toHaveBeenCalled();
      expect(mockUtilities.validatePK).toHaveBeenCalledWith(processedResponse);
      expect(result).toEqual(processedResponse);
    });

    it("should validate the primary key of the created item", async () => {
      // Setup
      mockHttpApi.httpPost = vi.fn().mockResolvedValue(mockCreatedItem);

      // Execute
      await createOperation(mockItem);

      // Verify
      expect(mockUtilities.validatePK).toHaveBeenCalledWith(mockCreatedItem);
    });
  });

  describe("edge cases", () => {
    it("should handle empty item object", async () => {
      // Setup
      const emptyItem = {};
      mockHttpApi.httpPost = vi.fn().mockResolvedValue(mockCreatedItem);

      // Execute
      const result = await createOperation(emptyItem);

      // Verify
      expect(result).toEqual(mockCreatedItem);
      expect(mockHttpApi.httpPost).toHaveBeenCalledWith(
        "/test/path",
        emptyItem,
        expect.any(Object)
      );
    });

    it("should handle null/undefined locations gracefully", async () => {
      // Setup
      mockHttpApi.httpPost = vi.fn().mockResolvedValue(mockCreatedItem);

      // Execute with undefined locations (default parameter)
      const result = await createOperation(mockItem);

      // Verify
      expect(result).toEqual(mockCreatedItem);
      expect(mockUtilities.verifyLocations).toHaveBeenCalledWith([]);
    });

    it("should handle complex nested item data", async () => {
      // Setup
      const complexItem = {
        name: "Complex Item",
        data: {
          nested: {
            array: [1, 2, 3],
            object: { key: "value" }
          },
          metadata: {
            created: new Date().toISOString(),
            tags: ["tag1", "tag2"]
          }
        }
      };

      const createdComplexItem = { ...complexItem, id: "complex-123" };
      mockHttpApi.httpPost = vi.fn().mockResolvedValue(createdComplexItem);

      // Execute
      const result = await createOperation(complexItem);

      // Verify
      expect(result).toEqual(createdComplexItem);
      expect(mockHttpApi.httpPost).toHaveBeenCalledWith(
        "/test/path",
        complexItem,
        expect.any(Object)
      );
    });
  });

  describe("authentication handling", () => {
    it("should use writeAuthenticated option for request authentication", async () => {
      // Setup
      const authOptions: ClientApiOptions = {
        ...mockApiOptions,
        writeAuthenticated: false
      };

      mockHttpApi.httpPost = vi.fn().mockResolvedValue(mockCreatedItem);
      const operation = getCreateOperation(mockHttpApi, authOptions, mockUtilities);

      // Execute
      await operation(mockItem);

      // Verify
      expect(mockHttpApi.httpPost).toHaveBeenCalledWith(
        "/test/path",
        mockItem,
        expect.objectContaining({
          isAuthenticated: false
        })
      );
    });

    it("should handle missing writeAuthenticated option", async () => {
      // Setup
      const optionsWithoutAuth: ClientApiOptions = {
        postOptions: { timeout: 5000 }
      };

      mockHttpApi.httpPost = vi.fn().mockResolvedValue(mockCreatedItem);
      const operation = getCreateOperation(mockHttpApi, optionsWithoutAuth, mockUtilities);

      // Execute
      await operation(mockItem);

      // Verify - should not have isAuthenticated property when writeAuthenticated is not set
      const callArgs = mockHttpApi.httpPost.mock.calls[0];
      expect(callArgs[0]).toBe("/test/path");
      expect(callArgs[1]).toBe(mockItem);
      expect(callArgs[2]).toEqual(expect.objectContaining({
        timeout: 5000
      }));
    });
  });
});
