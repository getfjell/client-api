import {
  Item,
  ItemProperties,
  LocKeyArray
} from "@fjell/core";
import { HttpApi, PostMethodOptions } from "@fjell/http-api";
  
import { ClientApiOptions } from "@/ClientApiOptions";
import LibLogger from "@/logger";
import { Utilities } from "@/Utilities";
  
const logger = LibLogger.get('client-api', 'ops', 'create');

export const getCreateOperation = <
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
  
  const create = async (
    item: ItemProperties<S, L1, L2, L3, L4, L5>,
    options: Partial<PostMethodOptions> = {},
    locations: LocKeyArray<L1, L2, L3, L4, L5> | [] = []
  ): Promise<V> => {
    logger.default('create', { item, locations });
    utilities.verifyLocations(locations);
  
    const loc: LocKeyArray<L1, L2, L3, L4, L5> | [] = locations;
    const requestOptions = Object.assign({}, options, { isAuthenticated: apiOptions.writeAuthenticated });
  
    const created: V =
        utilities.validatePK(await utilities.processOne(api.httpPost<V>(
          utilities.getPath(loc),
          item,
          requestOptions,
        ))) as V;
    return created;
  };

  return create;
}
  