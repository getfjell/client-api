/* eslint-disable max-params */
import {
  ComKey,
  Item,
  ItemQuery,
  LocKeyArray,
  PriKey,
  TypesProperties
} from "@fjell/core";
import {
  DeleteMethodOptions,
  GetMethodOptions,
  HttpApi,
  PostMethodOptions,
  PutMethodOptions,
} from "@fjell/http-api";
import { createAItemAPI, PathNamesArray } from "./AItemAPI";

import { ClientApi } from "./ClientApi";
import { ClientApiOptions } from "./ClientApiOptions";
import LibLogger from "@/logger";

const logger = LibLogger.get('CItemAPI');

export interface CItemApi<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> extends ClientApi<V, S, L1, L2, L3, L4, L5> {
  action: (
    ik: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
    action: string,
    body: any,
    options: Partial<PostMethodOptions>
  ) => Promise<V>;
  all: (
    query: ItemQuery,
    options: Partial<GetMethodOptions>,
    locations: LocKeyArray<L1, L2, L3, L4, L5> | []
  ) => Promise<V[]>;
  allAction: (
    action: string,
    body: any,
    options: Partial<PostMethodOptions>,
    locations: LocKeyArray<L1, L2, L3, L4, L5> | []
  ) => Promise<V[]>;
  get: (
    ik: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
    options: Partial<GetMethodOptions>,
  ) => Promise<V | null>;
  create: (
    item: TypesProperties<V, S, L1, L2, L3, L4, L5>,
    options: Partial<PostMethodOptions>,
    locations: LocKeyArray<L1, L2, L3, L4, L5> | []
  ) => Promise<V>;
  remove: (
    ik: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
    options: Partial<DeleteMethodOptions>
  ) => Promise<boolean>;
  update: (
    ik: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
    item: TypesProperties<V, S, L1, L2, L3, L4, L5>,
    options: Partial<PutMethodOptions>
  ) => Promise<V>;
  find: (
    finder: string,
    finderParams: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
    options: Partial<GetMethodOptions>,
    locations: LocKeyArray<L1, L2, L3, L4, L5> | []
  ) => Promise<V[]>;
};

export const createCItemApi = <
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
>(
    api: HttpApi,
    type: S,
    pathNames: PathNamesArray<L1, L2, L3, L4, L5>,
    options: ClientApiOptions
  ): CItemApi<V, S, L1, L2, L3, L4, L5> => {

  logger.default('createCItemApi', { api, type, pathNames, options });

  const aItemAPI = createAItemAPI(api, type, pathNames, options);

  return {
    action: aItemAPI.action,
    all: aItemAPI.all,
    allAction: aItemAPI.allAction,
    one: aItemAPI.one,
    get: aItemAPI.get,
    create: aItemAPI.create,
    remove: aItemAPI.remove,
    update: aItemAPI.update,
    find: aItemAPI.find,
  } as unknown as CItemApi<V, S, L1, L2, L3, L4, L5>;
}
