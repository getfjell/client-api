import {
  ComKey,
  Item,
  LocKeyArray,
  PriKey,
  UpdateOptions
} from "@fjell/types";
import { HttpApi } from "@fjell/http-api";

import { ClientApiOptions } from "../ClientApiOptions";
import LibLogger from "../logger";
import { Utilities } from "../Utilities";

const logger = LibLogger.get('client-api', 'ops', 'upsert');

export const getUpsertOperation = <
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

  const upsert = async (
    key: PriKey<S> | ComKey<S, L1, L2, L3, L4, L5>,
    item: Partial<Item<S, L1, L2, L3, L4, L5>>,
    locations?: LocKeyArray<L1, L2, L3, L4, L5>,
    options?: UpdateOptions
  ): Promise<V> => {
    const requestOptions = Object.assign({}, apiOptions.putOptions, { isAuthenticated: apiOptions.writeAuthenticated });
    logger.default('upsert', { key, item, locations, options, requestOptions });

    // Add locations to query params if provided
    const path = utilities.getPath(key);
    let url = locations && locations.length > 0
      ? `${path}?locations=${encodeURIComponent(JSON.stringify(locations))}`
      : path;

    // Add update options to query params if provided
    if (options) {
      const separator = url.includes('?') ? '&' : '?';
      url += `${separator}options=${encodeURIComponent(JSON.stringify(options))}`;
    }

    return await utilities.processOne(
      api.httpPut<V>(
        url,
        { ...item, upsert: true },
        requestOptions,
      ));
  }

  return upsert;
}

