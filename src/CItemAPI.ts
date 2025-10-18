
import {
  Item,
} from "@fjell/core";
import {
  HttpApi
} from "@fjell/http-api";
import { createAItemAPI, PathNamesArray } from "./AItemAPI";

import LibLogger from "./logger";
import { ClientApi } from "./ClientApi";
import { ClientApiOptions } from "./ClientApiOptions";

const logger = LibLogger.get('CItemAPI');

/**
 * CItemApi extends ClientApi for contained items.
 * No additional methods needed - pure Operations interface.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CItemApi<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never,
> extends ClientApi<V, S, L1, L2, L3, L4, L5> {
  // Inherits all methods from ClientApi (which extends core Operations)
}

export const createCItemApi = <
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
>(api: HttpApi, type: S, pathNames: PathNamesArray<L1, L2, L3, L4, L5>, options?: ClientApiOptions): CItemApi<V, S, L1, L2, L3, L4, L5> => {

  logger.default('createCItemApi', { api, type, pathNames, options });

  const aItemAPI = createAItemAPI(api, type, pathNames, options);

  return {
    action: aItemAPI.action,
    all: aItemAPI.all,
    allAction: aItemAPI.allAction,
    allFacet: aItemAPI.allFacet,
    one: aItemAPI.one,
    get: aItemAPI.get,
    create: aItemAPI.create,
    remove: aItemAPI.remove,
    update: aItemAPI.update,
    upsert: aItemAPI.upsert,
    facet: aItemAPI.facet,
    find: aItemAPI.find,
    findOne: aItemAPI.findOne,
  } as unknown as CItemApi<V, S, L1, L2, L3, L4, L5>;
}
