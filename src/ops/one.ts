import {
  AllOperationResult,
  Item,
  ItemQuery,
  LocKeyArray,
  OneMethod,
  QueryParams,
  queryToParams
} from "@fjell/core";
import { HttpApi } from "@fjell/http-api";

import { ClientApiOptions } from "../ClientApiOptions";
import LibLogger from "../logger";
import { Utilities } from "../Utilities";

const logger = LibLogger.get('client-api', 'ops', 'one');

export const getOneOperation = <
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

  ): OneMethod<V, S, L1, L2, L3, L4, L5> => {

  const one = async (
    query: ItemQuery = {} as ItemQuery,
    locations: LocKeyArray<L1, L2, L3, L4, L5> | [] = []
  ): Promise<V | null> => {
    utilities.verifyLocations(locations);

    const loc: LocKeyArray<L1, L2, L3, L4, L5> | [] = locations;

    // Add limit: 1 to optimize the query
    const params: QueryParams = queryToParams(query);
    params.limit = '1';
    
    const requestOptions = Object.assign({}, apiOptions.getOptions, { isAuthenticated: apiOptions.readAuthenticated, params });
    logger.default('one', { query, locations, requestOptions });
    logger.debug('QUERY_CACHE: client-api.one() - Making API request', {
      query: JSON.stringify(query),
      locations: JSON.stringify(locations),
      path: utilities.getPath(loc),
      params: JSON.stringify(params),
      isAuthenticated: apiOptions.readAuthenticated
    });

    // Server returns AllOperationResult<V> with items and metadata
    const result = await api.httpGet<AllOperationResult<V>>(
      utilities.getPath(loc),
      requestOptions,
    );

    // Process items through utilities (date conversion, validation, etc.)
    const items = await utilities.processArray(Promise.resolve(result.items));

    let item: V | null = null;
    if (items.length > 0) {
      item = items[0];
      logger.debug('QUERY_CACHE: client-api.one() - API response received', {
        query: JSON.stringify(query),
        locations: JSON.stringify(locations),
        itemKey: JSON.stringify(item.key)
      });
    } else {
      logger.debug('QUERY_CACHE: client-api.one() - API returned no items', {
        query: JSON.stringify(query),
        locations: JSON.stringify(locations)
      });
    }

    return item;
  }

  return one;
}
