import {
  Item,
  LocKeyArray,
  QueryParams
} from "@fjell/core";
import { GetMethodOptions, HttpApi } from "@fjell/http-api";
    
import { finderToParams } from "@/AItemAPI";
import { ClientApiOptions } from "@/ClientApiOptions";
import LibLogger from "@/logger";
import { Utilities } from "@/Utilities";
    
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
    // eslint-disable-next-line max-params
  ) => {
    
  const find = async (
    finder: string,
    finderParams: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
    options: Partial<GetMethodOptions> = {},
    locations: LocKeyArray<L1, L2, L3, L4, L5> | [] = []
  ): Promise<V[]> => {
    logger.default('find', { finder, finderParams, locations });
    utilities.verifyLocations(locations);
    const loc: LocKeyArray<L1, L2, L3, L4, L5> | [] = locations;
  
    const params: QueryParams = finderToParams(finder, finderParams);
  
    const requestOptions = Object.assign({}, options, { isAuthenticated: apiOptions.allAuthenticated, params });
  
    return utilities.validatePK(await utilities.processArray(
      api.httpGet<V[]>(
        utilities.getPath(loc),
        requestOptions,
      ))) as V[];
  }
    
  return find;
}
    