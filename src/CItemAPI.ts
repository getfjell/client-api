
import {
  ComKey,
  Item,
  ItemQuery,
  LocKeyArray,
  PriKey,
  TypesProperties
} from "@fjell/core";
import {
  HttpApi
} from "@fjell/http-api";
import { createAItemAPI, PathNamesArray } from "./AItemAPI";

import LibLogger from "@/logger";
import { ClientApi } from "./ClientApi";
import { ClientApiOptions } from "./ClientApiOptions";

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
  ) => Promise<V>;
  all: (
    query: ItemQuery,
    locations?: LocKeyArray<L1, L2, L3, L4, L5> | []
  ) => Promise<V[]>;
  allAction: (
    action: string,
    body?: any,
    locations?: LocKeyArray<L1, L2, L3, L4, L5> | []
  ) => Promise<V[]>;
  allFacet: (
    facet: string,
    params?: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
    locations?: LocKeyArray<L1, L2, L3, L4, L5> | []
  ) => Promise<any>;
  get: (
    ik: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
  ) => Promise<V | null>;
  create: (
    item: TypesProperties<V, S, L1, L2, L3, L4, L5>,
    locations?: LocKeyArray<L1, L2, L3, L4, L5> | []
  ) => Promise<V>;
  remove: (
    ik: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
  ) => Promise<boolean>;
  update: (
    ik: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
    item: TypesProperties<V, S, L1, L2, L3, L4, L5>,
  ) => Promise<V>;
  facet: (
    ik: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
    facet: string,
    params?: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
  ) => Promise<any>;
  find: (
    finder: string,
    finderParams?: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
    locations?: LocKeyArray<L1, L2, L3, L4, L5> | []
  ) => Promise<V[]>;
  findOne: (
    finder: string,
    finderParams?: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
    locations?: LocKeyArray<L1, L2, L3, L4, L5> | []
  ) => Promise<V>;
};

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

  return {
    action: aItemAPI.action,
    all: aItemAPI.all,
    allAction: aItemAPI.allAction,
    allFacet: aItemAPI.allFacet,
    one: aItemAPI.one,
    get: aItemAPI.get,
    create: aItemAPI.create,
    remove: aItemAPI.remove,
    update: aItemAPI.update,
    facet: aItemAPI.facet,
    find: aItemAPI.find,
    findOne: aItemAPI.findOne,
  } as unknown as CItemApi<V, S, L1, L2, L3, L4, L5>;
}
