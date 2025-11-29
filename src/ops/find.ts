import {
  FindMethod,
  FindOperationResult,
  FindOptions,
  Item,
  LocKeyArray,
  QueryParams
} from "@fjell/core";
import { HttpApi } from "@fjell/http-api";

import { finderToParams } from "../AItemAPI";
import { ClientApiOptions } from "../ClientApiOptions";
import LibLogger from "../logger";
import { Utilities } from "../Utilities";

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
    logger.debug('QUERY_CACHE: client-api.find() - Making API request', {
      finder,
      finderParams: JSON.stringify(finderParams),
      locations: JSON.stringify(locations),
      findOptions,
      path: utilities.getPath(loc),
      params: JSON.stringify(mergedParams),
      isAuthenticated: apiOptions.allAuthenticated
    });

    // Expect FindOperationResult from server
    const response = await api.httpGet<FindOperationResult<V>>(
      utilities.getPath(loc),
      requestOptions,
    );
    
    // Process items array (convert dates, etc.)
    const processedItems = await utilities.processArray(Promise.resolve(response.items || []));
    
    logger.debug('QUERY_CACHE: client-api.find() - API response received', {
      finder,
      finderParams: JSON.stringify(finderParams),
      locations: JSON.stringify(locations),
      itemCount: processedItems.length,
      total: response.metadata?.total || 0,
      itemKeys: processedItems.map(item => JSON.stringify(item.key))
    });

    return {
      items: processedItems,
      metadata: response.metadata
    };
  }

  return find as unknown as FindMethod<V, S, L1, L2, L3, L4, L5>;
}
