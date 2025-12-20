import {
  ComKey,
  GetMethod,
  Item,
  PriKey,
} from "@fjell/types";
import { HttpApi } from "@fjell/http-api";

import { ClientApiOptions } from "../ClientApiOptions";
import LibLogger from "../logger";
import { Utilities } from "../Utilities";
import { calculateRetryDelay, enhanceError, shouldRetryError } from "./errorHandling";

const logger = LibLogger.get('client-api', 'ops', 'get');

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

  ): GetMethod<V, S, L1, L2, L3, L4, L5> => {

  const get = async (
    ik: PriKey<S> | ComKey<S, L1, L2, L3, L4, L5>,
  ): Promise<V | null> => {
    const requestOptions = Object.assign({}, apiOptions.getOptions, { isAuthenticated: apiOptions.readAuthenticated });
    const keyStr = JSON.stringify(ik);
    
    logger.default('get', { ik, requestOptions });

    const operationContext = {
      operation: 'get',
      path: utilities.getPath(ik),
      keyType: typeof ik,
      key: keyStr
    };

    logger.debug('CLIENT_API: get() started', {
      ...operationContext,
      isAuthenticated: apiOptions.readAuthenticated
    });

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
      const attemptStartTime = Date.now();
      try {
        logger.debug(`CLIENT_API: get() attempt ${attempt + 1}`, {
          ...operationContext,
          attempt: attempt + 1,
          maxRetries: retryConfig.maxRetries + 1
        });

        const httpStartTime = Date.now();
        const result = await utilities.processOne(
          api.httpGet<V>(
            utilities.getPath(ik),
            requestOptions,
          )
        );
        const httpDuration = Date.now() - httpStartTime;

        utilities.validatePK(result);

        const attemptDuration = Date.now() - attemptStartTime;
        const totalDuration = Date.now() - startTime;

        if (attempt > 0) {
          logger.info(`CLIENT_API: get() succeeded after retries`, {
            ...operationContext,
            totalAttempts: attempt + 1,
            httpDuration,
            attemptDuration,
            totalDuration
          });
        } else {
          logger.debug(`CLIENT_API: get() succeeded (first attempt)`, {
            ...operationContext,
            httpDuration,
            totalDuration,
            hasResult: !!result
          });
        }

        return result;
      } catch (error: any) {
        lastError = error;
        const attemptDuration = Date.now() - attemptStartTime;

        // Handle 404 errors specially - return null instead of throwing
        if (error.status === 404) {
          logger.debug('CLIENT_API: get() - item not found (404)', {
            ...operationContext,
            attemptDuration,
            totalDuration: Date.now() - startTime
          });
          return null;
        }

        logger.debug('CLIENT_API: get() attempt failed', {
          ...operationContext,
          attempt: attempt + 1,
          attemptDuration,
          errorStatus: error.status,
          errorCode: error.code,
          errorMessage: error.message
        });

        if (attempt === retryConfig.maxRetries) {
          break;
        }

        const isRetryable = shouldRetryError(error);
        if (!isRetryable) {
          logger.debug('CLIENT_API: get() - not retrying (non-retryable error)', {
            ...operationContext,
            errorMessage: error.message,
            errorCode: error.code || error.status,
            errorStatus: error.status,
            attempt: attempt + 1,
            totalDuration: Date.now() - startTime
          });
          break;
        }

        const delay = calculateRetryDelay(attempt, retryConfig);

        logger.warning(`CLIENT_API: get() - retrying after ${delay}ms`, {
          ...operationContext,
          errorMessage: error.message,
          errorCode: error.code || error.status,
          errorStatus: error.status,
          delay,
          attemptNumber: attempt + 1,
          nextAttempt: attempt + 2,
          maxRetries: retryConfig.maxRetries + 1
        });

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    const finalError = enhanceError(lastError, operationContext);
    const totalDuration = Date.now() - startTime;

    if (apiOptions.errorHandler) {
      try {
        apiOptions.errorHandler(finalError, operationContext);
      } catch (handlerError: any) {
        logger.error('CLIENT_API: Custom error handler failed', {
          ...operationContext,
          originalError: finalError.message,
          handlerError: handlerError?.message || String(handlerError)
        });
      }
    }

    logger.error(`CLIENT_API: get() failed after all retries`, {
      ...operationContext,
      errorMessage: finalError.message,
      errorCode: finalError.code || finalError.status,
      errorStatus: finalError.status,
      totalDuration,
      totalAttempts: retryConfig.maxRetries + 1
    });

    throw finalError;
  }

  return get;
}
