import {
  ComKey,
  Item,
  PriKey,
} from "@fjell/core";
import { HttpApi } from "@fjell/http-api";

import { ClientApiOptions } from "@/ClientApiOptions";
import LibLogger from "@/logger";
import { Utilities } from "@/Utilities";

const logger = LibLogger.get('client-api', 'ops', 'get');

// Utility functions for error handling
function shouldRetryError(error: any): boolean {
  if (error.code === 'ECONNREFUSED' ||
    error.code === 'ENOTFOUND' ||
    error.code === 'ENETUNREACH' ||
    error.message?.includes('timeout') ||
    error.message?.includes('network')) {
    return true;
  }

  if (error.status >= 500 || error.status === 429) {
    return true;
  }

  if (error.status >= 400 && error.status < 500 && error.status !== 429) {
    return false;
  }

  return true;
}

function calculateRetryDelay(attempt: number, config: any): number {
  const exponentialDelay = (config.initialDelayMs || 1000) * Math.pow(config.backoffMultiplier || 2, attempt);
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs || 30000);
  const jitter = 0.5 + (Math.random() * 0.5);
  return Math.floor(cappedDelay * jitter);
}

function enhanceError(error: any, context: any): any {
  if (!error) return new Error('Unknown error occurred');
  if (error.context) return error;

  const enhancedError = new Error(error.message || 'HTTP operation failed');
  Object.assign(enhancedError, {
    code: error.code || error.status || 'UNKNOWN_ERROR',
    status: error.status,
    context,
    originalError: error
  });

  return enhancedError;
}

export const getGetOperation = <
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

  const get = async (
    ik: PriKey<S> | ComKey<S, never, never, never, never, never>,
  ): Promise<V | null> => {
    const requestOptions = Object.assign({}, apiOptions.getOptions, { isAuthenticated: apiOptions.readAuthenticated });
    logger.default('get', { ik, requestOptions });

    const operationContext = {
      operation: 'get',
      path: utilities.getPath(ik),
      keyType: typeof ik
    };

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
        logger.debug(`Getting item (attempt ${attempt + 1})`, operationContext);

        const result = await utilities.processOne(
          api.httpGet<V>(
            utilities.getPath(ik),
            requestOptions,
          )
        );

        const item = utilities.validatePK(result) as V;

        if (attempt > 0) {
          logger.info(`Get operation succeeded after ${attempt} retries`, {
            ...operationContext,
            totalAttempts: attempt + 1,
            duration: Date.now() - startTime
          });
        }

        return item;
      } catch (error: any) {
        lastError = error;

        // Handle 404 errors specially - return null instead of throwing
        if (error.status === 404) {
          logger.debug('Item not found (404)', operationContext);
          return null;
        }

        if (attempt === retryConfig.maxRetries) {
          break;
        }

        const isRetryable = shouldRetryError(error);
        if (!isRetryable) {
          logger.debug('Not retrying get operation due to non-retryable error', {
            ...operationContext,
            errorMessage: error.message,
            errorCode: error.code || error.status,
            attempt: attempt + 1
          });
          break;
        }

        const delay = calculateRetryDelay(attempt, retryConfig);

        logger.warning(`Retrying get operation (attempt ${attempt + 2}) after ${delay}ms`, {
          ...operationContext,
          errorMessage: error.message,
          errorCode: error.code || error.status,
          delay,
          attemptNumber: attempt + 1
        });

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    const finalError = enhanceError(lastError, operationContext);

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

    logger.error(`Get operation failed after ${retryConfig.maxRetries + 1} attempts`, {
      ...operationContext,
      errorMessage: finalError.message,
      errorCode: finalError.code || finalError.status,
      duration: Date.now() - startTime,
      totalAttempts: retryConfig.maxRetries + 1
    });

    throw finalError;
  }

  return get;
}
