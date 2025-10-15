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

  const validateLocationKeyOrder = (
    keys: Array<PriKey<S> | LocKey<L1 | L2 | L3 | L4 | L5>>,
  ): void => {
    // Extract only LocKeys for validation
    const locKeys = keys.filter(k => !isPriKey(k)) as Array<LocKey<L1 | L2 | L3 | L4 | L5>>;
    
    if (locKeys.length <= 1) {
      // No validation needed for 0 or 1 location keys
      return;
    }

    // Build a map of pathName -> index for ordering validation
    // We need to check if the key types appear in the same order as pathNames
    const pathNameOrder = new Map<string, number>();
    pathNames.forEach((pathName, index) => {
      // Handle paths with slashes (e.g., "fjell/order" -> also map "order")
      const pathParts = pathName.split('/');
      const lastPart = pathParts[pathParts.length - 1];
      
      // Map the full pathName
      pathNameOrder.set(pathName, index);
      pathNameOrder.set(pathName.toLowerCase(), index);
      
      // Map the last part of the path (for "fjell/order" map "order")
      pathNameOrder.set(lastPart, index);
      pathNameOrder.set(lastPart.toLowerCase(), index);
      
      // Also map common variations to help with matching
      const singular = lastPart.endsWith('s') ? lastPart.slice(0, -1) : lastPart;
      const plural = lastPart + 's';
      const pluralEs = lastPart + 'es';
      
      pathNameOrder.set(singular, index);
      pathNameOrder.set(plural, index);
      pathNameOrder.set(pluralEs, index);
      pathNameOrder.set(singular.toLowerCase(), index);
      pathNameOrder.set(plural.toLowerCase(), index);
    });

    // Check if location keys are in ascending order based on pathNames
    let lastIndex = -1;
    const keyDetails: Array<{ kt: string; pathNameIndex: number | undefined }> = [];

    for (const locKey of locKeys) {
      const keyType = locKey.kt;
      const currentIndex = pathNameOrder.get(keyType);
      
      keyDetails.push({ kt: keyType, pathNameIndex: currentIndex });
      
      if (typeof currentIndex !== 'undefined') {
        if (currentIndex <= lastIndex) {
          // Keys are out of order!
          logger.error('Location keys are not in the correct hierarchical order', {
            keys: locKeys.map(k => ({ kt: k.kt, lk: k.lk })),
            pathNames,
            keyDetails,
            issue: `Key type "${keyType}" (index ${currentIndex}) should come before the previous key (index ${lastIndex})`
          });
          
          throw new Error(
            `Location keys must be ordered from parent to child according to the entity hierarchy. ` +
            `Expected order based on pathNames: [${pathNames.join(', ')}]. ` +
            `Received key types in order: [${locKeys.map(k => k.kt).join(', ')}]. ` +
            `Key "${keyType}" is out of order - it should appear earlier in the hierarchy.`
          );
        }
        lastIndex = currentIndex;
      }
    }

    logger.default('Location key order validation passed', {
      locKeys: locKeys.map(k => ({ kt: k.kt, lk: k.lk })),
      keyDetails
    });
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

      // Validate location key ordering before processing
      validateLocationKeyOrder(keys);

      // For contained items (ComKey), we need to process location keys first
      // to match the URL structure: /parents/{parentId}/children/{childId}
      if (keys.length > 1) {
        // Separate PriKeys and LocKeys
        const priKeys = keys.filter(k => isPriKey(k));
        const locKeys = keys.filter(k => !isPriKey(k));
        
        // Reorder: LocKeys first, then PriKeys
        const reorderedKeys = [...locKeys, ...priKeys];
        logger.default('Reordered keys for contained item', {
          original: keys,
          reordered: reorderedKeys,
          priKeys,
          locKeys
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
        // For primary items, use the original logic
        let path: string = addPath('', keys, localPathNames);

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
