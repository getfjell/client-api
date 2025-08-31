import { ComKey, Item, LocKeyArray, PriKey } from "@fjell/core";
import { HttpApi } from "@fjell/http-api";

import { ClientApiOptions } from "../ClientApiOptions";
import LibLogger from "../logger";
import { Utilities } from "../Utilities";

const logger = LibLogger.get('client-api', 'ops', 'allAction');

export const getAllActionOperation = <
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never,
>(
    api: HttpApi,
    apiOptions: ClientApiOptions,
    utilities: Utilities<V, S, L1, L2, L3, L4, L5>
  ) => {
  const allAction = async (
    action: string,
    body: any = {},
    locations: LocKeyArray<L1, L2, L3, L4, L5> | [] = []
  ): Promise<[V[], Array<PriKey<any> | ComKey<any, any, any, any, any, any> | LocKeyArray<any, any, any, any, any>>]> => {
    const requestOptions = Object.assign({}, apiOptions.postOptions, { isAuthenticated: apiOptions.writeAuthenticated });
    logger.default('allAction', { action, body, locations, requestOptions });
    utilities.verifyLocations(locations);

    const loc: LocKeyArray<L1, L2, L3, L4, L5> | [] = locations;

    const response = await api.httpPost<[V[], Array<PriKey<any> | ComKey<any, any, any, any, any, any> | LocKeyArray<any, any, any, any, any>>]>(
      `${utilities.getPath(loc)}/${action}`,
      body,
      requestOptions,
    );

    // Handle Express edge case where [[],[]] gets converted to {} on the server-side
    let processedResponse = response;
    if (response && typeof response === 'object' && !Array.isArray(response) && Object.keys(response).length === 0) {
      logger.warning('Detected empty object response from server, converting to [[],[]] to handle Express edge case', { action, path: utilities.getPath(loc) });
      processedResponse = [[], []] as [V[], Array<PriKey<any> | ComKey<any, any, any, any, any, any> | LocKeyArray<any, any, any, any, any>>];
    }

    const [items, affectedItems] = processedResponse;

    return [
      utilities.validatePK(
        await utilities.processArray(Promise.resolve(items))
      ) as V[],
      affectedItems
    ];
  };
  return allAction;
}
