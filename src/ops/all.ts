import {
  AllMethod,
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
    locations: LocKeyArray<L1, L2, L3, L4, L5> | [] = []
  ): Promise<V[]> => {
    utilities.verifyLocations(locations);
    const loc: LocKeyArray<L1, L2, L3, L4, L5> | [] = locations;

    const params: QueryParams = queryToParams(query);
    const requestOptions = Object.assign({}, apiOptions.getOptions, { isAuthenticated: apiOptions.allAuthenticated, params });

    logger.default('all', { query, locations, requestOptions });
    logger.debug('QUERY_CACHE: client-api.all() - Making API request', {
      query: JSON.stringify(query),
      locations: JSON.stringify(locations),
      path: utilities.getPath(loc),
      params: JSON.stringify(params),
      isAuthenticated: apiOptions.allAuthenticated
    });

    const result = await utilities.processArray(
      api.httpGet<V[]>(
        utilities.getPath(loc),
        requestOptions,
      ));
    
    logger.debug('QUERY_CACHE: client-api.all() - API response received', {
      query: JSON.stringify(query),
      locations: JSON.stringify(locations),
      itemCount: result.length,
      itemKeys: result.map(item => JSON.stringify(item.key))
    });

    return result;
  }

  return all;
}

