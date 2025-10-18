import {
  ComKey,
  validatePK as coreValidatePK,
  generateKeyArray,
  isPriKey,
  Item,
  LocKey,
  LocKeyArray,
  PriKey,
} from "@fjell/core";

import LibLogger from "./logger";
import deepmerge from "deepmerge";

const logger = LibLogger.get('client-api', 'Utility');

export interface Utilities<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> {
  verifyLocations: (locations: LocKeyArray<L1, L2, L3, L4, L5> | [] | never) => boolean;
  processOne: (apiCall: Promise<V>) => Promise<V>;
  processArray: (api: Promise<V[]>) => Promise<V[]>;
  convertDoc: (doc: V) => V;
  getPath: (key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S> | LocKeyArray<L1, L2, L3, L4, L5> | []) => string;
  validatePK: (item: Item<S, L1, L2, L3, L4, L5> | Item<S, L1, L2, L3, L4, L5>[]) =>
    Item<S, L1, L2, L3, L4, L5> | Item<S, L1, L2, L3, L4, L5>[];
}

export const createUtilities = <
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
>(pkType: S, pathNames: string[]): Utilities<V, S, L1, L2, L3, L4, L5> => {

  logger.default('createUtilities', { pkType, pathNames });

  const verifyLocations = (
    locations: LocKeyArray<L1, L2, L3, L4, L5> | [] | never,
  ): boolean => {

    if (locations && locations.length < pathNames.length - 1) {
      throw new Error('Not enough locations for pathNames: locations:'
        + locations.length + ' pathNames:' + pathNames.length);
    }
    return true;
  }

  const processOne = async (
    apiCall: Promise<V>,
  ): Promise<V> => {
    logger.default('processOne', { apiCall });
    const response = await apiCall;
    logger.default('processOne response', {
      responseType: typeof response,
      hasData: !!response
    });
    return convertDoc(response);
  };

  const processArray = async (
    api: Promise<V[]>,
  ): Promise<V[]> => {
    logger.default('processArray', { api });
    const response = await api;
    logger.default('processArray response', {
      responseType: typeof response,
      isArray: Array.isArray(response),
      length: Array.isArray(response) ? response.length : 0
    });
    if (response && Array.isArray(response)) {
      return response.map((subjectChat: V) =>
        convertDoc(subjectChat),
      ) as unknown as V[];
    } else {
      logger.error('Response was not an array', { response });
      throw new Error('Response was not an array');
    }
  };

  const convertDoc = (doc: V): V => {
    logger.default('convertDoc', { doc });
    // console.log(JSON.stringify(doc, null, 2));
    if (doc && doc.events) {
      const events = doc.events;
      for (const key in events) {
        events[key] = deepmerge(events[key], { at: events[key].at ? new Date(events[key].at) : null });
      }

      return doc as unknown as V;
    } else {
      return doc;
    }
  };

  const getPath =
    (
      key: ComKey<S, L1, L2, L3, L4, L5> | PriKey<S> | LocKeyArray<L1, L2, L3, L4, L5> | [],
    ):
      string => {

      const localPathNames = [...pathNames];
      logger.default('getPath', { key, pathNames: localPathNames });

      // console.log('getPath key: ' + JSON.stringify(key));

      const keys = generateKeyArray(key);

      // console.log('getPath keys: ' + JSON.stringify(keys));
      // console.log('getPath pathNames: ' + JSON.stringify(pathNames));

      // For contained items (ComKey), we need to process location keys first
      // to match the URL structure: /parents/{parentId}/children/{childId}
      if (keys.length > 1) {
        // Separate PriKeys and LocKeys
        const priKeys = keys.filter(k => isPriKey(k));
        const locKeys = keys.filter(k => !isPriKey(k));
        
        // Location keys come in child->parent order, but paths must be parent->child
        // So reverse the locKeys to get parent->child order for path building
        const reversedLocKeys = [...locKeys].reverse();
        
        // Reorder: reversed LocKeys first, then PriKeys
        const reorderedKeys = [...reversedLocKeys, ...priKeys];
        logger.default('Reordered keys for contained item', {
          original: keys,
          locKeys,
          reversedLocKeys,
          reordered: reorderedKeys,
          priKeys
        });
        
        let path: string = addPath('', reorderedKeys, localPathNames);

        // If there is only one collection left in the collections array, this means that
        // we received LocKeys and we need to add the last collection to the reference
        if (localPathNames.length === 1) {
          path = `${path}/${localPathNames[0]}`;
        }

        logger.default('getPath created', { key, path });
        return path;
      } else {
        // For primary items or single keys
        // If it's a LocKey array, we still need to reverse it for path building
        const priKeys = keys.filter(k => isPriKey(k));
        const locKeys = keys.filter(k => !isPriKey(k));
        
        // Reverse locKeys if present (child->parent to parent->child)
        const reversedLocKeys = locKeys.length > 0 ? [...locKeys].reverse() : [];
        const orderedKeys = [...reversedLocKeys, ...priKeys];
        
        let path: string = addPath('', orderedKeys, localPathNames);

        // If there is only one collection left in the collections array, this means that
        // we received LocKeys and we need to add the last collection to the reference
        if (localPathNames.length === 1) {
          path = `${path}/${localPathNames[0]}`;
        }

        logger.default('getPath created', { key, path });
        return path;
      }
    };

  const addPath = (
    base: string,
    keys: Array<PriKey<S> | LocKey<L1 | L2 | L3 | L4 | L5>>,
    localPathNames: string[],
  ): string => {
    logger.default('addPath', { base, keys, pathNames: localPathNames });
    if (keys.length < localPathNames.length - 1) {
      logger.error('addPath should never have keys with a length less than the length of pathNames - 1',
        { keys, localPathNames });
      throw new Error('addPath should never have keys with a length less than the length of pathNames - 1: '
        + keys.length + ' ' + localPathNames.length + ' ' + JSON.stringify(keys, localPathNames));
    } else if (keys.length > localPathNames.length) {
      logger.error('addPath should never have keys with a length greater than the length of pathNames',
        { keys, pathNames });
      throw new Error('addPath should never have keys with a length greater than the length of pathNames: '
        + keys.length + ' ' + localPathNames.length + ' ' + JSON.stringify(keys, localPathNames));
    }
    if (keys.length === 0) {
      // If you've recursively consumed all of the keys, return the base.
      logger.default('addPath returning base', { base });
      return base;
    } else {
      const currentKey = keys[0];
      const keyType = isPriKey(currentKey) ? currentKey.kt : currentKey.kt;
      
      // Find the best matching pathName for this key type
      const matchingPathNameIndex = localPathNames.findIndex(pathName => {
        const singularPathName = pathName.endsWith('s') ? pathName.slice(0, -1) : pathName;
        const pluralKeyType = keyType + 's';
        
        // Try various matching strategies
        return pathName === pluralKeyType || // photos === photo+s
               pathName === keyType + 'es' || // matches === match+es
               singularPathName === keyType || // photo === photo
               pathName.toLowerCase() === keyType.toLowerCase() || // case insensitive
               pathName.toLowerCase() === pluralKeyType.toLowerCase(); // case insensitive plural
      });
      
      if (matchingPathNameIndex !== -1) {
        // Found a matching pathName
        const pathName = localPathNames.splice(matchingPathNameIndex, 1)[0];
        const key = keys.shift()!;
        const id = isPriKey(key) ? (key as PriKey<S>).pk : (key as LocKey<L1 | L2 | L3 | L4 | L5>).lk;
        const nextBase = `${base}/${pathName}/${id}`;
        logger.default('Adding Path (matched)', {
          pathName,
          keyType,
          isPriKey: isPriKey(key),
          key,
          nextBase
        });
        return addPath(nextBase, keys, localPathNames);
      } else {
        // No match found, use first available pathName
        const pathName = localPathNames.shift()!;
        const key = keys.shift()!;
        const id = isPriKey(key) ? (key as PriKey<S>).pk : (key as LocKey<L1 | L2 | L3 | L4 | L5>).lk;
        const nextBase = `${base}/${pathName}/${id}`;
        logger.default('Adding Path (no match, using first)', {
          pathName,
          keyType,
          isPriKey: isPriKey(key),
          key,
          nextBase
        });
        return addPath(nextBase, keys, localPathNames);
      }
    }

  }

  const validatePK = (
    item: Item<S, L1, L2, L3, L4, L5> | Item<S, L1, L2, L3, L4, L5>[]):
    Item<S, L1, L2, L3, L4, L5> | Item<S, L1, L2, L3, L4, L5>[] => {
    return coreValidatePK<S, L1, L2, L3, L4, L5>(item, pkType);
  }

  return {
    verifyLocations,
    processOne,
    convertDoc,
    processArray,
    getPath,
    validatePK,
  }
}
