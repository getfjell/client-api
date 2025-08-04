import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getGetOperation } from '../../src/ops/get';
import { ComKey, Item, PriKey } from '@fjell/core';

// Mock the logger
vi.mock('../../src/logger', () => ({
  default: {
    get: vi.fn(() => ({
      default: vi.fn(),
      debug: vi.fn(),
      info: vi.fn(),
      warning: vi.fn(),
      error: vi.fn(),
    })),
  },
}));

// Mock error handling functions to avoid real delays
vi.mock('../../src/ops/errorHandling', async () => {
  const actual = await vi.importActual('../../src/ops/errorHandling');
  return {
    ...actual,
    calculateRetryDelay: vi.fn(() => 0), // No delay in tests
  };
});

interface TestItem extends Item<'test', 'location1'> {
  name: string;
  value: number;
}

describe('getGetOperation', () => {
  let mockApi: any;
  let mockApiOptions: any;
  let mockUtilities: any;
  let mockErrorHandler: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockErrorHandler = vi.fn();

    mockApi = {
      httpGet: vi.fn(),
    };

    mockApiOptions = {
      readAuthenticated: true,
      getOptions: { timeout: 5000 },
      retryConfig: {
        maxRetries: 2,
        initialDelayMs: 100,
        maxDelayMs: 1000,
        backoffMultiplier: 2,
      },
      errorHandler: mockErrorHandler,
    };

    mockUtilities = {
      getPath: vi.fn((key) => `/test/${typeof key === 'string' ? key : key.pk}`),
      processOne: vi.fn((promise) => promise),
      validatePK: vi.fn((item) => item),
    };
  });

  test('should create get function', () => {
    const get = getGetOperation(mockApi, mockApiOptions, mockUtilities);
    expect(typeof get).toBe('function');
  });

  test('should successfully get an item', async () => {
    const testItem: TestItem = {
      pk: 'test-id' as PriKey<'test'>,
      name: 'Test Item',
      value: 42,
    };

    mockApi.httpGet.mockResolvedValue(testItem);
    mockUtilities.processOne.mockResolvedValue(testItem);
    mockUtilities.validatePK.mockReturnValue(testItem);

    const get = getGetOperation(mockApi, mockApiOptions, mockUtilities);
    const result = await get('test-id' as PriKey<'test'>);

    expect(result).toEqual(testItem);
    expect(mockApi.httpGet).toHaveBeenCalledWith(
      '/test/test-id',
      expect.objectContaining({
        timeout: 5000,
        isAuthenticated: true,
      })
    );
    expect(mockUtilities.processOne).toHaveBeenCalled();
    expect(mockUtilities.validatePK).toHaveBeenCalledWith(testItem);
  });

  test('should return null for 404 errors', async () => {
    const error404 = new Error('Not found');
    Object.assign(error404, { status: 404 });

    mockApi.httpGet.mockRejectedValue(error404);

    const get = getGetOperation(mockApi, mockApiOptions, mockUtilities);
    const result = await get('non-existent-id' as PriKey<'test'>);

    expect(result).toBeNull();
    expect(mockErrorHandler).not.toHaveBeenCalled();
  });

  test('should retry on retryable errors', async () => {
    const testItem: TestItem = {
      pk: 'test-id' as PriKey<'test'>,
      name: 'Test Item',
      value: 42,
    };

    const retryableError = new Error('Server error');
    Object.assign(retryableError, { status: 500 });

    // First call fails, second succeeds
    mockApi.httpGet
      .mockRejectedValueOnce(retryableError)
      .mockResolvedValueOnce(testItem);

    // processOne should be called only on the successful attempt
    mockUtilities.processOne.mockImplementation((promise) => promise);
    mockUtilities.validatePK.mockReturnValue(testItem);

    const get = getGetOperation(mockApi, mockApiOptions, mockUtilities);
    const result = await get('test-id' as PriKey<'test'>);

    expect(result).toEqual(testItem);
    expect(mockApi.httpGet).toHaveBeenCalledTimes(2);
  });

  test('should not retry non-retryable errors', async () => {
    const nonRetryableError = new Error('Bad request');
    Object.assign(nonRetryableError, { status: 400 });

    mockApi.httpGet.mockRejectedValue(nonRetryableError);

    const get = getGetOperation(mockApi, mockApiOptions, mockUtilities);

    await expect(get('test-id' as PriKey<'test'>)).rejects.toThrow();
    expect(mockApi.httpGet).toHaveBeenCalledTimes(1);
    expect(mockErrorHandler).toHaveBeenCalled();
  });

  test('should exhaust retries and throw error', async () => {
    const retryableError = new Error('Server error');
    Object.assign(retryableError, { status: 500 });

    mockApi.httpGet.mockRejectedValue(retryableError);

    const get = getGetOperation(mockApi, mockApiOptions, mockUtilities);

    await expect(get('test-id' as PriKey<'test'>)).rejects.toThrow();
    // Should try initial + 2 retries = 3 total attempts
    expect(mockApi.httpGet).toHaveBeenCalledTimes(3);
    expect(mockErrorHandler).toHaveBeenCalled();
  });

  test('should handle custom error handler failures gracefully', async () => {
    const testError = new Error('Test error');
    Object.assign(testError, { status: 400 });

    mockApi.httpGet.mockRejectedValue(testError);
    mockErrorHandler.mockImplementation(() => {
      throw new Error('Error handler failed');
    });

    const get = getGetOperation(mockApi, mockApiOptions, mockUtilities);

    // Should still throw the original error, not the error handler error
    await expect(get('test-id' as PriKey<'test'>)).rejects.toThrow('Test error');
    expect(mockErrorHandler).toHaveBeenCalled();
  });

  test('should work with composite keys', async () => {
    const testItem: TestItem = {
      pk: 'test-id' as PriKey<'test'>,
      name: 'Test Item',
      value: 42,
    };

    const comKey: ComKey<'test', never, never, never, never, never> = {
      pk: 'test-id' as PriKey<'test'>,
    };

    mockApi.httpGet.mockResolvedValue(testItem);
    mockUtilities.processOne.mockResolvedValue(testItem);
    mockUtilities.validatePK.mockReturnValue(testItem);
    mockUtilities.getPath.mockReturnValue('/test/test-id');

    const get = getGetOperation(mockApi, mockApiOptions, mockUtilities);
    const result = await get(comKey);

    expect(result).toEqual(testItem);
    expect(mockUtilities.getPath).toHaveBeenCalledWith(comKey);
  });

  test('should use default retry configuration when none provided', async () => {
    const testError = new Error('Server error');
    Object.assign(testError, { status: 500 });

    const optionsWithoutRetry = {
      readAuthenticated: true,
      getOptions: {},
      errorHandler: mockErrorHandler,
    };

    mockApi.httpGet.mockRejectedValue(testError);

    const get = getGetOperation(mockApi, optionsWithoutRetry, mockUtilities);

    await expect(get('test-id' as PriKey<'test'>)).rejects.toThrow();
    // Should use default of 3 retries + 1 initial = 4 total attempts
    expect(mockApi.httpGet).toHaveBeenCalledTimes(4);
  });

  test('should merge get options correctly', async () => {
    const testItem: TestItem = {
      pk: 'test-id' as PriKey<'test'>,
      name: 'Test Item',
      value: 42,
    };

    mockApi.httpGet.mockResolvedValue(testItem);
    mockUtilities.processOne.mockResolvedValue(testItem);
    mockUtilities.validatePK.mockReturnValue(testItem);

    const get = getGetOperation(mockApi, mockApiOptions, mockUtilities);
    await get('test-id' as PriKey<'test'>);

    expect(mockApi.httpGet).toHaveBeenCalledWith(
      '/test/test-id',
      expect.objectContaining({
        timeout: 5000,
        isAuthenticated: true,
      })
    );
  });

  test('should handle network errors with retry', async () => {
    const testItem: TestItem = {
      pk: 'test-id' as PriKey<'test'>,
      name: 'Test Item',
      value: 42,
    };

    const networkError = new Error('Connection refused');
    Object.assign(networkError, { code: 'ECONNREFUSED' });

    // First call fails with network error, second succeeds
    mockApi.httpGet
      .mockRejectedValueOnce(networkError)
      .mockResolvedValueOnce(testItem);

    mockUtilities.processOne.mockImplementation((promise) => promise);
    mockUtilities.validatePK.mockReturnValue(testItem);

    const get = getGetOperation(mockApi, mockApiOptions, mockUtilities);
    const result = await get('test-id' as PriKey<'test'>);

    expect(result).toEqual(testItem);
    expect(mockApi.httpGet).toHaveBeenCalledTimes(2);
  });

  test('should handle rate limiting (429) with retry', async () => {
    const testItem: TestItem = {
      pk: 'test-id' as PriKey<'test'>,
      name: 'Test Item',
      value: 42,
    };

    const rateLimitError = new Error('Too many requests');
    Object.assign(rateLimitError, { status: 429 });

    // First call fails with rate limit, second succeeds
    mockApi.httpGet
      .mockRejectedValueOnce(rateLimitError)
      .mockResolvedValueOnce(testItem);

    mockUtilities.processOne.mockImplementation((promise) => promise);
    mockUtilities.validatePK.mockReturnValue(testItem);

    const get = getGetOperation(mockApi, mockApiOptions, mockUtilities);
    const result = await get('test-id' as PriKey<'test'>);

    expect(result).toEqual(testItem);
    expect(mockApi.httpGet).toHaveBeenCalledTimes(2);
  });
});
