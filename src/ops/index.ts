/* eslint-disable indent */
import { Item } from "@fjell/core"
import { getAllOperation } from "./all"
import { getActionOperation } from "./action"
import { Utilities } from "../Utilities"
import { HttpApi } from "@fjell/http-api"
import { getAllActionOperation } from "./allAction"
import { getOneOperation } from "./one"
import { getCreateOperation } from "./create"
import { getUpdateOperation } from "./update"
import { getUpsertOperation } from "./upsert"
import { getGetOperation } from "./get"
import { getRemoveOperation } from "./remove"
import { getFindOperation } from "./find"
import { ClientApiOptions } from "../ClientApiOptions"
import { ClientApi } from "../ClientApi"
import { getFindOneOperation } from "./findOne"
import { getFacetOperation } from "./facet"
import { getAllFacetOperation } from "./allFacet"

export const getOperations =
  <
    V extends Item<S, L1, L2, L3, L4, L5>,
    S extends string,
    L1 extends string = never,
    L2 extends string = never,
    L3 extends string = never,
    L4 extends string = never,
    L5 extends string = never>(
      api: HttpApi,
      apiOptions: ClientApiOptions,
      utilities: Utilities<V, S, L1, L2, L3, L4, L5>,

    ): ClientApi<V, S, L1, L2, L3, L4, L5> => {
    return {
      action: getActionOperation<V, S, L1, L2, L3, L4, L5>(
        api,
        apiOptions,
        utilities,
      ),
      all: getAllOperation<V, S, L1, L2, L3, L4, L5>(
        api,
        apiOptions,
        utilities,
      ),
      allAction: getAllActionOperation<V, S, L1, L2, L3, L4, L5>(
        api,
        apiOptions,
        utilities,
      ),
      allFacet: getAllFacetOperation<V, S, L1, L2, L3, L4, L5>(
        api,
        apiOptions,
        utilities,
      ),
      create: getCreateOperation<V, S, L1, L2, L3, L4, L5>(
        api,
        apiOptions,
        utilities,
      ),
      facet: getFacetOperation<V, S, L1, L2, L3, L4, L5>(
        api,
        apiOptions,
        utilities,
      ),
      findOne: getFindOneOperation<V, S, L1, L2, L3, L4, L5>(
        api,
        apiOptions,
        utilities,
      ),
      find: getFindOperation<V, S, L1, L2, L3, L4, L5>(
        api,
        apiOptions,
        utilities,
      ),
      get: getGetOperation<V, S, L1, L2, L3, L4, L5>(
        api,
        apiOptions,
        utilities,
      ),
      one: getOneOperation<V, S, L1, L2, L3, L4, L5>(
        api,
        apiOptions,
        utilities,
      ),
      remove: getRemoveOperation<V, S, L1, L2, L3, L4, L5>(
        api,
        apiOptions,
        utilities,
      ),
      update: getUpdateOperation<V, S, L1, L2, L3, L4, L5>(
        api,
        apiOptions,
        utilities,
      ),
      upsert: getUpsertOperation<V, S, L1, L2, L3, L4, L5>(
        api,
        apiOptions,
        utilities,
      ),
    }
  }