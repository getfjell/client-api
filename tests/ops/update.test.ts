import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getUpdateOperation } from "../../src/ops/update";
import { ClientApiOptions } from "../../src/ClientApiOptions";

describe("update operation", () => {
  let mockApi: any;
  let mockUtilities: any;
  let mockOptions: ClientApiOptions;

  beforeEach(() => {
    mockApi = {
      httpPut: vi.fn()
    };

    mockUtilities = {
      getPath: vi.fn().mockReturnValue("/test/path"),
      processOne: vi.fn((promise) => promise),
      verifyLocations: vi.fn()
    };

    mockOptions = {
      putOptions: {},
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

  it("should succeed on first attempt", async () => {
    const expectedResult = { key: { kt: "test", pk: "1" }, name: "test" };
    mockApi.httpPut.mockResolvedValueOnce(expectedResult);

    const update = getUpdateOperation(mockApi, mockOptions, mockUtilities);
    const result = await update({ kt: "test", pk: "1" } as any, { name: "updated" });

    expect(result).toEqual(expectedResult);
    expect(mockApi.httpPut).toHaveBeenCalledTimes(1);
  });

  it("should retry on 5xx errors and succeed", async () => {
    const expectedResult = { key: { kt: "test", pk: "1" }, name: "test" };
    
    mockApi.httpPut
      .mockRejectedValueOnce({ status: 500, message: "Server Error" })
      .mockResolvedValueOnce(expectedResult);

    const update = getUpdateOperation(mockApi, mockOptions, mockUtilities);
    const result = await update({ kt: "test", pk: "1" } as any, { name: "updated" });

    expect(result).toEqual(expectedResult);
    expect(mockApi.httpPut).toHaveBeenCalledTimes(2);
  });

  it("should retry on network errors", async () => {
    const expectedResult = { key: { kt: "test", pk: "1" }, name: "test" };
    
    mockApi.httpPut
      .mockRejectedValueOnce({ code: "ECONNREFUSED", message: "Connection refused" })
      .mockResolvedValueOnce(expectedResult);

    const update = getUpdateOperation(mockApi, mockOptions, mockUtilities);
    const result = await update({ kt: "test", pk: "1" } as any, { name: "updated" });

    expect(result).toEqual(expectedResult);
    expect(mockApi.httpPut).toHaveBeenCalledTimes(2);
  });

  it("should retry on 429 rate limiting", async () => {
    const expectedResult = { key: { kt: "test", pk: "1" }, name: "test" };
    
    mockApi.httpPut
      .mockRejectedValueOnce({ status: 429, message: "Rate limited" })
      .mockResolvedValueOnce(expectedResult);

    const update = getUpdateOperation(mockApi, mockOptions, mockUtilities);
    const result = await update({ kt: "test", pk: "1" } as any, { name: "updated" });

    expect(result).toEqual(expectedResult);
    expect(mockApi.httpPut).toHaveBeenCalledTimes(2);
  });

  it("should NOT retry on 4xx client errors (except 429)", async () => {
    mockApi.httpPut.mockRejectedValueOnce({ status: 400, message: "Bad Request" });

    const update = getUpdateOperation(mockApi, mockOptions, mockUtilities);

    await expect(update({ kt: "test", pk: "1" } as any, { name: "updated" }))
      .rejects.toMatchObject({ code: 400 });

    expect(mockApi.httpPut).toHaveBeenCalledTimes(1);
  });

  it("should NOT retry on 401 unauthorized", async () => {
    mockApi.httpPut.mockRejectedValueOnce({ status: 401, message: "Unauthorized" });

    const update = getUpdateOperation(mockApi, mockOptions, mockUtilities);

    await expect(update({ kt: "test", pk: "1" } as any, { name: "updated" }))
      .rejects.toMatchObject({ code: 401 });

    expect(mockApi.httpPut).toHaveBeenCalledTimes(1);
  });

  it("should NOT retry on 403 forbidden", async () => {
    mockApi.httpPut.mockRejectedValueOnce({ status: 403, message: "Forbidden" });

    const update = getUpdateOperation(mockApi, mockOptions, mockUtilities);

    await expect(update({ kt: "test", pk: "1" } as any, { name: "updated" }))
      .rejects.toMatchObject({ code: 403 });

    expect(mockApi.httpPut).toHaveBeenCalledTimes(1);
  });

  it("should NOT retry on 404 not found", async () => {
    mockApi.httpPut.mockRejectedValueOnce({ status: 404, message: "Not Found" });

    const update = getUpdateOperation(mockApi, mockOptions, mockUtilities);

    await expect(update({ kt: "test", pk: "1" } as any, { name: "updated" }))
      .rejects.toMatchObject({ code: 404 });

    expect(mockApi.httpPut).toHaveBeenCalledTimes(1);
  });

  it("should exhaust retries and throw final error", async () => {
    mockApi.httpPut.mockRejectedValue({ status: 500, message: "Server Error" });

    const update = getUpdateOperation(mockApi, mockOptions, mockUtilities);

    await expect(update({ kt: "test", pk: "1" } as any, { name: "updated" }))
      .rejects.toMatchObject({ code: 500 });
    
    expect(mockApi.httpPut).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });

  it("should call custom error handler on final failure", async () => {
    const errorHandler = vi.fn();
    mockOptions.errorHandler = errorHandler;
    
    mockApi.httpPut.mockRejectedValue({ status: 400, message: "Bad Request" });

    const update = getUpdateOperation(mockApi, mockOptions, mockUtilities);

    await expect(update({ kt: "test", pk: "1" } as any, { name: "updated" }))
      .rejects.toBeDefined();

    expect(errorHandler).toHaveBeenCalledTimes(1);
    expect(errorHandler).toHaveBeenCalledWith(
      expect.objectContaining({ code: 400 }),
      expect.objectContaining({ operation: "update" })
    );
  });

  it("should handle error handler throwing an exception", async () => {
    const errorHandler = vi.fn().mockImplementation(() => {
      throw new Error("Handler error");
    });
    mockOptions.errorHandler = errorHandler;
    
    mockApi.httpPut.mockRejectedValue({ status: 400, message: "Bad Request" });

    const update = getUpdateOperation(mockApi, mockOptions, mockUtilities);

    // Should still throw the original error, not the handler error
    await expect(update({ kt: "test", pk: "1" } as any, { name: "updated" }))
      .rejects.toMatchObject({ code: 400 });

    expect(errorHandler).toHaveBeenCalledTimes(1);
  });

  it("should retry multiple times before succeeding", async () => {
    const expectedResult = { key: { kt: "test", pk: "1" }, name: "test" };
    
    mockApi.httpPut
      .mockRejectedValueOnce({ status: 500, message: "Server Error" })
      .mockRejectedValueOnce({ status: 500, message: "Server Error" })
      .mockResolvedValueOnce(expectedResult);

    const update = getUpdateOperation(mockApi, mockOptions, mockUtilities);
    const result = await update({ kt: "test", pk: "1" } as any, { name: "updated" });
    
    expect(result).toEqual(expectedResult);
    expect(mockApi.httpPut).toHaveBeenCalledTimes(3);
  });

  it("should handle timeout errors as retryable", async () => {
    const expectedResult = { key: { kt: "test", pk: "1" }, name: "test" };
    
    mockApi.httpPut
      .mockRejectedValueOnce({ message: "timeout exceeded" })
      .mockResolvedValueOnce(expectedResult);

    const update = getUpdateOperation(mockApi, mockOptions, mockUtilities);
    const result = await update({ kt: "test", pk: "1" } as any, { name: "updated" });

    expect(result).toEqual(expectedResult);
    expect(mockApi.httpPut).toHaveBeenCalledTimes(2);
  });
});
