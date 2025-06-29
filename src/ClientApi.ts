import { ComKey, Item, ItemQuery, LocKeyArray, PriKey } from "@fjell/core";

export interface ClientApi<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> {
  action: (
    ik: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
    action: string,
    body?: any,
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
  create: (
    item: Partial<Item<S, L1, L2, L3, L4, L5>>,
    locations?: LocKeyArray<L1, L2, L3, L4, L5> | []
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
  get: (
    ik: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
  ) => Promise<V | null>;
  one: (
    query: ItemQuery,
    locations?: LocKeyArray<L1, L2, L3, L4, L5> | []
  ) => Promise<V | null>;
  remove: (
    ik: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
  ) => Promise<boolean>;
  update: (
    ik: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
    item: Partial<Item<S, L1, L2, L3, L4, L5>>,
  ) => Promise<V>;
}