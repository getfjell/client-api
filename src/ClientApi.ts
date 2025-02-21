import { ComKey, Item, ItemQuery, LocKeyArray, PriKey, TypesProperties } from "@fjell/core";
import { DeleteMethodOptions, GetMethodOptions, PostMethodOptions, PutMethodOptions } from "@fjell/http-api";

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
        body: any,
        options: Partial<PostMethodOptions>,
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
    create: (
        item: TypesProperties<V, S, L1, L2, L3, L4, L5>,
        options: Partial<PostMethodOptions>,
        locations: LocKeyArray<L1, L2, L3, L4, L5> | []
    ) => Promise<V>;
    find: (
        finder: string,
        finderParams: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>,
        options: Partial<GetMethodOptions>,
        locations: LocKeyArray<L1, L2, L3, L4, L5> | []
    ) => Promise<V[]>;
    get: (
        ik: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
        options: Partial<GetMethodOptions>,
    ) => Promise<V | null>;
    one: (
        query: ItemQuery,
        options: Partial<GetMethodOptions>,
        locations: LocKeyArray<L1, L2, L3, L4, L5> | []
    ) => Promise<V | null>;
    remove: (
        ik: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
        options: Partial<DeleteMethodOptions>
    ) => Promise<boolean>;
    update: (
        ik: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S>,
        item: TypesProperties<V, S, L1, L2, L3, L4, L5>,
        options: Partial<PutMethodOptions>
    ) => Promise<V>;
}