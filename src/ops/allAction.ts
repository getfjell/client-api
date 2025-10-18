 
import { AllActionOperationMethod, ComKey, Item, LocKeyArray, OperationParams, PriKey } from "@fjell/core";
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
  ): AllActionOperationMethod<V, S, L1, L2, L3, L4, L5> => {
  const allAction = async (
    action: string,
    params?: OperationParams,
    locations?: LocKeyArray<L1, L2, L3, L4, L5> | []
  ): Promise<[V[], Array<PriKey<any> | ComKey<any, any, any, any, any, any> | LocKeyArray<any, any, any, any, any>>]> => {
    const requestOptions = Object.assign({}, apiOptions.postOptions, { isAuthenticated: apiOptions.writeAuthenticated });
    const loc: LocKeyArray<L1, L2, L3, L4, L5> | [] = locations || [];
    logger.default('allAction', { action, params, locations: loc, requestOptions });
    utilities.verifyLocations(loc);

    const response = await api.httpPost<[V[], Array<PriKey<any> | ComKey<any, any, any, any, any, any> | LocKeyArray<any, any, any, any, any>>]>(
      `${utilities.getPath(loc)}/${action}`,
      params || {},
      requestOptions,
    );

    // Handle edge cases where response might not be an array
    let items: V[] = [];
    let affectedItems: Array<PriKey<any> | ComKey<any, any, any, any, any, any> | LocKeyArray<any, any, any, any, any>> = [];

    if (Array.isArray(response)) {
      // Check if this is a properly formatted tuple response [items, affectedItems]
      if (response.length === 2 && Array.isArray(response[0])) {
        [items, affectedItems] = response;
      } else {
        // Handle other array responses - return as-is
        return response as any;
      }
    } else if (response && typeof response === 'object' && Object.keys(response).length === 0) {
      // Handle empty object response {}
      items = [];
      affectedItems = [];
    } else if (typeof response === 'string' && response === '{}') {
      // Handle string response "{}"
      items = [];
      affectedItems = [];
    }

    const processedItems = await utilities.processArray(Promise.resolve(items));
    if (Array.isArray(processedItems)) {
      processedItems.forEach(item => utilities.validatePK(item));
    }
    return [
      processedItems,
      affectedItems
    ];
  };
  return allAction;
}
