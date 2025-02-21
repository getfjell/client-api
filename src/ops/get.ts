import {
  ComKey,
  Item,
  PriKey,
} from "@fjell/core";
import { GetMethodOptions, HttpApi } from "@fjell/http-api";
    
import { ClientApiOptions } from "@/ClientApiOptions";
import LibLogger from "@/logger";
import { Utilities } from "@/Utilities";
    
const logger = LibLogger.get('client-api', 'ops', 'get');
  
export const getGetOperation = <
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
    
  const get = async (
    ik: PriKey<S> | ComKey<S, never, never, never, never, never>,
    options: Partial<GetMethodOptions> = {},
  ): Promise<V | null> => {
    logger.default('get', { ik });
  
    const requestOptions = Object.assign({}, options, { isAuthenticated: apiOptions.readAuthenticated });
  
    return utilities.validatePK(await utilities.processOne(
      api.httpGet<V>(
        utilities.getPath(ik),
        requestOptions,
      ))) as V;
  }
  
  return get;
}
    