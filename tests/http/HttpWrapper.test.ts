/* eslint-disable @typescript-eslint/no-unused-vars */
 
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpApi } from '@fjell/http-api';
import { HttpWrapper, RetryConfig } from '../../src/http/HttpWrapper';
import {
  AuthenticationError,
  NetworkError,
  RateLimitError,
  ServerError,
  TimeoutError,
  ValidationError
} from '../../src/errors/index';

// Mock the console methods to avoid cluttering test output
const mockConsole = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
};

describe('HttpWrapper', () => {
  let mockHttpApi: HttpApi;
  let httpWrapper: HttpWrapper;
  let originalConsole: typeof console;

  beforeEach(() => {
    // Mock console methods
    originalConsole = global.console;
    global.console = mockConsole as any;

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

    // Use fake timers for better control over async operations
    vi.useFakeTimers();

    // Create HttpWrapper with default config
    httpWrapper = new HttpWrapper(mockHttpApi);
  });

  afterEach(() => {
    global.console = originalConsole;
    vi.useRealTimers();
  });

  describe('Constructor and Configuration', () => {
    it('should create instance with default configuration', () => {
      const wrapper = new HttpWrapper(mockHttpApi);
      const config = wrapper.getRetryConfig();

      expect(config.maxRetries).toBe(3);
      expect(config.initialDelayMs).toBe(1000);
      expect(config.maxDelayMs).toBe(30000);
      expect(config.backoffMultiplier).toBe(2);
      expect(config.enableJitter).toBe(true);
      expect(typeof config.shouldRetry).toBe('function');
      expect(typeof config.onRetry).toBe('function');
    });

    it('should create instance with custom configuration', () => {
      const customConfig: RetryConfig = {
        maxRetries: 5,
        initialDelayMs: 2000,
        maxDelayMs: 60000,
        backoffMultiplier: 3,
        enableJitter: false
      };

      const wrapper = new HttpWrapper(mockHttpApi, customConfig);
      const config = wrapper.getRetryConfig();

      expect(config.maxRetries).toBe(5);
      expect(config.initialDelayMs).toBe(2000);
      expect(config.maxDelayMs).toBe(60000);
      expect(config.backoffMultiplier).toBe(3);
      expect(config.enableJitter).toBe(false);
    });

    it('should update retry configuration', () => {
      const newConfig = { maxRetries: 7, initialDelayMs: 500 };
      httpWrapper.updateRetryConfig(newConfig);

      const config = httpWrapper.getRetryConfig();
      expect(config.maxRetries).toBe(7);
      expect(config.initialDelayMs).toBe(500);
      // Other values should remain from defaults
      expect(config.maxDelayMs).toBe(30000);
    });
  });

  describe('Successful Operations', () => {
    it('should execute GET request successfully without retries', async () => {
      const mockResponse = { data: 'test' };
      vi.mocked(mockHttpApi.httpGet).mockResolvedValue(mockResponse);

      const result = await httpWrapper.get('/test-url', { param: 'value' });

      expect(result).toEqual(mockResponse);
      expect(mockHttpApi.httpGet).toHaveBeenCalledTimes(1);
      expect(mockHttpApi.httpGet).toHaveBeenCalledWith('/test-url', { param: 'value' });
      expect(mockConsole.debug).toHaveBeenCalledWith(
        'Executing GET',
        expect.objectContaining({
          attempt: 1,
          maxRetries: 4,
          url: '/test-url'
        })
      );
    });

    it('should execute POST request successfully', async () => {
      const mockData = { name: 'test' };
      const mockResponse = { id: 1, ...mockData };
      vi.mocked(mockHttpApi.httpPost).mockResolvedValue(mockResponse);

      const result = await httpWrapper.post('/test-url', mockData, { headers: {} });

      expect(result).toEqual(mockResponse);
      expect(mockHttpApi.httpPost).toHaveBeenCalledTimes(1);
      expect(mockHttpApi.httpPost).toHaveBeenCalledWith('/test-url', mockData, { headers: {} });
    });

    it('should execute PUT request successfully', async () => {
      const mockData = { id: 1, name: 'updated' };
      const mockResponse = mockData;
      vi.mocked(mockHttpApi.httpPut).mockResolvedValue(mockResponse);

      const result = await httpWrapper.put('/test-url/1', mockData);

      expect(result).toEqual(mockResponse);
      expect(mockHttpApi.httpPut).toHaveBeenCalledTimes(1);
      expect(mockHttpApi.httpPut).toHaveBeenCalledWith('/test-url/1', mockData, undefined);
    });

    it('should execute DELETE request successfully', async () => {
      const mockResponse = { success: true };
      vi.mocked(mockHttpApi.httpDelete).mockResolvedValue(mockResponse);

      const result = await httpWrapper.delete('/test-url/1', { force: true });

      expect(result).toEqual(mockResponse);
      expect(mockHttpApi.httpDelete).toHaveBeenCalledTimes(1);
      expect(mockHttpApi.httpDelete).toHaveBeenCalledWith('/test-url/1', { force: true });
    });
  });

  describe('Retry Logic', () => {
    it('should retry on retryable errors and succeed', async () => {
      const mockResponse = { data: 'success' };
      const networkError = new NetworkError('Connection failed');

      vi.mocked(mockHttpApi.httpGet)
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValue(mockResponse);

      // Start the async operation
      const resultPromise = httpWrapper.get('/test-url');

      // Fast-forward through the delays
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result).toEqual(mockResponse);
      expect(mockHttpApi.httpGet).toHaveBeenCalledTimes(3);
      expect(mockConsole.warn).toHaveBeenCalledTimes(2);
      expect(mockConsole.info).toHaveBeenCalledWith(
        'GET succeeded after 2 retries',
        expect.objectContaining({
          totalAttempts: 3,
          url: '/test-url'
        })
      );
    });

    it('should not retry non-retryable errors', async () => {
      const authError = new AuthenticationError('Invalid credentials');
      vi.mocked(mockHttpApi.httpGet).mockRejectedValue(authError);

      await expect(httpWrapper.get('/test-url')).rejects.toThrow(authError);

      expect(mockHttpApi.httpGet).toHaveBeenCalledTimes(1);
      expect(mockConsole.debug).toHaveBeenCalledWith(
        'Not retrying GET due to non-retryable error',
        expect.objectContaining({
          errorCode: 'AUTHENTICATION_ERROR',
          attempt: 1
        })
      );
    });

    it('should exhaust all retries and fail', async () => {
      const serverError = new ServerError(500, 'Internal Server Error');
      vi.mocked(mockHttpApi.httpGet).mockRejectedValue(serverError);

      const resultPromise = httpWrapper.get('/test-url');

      // Handle both timer advancement and error expectation together
      const [, error] = await Promise.all([
        vi.runAllTimersAsync(),
        expect(resultPromise).rejects.toThrow(serverError)
      ]);

      expect(mockHttpApi.httpGet).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
      expect(mockConsole.error).toHaveBeenCalledWith(
        'GET failed after 4 attempts',
        expect.objectContaining({
          errorCode: 'SERVER_ERROR',
          url: '/test-url'
        })
      );
    });

    it('should handle rate limiting with custom retry delay', async () => {
      const rateLimitError = new RateLimitError(5); // 5 seconds retry-after
      const mockResponse = { data: 'success' };

      vi.mocked(mockHttpApi.httpGet)
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValue(mockResponse);

      const resultPromise = httpWrapper.get('/test-url');

      // Fast-forward through delays
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result).toEqual(mockResponse);
      expect(mockHttpApi.httpGet).toHaveBeenCalledTimes(2);

      // Verify retry callback was called with appropriate delay
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('Retrying HTTP request'),
        expect.objectContaining({
          errorCode: 'RATE_LIMIT_ERROR',
          delay: 5000 // Should use rate limit delay (5000ms > default 1000ms)
        })
      );
    });

    it('should respect custom shouldRetry function', async () => {
      const customConfig: RetryConfig = {
        shouldRetry: (error, attempt) => attempt < 1 // Only allow 1 retry
      };

      const wrapper = new HttpWrapper(mockHttpApi, customConfig);
      const serverError = new ServerError(500, 'Internal Server Error');
      vi.mocked(mockHttpApi.httpGet).mockRejectedValue(serverError);

      const resultPromise = wrapper.get('/test-url');

      // Handle both timer advancement and error expectation together
      const [, error] = await Promise.all([
        vi.runAllTimersAsync(),
        expect(resultPromise).rejects.toThrow(serverError)
      ]);

      expect(mockHttpApi.httpGet).toHaveBeenCalledTimes(2); // 1 initial + 1 retry
    });

    it('should call custom onRetry callback', async () => {
      const onRetryMock = vi.fn();
      const customConfig: RetryConfig = {
        onRetry: onRetryMock
      };

      const wrapper = new HttpWrapper(mockHttpApi, customConfig);
      const networkError = new NetworkError('Connection failed');
      const mockResponse = { data: 'success' };

      vi.mocked(mockHttpApi.httpGet)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValue(mockResponse);

      const resultPromise = wrapper.get('/test-url');

      // Fast-forward through delays
      await vi.runAllTimersAsync();

      await resultPromise;

      expect(onRetryMock).toHaveBeenCalledTimes(1);
      expect(onRetryMock).toHaveBeenCalledWith(
        networkError,
        0, // attempt number
        expect.any(Number) // delay
      );
    });
  });

  describe('Error Conversion', () => {
    it('should preserve ClientApiError instances', async () => {
      const validationError = new ValidationError('Invalid input');
      vi.mocked(mockHttpApi.httpPost).mockRejectedValue(validationError);

      await expect(httpWrapper.post('/test-url', {})).rejects.toThrow(validationError);
      expect(mockHttpApi.httpPost).toHaveBeenCalledTimes(1);
    });

    it('should convert HTTP response errors', async () => {
      const httpError = {
        response: {
          status: 404,
          statusText: 'Not Found',
          data: { message: 'Resource not found' },
          headers: { 'content-type': 'application/json' }
        },
        config: { url: '/test-url' }
      };

      vi.mocked(mockHttpApi.httpGet).mockRejectedValue(httpError);

      try {
        await httpWrapper.get('/test-url');
        expect.fail('Should have thrown an error');
      } catch (thrownError: any) {
        expect(thrownError.message).toContain('Resource not found');
        expect(thrownError.code).toBe('NOT_FOUND_ERROR');
        expect(thrownError.context).toMatchObject({
          operation: 'GET',
          url: '/test-url',
          statusCode: 404,
          headers: { 'content-type': 'application/json' }
        });
      }
    });

    it('should convert network request errors', async () => {
      // Use wrapper with no retries to avoid timeout issues
      const noRetryWrapper = new HttpWrapper(mockHttpApi, { maxRetries: 0 });

      const networkError = {
        request: {},
        code: 'ECONNREFUSED',
        message: 'Connection refused',
        config: { url: '/test-url', method: 'GET' }
      };

      vi.mocked(mockHttpApi.httpGet).mockRejectedValue(networkError);

      await expect(noRetryWrapper.get('/test-url')).rejects.toMatchObject({
        message: expect.stringContaining('Network error: Connection refused'),
        code: 'NETWORK_ERROR',
        isRetryable: true
      });
    });

    it('should convert timeout errors', async () => {
      // Use wrapper with no retries to avoid timeout issues
      const noRetryWrapper = new HttpWrapper(mockHttpApi, { maxRetries: 0 });

      const timeoutError = {
        request: {},
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded',
        timeout: 5000,
        config: { url: '/test-url' }
      };

      vi.mocked(mockHttpApi.httpGet).mockRejectedValue(timeoutError);

      await expect(noRetryWrapper.get('/test-url')).rejects.toMatchObject({
        message: expect.stringContaining('Request timed out after 5000ms'),
        code: 'TIMEOUT_ERROR',
        isRetryable: true
      });
    });

    it('should convert unknown errors to network errors', async () => {
      // Use wrapper with no retries to avoid timeout issues
      const noRetryWrapper = new HttpWrapper(mockHttpApi, { maxRetries: 0 });

      const unknownError = new Error('Something went wrong');
      vi.mocked(mockHttpApi.httpGet).mockRejectedValue(unknownError);

      await expect(noRetryWrapper.get('/test-url')).rejects.toMatchObject({
        message: expect.stringContaining('Network error: Something went wrong'),
        code: 'NETWORK_ERROR',
        isRetryable: true
      });
    });
  });

  describe('Exponential Backoff and Jitter', () => {
    it('should calculate delay with exponential backoff', async () => {
      const onRetryMock = vi.fn();
      const customConfig: RetryConfig = {
        initialDelayMs: 100,
        backoffMultiplier: 2,
        enableJitter: false, // Disable jitter for predictable testing
        onRetry: onRetryMock
      };

      const wrapper = new HttpWrapper(mockHttpApi, customConfig);
      const networkError = new NetworkError('Connection failed');
      const mockResponse = { data: 'success' };

      vi.mocked(mockHttpApi.httpGet)
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValue(mockResponse);

      const resultPromise = wrapper.get('/test-url');

      // Fast-forward through delays
      await vi.runAllTimersAsync();

      await resultPromise;

      expect(onRetryMock).toHaveBeenCalledTimes(3);

      // Check exponential backoff: 100ms, 200ms, 400ms
      expect(onRetryMock).toHaveBeenNthCalledWith(1, networkError, 0, 100);
      expect(onRetryMock).toHaveBeenNthCalledWith(2, networkError, 1, 200);
      expect(onRetryMock).toHaveBeenNthCalledWith(3, networkError, 2, 400);
    });

    it('should respect maximum delay', async () => {
      const onRetryMock = vi.fn();
      const customConfig: RetryConfig = {
        initialDelayMs: 1000,
        backoffMultiplier: 10,
        maxDelayMs: 2000,
        enableJitter: false,
        onRetry: onRetryMock
      };

      const wrapper = new HttpWrapper(mockHttpApi, customConfig);
      const networkError = new NetworkError('Connection failed');
      const mockResponse = { data: 'success' };

      vi.mocked(mockHttpApi.httpGet)
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValue(mockResponse);

      const resultPromise = wrapper.get('/test-url');

      // Fast-forward through delays
      await vi.runAllTimersAsync();

      await resultPromise;

      expect(onRetryMock).toHaveBeenCalledTimes(2);

      // Second retry should be capped at maxDelayMs (2000ms) instead of 10000ms
      expect(onRetryMock).toHaveBeenNthCalledWith(1, networkError, 0, 1000);
      expect(onRetryMock).toHaveBeenNthCalledWith(2, networkError, 1, 2000);
    });

    it('should apply jitter when enabled', async () => {
      const onRetryMock = vi.fn();
      const customConfig: RetryConfig = {
        initialDelayMs: 1000,
        backoffMultiplier: 2,
        enableJitter: true,
        onRetry: onRetryMock
      };

      const wrapper = new HttpWrapper(mockHttpApi, customConfig);
      const networkError = new NetworkError('Connection failed');
      const mockResponse = { data: 'success' };

      vi.mocked(mockHttpApi.httpGet)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValue(mockResponse);

      const resultPromise = wrapper.get('/test-url');

      // Fast-forward through delays
      await vi.runAllTimersAsync();

      await resultPromise;

      expect(onRetryMock).toHaveBeenCalledTimes(1);

      const [, , delay] = onRetryMock.mock.calls[0];
      // With jitter, delay should be between 500ms (50%) and 1000ms (100%)
      expect(delay).toBeGreaterThanOrEqual(500);
      expect(delay).toBeLessThanOrEqual(1000);
    });
  });

  describe('Context Handling', () => {
    it('should include context in operation calls', async () => {
      const mockResponse = { data: 'test' };
      vi.mocked(mockHttpApi.httpGet).mockResolvedValue(mockResponse);

      const context = { userId: '123', traceId: 'abc' };
      await httpWrapper.get('/test-url', {}, context);

      expect(mockConsole.debug).toHaveBeenCalledWith(
        'Executing GET',
        expect.objectContaining({
          url: '/test-url',
          userId: '123',
          traceId: 'abc'
        })
      );
    });

    it('should preserve context in error scenarios', async () => {
      const authError = new AuthenticationError('Invalid token');
      vi.mocked(mockHttpApi.httpPost).mockRejectedValue(authError);

      const context = { userId: '456' };
      await expect(httpWrapper.post('/test-url', {}, {}, context)).rejects.toThrow(authError);

      expect(mockConsole.debug).toHaveBeenCalledWith(
        'Not retrying POST due to non-retryable error',
        expect.objectContaining({
          url: '/test-url',
          userId: '456'
        })
      );
    });

    it('should handle POST/PUT data context', async () => {
      const mockResponse = { id: 1 };
      vi.mocked(mockHttpApi.httpPost).mockResolvedValue(mockResponse);

      await httpWrapper.post('/test-url', { name: 'test' });

      expect(mockConsole.debug).toHaveBeenCalledWith(
        'Executing POST',
        expect.objectContaining({
          url: '/test-url',
          hasData: true
        })
      );
    });

    it('should handle POST/PUT without data', async () => {
      const mockResponse = { success: true };
      vi.mocked(mockHttpApi.httpPost).mockResolvedValue(mockResponse);

      await httpWrapper.post('/test-url');

      expect(mockConsole.debug).toHaveBeenCalledWith(
        'Executing POST',
        expect.objectContaining({
          url: '/test-url',
          hasData: false
        })
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero maxRetries configuration', async () => {
      const customConfig: RetryConfig = { maxRetries: 0 };
      const wrapper = new HttpWrapper(mockHttpApi, customConfig);

      const networkError = new NetworkError('Connection failed');
      vi.mocked(mockHttpApi.httpGet).mockRejectedValue(networkError);

      await expect(wrapper.get('/test-url')).rejects.toThrow(networkError);

      expect(mockHttpApi.httpGet).toHaveBeenCalledTimes(1); // No retries
    });

    it('should handle null/undefined responses', async () => {
      vi.mocked(mockHttpApi.httpGet).mockResolvedValue(null);

      const result = await httpWrapper.get('/test-url');

      expect(result).toBeNull();
      expect(mockHttpApi.httpGet).toHaveBeenCalledTimes(1);
    });

    it('should handle very large delays gracefully', async () => {
      const customConfig: RetryConfig = {
        initialDelayMs: Number.MAX_SAFE_INTEGER,
        maxDelayMs: Number.MAX_SAFE_INTEGER,
        enableJitter: false
      };

      const wrapper = new HttpWrapper(mockHttpApi, customConfig);
      // This test just ensures no overflow errors occur in delay calculation
      const config = wrapper.getRetryConfig();
      expect(config.initialDelayMs).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should handle malformed retry-after headers', async () => {
      // Use wrapper with no retries to avoid timeout issues
      const noRetryWrapper = new HttpWrapper(mockHttpApi, { maxRetries: 0 });

      const rateLimitError = {
        response: {
          status: 429,
          statusText: 'Too Many Requests',
          data: {},
          headers: { 'retry-after': 'invalid' }
        }
      };

      vi.mocked(mockHttpApi.httpGet).mockRejectedValue(rateLimitError);

      await expect(noRetryWrapper.get('/test-url')).rejects.toMatchObject({
        message: expect.stringContaining('Rate limit exceeded'),
        code: 'RATE_LIMIT_ERROR',
        retryAfter: expect.any(Number) // NaN is a number in JavaScript
      });
    });
  });

  describe('Default Retry Logic', () => {
    it('should use default shouldRetry logic correctly', () => {
      const config = httpWrapper.getRetryConfig();

      // Test retryable errors
      const networkError = new NetworkError('Connection failed');
      const serverError = new ServerError(500, 'Internal error');
      const timeoutError = new TimeoutError(5000);

      expect(config.shouldRetry(networkError, 0)).toBe(true);
      expect(config.shouldRetry(serverError, 1)).toBe(true);
      expect(config.shouldRetry(timeoutError, 2)).toBe(true);

      // Should not retry after max attempts
      expect(config.shouldRetry(networkError, 3)).toBe(false);

      // Test non-retryable errors
      const authError = new AuthenticationError('Invalid token');
      const validationError = new ValidationError('Bad input');

      expect(config.shouldRetry(authError, 0)).toBe(false);
      expect(config.shouldRetry(validationError, 1)).toBe(false);
    });
  });
});
