import {
  ComKey,
  Item,
  PriKey,
} from "@fjell/core";
import { GetMethodOptions, HttpApi } from "@fjell/http-api";

import { ClientApiOptions } from "@/ClientApiOptions";
import LibLogger from "@/logger";
import { Utilities } from "@/Utilities";

const logger = LibLogger.get('client-api', 'ops', 'facet');

export const getFacetOperation = <
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

  /**
   * Executes a facet operation on an item.
   *
   * A facet is a piece of information that is related to an item - it represents
   * a specific aspect or characteristic of the item. Unlike actions which may
   * return items or perform operations, facets are informational queries that
   * return data about a particular facet of an item.
   *
   * @param ik - The item key (composite or primary key) identifying the item
   * @param facet - The name of the facet to query
   * @param body - Optional request body for the facet operation
   * @param options - Optional HTTP request options
   * @returns Promise resolving to the facet data
   */
  const facet = async (
    ik: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
    facet: string,
    options: Partial<GetMethodOptions> = {}
  ): Promise<any> => {
    logger.default('facet', { ik, facet });

    const requestOptions = Object.assign({}, options, { isAuthenticated: apiOptions.writeAuthenticated });

    return api.httpGet<any>(
      `${utilities.getPath(ik)}/${facet}`,
      requestOptions,
    );

  };

  return facet;
}
