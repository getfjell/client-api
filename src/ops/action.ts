import {
  ComKey,
  Item,
  PriKey,
} from "@fjell/core";
import { HttpApi } from "@fjell/http-api";

import { ClientApiOptions } from "@/ClientApiOptions";
import LibLogger from "@/logger";
import { Utilities } from "@/Utilities";

const logger = LibLogger.get('client-api', 'ops', 'action');

export const getActionOperation = <
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

  const action = async (
    ik: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
    action: string,
    body: any = {},
  ): Promise<V> => {
    const requestOptions = Object.assign({}, apiOptions.postOptions, { isAuthenticated: apiOptions.writeAuthenticated });
    logger.default('action', { ik, action, body, requestOptions });

    return utilities.validatePK(
      await utilities.processOne(
        api.httpPost<V>(
          `${utilities.getPath(ik)}/${action}`,
          body,
          requestOptions,
        )
      )) as V;

  };

  return action;
}
