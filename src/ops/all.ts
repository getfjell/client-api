import {
  AllMethod,
  AllOperationResult,
  AllOptions,
  Item,
  ItemQuery,
  LocKeyArray,
  queryToParams,
} from "@fjell/core";
import { HttpApi, QueryParams } from "@fjell/http-api";

import { ClientApiOptions } from "../ClientApiOptions";
import LibLogger from "../logger";
import { Utilities } from "../Utilities";

const logger = LibLogger.get('client-api', 'ops', 'all');

export const getAllOperation = <
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

  ): AllMethod<V, S, L1, L2, L3, L4, L5> => {

  const all = async (
    query: ItemQuery = {} as ItemQuery,
    locations: LocKeyArray<L1, L2, L3, L4, L5> | [] = [],
    allOptions?: AllOptions
  ): Promise<AllOperationResult<V>> => {
    utilities.verifyLocations(locations);
    const loc: LocKeyArray<L1, L2, L3, L4, L5> | [] = locations;

    // Build query params from ItemQuery
    const params: QueryParams = queryToParams(query);

    // Override with AllOptions if provided (takes precedence)
    if (allOptions && 'limit' in allOptions && allOptions.limit != null) {
      params.limit = String(allOptions.limit);
    }
    if (allOptions && 'offset' in allOptions && allOptions.offset != null) {
      params.offset = String(allOptions.offset);
    }

    const requestOptions = Object.assign({}, apiOptions.getOptions, { isAuthenticated: apiOptions.allAuthenticated, params });

    logger.default('all', { query, locations, allOptions, requestOptions });
    logger.debug('QUERY_CACHE: client-api.all() - Making API request', {
      query: JSON.stringify(query),
      locations: JSON.stringify(locations),
      allOptions: JSON.stringify(allOptions),
      path: utilities.getPath(loc),
      params: JSON.stringify(params),
      isAuthenticated: apiOptions.allAuthenticated
    });

    // Server returns AllOperationResult<V> with items and metadata
    const result = await api.httpGet<AllOperationResult<V>>(
      utilities.getPath(loc),
      requestOptions,
    );

    // Handle case where server returns {} or result.items is undefined
    // Extract items array from result, defaulting to empty array if missing
    let itemsArray: V[] = [];
    if (result) {
      if (result.items && Array.isArray(result.items)) {
        itemsArray = result.items;
      } else if (Array.isArray(result)) {
        itemsArray = result;
      } else {
        // Log unexpected response format
        logger.warning('Unexpected response format from server', {
          result,
          resultType: typeof result,
          hasItems: 'items' in result,
          resultKeys: result && typeof result === 'object' ? Object.keys(result) : []
        });
        itemsArray = [];
      }
    }

    // Ensure itemsArray is always a valid array before processing
    if (!Array.isArray(itemsArray)) {
      logger.error('itemsArray is not an array, defaulting to empty array', { itemsArray });
      itemsArray = [];
    }

    // Process items through utilities (date conversion, validation, etc.)
    const processedItems = await utilities.processArray(Promise.resolve(itemsArray));

    logger.debug('QUERY_CACHE: client-api.all() - API response received', {
      query: JSON.stringify(query),
      locations: JSON.stringify(locations),
      itemCount: processedItems.length,
      total: result?.metadata?.total,
      hasMore: result?.metadata?.hasMore,
      itemKeys: processedItems.map(item => JSON.stringify(item.key))
    });

    // Return AllOperationResult with processed items
    return {
      items: processedItems,
      metadata: result?.metadata || { total: 0, returned: 0, offset: 0, hasMore: false }
    };
  }

  return all;
}

