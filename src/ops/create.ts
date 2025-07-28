import {
  Item,
  LocKeyArray
} from "@fjell/core";
import { HttpApi } from "@fjell/http-api";

import { ClientApiOptions } from "../ClientApiOptions";
import LibLogger from "../logger";
import { Utilities } from "../Utilities";

const logger = LibLogger.get('client-api', 'ops', 'create');

// Utility functions for error handling
function shouldRetryError(error: any): boolean {
  // Retry on network errors and 5xx server errors
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

function calculateRetryDelay(attempt: number, config: any): number {
  const exponentialDelay = (config.initialDelayMs || 1000) * Math.pow(config.backoffMultiplier || 2, attempt);
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs || 30000);

  // Add jitter: random value between 50% and 100% of calculated delay
  const jitter = 0.5 + (Math.random() * 0.5);
  return Math.floor(cappedDelay * jitter);
}

function enhanceError(error: any, context: any): any {
  if (!error) return new Error('Unknown error occurred');

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

export const getCreateOperation = <
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never>(
    api: HttpApi,
    apiOptions: ClientApiOptions,
    utilities: Utilities<V, S, L1, L2, L3, L4, L5>

  ) => {

  const create = async (
    item: Partial<Item<S, L1, L2, L3, L4, L5>>,
    locations: LocKeyArray<L1, L2, L3, L4, L5> | [] = []
  ): Promise<V> => {
    const requestOptions = Object.assign({}, apiOptions.postOptions, { isAuthenticated: apiOptions.writeAuthenticated });
    logger.default('create', { item, locations, requestOptions });
    utilities.verifyLocations(locations);

    const loc: LocKeyArray<L1, L2, L3, L4, L5> | [] = locations;
    const operationContext = {
      operation: 'create',
      path: utilities.getPath(loc),
      itemType: typeof item,
      hasLocations: locations.length > 0
    };

    // Retry configuration from options or defaults
    const retryConfig = {
      maxRetries: 3,
      initialDelayMs: 1000,
      maxDelayMs: 30000,
      backoffMultiplier: 2,
      ...apiOptions.retryConfig
    };

    let lastError: any = null;
    const startTime = Date.now();

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        logger.debug(`Creating item (attempt ${attempt + 1})`, operationContext);

        const result = await utilities.processOne(api.httpPost<V>(
          utilities.getPath(loc),
          item,
          requestOptions,
        ));

        const created: V = utilities.validatePK(result) as V;

        if (attempt > 0) {
          logger.info(`Create operation succeeded after ${attempt} retries`, {
            ...operationContext,
            totalAttempts: attempt + 1,
            duration: Date.now() - startTime
          });
        }

        return created;
      } catch (error: any) {
        lastError = error;

        // Don't retry on the last attempt
        if (attempt === retryConfig.maxRetries) {
          break;
        }

        // Determine if error is retryable
        const isRetryable = shouldRetryError(error);
        if (!isRetryable) {
          logger.debug('Not retrying create operation due to non-retryable error', {
            ...operationContext,
            errorMessage: error.message,
            errorCode: error.code || error.status,
            attempt: attempt + 1
          });
          break;
        }

        // Calculate delay with exponential backoff
        const delay = calculateRetryDelay(attempt, retryConfig);

        logger.warning(`Retrying create operation (attempt ${attempt + 2}) after ${delay}ms`, {
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

    // Call custom error handler if provided
    if (apiOptions.errorHandler) {
      try {
        apiOptions.errorHandler(finalError, operationContext);
      } catch (handlerError: any) {
        logger.error('Custom error handler failed', {
          originalError: finalError.message,
          handlerError: handlerError?.message || String(handlerError)
        });
      }
    }

    logger.error(`Create operation failed after ${retryConfig.maxRetries + 1} attempts`, {
      ...operationContext,
      errorMessage: finalError.message,
      errorCode: finalError.code || finalError.status,
      duration: Date.now() - startTime,
      totalAttempts: retryConfig.maxRetries + 1
    });

    throw finalError;
  };

  return create;
}
