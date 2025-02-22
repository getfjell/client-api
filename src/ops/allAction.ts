import {
  Item,
  LocKeyArray
} from "@fjell/core";
import { HttpApi, PostMethodOptions } from "@fjell/http-api";
    
import { ClientApiOptions } from "@/ClientApiOptions";
import LibLogger from "@/logger";
import { Utilities } from "@/Utilities";
    
const logger = LibLogger.get('client-api', 'ops', 'allAction');
  
export const getAllActionOperation = <
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
    
  const allAction = async (
    action: string,
    body: any = {},
    options: Partial<PostMethodOptions> = {},
    locations: LocKeyArray<L1, L2, L3, L4, L5> | [] = []
  ): Promise<V[]> => {
    logger.default('allAction', { action, body, locations });
    utilities.verifyLocations(locations);
  
    const loc: LocKeyArray<L1, L2, L3, L4, L5> | [] = locations;
  
    const requestOptions = Object.assign({}, options, { isAuthenticated: apiOptions.writeAuthenticated });
  
    // TODO: This should respond to either a single object, or multiple objects in an array.
    return utilities.validatePK(
      await utilities.processArray(
        api.httpPost<V[]>(
          utilities.getPath(loc),
          body,
          requestOptions,
        )
      )) as V[];
  };
  
  return allAction;
}
    