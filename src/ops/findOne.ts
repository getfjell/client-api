import {
  FindOneMethod,
  Item,
  LocKeyArray,
} from "@fjell/types";
import { HttpApi, QueryParams } from "@fjell/http-api";

import { finderToParams } from "../AItemAPI";
import { ClientApiOptions } from "../ClientApiOptions";
import LibLogger from "../logger";
import { Utilities } from "../Utilities";

const logger = LibLogger.get('client-api', 'ops', 'find');

export const getFindOneOperation = <
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

  ): FindOneMethod<V, S, L1, L2, L3, L4, L5> => {

  const findOne = async (
    finder: string,
    finderParams: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>> = {},
    locations: LocKeyArray<L1, L2, L3, L4, L5> | [] = []
  ): Promise<V> => {
    utilities.verifyLocations(locations);
    const loc: LocKeyArray<L1, L2, L3, L4, L5> | [] = locations;

    const params: QueryParams = finderToParams(finder, finderParams);
    params.one = true;

    const requestOptions = Object.assign({}, apiOptions.getOptions, { isAuthenticated: apiOptions.allAuthenticated, params });
    logger.default('findOne', { finder, finderParams, locations, requestOptions });
    logger.debug('QUERY_CACHE: client-api.findOne() - Making API request', {
      finder,
      finderParams: JSON.stringify(finderParams),
      locations: JSON.stringify(locations),
      path: utilities.getPath(loc),
      params: JSON.stringify(params),
      isAuthenticated: apiOptions.allAuthenticated
    });

    const results = await utilities.processArray(
      api.httpGet<V[]>(
        utilities.getPath(loc),
        requestOptions,
      ));
    
    const result = results[0];
    if (result) {
      utilities.validatePK(result);
      logger.debug('QUERY_CACHE: client-api.findOne() - API response received', {
        finder,
        finderParams: JSON.stringify(finderParams),
        locations: JSON.stringify(locations),
        itemKey: JSON.stringify(result.key)
      });
    } else {
      logger.debug('QUERY_CACHE: client-api.findOne() - API returned no items', {
        finder,
        finderParams: JSON.stringify(finderParams),
        locations: JSON.stringify(locations)
      });
    }
    
    return result;
  }

  return findOne;
}
