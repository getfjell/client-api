
import LibLogger from "./logger";
import { Item } from "@fjell/core";
import { Instance as BaseInstance, Coordinate, createInstance as createBaseInstance, Registry } from "@fjell/registry";
import { ClientApi } from "./ClientApi";

const logger = LibLogger.get("Instance");

/**
 * The Client API Instance interface represents a client API model instance that extends the base Instance
 * from @fjell/registry and adds client API operations for interacting with remote data.
 *
 * The interface extends the base Instance (which provides coordinate and registry) with:
 * - clientApi: Provides methods for interacting with remote data through HTTP APIs (get, create, update, etc.)
 *
 * @template V - The type of the data model item, extending Item
 * @template S - The string literal type representing the model's key type
 * @template L1-L5 - Optional string literal types for location hierarchy levels
 */
export interface Instance<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> extends BaseInstance<S, L1, L2, L3, L4, L5> {
  /** The client API object that provides methods for interacting with remote data */
  clientApi: ClientApi<V, S, L1, L2, L3, L4, L5>;
}

export const createInstance = <
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
>(
    registry: Registry,
    coordinate: Coordinate<S, L1, L2, L3, L4, L5>,
    clientApi: ClientApi<V, S, L1, L2, L3, L4, L5>,
  ): Instance<V, S, L1, L2, L3, L4, L5> => {
  logger.debug("createInstance", { coordinate, clientApi, registry });
  const baseInstance = createBaseInstance(registry, coordinate);
  return { ...baseInstance, clientApi };
}
