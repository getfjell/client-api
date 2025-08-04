/* eslint-disable no-undefined */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  calculateRetryDelay,
  enhanceError,
  executeErrorHandler,
  executeWithRetry,
  getRetryConfig,
  shouldRetryError
} from '../../src/ops/errorHandling';

describe('errorHandling', () => {
  const mockLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    error: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('shouldRetryError', () => {
    it('should retry on network connection errors', () => {
      const errors = [
        { code: 'ECONNREFUSED' },
        { code: 'ENOTFOUND' },
        { code: 'ENETUNREACH' }
      ];

      errors.forEach(error => {
        expect(shouldRetryError(error)).toBe(true);
      });
    });

    it('should retry on timeout errors', () => {
      const errors = [
        { message: 'Connection timeout' },
        { message: 'Request network timeout' },
        { message: 'Socket timeout occurred' }
      ];

      errors.forEach(error => {
        expect(shouldRetryError(error)).toBe(true);
      });
    });

    it('should retry on 5xx server errors', () => {
      const errors = [
        { status: 500 },
        { status: 502 },
        { status: 503 },
        { status: 504 }
      ];

      errors.forEach(error => {
        expect(shouldRetryError(error)).toBe(true);
      });
    });

    it('should retry on 429 rate limiting', () => {
      expect(shouldRetryError({ status: 429 })).toBe(true);
    });

    it('should not retry on 4xx client errors except 429', () => {
      const errors = [
        { status: 400 },
        { status: 401 },
        { status: 403 },
        { status: 404 },
        { status: 422 }
      ];

      errors.forEach(error => {
        expect(shouldRetryError(error)).toBe(false);
      });
    });

    it('should retry on unknown errors by default', () => {
      const errors = [
        { message: 'Unknown error' },
        { code: 'UNKNOWN_CODE' },
        {}
      ];

      errors.forEach(error => {
        expect(shouldRetryError(error)).toBe(true);
      });
    });

    it('should handle null/undefined errors by throwing', () => {
      expect(() => shouldRetryError(null)).toThrow();
      expect(() => shouldRetryError(undefined)).toThrow();
    });
  });

  describe('calculateRetryDelay', () => {
    it('should calculate exponential backoff delay', () => {
      const config = {
        initialDelayMs: 1000,
        backoffMultiplier: 2,
        maxDelayMs: 30000
      };

      const delay0 = calculateRetryDelay(0, config);
      const delay1 = calculateRetryDelay(1, config);
      const delay2 = calculateRetryDelay(2, config);

      // Should be exponential (with jitter between 50%-100%)
      expect(delay0).toBeGreaterThanOrEqual(500); // 50% of 1000ms
      expect(delay0).toBeLessThanOrEqual(1000); // 100% of 1000ms

      expect(delay1).toBeGreaterThanOrEqual(1000); // 50% of 2000ms
      expect(delay1).toBeLessThanOrEqual(2000); // 100% of 2000ms

      expect(delay2).toBeGreaterThanOrEqual(2000); // 50% of 4000ms
      expect(delay2).toBeLessThanOrEqual(4000); // 100% of 4000ms
    });

    it('should cap delay at maxDelayMs', () => {
      const config = {
        initialDelayMs: 1000,
        backoffMultiplier: 2,
        maxDelayMs: 5000
      };

      const delay = calculateRetryDelay(10, config); // Would be 1024000ms without cap
      expect(delay).toBeLessThanOrEqual(5000);
      expect(delay).toBeGreaterThanOrEqual(2500); // 50% of cap
    });

    it('should use default values when config properties are missing', () => {
      const delay = calculateRetryDelay(0, {});
      expect(delay).toBeGreaterThanOrEqual(500); // 50% of default 1000ms
      expect(delay).toBeLessThanOrEqual(1000); // 100% of default 1000ms
    });
  });

  describe('enhanceError', () => {
    it('should enhance error with context', () => {
      const originalError = new Error('Test error');
      originalError.status = 500;
      const context = { operation: 'test', id: '123' };

      const enhanced = enhanceError(originalError, context);

      expect(enhanced.message).toBe('Test error');
      expect(enhanced.code).toBe(500);
      expect(enhanced.status).toBe(500);
      expect(enhanced.context).toEqual(context);
      expect(enhanced.originalError).toBe(originalError);
    });

    it('should create error from null/undefined', () => {
      const context = { operation: 'test' };

      const enhanced = enhanceError(null, context);

      expect(enhanced.message).toBe('Unknown error occurred');
      expect(enhanced).toBeInstanceOf(Error);
      // Note: context is not added to new errors created from null
      expect(enhanced.context).toBeUndefined();
    });

    it('should return already enhanced errors as-is', () => {
      const alreadyEnhanced = new Error('Already enhanced');
      alreadyEnhanced.context = { existing: true };

      const result = enhanceError(alreadyEnhanced, { new: 'context' });

      expect(result).toBe(alreadyEnhanced);
      expect(result.context).toEqual({ existing: true });
    });

    it('should handle errors with different code/status properties', () => {
      const errorWithCode = { message: 'Code error', code: 'ERR_CODE' };
      const enhanced = enhanceError(errorWithCode, {});
      expect(enhanced.code).toBe('ERR_CODE');

      const errorWithStatus = { message: 'Status error', status: 404 };
      const enhanced2 = enhanceError(errorWithStatus, {});
      expect(enhanced2.code).toBe(404);
    });
  });

  describe('getRetryConfig', () => {
    it('should return default config when no options provided', () => {
      const config = getRetryConfig({});

      expect(config).toEqual({
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 30000,
        backoffMultiplier: 2
      });
    });

    it('should merge custom retry config with defaults', () => {
      const apiOptions = {
        retryConfig: {
          maxRetries: 5,
          initialDelayMs: 2000
        }
      };

      const config = getRetryConfig(apiOptions);

      expect(config).toEqual({
        maxRetries: 5,
        initialDelayMs: 2000,
        maxDelayMs: 30000,
        backoffMultiplier: 2
      });
    });

    it('should override all default values when provided', () => {
      const apiOptions = {
        retryConfig: {
          maxRetries: 1,
          initialDelayMs: 500,
          maxDelayMs: 10000,
          backoffMultiplier: 1.5
        }
      };

      const config = getRetryConfig(apiOptions);

      expect(config).toEqual(apiOptions.retryConfig);
    });
  });

  describe('executeErrorHandler', () => {
    it('should execute error handler with error and context', () => {
      const errorHandler = vi.fn();
      const error = new Error('Test error');
      const context = { operation: 'test' };

      executeErrorHandler(errorHandler, error, context, mockLogger);

      expect(errorHandler).toHaveBeenCalledWith(error, context);
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should do nothing when no error handler provided', () => {
      executeErrorHandler(undefined, new Error('Test'), {}, mockLogger);
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should handle error handler that throws', () => {
      const errorHandler = vi.fn().mockImplementation(() => {
        throw new Error('Handler failed');
      });
      const originalError = new Error('Original error');
      const context = { operation: 'test' };

      executeErrorHandler(errorHandler, originalError, context, mockLogger);

      expect(errorHandler).toHaveBeenCalledWith(originalError, context);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Custom error handler failed',
        {
          originalError: 'Original error',
          handlerError: 'Handler failed'
        }
      );
    });

    it('should handle non-Error objects thrown by handler', () => {
      const errorHandler = vi.fn().mockImplementation(() => {
        throw 'String error';
      });

      executeErrorHandler(errorHandler, new Error('Test'), {}, mockLogger);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Custom error handler failed',
        {
          originalError: 'Test',
          handlerError: 'String error'
        }
      );
    });
  });

  describe('executeWithRetry', () => {
    it('should succeed on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      const apiOptions = {};
      const context = { operation: 'test' };

      const result = await executeWithRetry(
        operation,
        'test-operation',
        context,
        apiOptions,
        mockLogger
      );

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Executing test-operation (attempt 1)',
        context
      );
    });

    it('should retry on retryable errors and eventually succeed', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce({ status: 500 })
        .mockRejectedValueOnce({ code: 'ECONNREFUSED' })
        .mockResolvedValue('success');

      const apiOptions = { retryConfig: { maxRetries: 3, initialDelayMs: 10 } };
      const context = { operation: 'test' };

      const result = await executeWithRetry(
        operation,
        'test-operation',
        context,
        apiOptions,
        mockLogger
      );

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'test-operation operation succeeded after 2 retries',
        expect.objectContaining({
          ...context,
          totalAttempts: 3
        })
      );
    });

    it('should fail after max retries on retryable errors', async () => {
      const error = { status: 500, message: 'Server error' };
      const operation = vi.fn().mockRejectedValue(error);
      const apiOptions = { retryConfig: { maxRetries: 2, initialDelayMs: 10 } };
      const context = { operation: 'test' };

      await expect(
        executeWithRetry(operation, 'test-operation', context, apiOptions, mockLogger)
      ).rejects.toThrow();

      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
      expect(mockLogger.error).toHaveBeenCalledWith(
        'test-operation operation failed after 3 attempts',
        expect.objectContaining({
          ...context,
          errorMessage: expect.any(String),
          totalAttempts: 3
        })
      );
    });

    it('should not retry on non-retryable errors', async () => {
      const error = { status: 404, message: 'Not found' };
      const operation = vi.fn().mockRejectedValue(error);
      const apiOptions = {};
      const context = { operation: 'test' };

      await expect(
        executeWithRetry(operation, 'test-operation', context, apiOptions, mockLogger)
      ).rejects.toThrow();

      expect(operation).toHaveBeenCalledTimes(1);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Not retrying test-operation operation due to non-retryable error',
        expect.objectContaining({
          ...context,
          errorMessage: 'Not found',
          errorCode: 404,
          attempt: 1
        })
      );
    });

    it('should handle special error handling returning values', async () => {
      const error = { status: 404, message: 'Not found' };
      const operation = vi.fn().mockRejectedValue(error);
      const specialErrorHandling = vi.fn().mockReturnValue(null);
      const apiOptions = {};
      const context = { operation: 'test' };

      const result = await executeWithRetry(
        operation,
        'test-operation',
        context,
        apiOptions,
        mockLogger,
        specialErrorHandling
      );

      expect(result).toBe(null);
      expect(specialErrorHandling).toHaveBeenCalledWith(error);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should continue retrying when special error handling returns undefined', async () => {
      const error = { status: 500, message: 'Server error' };
      const operation = vi.fn().mockRejectedValue(error);
      const specialErrorHandling = vi.fn().mockReturnValue(undefined);
      const apiOptions = { retryConfig: { maxRetries: 1, initialDelayMs: 10 } };
      const context = { operation: 'test' };

      await expect(
        executeWithRetry(operation, 'test-operation', context, apiOptions, mockLogger, specialErrorHandling)
      ).rejects.toThrow();

      expect(specialErrorHandling).toHaveBeenCalledTimes(2); // Called on each attempt
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should execute custom error handler on final failure', async () => {
      const error = { status: 500, message: 'Server error' };
      const operation = vi.fn().mockRejectedValue(error);
      const errorHandler = vi.fn();
      const apiOptions = {
        retryConfig: { maxRetries: 1, initialDelayMs: 10 },
        errorHandler
      };
      const context = { operation: 'test' };

      await expect(
        executeWithRetry(operation, 'test-operation', context, apiOptions, mockLogger)
      ).rejects.toThrow();

      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
          context
        }),
        context
      );
    });

    it('should log retry attempts with delays', async () => {
      const error = { status: 500, message: 'Server error' };
      const operation = vi.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success');

      const apiOptions = { retryConfig: { maxRetries: 2, initialDelayMs: 10 } };
      const context = { operation: 'test' };

      await executeWithRetry(operation, 'test-operation', context, apiOptions, mockLogger);

      expect(mockLogger.warning).toHaveBeenCalledWith(
        expect.stringContaining('Retrying test-operation operation (attempt 2)'),
        expect.objectContaining({
          ...context,
          errorMessage: 'Server error',
          errorCode: 500,
          delay: expect.any(Number),
          attemptNumber: 1
        })
      );
    });
  });
});
