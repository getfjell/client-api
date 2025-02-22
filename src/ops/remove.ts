import {
  ComKey,
  Item,
  PriKey,
} from "@fjell/core";
import { DeleteMethodOptions, HttpApi } from "@fjell/http-api";
    
import { ClientApiOptions } from "@/ClientApiOptions";
import LibLogger from "@/logger";
import { Utilities } from "@/Utilities";
    
const logger = LibLogger.get('client-api', 'ops', 'remove');
  
export const getRemoveOperation = <
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
    
  const remove = async (
    ik: PriKey<S> | ComKey<S, L1, L2, L3, L4, L5>,
    options: Partial<DeleteMethodOptions> = {},
  ): Promise<boolean> => {
    logger.default('remove', { ik });
  
    const requestOptions = Object.assign({}, options, { isAuthenticated: apiOptions.writeAuthenticated });
  
    return api.httpDelete<boolean>(utilities.getPath(ik), requestOptions);
  }
  
  return remove;
}
    