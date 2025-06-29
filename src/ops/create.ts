import {
  Item,
  LocKeyArray
} from "@fjell/core";
import { HttpApi } from "@fjell/http-api";

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

  ) => {

  const create = async (
    item: Partial<Item<S, L1, L2, L3, L4, L5>>,
    locations: LocKeyArray<L1, L2, L3, L4, L5> | [] = []
  ): Promise<V> => {
    const requestOptions = Object.assign({}, apiOptions.postOptions, { isAuthenticated: apiOptions.writeAuthenticated });
    logger.default('create', { item, locations, requestOptions });
    utilities.verifyLocations(locations);

    const loc: LocKeyArray<L1, L2, L3, L4, L5> | [] = locations;

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
