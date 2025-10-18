/* eslint-disable indent */
import { Item } from "@fjell/core";
import { HttpApi } from "@fjell/http-api";

import { ClientApiOptions } from "./ClientApiOptions";
import { getOperations } from "./ops";
import { createUtilities } from "./Utilities";
import { ClientApi } from "./ClientApi";

import LibLogger from "./logger";

const logger = LibLogger.get('AItemAPI');

export type PathNamesArray<
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> =
  ([L5] extends [never] ?
    ([L4] extends [never] ?
      ([L3] extends [never] ?
        ([L2] extends [never] ?
          ([L1] extends [never] ?
            [string] :
            [string, string]) :
          [string, string, string]) :
        [string, string, string, string]) :
      [string, string, string, string, string]) :
    [string, string, string, string, string, string]);

export const finderToParams = (
  finder: string,
  finderParams: Record<string, string | number | boolean | Date | Array<string | number | boolean | Date>>
): Record<string, string> => {
  return {
    finder,
    finderParams: JSON.stringify(finderParams),
  };
};

export const createAItemAPI = <
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
>(
  api: HttpApi,
  pkType: S,
  pathNames: PathNamesArray<L1, L2, L3, L4, L5>,
  options?: ClientApiOptions,
): ClientApi<V, S, L1, L2, L3, L4, L5> => {

  logger.default('createAItemAPI', { pkType, pathNames, options });

  let mergedOptions: ClientApiOptions;

  const defaultOptions: ClientApiOptions = {
    readAuthenticated: true,
    allAuthenticated: true,
    writeAuthenticated: true,
    getOptions: {},
    postOptions: {},
    putOptions: {},
    deleteOptions: {},
  };

  if (options) {
    mergedOptions = Object.assign({}, defaultOptions, options);
  } else {
    mergedOptions = defaultOptions;
  }

  const utilities = createUtilities<V, S, L1, L2, L3, L4, L5>(pkType, pathNames);
  const operations = getOperations<V, S, L1, L2, L3, L4, L5>(api, mergedOptions, utilities);

  return {
    action: operations.action,
    all: operations.all,
    allAction: operations.allAction,
    allFacet: operations.allFacet,
    create: operations.create,
    facet: operations.facet,
    find: operations.find,
    findOne: operations.findOne,
    get: operations.get,
    one: operations.one,
    remove: operations.remove,
    update: operations.update,
    upsert: operations.upsert,
  }
}