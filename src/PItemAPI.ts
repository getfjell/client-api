import { AllOptions, ComKey, Item, ItemQuery, PriKey } from "@fjell/core";
import { HttpApi } from "@fjell/http-api";
import { createAItemAPI } from "./AItemAPI";
import { ClientApi } from "./ClientApi";

import LibLogger from "./logger";
import { ClientApiOptions } from "./ClientApiOptions";
const logger = LibLogger.get('PItemAPI');

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

  const all = async (query?: ItemQuery, locations?: [], allOptions?: AllOptions) =>
    await aItemAPI.all(query || {}, locations || [], allOptions);

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

  const find = async (finder: string, finderParams?: any) =>
    await aItemAPI.find(finder, finderParams);

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
