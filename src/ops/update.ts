import {
  ComKey,
  Item,
  PriKey,
  UpdateMethod
} from "@fjell/core";
import { HttpApi } from "@fjell/http-api";

import { ClientApiOptions } from "../ClientApiOptions";
import LibLogger from "../logger";
import { Utilities } from "../Utilities";
import { calculateRetryDelay, enhanceError, shouldRetryError } from "./errorHandling";

const logger = LibLogger.get('client-api', 'ops', 'update');

export const getUpdateOperation = <
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

  ): UpdateMethod<V, S, L1, L2, L3, L4, L5> => {

  const update = async (
    ik: PriKey<S> | ComKey<S, L1, L2, L3, L4, L5>,
    item: Partial<Item<S, L1, L2, L3, L4, L5>>,
  ): Promise<V> => {
    const requestOptions = Object.assign({}, apiOptions.putOptions, { isAuthenticated: apiOptions.writeAuthenticated });
    const keyStr = JSON.stringify(ik);
    
    logger.default('update', { ik, item, requestOptions });

    const operationContext = {
      operation: 'update',
      path: utilities.getPath(ik),
      keyType: typeof ik,
      key: keyStr
    };

    logger.debug('CLIENT_API: update() started', {
      ...operationContext,
      isAuthenticated: apiOptions.writeAuthenticated
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
        logger.debug(`CLIENT_API: update() attempt ${attempt + 1}`, {
          ...operationContext,
          attempt: attempt + 1,
          maxRetries: retryConfig.maxRetries + 1
        });

        const httpStartTime = Date.now();
        const result = await utilities.processOne(
          api.httpPut<V>(
            utilities.getPath(ik),
            item,
            requestOptions,
          )
        );
        const httpDuration = Date.now() - httpStartTime;

        const attemptDuration = Date.now() - attemptStartTime;
        const totalDuration = Date.now() - startTime;

        if (attempt > 0) {
          logger.info(`CLIENT_API: update() succeeded after retries`, {
            ...operationContext,
            totalAttempts: attempt + 1,
            httpDuration,
            attemptDuration,
            totalDuration
          });
        } else {
          logger.debug(`CLIENT_API: update() succeeded (first attempt)`, {
            ...operationContext,
            httpDuration,
            totalDuration
          });
        }

        return result;
      } catch (error: any) {
        lastError = error;
        const attemptDuration = Date.now() - attemptStartTime;

        logger.debug('CLIENT_API: update() attempt failed', {
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
          logger.debug('CLIENT_API: update() - not retrying (non-retryable error)', {
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

        logger.warning(`CLIENT_API: update() - retrying after ${delay}ms`, {
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

    logger.error(`CLIENT_API: update() failed after all retries`, {
      ...operationContext,
      errorMessage: finalError.message,
      errorCode: finalError.code || finalError.status,
      errorStatus: finalError.status,
      totalDuration,
      totalAttempts: retryConfig.maxRetries + 1
    });

    throw finalError;
  }

  return update;
}
