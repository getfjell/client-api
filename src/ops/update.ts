import {
  ComKey,
  Item,
  PriKey
} from "@fjell/core";
import { HttpApi } from "@fjell/http-api";

import { ClientApiOptions } from "@/ClientApiOptions";
import LibLogger from "@/logger";
import { Utilities } from "@/Utilities";

const logger = LibLogger.get('client-api', 'ops', 'update');

export const getUpdateOperation = <
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

  const update = async (
    ik: PriKey<S> | ComKey<S, L1, L2, L3, L4, L5>,
    item: Partial<Item<S, L1, L2, L3, L4, L5>>,
  ): Promise<V> => {
    const requestOptions = Object.assign({}, apiOptions.putOptions, { isAuthenticated: apiOptions.writeAuthenticated });
    logger.default('update', { ik, item, requestOptions });

    return utilities.validatePK(await utilities.processOne(
      api.httpPut<V>(
        utilities.getPath(ik),
        item,
        requestOptions,
      ))) as V;
  }

  return update;
}
