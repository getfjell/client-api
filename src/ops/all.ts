import {
  Item,
  ItemQuery,
  LocKeyArray,
  queryToParams,
} from "@fjell/core";
import { HttpApi, QueryParams } from "@fjell/http-api";
  
import { ClientApiOptions } from "@/ClientApiOptions";
import LibLogger from "@/logger";
import { Utilities } from "@/Utilities";
import { GetMethodOptions } from "@fjell/http-api";
  
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
   
  ) => {
  
  const all = async (
    query: ItemQuery = {} as ItemQuery,
    options: Partial<GetMethodOptions> = {},
    locations: LocKeyArray<L1, L2, L3, L4, L5> | [] = []
  ): Promise<V[]> => {
    logger.default('all', { query, locations });
    utilities.verifyLocations(locations);
    const loc: LocKeyArray<L1, L2, L3, L4, L5> | [] = locations;
  
    const params: QueryParams = queryToParams(query);
  
    const requestOptions = Object.assign({}, options, { isAuthenticated: apiOptions.allAuthenticated, params });
  
    return utilities.validatePK(await utilities.processArray(
      api.httpGet<V[]>(
        utilities.getPath(loc),
        requestOptions,
      ))) as V[];
  }

  return all;
}
  
