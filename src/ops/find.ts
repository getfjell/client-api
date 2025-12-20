import {
  FindMethod,
  FindOperationResult,
  FindOptions,
  Item,
  LocKeyArray,
} from "@fjell/types";
import { HttpApi, QueryParams } from "@fjell/http-api";

import { finderToParams } from "../AItemAPI";
import { ClientApiOptions } from "../ClientApiOptions";
import LibLogger from "../logger";
import { Utilities } from "../Utilities";
import { calculateRetryDelay, enhanceError, shouldRetryError } from "./errorHandling";

const logger = LibLogger.get('client-api', 'ops', 'find');

export const getFindOperation = <
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

  ): FindMethod<V, S, L1, L2, L3, L4, L5> => {

  const find = async (
    finder: string,
    finderParams: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>> = {},
    locations: LocKeyArray<L1, L2, L3, L4, L5> | [] = [],
    findOptions?: FindOptions
  ): Promise<FindOperationResult<V>> => {
    utilities.verifyLocations(locations);
    const loc: LocKeyArray<L1, L2, L3, L4, L5> | [] = locations;

    const mergedParams: QueryParams = finderToParams(finder, finderParams);
    
    // Add pagination options to query parameters
    if (findOptions?.limit != null) {
      mergedParams.limit = findOptions.limit.toString();
    }
    if (findOptions?.offset != null) {
      mergedParams.offset = findOptions.offset.toString();
    }
    
    const requestOptions = Object.assign({}, apiOptions.getOptions, { isAuthenticated: apiOptions.allAuthenticated, params: mergedParams });
    logger.default('find', { finder, finderParams, locations, findOptions, requestOptions });

    const operationContext = {
      operation: 'find',
      finder,
      path: utilities.getPath(loc),
      params: JSON.stringify(mergedParams),
      locations: JSON.stringify(locations)
    };

    logger.debug('CLIENT_API: find() started', {
      ...operationContext,
      findOptions,
      isAuthenticated: apiOptions.allAuthenticated
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
        logger.debug(`CLIENT_API: find() attempt ${attempt + 1}`, {
          ...operationContext,
          attempt: attempt + 1,
          maxRetries: retryConfig.maxRetries + 1
        });

        const httpStartTime = Date.now();
        // Expect FindOperationResult from server
        const response = await api.httpGet<FindOperationResult<V>>(
          utilities.getPath(loc),
          requestOptions,
        );
        const httpDuration = Date.now() - httpStartTime;

        // Validate response shape to prevent downstream errors
        if (!response || typeof response !== 'object') {
          logger.error('Invalid response from find operation', {
            component: 'client-api',
            operation: 'find',
            finder,
            responseType: typeof response,
            response,
            suggestion: 'Server should return FindOperationResult with { items: [], metadata: {...} } structure'
          });
          throw new Error(
            `Invalid response from find operation: expected FindOperationResult object with items and metadata, got ${typeof response}. ` +
            `This indicates a server-side API issue.`
          );
        }

        // Handle case where response.items might be undefined
        const items = response.items || [];
        if (!Array.isArray(items)) {
          logger.error('Invalid response items from find operation', {
            component: 'client-api',
            operation: 'find',
            finder,
            itemsType: typeof items,
            response,
            suggestion: 'Server should return FindOperationResult.items as an array'
          });
          throw new Error(
            `Invalid response from find operation: items must be an array, got ${typeof items}. ` +
            `This indicates a server-side API issue.`
          );
        }
        
        // Process items array (convert dates, etc.)
        const processedItems = await utilities.processArray(Promise.resolve(items));

        const attemptDuration = Date.now() - attemptStartTime;
        const totalDuration = Date.now() - startTime;
        
        if (attempt > 0) {
          logger.info(`CLIENT_API: find() succeeded after retries`, {
            ...operationContext,
            totalAttempts: attempt + 1,
            httpDuration,
            attemptDuration,
            totalDuration,
            itemCount: processedItems.length
          });
        } else {
          logger.debug(`CLIENT_API: find() succeeded (first attempt)`, {
            ...operationContext,
            httpDuration,
            totalDuration,
            itemCount: processedItems.length,
            total: response.metadata?.total || 0
          });
        }

        return {
          items: processedItems,
          metadata: response.metadata || {
            total: processedItems.length,
            returned: processedItems.length,
            offset: findOptions?.offset ?? 0,
            limit: findOptions?.limit,
            hasMore: false
          }
        };
      } catch (error: any) {
        lastError = error;
        const attemptDuration = Date.now() - attemptStartTime;

        logger.debug('CLIENT_API: find() attempt failed', {
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
          logger.debug('CLIENT_API: find() - not retrying (non-retryable error)', {
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

        logger.warning(`CLIENT_API: find() - retrying after ${delay}ms`, {
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

    logger.error(`CLIENT_API: find() failed after all retries`, {
      ...operationContext,
      errorMessage: finalError.message,
      errorCode: finalError.code || finalError.status,
      errorStatus: finalError.status,
      totalDuration,
      totalAttempts: retryConfig.maxRetries + 1
    });

    throw finalError;
  }

  return find as unknown as FindMethod<V, S, L1, L2, L3, L4, L5>;
}
