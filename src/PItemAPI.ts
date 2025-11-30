import { AllOperationResult, AllOptions, ComKey, FindOperationResult, FindOptions, Item, ItemQuery, PriKey } from "@fjell/core";
import { HttpApi } from "@fjell/http-api";
import { createAItemAPI } from "./AItemAPI";
import { ClientApi } from "./ClientApi";

import LibLogger from "./logger";
import { ClientApiOptions } from "./ClientApiOptions";
const logger = LibLogger.get('PItemAPI');

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

// PItemApi now directly extends ClientApi without re-declaring methods
// This ensures compatibility with core Operations interface
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PItemApi<
  V extends Item<S>,
  S extends string
> extends ClientApi<V, S> {
  // Inherits all methods from ClientApi
}

export const createPItemApi = <V extends Item<S>, S extends string>(
  api: HttpApi,
  type: S,
  pathName: string,
  options?: ClientApiOptions
): PItemApi<V, S> => {

  logger.default('createPItemApi', { type, pathName, options });

  const aItemAPI = createAItemAPI<V, S>(api, type, [pathName], options);

  // Simplified wrapper functions that adapt to primary-only API (no locations)
  const action = async (
    ik: PriKey<S> | ComKey<S, never, never, never, never, never>,
    action: string,
    params?: any,
  ) => await aItemAPI.action(ik, action, params);

  const all = async (query?: ItemQuery, locations?: [], allOptions?: AllOptions): Promise<AllOperationResult<V>> => {
    const result = await aItemAPI.all(query || {}, locations || [], allOptions);
    const extracted = ensureItemsExtracted<V>(result, 'all');
    return extracted as AllOperationResult<V>;
  };

  const allAction = async (action: string, params?: any) =>
    await aItemAPI.allAction(action, params, []);

  const allFacet = async (facet: string, params?: any) =>
    await aItemAPI.allFacet(facet, params);

  const one = async (query?: ItemQuery) =>
    await aItemAPI.one(query || {}, []);

  const get = async (ik: PriKey<S> | ComKey<S, never, never, never, never, never>) =>
    await aItemAPI.get(ik);

  const create = async (item: Partial<Item<S>>, options?: any) =>
    await aItemAPI.create(item, options);

  const remove = async (ik: PriKey<S> | ComKey<S, never, never, never, never, never>) =>
    await aItemAPI.remove(ik);

  const update = async (
    ik: PriKey<S> | ComKey<S, never, never, never, never, never>,
    item: Partial<Item<S>>,
  ) => await aItemAPI.update(ik, item);

  const upsert = async (
    ik: PriKey<S> | ComKey<S, never, never, never, never, never>,
    item: Partial<Item<S>>,
    locations?: any
  ) => await aItemAPI.upsert(ik, item, locations);

  const facet = async (
    ik: PriKey<S> | ComKey<S, never, never, never, never, never>,
    facet: string,
    params?: any,
  ) => await aItemAPI.facet(ik, facet, params);

  const find = async (finder: string, finderParams?: any, locations?: [], findOptions?: FindOptions): Promise<FindOperationResult<V>> => {
    const result = await (aItemAPI.find as any)(finder, finderParams, locations || [], findOptions);
    const extracted = ensureItemsExtracted<V>(result, 'find');
    return extracted as FindOperationResult<V>;
  };

  const findOne = async (finder: string, finderParams?: any) =>
    await aItemAPI.findOne(finder, finderParams);

  return {
    action,
    all,
    allAction,
    allFacet,
    one,
    get,
    create,
    remove,
    update,
    upsert,
    facet,
    find,
    findOne,
  } as PItemApi<V, S>;

};
