import { ComKey, Item, ItemQuery, LocKeyArray, PriKey } from "@fjell/core";
import { HttpApi } from "@fjell/http-api";
import { createAItemAPI } from "./AItemAPI";
import { ClientApi } from "./ClientApi";

import LibLogger from "./logger";
import { ClientApiOptions } from "./ClientApiOptions";
const logger = LibLogger.get('PItemAPI');

export interface PItemApi<
  V extends Item<S>,
  S extends string
> extends ClientApi<V, S> {

  action: (
    ik: PriKey<S> | ComKey<S, never, never, never, never, never>,
    action: string,
    body: any,
  ) => Promise<[V, Array<PriKey<any> | ComKey<any, any, any, any, any, any> | LocKeyArray<any, any, any, any, any>>]>;

  all: (
    query: ItemQuery,
  ) => Promise<V[]>;

  allAction: (
    action: string,
    body?: any,
  ) => Promise<[V[], Array<PriKey<any> | ComKey<any, any, any, any, any, any> | LocKeyArray<any, any, any, any, any>>]>;

  allFacet: (
    facet: string,
    params?: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
  ) => Promise<any>;

  one: (
    query: ItemQuery,
  ) => Promise<V | null>;

  get: (
    ik: PriKey<S> | ComKey<S, never, never, never, never, never>,
  ) => Promise<V | null>;

  create: (
    item: Partial<Item<S>>,
  ) => Promise<V>;

  remove: (
    ik: PriKey<S> | ComKey<S, never, never, never, never, never>,
  ) => Promise<boolean>;

  update: (
    ik: PriKey<S> | ComKey<S, never, never, never, never, never>,
    item: Partial<Item<S>>,
  ) => Promise<V>;

  facet: (
    ik: PriKey<S> | ComKey<S, never, never, never, never, never>,
    facet: string,
    params?: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
  ) => Promise<any>;

  find: (
    finder: string,
    finderParams?: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
  ) => Promise<V[]>;

  findOne: (
    finder: string,
    finderParams?: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
  ) => Promise<V>;
}

export const createPItemApi = <V extends Item<S>, S extends string>(
  api: HttpApi,
  type: S,
  pathName: string,
  options?: ClientApiOptions
): PItemApi<V, S> => {

  logger.default('createPItemApi', { type, pathName, options });

  const aItemAPI = createAItemAPI<V, S>(api, type, [pathName], options);

  const action =
    async (
      ik: PriKey<S> | ComKey<S, never, never, never, never, never>,
      action: string,
      body: any = {},
    ): Promise<[V, Array<PriKey<any> | ComKey<any, any, any, any, any, any> | LocKeyArray<any, any, any, any, any>>]> =>
      await aItemAPI.action(ik, action, body) as [V, Array<PriKey<any> | ComKey<any, any, any, any, any, any> | LocKeyArray<any, any, any, any, any>>];

  const all =
    async (
      query: ItemQuery = {} as ItemQuery,
    ): Promise<V[]> =>
      await aItemAPI.all(query, []) as V[];

  const allAction =
    async (
      action: string,
      body: any = {},
    ): Promise<[V[], Array<PriKey<any> | ComKey<any, any, any, any, any, any> | LocKeyArray<any, any, any, any, any>>]> =>
      await aItemAPI.allAction(action, body, []) as [V[], Array<PriKey<any> | ComKey<any, any, any, any, any, any> | LocKeyArray<any, any, any, any, any>>];

  const allFacet =
    async (
      facet: string,
      params: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>> = {},
    ): Promise<any> =>
      await aItemAPI.allFacet(facet, params) as any;

  const one =
    async (
      query: ItemQuery = {} as ItemQuery,
    ): Promise<V | null> =>
      await aItemAPI.one(query, []) as V | null;

  const get =
    async (
      ik: PriKey<S> | ComKey<S, never, never, never, never, never>,
    ): Promise<V | null> =>
      await aItemAPI.get(ik) as V | null;

  const create =
    async (
      item: Partial<Item<S>>,
    ): Promise<V> =>
      await aItemAPI.create(item, []) as V;

  const remove =
    async (
      ik: PriKey<S> | ComKey<S, never, never, never, never, never>,
    ): Promise<boolean> =>
      await aItemAPI.remove(ik) as boolean;

  const update =
    async (
      ik: PriKey<S> | ComKey<S, never, never, never, never, never>,
      item: Partial<Item<S>>,
    ): Promise<V> =>
      await aItemAPI.update(ik, item) as V;

  const facet =
    async (
      ik: PriKey<S> | ComKey<S, never, never, never, never, never>,
      facet: string,
      params: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>> = {},
    ): Promise<any> =>
      await aItemAPI.facet(ik, facet, params) as any;

  const find =
    async (
      finder: string,
      finderParams: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>> = {},
    ): Promise<V[]> =>
      await aItemAPI.find(finder, finderParams) as V[];

  const findOne =
    async (
      finder: string,
      finderParams: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>> = {},
    ): Promise<V> =>
      await aItemAPI.findOne(finder, finderParams) as V;

  return {
    ...aItemAPI,
    action,
    all,
    allAction,
    allFacet,
    one,
    get,
    create,
    remove,
    update,
    facet,
    find,
    findOne,
  };

};
