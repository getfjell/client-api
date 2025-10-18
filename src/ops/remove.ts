import {
  ComKey,
  Item,
  PriKey,
  RemoveMethod
} from "@fjell/core";
import { HttpApi } from "@fjell/http-api";

import { ClientApiOptions } from "../ClientApiOptions";
import LibLogger from "../logger";
import { Utilities } from "../Utilities";

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

  ): RemoveMethod<V, S, L1, L2, L3, L4, L5> => {

  const remove = async (
    ik: PriKey<S> | ComKey<S, L1, L2, L3, L4, L5>,
  ): Promise<V | void> => {
    const requestOptions = Object.assign({}, apiOptions.deleteOptions, { isAuthenticated: apiOptions.writeAuthenticated });
    logger.default('remove', { ik, requestOptions });

    const result = await api.httpDelete<V | boolean | void>(utilities.getPath(ik), requestOptions);
    
    // If result is a boolean, return void for compatibility
    if (typeof result === 'boolean') {
      return;
    }
    
    // Otherwise return the item (if the server returns it)
    return result as V | void;
  }

  return remove;
}
