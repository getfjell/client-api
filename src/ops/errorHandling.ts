/**
 * Shared error handling utilities for all HTTP operations
 */

import { isFjellHttpError } from '@fjell/http-api';

/**
 * Determines if an error should be retried based on error type and status code
 */
export function shouldRetryError(error: any): boolean {
  // Check FjellHttpError retryable flag first
  if (isFjellHttpError(error)) {
    return error.isRetryable();
  }

  // Retry on network errors and timeouts
  if (error.code === 'ECONNREFUSED' ||
    error.code === 'ENOTFOUND' ||
    error.code === 'ENETUNREACH' ||
    error.message?.includes('timeout') ||
    error.message?.includes('network')) {
    return true;
  }

  // Retry on HTTP 5xx errors and 429 (rate limiting)
  if (error.status >= 500 || error.status === 429) {
    return true;
  }

  // Don't retry on 4xx client errors (except 429)
  if (error.status >= 400 && error.status < 500 && error.status !== 429) {
    return false;
  }

  // Default to retrying unknown errors
  return true;
}

/**
 * Calculates retry delay with exponential backoff and jitter
 */
export function calculateRetryDelay(attempt: number, config: any): number {
  const exponentialDelay = (config.initialDelayMs || 1000) * Math.pow(config.backoffMultiplier || 2, attempt);
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs || 30000);

  // Add jitter: random value between 50% and 100% of calculated delay
  const jitter = 0.5 + (Math.random() * 0.5);
  return Math.floor(cappedDelay * jitter);
}

/**
 * Enhances error with additional context information
 * Preserves FjellHttpError without modification
 */
export function enhanceError(error: any, context: any): any {
  if (!error) return new Error('Unknown error occurred');

  // Don't modify FjellHttpError - it already has full context
  if (isFjellHttpError(error)) {
    return error;
  }

  // If it's already enhanced, return as-is
  if (error.context) return error;

  // Add context to the error
  const enhancedError = new Error(error.message || 'HTTP operation failed');
  Object.assign(enhancedError, {
    code: error.code || error.status || 'UNKNOWN_ERROR',
    status: error.status,
    context,
    originalError: error
  });

  return enhancedError;
}

/**
 * Gets default retry configuration merged with provided options
 */
export function getRetryConfig(apiOptions: any): any {
  return {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    ...apiOptions.retryConfig
  };
}

/**
 * Handles custom error handler execution with error protection
 */
export function executeErrorHandler(
  errorHandler: ((error: any, context?: Record<string, any>) => void) | undefined,
  error: any,
  context: any,
  logger: any
): void {
  if (!errorHandler) return;

  try {
    errorHandler(error, context);
  } catch (handlerError: any) {
    logger.error('Custom error handler failed', {
      originalError: error.message,
      handlerError: handlerError?.message || String(handlerError)
    });
  }
}

/**
 * Common retry loop logic for HTTP operations
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  operationContext: Record<string, any>,
  apiOptions: any,
  logger: any,
  specialErrorHandling?: (error: any) => T | null | undefined
): Promise<T> {
  const retryConfig = getRetryConfig(apiOptions);
  let lastError: any = null;
  const startTime = Date.now();

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      logger.debug(`Executing ${operationName} (attempt ${attempt + 1})`, operationContext);

      const result = await operation();

      if (attempt > 0) {
        logger.info(`${operationName} operation succeeded after ${attempt} retries`, {
          ...operationContext,
          totalAttempts: attempt + 1,
          duration: Date.now() - startTime
        });
      }

      return result;
    } catch (error: any) {
      lastError = error;

      // Handle special error cases (like 404 returning null)
      if (specialErrorHandling) {
        const specialResult = specialErrorHandling(error);
        if (specialResult !== void 0) {
          return specialResult as T;
        }
      }

      // Don't retry on the last attempt
      if (attempt === retryConfig.maxRetries) {
        break;
      }

      // Check if we should retry this error
      const isRetryable = shouldRetryError(error);
      if (!isRetryable) {
        logger.debug(`Not retrying ${operationName} operation due to non-retryable error`, {
          ...operationContext,
          errorMessage: error.message,
          errorCode: error.code || error.status,
          attempt: attempt + 1
        });
        break;
      }

      // Calculate delay with exponential backoff
      const delay = calculateRetryDelay(attempt, retryConfig);

      logger.warning(`Retrying ${operationName} operation (attempt ${attempt + 2}) after ${delay}ms`, {
        ...operationContext,
        errorMessage: error.message,
        errorCode: error.code || error.status,
        delay,
        attemptNumber: attempt + 1
      });

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Handle final error
  const finalError = enhanceError(lastError, operationContext);

  // Execute custom error handler if provided
  executeErrorHandler(apiOptions.errorHandler, finalError, operationContext, logger);

  logger.error(`${operationName} operation failed after ${retryConfig.maxRetries + 1} attempts`, {
    ...operationContext,
    errorMessage: finalError.message,
    errorCode: finalError.code || finalError.status,
    duration: Date.now() - startTime,
    totalAttempts: retryConfig.maxRetries + 1
  });

  throw finalError;
}
