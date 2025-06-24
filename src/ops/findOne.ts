import {
  Item,
  LocKeyArray,
  QueryParams
} from "@fjell/core";
import { HttpApi } from "@fjell/http-api";

import { finderToParams } from "@/AItemAPI";
import { ClientApiOptions } from "@/ClientApiOptions";
import LibLogger from "@/logger";
import { Utilities } from "@/Utilities";

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

  ) => {

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

    return (utilities.validatePK(await utilities.processArray(
      api.httpGet<V[]>(
        utilities.getPath(loc),
        requestOptions,
      ))) as V[])[0];
  }

  return findOne;
}
