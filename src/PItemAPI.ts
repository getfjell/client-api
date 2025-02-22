/* eslint-disable @typescript-eslint/no-unused-vars */
 
import { ComKey, Item, ItemProperties, ItemQuery, PriKey, TypesProperties } from "@fjell/core";
import { HttpApi } from "@fjell/http-api";
import { createAItemAPI, PathNamesArray } from "./AItemAPI";
import { ClientApi } from "./ClientApi";

import { DeleteMethodOptions, GetMethodOptions, PostMethodOptions, PutMethodOptions } from "@fjell/http-api";
import { ClientApiOptions } from "./ClientApiOptions";
import LibLogger from "@/logger";
const logger = LibLogger.get('PItemAPI');

export interface PItemApi<
  V extends Item<S>,
  S extends string
> extends ClientApi<V, S> {
  
  action: (
    ik: PriKey<S> | ComKey<S, never, never, never, never, never>,
    action: string,
    body: any,
    options: Partial<PostMethodOptions>,
    locations?: []
  ) => Promise<V>;

  all: (
    query: ItemQuery,
    options: Partial<GetMethodOptions>,
    locations?: []
  ) => Promise<V[]>;

  allAction: (
    action: string,
    body: any,
    options: Partial<PostMethodOptions>
  ) => Promise<V[]>;

  one: (
    query: ItemQuery,
    options: Partial<GetMethodOptions>
  ) => Promise<V | null>;

  get: (
    ik: PriKey<S> | ComKey<S, never, never, never, never, never>,
    options: Partial<GetMethodOptions>,
    locations?: []
  ) => Promise<V | null>;

  create: (
    item: TypesProperties<V, S>,
    options: Partial<PostMethodOptions>,
    locations?: []
  ) => Promise<V>;

  remove: (
    ik: PriKey<S> | ComKey<S, never, never, never, never, never>,
    options: Partial<DeleteMethodOptions>,
    locations?: []
  ) => Promise<boolean>;

  update: (
    ik: PriKey<S> | ComKey<S, never, never, never, never, never>,
    item: TypesProperties<V, S>,
    options: Partial<PutMethodOptions>,
    locations?: []
  ) => Promise<V>;

  find: (
    finder: string,
    finderParams: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
    options: Partial<GetMethodOptions>,
    locations?: []
  ) => Promise<V[]>;
}

export const createPItemApi = <
  V extends Item<S>,
  S extends string
>(
    api: HttpApi,
    type: S,
    pathName: string,
    options: ClientApiOptions
  ): PItemApi<V, S> => {

  logger.default('createPItemApi', { type, pathName, options });

  const aItemAPI = createAItemAPI<V, S>(api, type, [pathName], options);

  const action =
    async (
      ik: PriKey<S> | ComKey<S, never, never, never, never, never>,
      action: string,
      body: any = {},
      options: Partial<PostMethodOptions> = {},
    ): Promise<V> =>
        await aItemAPI.action(ik, action, body, options) as V;

  const all =
    async (
      query: ItemQuery = {} as ItemQuery,
      options: Partial<GetMethodOptions> = {},
    ): Promise<V[]> =>
        await aItemAPI.all(query, options, []) as V[];

  const allAction =
    async (
      action: string,
      body: any = {},
      options: Partial<PostMethodOptions> = {},
    ): Promise<V[]> =>
        await aItemAPI.allAction(action, body, options, []) as V[];
  
  const one =
    async (
      query: ItemQuery = {} as ItemQuery,
      options: Partial<GetMethodOptions> = {},
    ): Promise<V | null> =>
        await aItemAPI.one(query, options, []) as V | null;
  
  const get =
    async (
      ik: PriKey<S> | ComKey<S, never, never, never, never, never>,
      options: Partial<GetMethodOptions> = {},
    ): Promise<V | null> =>
        await aItemAPI.get(ik, options) as V | null;
  
  const create =
    async (
      item: TypesProperties<V, S>,
      options: Partial<PostMethodOptions> = {},
    ): Promise<V> =>
        await aItemAPI.create(item, options, []) as V;
  
  const remove =
    async (
      ik: PriKey<S> | ComKey<S, never, never, never, never, never>,
      options: Partial<DeleteMethodOptions> = {},
    ): Promise<boolean> =>
        await aItemAPI.remove(ik, options) as boolean;
  
  const update =
    async (
      ik: PriKey<S> | ComKey<S, never, never, never, never, never>,
      item: TypesProperties<V, S>,
      options: Partial<PutMethodOptions> = {},
    ): Promise<V> =>
        await aItemAPI.update(ik, item, options) as V;
  
  const find =
    async (
      finder: string,
      finderParams: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
      options: Partial<GetMethodOptions> = {},
    ): Promise<V[]> =>
        await aItemAPI.find(finder, finderParams, options, []) as V[];

  return {
    ...aItemAPI,
    action,
    all,
    allAction,
    one,
    get,
    create,
    remove,
    update,
    find,
  };

};
