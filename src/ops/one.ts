import {
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

    const params: QueryParams = queryToParams(query);
    const requestOptions = Object.assign({}, apiOptions.getOptions, { isAuthenticated: apiOptions.readAuthenticated, params });
    logger.default('one', { query, locations, requestOptions });

    let item: V | null = null;

    const items = await utilities.processArray(
      api.httpGet<V[]>(
        utilities.getPath(loc),
        requestOptions,
      ));

    if (items.length > 0) {
      item = items[0];
    }

    return item as V;
  }

  return one;
}
