import { HttpApi } from '@fjell/http-api';
import {
  ClientApiError,
  createHttpError,
  createNetworkError,
  RateLimitError
} from '../errors/index.js';

// Simple logger interface for now
const logger = {
  debug: (message: string, context?: any) => console.debug(message, context),
  info: (message: string, context?: any) => console.info(message, context),
  warning: (message: string, context?: any) => console.warn(message, context),
  error: (message: string, context?: any) => console.error(message, context)
};

/**
 * Configuration for retry behavior
 */
export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay between retries in milliseconds (default: 1000) */
  initialDelayMs?: number;
  /** Maximum delay between retries in milliseconds (default: 30000) */
  maxDelayMs?: number;
  /** Backoff multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number;
  /** Whether to add jitter to retry delays (default: true) */
  enableJitter?: boolean;
  /** Custom function to determine if an error should be retried */
  shouldRetry?: (error: ClientApiError, attemptNumber: number) => boolean;
  /** Called before each retry attempt */
  onRetry?: (error: ClientApiError, attemptNumber: number, delay: number) => void;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  enableJitter: true,
  shouldRetry: (error: ClientApiError, attemptNumber: number) => {
    // Don't retry after max attempts
    if (attemptNumber >= 3) return false;

    // Always retry retryable errors
    if (error.isRetryable) return true;

    // Don't retry non-retryable errors
    return false;
  },
  onRetry: (error: ClientApiError, attemptNumber: number, delay: number) => {
    logger.warning(`Retrying HTTP request (attempt ${attemptNumber + 1}) after ${delay}ms`, {
      errorCode: error.code,
      errorMessage: error.message,
      delay,
      attemptNumber
    });
  }
};

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate delay for exponential backoff with optional jitter
 */
function calculateDelay(
  attemptNumber: number,
  config: Required<RetryConfig>
): number {
  const exponentialDelay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attemptNumber);
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);

  if (!config.enableJitter) {
    return cappedDelay;
  }

  // Add jitter: random value between 50% and 100% of calculated delay
  const jitter = 0.5 + (Math.random() * 0.5);
  return Math.floor(cappedDelay * jitter);
}

/**
 * Enhanced HTTP wrapper with retry logic and comprehensive error handling
 */
export class HttpWrapper {
  private readonly api: HttpApi;
  private readonly retryConfig: Required<RetryConfig>;

  constructor(api: HttpApi, retryConfig: RetryConfig = {}) {
    this.api = api;
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  }

  /**
   * Execute HTTP operation with retry logic and error handling
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    context?: Record<string, any>
  ): Promise<T> {
    let lastError: ClientApiError | null = null;
    const startTime = Date.now();

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        logger.debug(`Executing ${operationName}`, {
          attempt: attempt + 1,
          maxRetries: this.retryConfig.maxRetries + 1,
          ...context
        });

        const result = await operation();

        if (attempt > 0) {
          logger.info(`${operationName} succeeded after ${attempt} retries`, {
            totalAttempts: attempt + 1,
            duration: Date.now() - startTime,
            ...context
          });
        }

        return result;
      } catch (error) {
        lastError = this.convertToClientApiError(error, operationName, context);

        // Don't retry on the last attempt
        if (attempt === this.retryConfig.maxRetries) {
          break;
        }

        // Check if we should retry this error
        if (!this.retryConfig.shouldRetry(lastError, attempt)) {
          logger.debug(`Not retrying ${operationName} due to non-retryable error`, {
            errorCode: lastError.code,
            errorMessage: lastError.message,
            attempt: attempt + 1,
            ...context
          });
          break;
        }

        // Handle rate limiting with custom delay
        let delay = calculateDelay(attempt, this.retryConfig);
        if (lastError instanceof RateLimitError && lastError.retryAfter) {
          delay = Math.max(delay, lastError.retryAfter * 1000);
        }

        // Call retry callback
        this.retryConfig.onRetry(lastError, attempt, delay);

        // Wait before retrying
        await sleep(delay);
      }
    }

    // Log final failure
    logger.error(`${operationName} failed after ${this.retryConfig.maxRetries + 1} attempts`, {
      errorCode: lastError?.code,
      errorMessage: lastError?.message,
      duration: Date.now() - startTime,
      ...context
    });

    throw lastError;
  }

  /**
   * Convert any error to a ClientApiError
   */
  private convertToClientApiError(
    error: any,
    operationName: string,
    context?: Record<string, any>
  ): ClientApiError {
    const errorContext = { operation: operationName, ...context };

    // If it's already a ClientApiError, return as-is
    if (error instanceof ClientApiError) {
      return error;
    }

    // Handle HTTP response errors
    if (error.response) {
      const { status, statusText, data, headers } = error.response;
      return createHttpError(status, statusText, data, {
        ...errorContext,
        headers,
        url: error.config?.url
      });
    }

    // Handle request errors (network issues, timeouts, etc.)
    if (error.request) {
      return createNetworkError(error, {
        ...errorContext,
        url: error.config?.url,
        method: error.config?.method
      });
    }

    // Handle configuration or other errors
    return createNetworkError(error, errorContext);
  }

  /**
   * Wrapper for HTTP GET operations
   */
  async get<T>(
    url: string,
    options?: any,
    context?: Record<string, any>
  ): Promise<T> {
    return this.executeWithRetry(
      () => this.api.httpGet(url, options),
      'GET',
      { url, ...context }
    );
  }

  /**
   * Wrapper for HTTP POST operations
   */
  async post<T>(
    url: string,
    data?: any,
    options?: any,
    context?: Record<string, any>
  ): Promise<T> {
    return this.executeWithRetry(
      () => this.api.httpPost(url, data, options),
      'POST',
      { url, hasData: !!data, ...context }
    );
  }

  /**
   * Wrapper for HTTP PUT operations
   */
  async put<T>(
    url: string,
    data?: any,
    options?: any,
    context?: Record<string, any>
  ): Promise<T> {
    return this.executeWithRetry(
      () => this.api.httpPut(url, data, options),
      'PUT',
      { url, hasData: !!data, ...context }
    );
  }

  /**
   * Wrapper for HTTP DELETE operations
   */
  async delete<T>(
    url: string,
    options?: any,
    context?: Record<string, any>
  ): Promise<T> {
    return this.executeWithRetry(
      () => this.api.httpDelete(url, options),
      'DELETE',
      { url, ...context }
    );
  }

  /**
   * Update retry configuration
   */
  updateRetryConfig(newConfig: Partial<RetryConfig>): void {
    Object.assign(this.retryConfig, newConfig);
  }

  /**
   * Get current retry configuration
   */
  getRetryConfig(): Required<RetryConfig> {
    return { ...this.retryConfig };
  }
}
