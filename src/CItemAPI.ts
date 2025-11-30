
import {
  AllOperationResult,
  AllOptions,
  FindOperationResult,
  FindOptions,
  Item,
  ItemQuery,
  LocKeyArray,
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

/**
 * Helper function to ensure items are extracted from { items, metadata } response structure.
 * This provides defensive handling in case the underlying API doesn't extract items properly.
 */
function ensureItemsExtracted<T>(
  result: any,
  operationName: string
): { items: T[]; metadata: any } {
  // If result already has the correct structure with items array, return as-is
  if (result && typeof result === 'object' && Array.isArray(result.items)) {
    return result;
  }
  
  // If result is the raw { items, metadata } structure but items wasn't extracted
  if (result && typeof result === 'object' && 'items' in result && 'metadata' in result) {
    logger.debug(`${operationName}: Extracting items from response structure`, {
      hasItems: Array.isArray(result.items),
      itemsType: typeof result.items,
      itemsLength: Array.isArray(result.items) ? result.items.length : 'N/A'
    });
    return {
      items: Array.isArray(result.items) ? result.items : [],
      metadata: result.metadata || {}
    };
  }
  
  // If result is an array (legacy format), wrap it
  if (Array.isArray(result)) {
    logger.debug(`${operationName}: Wrapping array result in { items, metadata } structure`);
    return {
      items: result,
      metadata: {
        total: result.length,
        returned: result.length,
        offset: 0,
        hasMore: false
      }
    };
  }
  
  // Fallback: return empty result
  logger.warning(`${operationName}: Unexpected response format, returning empty result`, {
    resultType: typeof result,
    resultKeys: result && typeof result === 'object' ? Object.keys(result) : []
  });
  return {
    items: [],
    metadata: {}
  };
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

  // Wrap methods that return { items, metadata } to ensure items are always extracted
  const all = async (
    query?: ItemQuery,
    locations?: LocKeyArray<L1, L2, L3, L4, L5> | [],
    allOptions?: AllOptions
  ): Promise<AllOperationResult<V>> => {
    const result = allOptions != null
      ? await aItemAPI.all(query, locations, allOptions)
      : await aItemAPI.all(query, locations);
    const extracted = ensureItemsExtracted<V>(result, 'all');
    return extracted as AllOperationResult<V>;
  };

  const find = async (
    finder: string,
    finderParams?: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
    locations?: LocKeyArray<L1, L2, L3, L4, L5> | [],
    findOptions?: FindOptions
  ): Promise<FindOperationResult<V>> => {
    const result = findOptions != null
      ? await aItemAPI.find(finder, finderParams, locations, findOptions)
      : await aItemAPI.find(finder, finderParams, locations);
    const extracted = ensureItemsExtracted<V>(result, 'find');
    return extracted as FindOperationResult<V>;
  };

  return {
    action: aItemAPI.action,
    all,
    allAction: aItemAPI.allAction,
    allFacet: aItemAPI.allFacet,
    one: aItemAPI.one,
    get: aItemAPI.get,
    create: aItemAPI.create,
    remove: aItemAPI.remove,
    update: aItemAPI.update,
    upsert: aItemAPI.upsert,
    facet: aItemAPI.facet,
    find,
    findOne: aItemAPI.findOne,
  } as unknown as CItemApi<V, S, L1, L2, L3, L4, L5>;
}
